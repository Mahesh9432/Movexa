import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID, uuid4


class LocalSessionStoreError(RuntimeError):
    """Raised when local session storage operations fail."""


class LocalSessionStore:
    """Durable SQLite storage for offline rehabilitation sessions."""

    TERMINAL_STATUSES = {
        "COMPLETED",
        "INCOMPLETE",
        "UNABLE_TO_ASSESS",
    }

    def __init__(self, database_path=None):
        if database_path is None:
            database_path = (
                Path(__file__).resolve().parent
                / "data"
                / "movexa_local.db"
            )

        self.database_path = Path(database_path)
        self.database_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        self._initialize_database()

    @contextmanager
    def _connect(self):
        """Open a connection and always close it after the transaction."""
        connection = sqlite3.connect(
            str(self.database_path),
            timeout=15,
        )
        connection.row_factory = sqlite3.Row

        try:
            connection.execute("PRAGMA foreign_keys = ON")
            with connection:
                yield connection
        finally:
            connection.close()

    def _initialize_database(self):
        try:
            with self._connect() as connection:
                connection.execute(
                    """
                    CREATE TABLE IF NOT EXISTS local_sessions (
                        client_session_id TEXT PRIMARY KEY,
                        backend_session_id TEXT UNIQUE,
                        patient_id TEXT NOT NULL,
                        prescription_id TEXT NOT NULL,
                        exercise TEXT NOT NULL,
                        started_at TEXT NOT NULL,
                        completed_at TEXT,
                        status TEXT NOT NULL
                            CHECK (
                                status IN (
                                    'IN_PROGRESS',
                                    'COMPLETED',
                                    'INCOMPLETE',
                                    'UNABLE_TO_ASSESS'
                                )
                            ),
                        sync_status TEXT NOT NULL DEFAULT 'PENDING'
                            CHECK (
                                sync_status IN (
                                    'PENDING',
                                    'SYNCED'
                                )
                            ),
                        synced_at TEXT,
                        session_summary TEXT,
                        created_at TEXT NOT NULL
                    )
                    """
                )

                connection.execute(
                    """
                    CREATE TABLE IF NOT EXISTS local_repetitions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        client_session_id TEXT NOT NULL,
                        rep_number INTEGER NOT NULL CHECK (rep_number > 0),
                        assessment_status TEXT NOT NULL
                            CHECK (
                                assessment_status IN (
                                    'ASSESSED',
                                    'UNABLE_TO_ASSESS'
                                )
                            ),
                        repetition_data TEXT NOT NULL,
                        created_at TEXT NOT NULL,
                        UNIQUE (client_session_id, rep_number),
                        FOREIGN KEY (client_session_id)
                            REFERENCES local_sessions(client_session_id)
                            ON DELETE CASCADE
                    )
                    """
                )

                connection.execute(
                    """
                    CREATE INDEX IF NOT EXISTS
                    idx_local_sessions_sync_status
                    ON local_sessions(sync_status, started_at)
                    """
                )

        except sqlite3.Error as exc:
            raise LocalSessionStoreError(
                f"Could not initialize local storage: {exc}"
            ) from exc

    @staticmethod
    def _validate_uuid(value, field_name):
        try:
            return str(UUID(str(value)))
        except (ValueError, TypeError, AttributeError) as exc:
            raise LocalSessionStoreError(
                f"{field_name} must be a valid UUID."
            ) from exc

    @staticmethod
    def _now():
        return datetime.now(timezone.utc).isoformat()

    def create_session(
        self,
        patient_id,
        prescription_id,
        exercise="Squat",
        client_session_id=None,
        started_at=None,
    ):
        patient_id = self._validate_uuid(patient_id, "patient_id")
        prescription_id = self._validate_uuid(
            prescription_id,
            "prescription_id",
        )

        client_session_id = self._validate_uuid(
            client_session_id or uuid4(),
            "client_session_id",
        )

        if not isinstance(exercise, str) or not exercise.strip():
            raise LocalSessionStoreError(
                "Exercise name must not be empty."
            )

        started_at = started_at or self._now()

        try:
            with self._connect() as connection:
                connection.execute(
                    """
                    INSERT INTO local_sessions (
                        client_session_id,
                        patient_id,
                        prescription_id,
                        exercise,
                        started_at,
                        status,
                        sync_status,
                        created_at
                    )
                    VALUES (?, ?, ?, ?, ?, 'IN_PROGRESS', 'PENDING', ?)
                    """,
                    (
                        client_session_id,
                        patient_id,
                        prescription_id,
                        exercise.strip(),
                        started_at,
                        self._now(),
                    ),
                )

            return client_session_id

        except sqlite3.IntegrityError as exc:
            raise LocalSessionStoreError(
                "Session already exists or violates a storage constraint."
            ) from exc
        except sqlite3.Error as exc:
            raise LocalSessionStoreError(
                f"Could not create local session: {exc}"
            ) from exc

    def save_repetition(self, client_session_id, repetition):
        client_session_id = self._validate_uuid(
            client_session_id,
            "client_session_id",
        )

        if not isinstance(repetition, dict):
            raise LocalSessionStoreError(
                "Repetition data must be a dictionary."
            )

        rep_number = repetition.get("rep_number")
        assessment_status = repetition.get("assessment_status")

        if (
            not isinstance(rep_number, int)
            or isinstance(rep_number, bool)
            or rep_number <= 0
        ):
            raise LocalSessionStoreError(
                "Repetition number must be a positive integer."
            )

        if assessment_status not in {
            "ASSESSED",
            "UNABLE_TO_ASSESS",
        }:
            raise LocalSessionStoreError(
                "Invalid repetition assessment status."
            )

        if (
            assessment_status == "UNABLE_TO_ASSESS"
            and repetition.get("rom_degrees") is not None
        ):
            raise LocalSessionStoreError(
                "An unassessed repetition cannot have ROM measurements."
            )

        try:
            repetition_json = json.dumps(
                repetition,
                allow_nan=False,
                separators=(",", ":"),
            )
        except (TypeError, ValueError) as exc:
            raise LocalSessionStoreError(
                "Repetition data must contain valid JSON values."
            ) from exc

        try:
            with self._connect() as connection:
                session = connection.execute(
                    """
                    SELECT status, sync_status
                    FROM local_sessions
                    WHERE client_session_id = ?
                    """,
                    (client_session_id,),
                ).fetchone()

                if session is None:
                    raise LocalSessionStoreError(
                        "Local session does not exist."
                    )

                if session["status"] != "IN_PROGRESS":
                    raise LocalSessionStoreError(
                        "Cannot add repetitions to a finished session."
                    )

                if session["sync_status"] == "SYNCED":
                    raise LocalSessionStoreError(
                        "Cannot modify an already synchronized session."
                    )

                connection.execute(
                    """
                    INSERT INTO local_repetitions (
                        client_session_id,
                        rep_number,
                        assessment_status,
                        repetition_data,
                        created_at
                    )
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (
                        client_session_id,
                        rep_number,
                        assessment_status,
                        repetition_json,
                        self._now(),
                    ),
                )

        except sqlite3.IntegrityError as exc:
            raise LocalSessionStoreError(
                "Repetition already exists or violates a storage constraint."
            ) from exc
        except sqlite3.Error as exc:
            raise LocalSessionStoreError(
                f"Could not save repetition: {exc}"
            ) from exc

    def finish_session(
        self,
        client_session_id,
        status,
        session_summary=None,
    ):
        client_session_id = self._validate_uuid(
            client_session_id,
            "client_session_id",
        )

        if status not in self.TERMINAL_STATUSES:
            raise LocalSessionStoreError(
                f"Unsupported terminal status: {status}"
            )

        try:
            summary_json = (
                json.dumps(session_summary, allow_nan=False)
                if session_summary is not None
                else None
            )
        except (TypeError, ValueError) as exc:
            raise LocalSessionStoreError(
                "Session summary must contain valid JSON values."
            ) from exc

        try:
            with self._connect() as connection:
                cursor = connection.execute(
                    """
                    UPDATE local_sessions
                    SET status = ?,
                        completed_at = ?,
                        session_summary = ?
                    WHERE client_session_id = ?
                      AND status = 'IN_PROGRESS'
                      AND sync_status = 'PENDING'
                    """,
                    (
                        status,
                        self._now(),
                        summary_json,
                        client_session_id,
                    ),
                )

                if cursor.rowcount != 1:
                    raise LocalSessionStoreError(
                        "Session does not exist, is already finished, "
                        "or has already been synchronized."
                    )

        except sqlite3.Error as exc:
            raise LocalSessionStoreError(
                f"Could not finish local session: {exc}"
            ) from exc

    def get_session(self, client_session_id):
        client_session_id = self._validate_uuid(
            client_session_id,
            "client_session_id",
        )

        try:
            with self._connect() as connection:
                row = connection.execute(
                    """
                    SELECT *
                    FROM local_sessions
                    WHERE client_session_id = ?
                    """,
                    (client_session_id,),
                ).fetchone()

                if row is None:
                    return None

                session = dict(row)
                session["session_summary"] = (
                    json.loads(session["session_summary"])
                    if session["session_summary"]
                    else None
                )

                repetitions = connection.execute(
                    """
                    SELECT repetition_data
                    FROM local_repetitions
                    WHERE client_session_id = ?
                    ORDER BY rep_number
                    """,
                    (client_session_id,),
                ).fetchall()

                session["repetitions_data"] = [
                    json.loads(item["repetition_data"])
                    for item in repetitions
                ]

                return session

        except sqlite3.Error as exc:
            raise LocalSessionStoreError(
                f"Could not retrieve local session: {exc}"
            ) from exc

    def get_pending_sessions(self):
        try:
            with self._connect() as connection:
                rows = connection.execute(
                    """
                    SELECT client_session_id
                    FROM local_sessions
                    WHERE status != 'IN_PROGRESS'
                      AND sync_status = 'PENDING'
                    ORDER BY started_at
                    """
                ).fetchall()

            return [
                self.get_session(row["client_session_id"])
                for row in rows
            ]

        except sqlite3.Error as exc:
            raise LocalSessionStoreError(
                f"Could not retrieve pending sessions: {exc}"
            ) from exc

    def mark_session_synced(
        self,
        client_session_id,
        backend_session_id,
    ):
        client_session_id = self._validate_uuid(
            client_session_id,
            "client_session_id",
        )
        backend_session_id = self._validate_uuid(
            backend_session_id,
            "backend_session_id",
        )

        try:
            with self._connect() as connection:
                cursor = connection.execute(
                    """
                    UPDATE local_sessions
                    SET backend_session_id = ?,
                        sync_status = 'SYNCED',
                        synced_at = ?
                    WHERE client_session_id = ?
                      AND status != 'IN_PROGRESS'
                      AND sync_status = 'PENDING'
                    """,
                    (
                        backend_session_id,
                        self._now(),
                        client_session_id,
                    ),
                )

                if cursor.rowcount != 1:
                    raise LocalSessionStoreError(
                        "Only an existing, finished, pending session "
                        "can be marked as synchronized."
                    )

        except sqlite3.IntegrityError as exc:
            raise LocalSessionStoreError(
                "Backend session ID is already associated with another "
                "local session."
            ) from exc
        except sqlite3.Error as exc:
            raise LocalSessionStoreError(
                f"Could not update synchronization status: {exc}"
            ) from exc
