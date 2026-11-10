import sqlite3
import tempfile
import unittest
from contextlib import closing
from pathlib import Path
from unittest.mock import Mock, patch
from uuid import uuid4

import requests

from offline_camera import OfflineCameraClient


class TestOfflineSessionSync(unittest.TestCase):

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)

        self.patient_id = str(uuid4())
        self.prescription_id = str(uuid4())
        self.backend_id = str(uuid4())
        self.db_path = Path(self.temp.name) / "sync_test.db"

        self.env = patch.dict("os.environ", {
            "MOVEXA_PATIENT_ID": self.patient_id,
            "MOVEXA_PRESCRIPTION_ID": self.prescription_id,
            "MOVEXA_ACCESS_TOKEN": "mock-token",
            "MOVEXA_API_BASE_URL": "http://localhost:8001",
        })
        self.env.start()
        self.addCleanup(self.env.stop)

        self.client = OfflineCameraClient(self.patient_id, self.db_path)
        self.addCleanup(self.client.http.close)

        self.client.submit_metrics({
            "individual_repetitions": [{
                "rep_number": 1,
                "assessment_status": "ASSESSED",
                "min_knee_angle": 90.0,
                "max_knee_angle": 170.0,
                "rom_degrees": 80.0,
                "duration_seconds": 2.0,
                "sample_count": 10,
            }]
        })

        with closing(sqlite3.connect(self.db_path)) as db:
            db.execute("""
                UPDATE offline_camera_sessions
                SET status = 'COMPLETED', completed_at = ?
                WHERE session_id = ?
            """, ("2026-11-10T12:00:00+00:00", self.client.session_id))
            db.commit()

    def get_sync_status(self):
        with closing(sqlite3.connect(self.db_path)) as db:
            return db.execute(
                "SELECT sync_status FROM offline_camera_sessions "
                "WHERE session_id = ?",
                (self.client.session_id,),
            ).fetchone()[0]

    def test_successful_sync_uses_required_api_sequence(self):
        self.client._backend_request = Mock(side_effect=[
            {"id": self.backend_id, "status": "IN_PROGRESS"},
            {"status": "COMPLETED"},
            {"synced_at": "2026-11-10T12:01:00+00:00"},
        ])

        result = self.client.sync_session()

        self.assertEqual(result["sync_status"], "SYNCED")
        self.assertEqual(self.get_sync_status(), "SYNCED")

        calls = self.client._backend_request.call_args_list
        self.assertEqual(calls[0].args[:2], ("POST", "/api/sessions"))
        self.assertEqual(
            calls[1].args[:2],
            ("PATCH", f"/api/sessions/{self.backend_id}/complete"),
        )
        self.assertEqual(
            calls[2].args[:2],
            ("POST", f"/api/sessions/{self.backend_id}/sync"),
        )

        payload = calls[2].kwargs["json"]["repetitions_data"][0]
        self.assertEqual(payload["rep_number"], 1)
        self.assertEqual(payload["range_of_motion"], 80.0)
        self.assertIsNone(payload["confidence"])

    def test_retry_skips_completion_when_backend_already_terminal(self):
        self.client._backend_request = Mock(side_effect=[
            {"id": self.backend_id, "status": "COMPLETED"},
            {"synced_at": "2026-11-10T12:02:00+00:00"},
        ])

        result = self.client.sync_session()

        self.assertEqual(result["sync_status"], "SYNCED")
        calls = self.client._backend_request.call_args_list
        self.assertEqual(len(calls), 2)
        self.assertEqual(calls[0].args[:2], ("POST", "/api/sessions"))
        self.assertEqual(
            calls[1].args[:2],
            ("POST", f"/api/sessions/{self.backend_id}/sync"),
        )

    def test_missing_synced_timestamp_stays_pending(self):
        self.client._backend_request = Mock(side_effect=[
            {"id": self.backend_id, "status": "IN_PROGRESS"},
            {"status": "COMPLETED"},
            {"status": "COMPLETED", "synced_at": None},
        ])

        result = self.client.sync_session()

        self.assertEqual(result["sync_status"], "PENDING")
        self.assertEqual(self.get_sync_status(), "PENDING")

    def test_missing_prescription_stays_pending(self):
        self.client.prescription_id = None
        self.client._backend_request = Mock()

        result = self.client.sync_session()

        self.assertEqual(result["sync_status"], "PENDING")
        self.assertEqual(self.get_sync_status(), "PENDING")
        self.client._backend_request.assert_not_called()

    def test_backend_failure_stays_pending(self):
        self.client._backend_request = Mock(side_effect=[
            {"id": self.backend_id, "status": "IN_PROGRESS"},
            {"status": "COMPLETED"},
            requests.HTTPError("Simulated sync failure"),
        ])

        result = self.client.sync_session()

        self.assertEqual(result["sync_status"], "PENDING")
        self.assertEqual(self.get_sync_status(), "PENDING")


if __name__ == "__main__":
    unittest.main(verbosity=2)
