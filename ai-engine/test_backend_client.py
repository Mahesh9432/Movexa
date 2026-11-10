import unittest
from unittest.mock import MagicMock, patch
from uuid import uuid4

from backend_client import (
    BackendClientError,
    MovexaBackendClient,
)


class TestMovexaBackendClient(unittest.TestCase):

    def setUp(self):
        self.session_id = str(uuid4())
        self.http = MagicMock()

        self.client = MovexaBackendClient(
            base_url="http://localhost:8000/",
            session_id=self.session_id,
            access_token="test-patient-token",
            http_session=self.http,
        )

        self.ai_result = {
            "session_id": self.session_id,
            "exercise": "Squat",
            "repetitions": 1,
            "individual_repetitions": [
                {
                    "rep_number": 1,
                    "assessment_status": "ASSESSED",
                    "min_knee_angle": 85.0,
                    "max_knee_angle": 170.0,
                    "rom_degrees": 85.0,
                    "duration_seconds": 2.1,
                    "sample_count": 12,
                }
            ],
            "compensation_issues": [],
        }

        self.http.post.return_value.json.return_value = {
            "message": "Metrics saved"
        }
        self.http.patch.return_value.json.return_value = {
            "status": "INCOMPLETE"
        }

    def test_initializes_authorization_header(self):
        self.assertEqual(
            self.http.headers.update.call_args[0][0]["Authorization"],
            "Bearer test-patient-token",
        )

    def test_submits_metrics_to_backend_session(self):
        result = self.client.submit_metrics(self.ai_result)

        self.http.post.assert_called_once()

        args, kwargs = self.http.post.call_args

        self.assertEqual(
            args[0],
            f"http://localhost:8000/api/sessions/{self.session_id}/metrics",
        )
        self.assertEqual(kwargs["json"]["session_id"], self.session_id)
        self.assertEqual(
            len(kwargs["json"]["individual_repetitions"]),
            1,
        )
        self.assertEqual(result, {"message": "Metrics saved"})

    def test_skips_metrics_when_no_repetitions_exist(self):
        empty_result = dict(self.ai_result)
        empty_result["individual_repetitions"] = []

        result = self.client.submit_metrics(empty_result)

        self.assertIsNone(result)
        self.http.post.assert_not_called()

    def test_rejects_mismatched_session_id(self):
        wrong_result = dict(self.ai_result)
        wrong_result["session_id"] = str(uuid4())

        with self.assertRaises(BackendClientError):
            self.client.submit_metrics(wrong_result)

        self.http.post.assert_not_called()

    def test_rejects_invalid_session_uuid(self):
        with self.assertRaises(BackendClientError):
            MovexaBackendClient(
                base_url="http://localhost:8000",
                session_id="not-a-uuid",
                access_token="test-token",
            )

    def test_rejects_missing_access_token(self):
        with self.assertRaises(BackendClientError):
            MovexaBackendClient(
                base_url="http://localhost:8000",
                session_id=self.session_id,
                access_token="",
            )

    def test_completes_session_with_incomplete_status(self):
        result = self.client.complete_session("INCOMPLETE")

        self.http.patch.assert_called_once_with(
            f"http://localhost:8000/api/sessions/{self.session_id}/complete",
            json={"status": "INCOMPLETE"},
            timeout=15,
        )
        self.assertEqual(result, {"status": "INCOMPLETE"})

    def test_completes_session_as_unable_to_assess(self):
        self.client.complete_session("UNABLE_TO_ASSESS")

        self.http.patch.assert_called_once()

        payload = self.http.patch.call_args.kwargs["json"]
        self.assertEqual(payload["status"], "UNABLE_TO_ASSESS")

    def test_rejects_unknown_session_status(self):
        with self.assertRaises(BackendClientError):
            self.client.complete_session("SUCCESS")

        self.http.patch.assert_not_called()

    @patch.dict(
        "os.environ",
        {
            "MOVEXA_API_BASE_URL": "http://localhost:8000",
            "MOVEXA_SESSION_ID": "",
            "MOVEXA_ACCESS_TOKEN": "test-token",
        },
    )
    def test_environment_requires_session_id(self):
        with self.assertRaises(BackendClientError):
            MovexaBackendClient.from_environment()

    @patch.dict(
        "os.environ",
        {
            "MOVEXA_API_BASE_URL": "http://localhost:8000",
            "MOVEXA_SESSION_ID": str(uuid4()),
            "MOVEXA_ACCESS_TOKEN": "",
        },
    )
    def test_environment_requires_access_token(self):
        with self.assertRaises(BackendClientError):
            MovexaBackendClient.from_environment()


if __name__ == "__main__":
    unittest.main()
