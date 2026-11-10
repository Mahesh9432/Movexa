import os
from uuid import UUID

import requests


class BackendClientError(RuntimeError):
    """Raised when backend communication configuration or requests fail."""


class MovexaBackendClient:
    """Authenticated HTTP client for Movexa rehabilitation session APIs."""

    ALLOWED_SESSION_STATUSES = {
        "COMPLETED",
        "INCOMPLETE",
        "UNABLE_TO_ASSESS",
    }

    def __init__(
        self,
        base_url,
        session_id,
        access_token,
        http_session=None,
        timeout=15,
    ):
        if not base_url:
            raise BackendClientError("Backend API base URL is required.")

        if not access_token:
            raise BackendClientError("Patient access token is required.")

        try:
            self.session_id = str(UUID(str(session_id)))
        except (ValueError, TypeError, AttributeError) as exc:
            raise BackendClientError(
                "A valid backend-generated session UUID is required."
            ) from exc

        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.http = http_session or requests.Session()

        self.http.headers.update(
            {
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json",
                "Content-Type": "application/json",
            }
        )

    @classmethod
    def from_environment(cls):
        """Create the client using environment configuration."""

        base_url = os.getenv(
            "MOVEXA_API_BASE_URL",
            "http://127.0.0.1:8000",
        )
        session_id = os.getenv("MOVEXA_SESSION_ID")
        access_token = os.getenv("MOVEXA_ACCESS_TOKEN")

        if not session_id:
            raise BackendClientError(
                "MOVEXA_SESSION_ID environment variable is missing."
            )

        if not access_token:
            raise BackendClientError(
                "MOVEXA_ACCESS_TOKEN environment variable is missing."
            )

        return cls(
            base_url=base_url,
            session_id=session_id,
            access_token=access_token,
        )

    def submit_metrics(self, ai_result):
        """Submit per-repetition AI measurements to the backend."""

        if not isinstance(ai_result, dict):
            raise BackendClientError("AI result must be a dictionary.")

        result_session_id = ai_result.get("session_id")

        if result_session_id:
            try:
                result_session_id = str(UUID(str(result_session_id)))
            except (ValueError, TypeError, AttributeError) as exc:
                raise BackendClientError(
                    "AI result contains an invalid session UUID."
                ) from exc

            if result_session_id != self.session_id:
                raise BackendClientError(
                    "AI result session UUID does not match the backend session."
                )

        repetitions = ai_result.get("individual_repetitions")

        if not isinstance(repetitions, list):
            raise BackendClientError(
                "AI result must contain an individual_repetitions list."
            )

        if not repetitions:
            return None

        compensation_issues = ai_result.get("compensation_issues", [])

        if not isinstance(compensation_issues, list):
            raise BackendClientError(
                "AI compensation_issues must be a list."
            )

        payload = dict(ai_result)
        payload["session_id"] = self.session_id

        url = (
            f"{self.base_url}/api/sessions/"
            f"{self.session_id}/metrics"
        )

        response = self.http.post(
            url,
            json=payload,
            timeout=self.timeout,
        )
        response.raise_for_status()

        return response.json()

    def complete_session(self, status):
        """Update the backend session status after camera processing."""

        if status not in self.ALLOWED_SESSION_STATUSES:
            raise BackendClientError(
                f"Unsupported session status: {status}"
            )

        url = (
            f"{self.base_url}/api/sessions/"
            f"{self.session_id}/complete"
        )

        response = self.http.patch(
            url,
            json={"status": status},
            timeout=self.timeout,
        )
        response.raise_for_status()

        return response.json()
