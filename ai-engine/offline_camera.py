import json
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID, uuid4

import requests
import camera


class OfflineCameraClient:
    """Offline-first camera client with authenticated backend synchronization."""

    ALLOWED_STATUSES = {"COMPLETED", "INCOMPLETE", "UNABLE_TO_ASSESS"}

    def __init__(self, patient_id, database_path=None):
        self.patient_id = str(UUID(str(patient_id)))
        self.session_id = str(uuid4())
        self.database_path = Path(database_path) if database_path else (
            Path(__file__).resolve().parent / "data" / "movexa_camera_offline.db"
        )
        self.database_path.parent.mkdir(parents=True, exist_ok=True)

        self.base_url = os.getenv(
            "MOVEXA_API_BASE_URL", "http://127.0.0.1:8000"
        ).rstrip("/")
        self.access_token = os.getenv("MOVEXA_ACCESS_TOKEN")
        self.prescription_id = os.getenv("MOVEXA_PRESCRIPTION_ID")
        if self.prescription_id:
            self.prescription_id = str(UUID(self.prescription_id))

        self.http = requests.Session()
        if self.access_token:
            self.http.headers.update({
                "Authorization": f"Bearer {self.access_token}",
                "Accept": "application/json",
                "Content-Type": "application/json",
            })

        self._initialize()
        self._create_session()

    @classmethod
    def from_environment(cls):
        patient_id = os.getenv("MOVEXA_PATIENT_ID")
        if not patient_id:
            raise RuntimeError("MOVEXA_PATIENT_ID is required.")
        return cls(patient_id)

    @contextmanager
    def _connect(self):
        connection = sqlite3.connect(str(self.database_path), timeout=15)
        connection.execute("PRAGMA foreign_keys = ON")
        try:
            with connection:
                yield connection
        finally:
            connection.close()

    def _initialize(self):
        with self._connect() as db:
            db.execute("""
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
            db.execute("""
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
            columns = {
                row[1] for row in db.execute(
                    "PRAGMA table_info(offline_camera_sessions)"
                )
            }
            if "backend_session_id" not in columns:
                db.execute(
                    "ALTER TABLE offline_camera_sessions "
                    "ADD COLUMN backend_session_id TEXT"
                )

    def _create_session(self):
        self.started_at = datetime.now(timezone.utc).isoformat()
        with self._connect() as db:
            db.execute("""
                INSERT INTO offline_camera_sessions (
                    session_id, patient_id, prescription_id,
                    exercise, status, started_at, sync_status
                ) VALUES (?, ?, ?, 'Squat', 'IN_PROGRESS', ?, 'PENDING')
            """, (
                self.session_id, self.patient_id,
                self.prescription_id, self.started_at,
            ))

        print("Offline session created:", self.session_id)
        print("Prescription:", self.prescription_id or "Not assigned")
        print("Storage: Local SQLite")

    def submit_metrics(self, result):
        repetitions = result.get("individual_repetitions", [])
        saved = 0

        with self._connect() as db:
            for repetition in repetitions:
                cursor = db.execute("""
                    INSERT OR IGNORE INTO offline_camera_repetitions (
                        session_id, rep_number, repetition_data
                    ) VALUES (?, ?, ?)
                """, (
                    self.session_id,
                    repetition["rep_number"],
                    json.dumps(repetition, allow_nan=False),
                ))
                saved += cursor.rowcount

        return {
            "message": "Metrics saved locally",
            "saved_repetitions": saved,
        }

    def _backend_request(self, method, path, **kwargs):
        response = self.http.request(
            method,
            f"{self.base_url}{path}",
            timeout=15,
            **kwargs,
        )
        response.raise_for_status()
        return response.json() if response.content else {}

    @staticmethod
    def _convert_repetition(rep):
        assessed = rep.get("assessment_status") == "ASSESSED"
        movement_data = {
            key: rep.get(key)
            for key in (
                "min_knee_angle",
                "max_knee_angle",
                "duration_seconds",
                "sample_count",
            )
            if key in rep
        }

        return {
            "rep_number": rep["rep_number"],
            "assessment_status": (
                "ASSESSED" if assessed else "UNABLE_TO_ASSESS"
            ),
            "range_of_motion": rep.get("rom_degrees") if assessed else None,
            "confidence": None,
            "movement_data": movement_data,
            "compensation_flags": {},
            "detected_issues": [],
            "feedback": None,
        }

    def sync_session(self):
        if not self.access_token:
            return {"sync_status": "PENDING", "reason": "Access token missing."}
        if not self.prescription_id:
            return {
                "sync_status": "PENDING",
                "reason": "Active prescription ID missing.",
            }

        with self._connect() as db:
            session = db.execute("""
                SELECT * FROM offline_camera_sessions WHERE session_id = ?
            """, (self.session_id,)).fetchone()
            rows = db.execute("""
                SELECT repetition_data
                FROM offline_camera_repetitions
                WHERE session_id = ?
                ORDER BY rep_number
            """, (self.session_id,)).fetchall()

        if not session or session[4] == "IN_PROGRESS":
            return {
                "sync_status": "PENDING",
                "reason": "Session is not finished.",
            }

        if session[4] not in self.ALLOWED_STATUSES:
            return {
                "sync_status": "PENDING",
                "reason": "Local session has an unsupported terminal status.",
            }

        try:
            created = self._backend_request(
                "POST",
                "/api/sessions",
                json={
                    "prescription_id": self.prescription_id,
                    "client_session_id": self.session_id,
                    "started_at": session[5],
                },
            )

            backend_id = created.get("id") or created.get("session_id")
            if not backend_id:
                raise RuntimeError("Backend response did not contain a session ID.")
            backend_id = str(UUID(str(backend_id)))

            backend_status = created.get("status")
            if backend_status == "IN_PROGRESS":
                completed = self._backend_request(
                    "PATCH",
                    f"/api/sessions/{backend_id}/complete",
                    json={
                        "status": session[4],
                        "completed_at": session[6],
                    },
                )
                if completed.get("status") != session[4]:
                    raise RuntimeError(
                        "Backend did not confirm the expected terminal session status."
                    )
            elif backend_status in self.ALLOWED_STATUSES:
                if backend_status != session[4]:
                    raise RuntimeError(
                        "Backend session status conflicts with the local session."
                    )
            else:
                raise RuntimeError(
                    f"Unexpected backend session status: {backend_status!r}"
                )

            repetitions = [
                self._convert_repetition(json.loads(row[0]))
                for row in rows
            ]
            sync_response = self._backend_request(
                "POST",
                f"/api/sessions/{backend_id}/sync",
                json={"repetitions_data": repetitions},
            )

            if not isinstance(sync_response, dict) or not sync_response.get(
                "synced_at"
            ):
                raise RuntimeError(
                    "Backend did not confirm synchronization with synced_at."
                )

            with self._connect() as db:
                db.execute("""
                    UPDATE offline_camera_sessions
                    SET backend_session_id = ?, sync_status = 'SYNCED'
                    WHERE session_id = ? AND status != 'IN_PROGRESS'
                """, (backend_id, self.session_id))

            return {
                "sync_status": "SYNCED",
                "backend_session_id": backend_id,
                "synced_at": sync_response["synced_at"],
            }

        except Exception as exc:
            print("Backend synchronization pending:", exc)
            return {"sync_status": "PENDING", "reason": str(exc)}

    def complete_session(self, status):
        if status not in self.ALLOWED_STATUSES:
            raise ValueError("Unsupported terminal session status.")

        completed_at = datetime.now(timezone.utc).isoformat()
        with self._connect() as db:
            cursor = db.execute("""
                UPDATE offline_camera_sessions
                SET status = ?, completed_at = ?
                WHERE session_id = ? AND status = 'IN_PROGRESS'
            """, (status, completed_at, self.session_id))

            if cursor.rowcount != 1:
                raise RuntimeError("Could not finalize local session.")

        sync_result = self.sync_session()
        return {
            "message": "Session finalized locally.",
            "session_id": self.session_id,
            "status": status,
            **sync_result,
        }


def main():
    camera.MovexaBackendClient.from_environment = staticmethod(
        OfflineCameraClient.from_environment
    )
    camera.main()


if __name__ == "__main__":
    main()
