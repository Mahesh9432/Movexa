import json
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID, uuid4

import camera


class OfflineCameraClient:
    """Local-only adapter for camera sessions without backend connectivity."""

    def __init__(self, patient_id, database_path=None):
        self.patient_id = str(UUID(str(patient_id)))
        self.session_id = str(uuid4())

        if database_path is None:
            database_path = (
                Path(__file__).resolve().parent
                / "data"
                / "movexa_camera_offline.db"
            )

        self.database_path = Path(database_path)
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize()
        self._create_session()

    @classmethod
    def from_environment(cls):
        patient_id = os.getenv("MOVEXA_PATIENT_ID")
        if not patient_id:
            raise RuntimeError(
                "MOVEXA_PATIENT_ID is required for offline recording."
            )
        return cls(patient_id)

    @contextmanager
    def _connect(self):
        connection = sqlite3.connect(str(self.database_path), timeout=15)
        try:
            connection.execute("PRAGMA foreign_keys = ON")
            with connection:
                yield connection
        finally:
            connection.close()

    def _initialize(self):
        with self._connect() as connection:
            connection.execute("""
                CREATE TABLE IF NOT EXISTS offline_camera_sessions (
                    session_id TEXT PRIMARY KEY,
                    patient_id TEXT NOT NULL,
                    prescription_id TEXT,
                    exercise TEXT NOT NULL,
                    status TEXT NOT NULL,
                    started_at TEXT NOT NULL,
                    completed_at TEXT,
                    session_summary TEXT,
                    sync_status TEXT NOT NULL DEFAULT 'PENDING'
                )
            """)
            connection.execute("""
                CREATE TABLE IF NOT EXISTS offline_camera_repetitions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    rep_number INTEGER NOT NULL,
                    repetition_data TEXT NOT NULL,
                    UNIQUE(session_id, rep_number),
                    FOREIGN KEY(session_id)
                        REFERENCES offline_camera_sessions(session_id)
                        ON DELETE CASCADE
                )
            """)

    def _create_session(self):
        prescription_id = os.getenv("MOVEXA_PRESCRIPTION_ID") or None
        if prescription_id:
            prescription_id = str(UUID(prescription_id))

        with self._connect() as connection:
            connection.execute("""
                INSERT INTO offline_camera_sessions (
                    session_id, patient_id, prescription_id,
                    exercise, status, started_at
                )
                VALUES (?, ?, ?, 'Squat', 'IN_PROGRESS', ?)
            """, (
                self.session_id,
                self.patient_id,
                prescription_id,
                datetime.now(timezone.utc).isoformat(),
            ))

        print(f"Offline session created: {self.session_id}")
        print("Prescription:", prescription_id or "Not assigned")
        print("Storage: Local SQLite")

    def submit_metrics(self, result):
        repetitions = result.get("individual_repetitions", [])

        with self._connect() as connection:
            for repetition in repetitions:
                connection.execute("""
                    INSERT OR IGNORE INTO offline_camera_repetitions (
                        session_id, rep_number, repetition_data
                    )
                    VALUES (?, ?, ?)
                """, (
                    self.session_id,
                    repetition["rep_number"],
                    json.dumps(repetition, allow_nan=False),
                ))

        return {
            "message": "Metrics saved locally",
            "saved_repetitions": len(repetitions),
        }

    def complete_session(self, status):
        allowed = {"COMPLETED", "INCOMPLETE", "UNABLE_TO_ASSESS"}
        if status not in allowed:
            raise ValueError("Unsupported terminal session status.")

        with self._connect() as connection:
            cursor = connection.execute("""
                UPDATE offline_camera_sessions
                SET status = ?, completed_at = ?
                WHERE session_id = ? AND status = 'IN_PROGRESS'
            """, (
                status,
                datetime.now(timezone.utc).isoformat(),
                self.session_id,
            ))

            if cursor.rowcount != 1:
                raise RuntimeError("Could not finalize local session.")

        return {
            "message": "Session saved locally; backend sync is pending",
            "session_id": self.session_id,
            "status": status,
        }


def main():
    camera.MovexaBackendClient.from_environment = staticmethod(
        OfflineCameraClient.from_environment
    )
    camera.main()


if __name__ == "__main__":
    main()
