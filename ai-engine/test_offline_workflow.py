import tempfile
import unittest
from pathlib import Path
from uuid import uuid4

from local_session_store import LocalSessionStore


class OfflineWorkflowTests(unittest.TestCase):
    def test_complete_offline_recording_and_recovery(self):
        with tempfile.TemporaryDirectory() as directory:
            db_path = Path(directory) / "offline_test.db"

            patient_id = str(uuid4())
            prescription_id = str(uuid4())
            client_session_id = str(uuid4())

            store = LocalSessionStore(db_path)

            created_id = store.create_session(
                patient_id=patient_id,
                prescription_id=prescription_id,
                exercise="Squat",
                client_session_id=client_session_id,
            )

            self.assertEqual(created_id, client_session_id)

            store.save_repetition(
                client_session_id,
                {
                    "rep_number": 1,
                    "assessment_status": "ASSESSED",
                    "min_knee_angle": 90.0,
                    "max_knee_angle": 170.0,
                    "rom_degrees": 80.0,
                    "duration_seconds": 2.0,
                    "sample_count": 10,
                },
            )

            store.finish_session(
                client_session_id,
                "COMPLETED",
                {"total_reps": 1, "duration_seconds": 10.0},
            )

            recovered = LocalSessionStore(db_path).get_session(
                client_session_id
            )

            self.assertEqual(recovered["status"], "COMPLETED")
            self.assertEqual(len(recovered["repetitions_data"]), 1)
            self.assertEqual(recovered["sync_status"], "PENDING")

            print("OFFLINE SESSION: SAVED")
            print("REPETITION: SAVED")
            print("SESSION RECOVERY: SUCCESS")
            print("SYNC STATUS: PENDING")


if __name__ == "__main__":
    unittest.main(verbosity=2)
