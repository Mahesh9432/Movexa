import sqlite3
import tempfile
import unittest
from contextlib import closing
from pathlib import Path
from uuid import uuid4

from offline_camera import OfflineCameraClient


class OfflineCameraIntegrationTest(unittest.TestCase):
    def test_complete_local_session(self):
        with tempfile.TemporaryDirectory() as temp:
            patient_id = str(uuid4())
            database_path = Path(temp) / "camera_test.db"

            client = OfflineCameraClient(patient_id, database_path)

            metrics = {
                "individual_repetitions": [
                    {
                        "rep_number": 1,
                        "assessment_status": "ASSESSED",
                        "min_knee_angle": 90.0,
                        "max_knee_angle": 170.0,
                        "rom_degrees": 80.0,
                        "duration_seconds": 2.0,
                        "sample_count": 10,
                    },
                    {
                        "rep_number": 2,
                        "assessment_status": "ASSESSED",
                        "min_knee_angle": 95.0,
                        "max_knee_angle": 168.0,
                        "rom_degrees": 73.0,
                        "duration_seconds": 2.2,
                        "sample_count": 11,
                    },
                ]
            }

            response = client.submit_metrics(metrics)
            self.assertEqual(response["saved_repetitions"], 2)

            completed = client.complete_session("COMPLETED")
            self.assertEqual(completed["status"], "COMPLETED")

            with closing(sqlite3.connect(database_path)) as db:
                session = db.execute(
                    "SELECT status, sync_status "
                    "FROM offline_camera_sessions"
                ).fetchone()

                repetitions = db.execute(
                    "SELECT COUNT(*) FROM offline_camera_repetitions"
                ).fetchone()[0]

            self.assertEqual(session, ("COMPLETED", "PENDING"))
            self.assertEqual(repetitions, 2)

            print("SYNTHETIC SESSION: PASSED")
            print("REPETITIONS SAVED: 2")
            print("SESSION STATUS: COMPLETED")
            print("SYNC STATUS: PENDING")


if __name__ == "__main__":
    unittest.main(verbosity=2)
