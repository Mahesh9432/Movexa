import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from uuid import uuid4

import camera
from offline_camera import OfflineCameraClient, main


class OfflineCameraEntryPointTest(unittest.TestCase):
    def test_main_routes_camera_pipeline_to_local_client(self):
        with tempfile.TemporaryDirectory() as temp:
            client = OfflineCameraClient(
                str(uuid4()),
                Path(temp) / "entrypoint_test.db",
            )

            original_factory = (
                camera.MovexaBackendClient.__dict__["from_environment"]
            )
            observed = {}

            def simulated_camera_pipeline():
                observed["client"] = (
                    camera.MovexaBackendClient.from_environment()
                )

            try:
                with patch.object(
                    OfflineCameraClient,
                    "from_environment",
                    return_value=client,
                ):
                    with patch.object(
                        camera,
                        "main",
                        side_effect=simulated_camera_pipeline,
                    ) as mocked_camera_main:
                        main()
                        mocked_camera_main.assert_called_once()

                self.assertIs(observed["client"], client)

            finally:
                camera.MovexaBackendClient.from_environment = (
                    original_factory
                )

            print("OFFLINE ENTRY POINT: PASSED")
            print("CAMERA PIPELINE: INVOKED")
            print("LOCAL CLIENT: VERIFIED")
            print("WEBCAM: NOT REQUIRED")


if __name__ == "__main__":
    unittest.main(verbosity=2)
