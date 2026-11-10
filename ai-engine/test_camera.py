import unittest
from contextlib import ExitStack
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import camera


class CameraLifecycleTests(unittest.TestCase):

    def setUp(self):
        self.stack = ExitStack()
        self.addCleanup(self.stack.close)

        self.session_id = "12345678-1234-5678-1234-567812345678"

        self.backend = MagicMock()
        self.backend.session_id = self.session_id
        self.backend.submit_metrics.return_value = {"message": "Metrics saved"}
        self.backend.complete_session.return_value = {"message": "Session updated"}

        self.detector = MagicMock()
        self.detector.detect_pose.return_value = SimpleNamespace(pose_landmarks=[])

        self.cap = MagicMock()
        self.cap.isOpened.return_value = True
        self.cap.read.return_value = (True, object())

        self.tracker = MagicMock()
        self.tracker.get_summary.return_value = {
            "total_reps": 0,
            "duration_seconds": 10.0,
            "reps_per_minute": 0.0,
        }

        self.analyzer = MagicMock()
        self.analyzer.analyze.return_value = ("STANDING", 0)
        self.analyzer.get_completed_reps.return_value = []

        self.formatter = MagicMock()

        def format_result(**kwargs):
            return {
                "session_id": kwargs["session_id"],
                "exercise": kwargs["exercise"],
                "individual_repetitions": kwargs["completed_reps"],
                "compensation_issues": kwargs["compensation_issues"],
                "session_summary": kwargs["session_summary"],
            }

        self.formatter.format_result.side_effect = format_result

        self.stack.enter_context(patch.object(
            camera.MovexaBackendClient,
            "from_environment",
            return_value=self.backend,
        ))
        self.stack.enter_context(patch.object(
            camera, "PoseDetector", return_value=self.detector
        ))
        self.stack.enter_context(patch.object(
            camera.cv2, "VideoCapture", return_value=self.cap
        ))
        self.stack.enter_context(patch.object(
            camera, "SessionTracker", return_value=self.tracker
        ))
        self.stack.enter_context(patch.object(
            camera, "SquatAnalyzer", return_value=self.analyzer
        ))
        self.stack.enter_context(patch.object(
            camera, "ResultFormatter", return_value=self.formatter
        ))
        self.stack.enter_context(patch.object(camera, "draw_text"))
        self.stack.enter_context(patch.object(
            camera.cv2, "flip", side_effect=lambda frame, code: frame
        ))
        self.stack.enter_context(patch.object(camera.cv2, "imshow"))
        self.stack.enter_context(patch.object(
            camera.cv2, "waitKey", return_value=ord("q")
        ))
        self.stack.enter_context(patch.object(camera.cv2, "destroyAllWindows"))

    def configure_successful_repetition(self):
        landmarks = [
            SimpleNamespace(visibility=1.0, x=0.5, y=0.5)
            for _ in range(33)
        ]

        self.detector.detect_pose.return_value = SimpleNamespace(
            pose_landmarks=[landmarks]
        )

        self.stack.enter_context(patch.object(
            camera, "draw_skeleton", return_value=[(100, 100)] * 29
        ))
        self.stack.enter_context(patch.object(
            camera, "calculate_angle", return_value=90.0
        ))
        self.stack.enter_context(patch.object(
            camera.ConfidenceChecker,
            "check_landmarks",
            return_value=True,
        ))
        self.stack.enter_context(patch.object(
            camera.TrunkAngleCalculator,
            "calculate_trunk_angle",
            return_value=10.0,
        ))

        self.analyzer.analyze.return_value = ("STANDING", 1)
        self.analyzer.get_completed_reps.return_value = [
            {
                "rep_number": 1,
                "assessment_status": "ASSESSED",
                "min_knee_angle": 90.0,
                "max_knee_angle": 170.0,
                "rom_degrees": 80.0,
                "duration_seconds": 2.0,
                "sample_count": 10,
            }
        ]

        self.tracker.get_summary.return_value = {
            "total_reps": 1,
            "duration_seconds": 10.0,
            "reps_per_minute": 6.0,
        }

    def test_successful_repetition_submits_metrics_and_finalizes(self):
        self.configure_successful_repetition()
        camera.main()

        self.backend.submit_metrics.assert_called_once()
        submitted = self.backend.submit_metrics.call_args.args[0]

        self.assertEqual(submitted["session_id"], self.session_id)
        self.assertEqual(len(submitted["individual_repetitions"]), 1)
        self.backend.complete_session.assert_called_once_with("INCOMPLETE")

        self.tracker.start_session.assert_called_once()
        self.tracker.end_session.assert_called_once()
        self.cap.release.assert_called_once()
        self.detector.close.assert_called_once()

    def test_no_repetitions_skips_metrics_and_marks_unable_to_assess(self):
        camera.main()

        self.backend.submit_metrics.assert_not_called()
        self.backend.complete_session.assert_called_once_with("UNABLE_TO_ASSESS")
        self.cap.release.assert_called_once()
        self.detector.close.assert_called_once()

    def test_camera_initialization_failure_finalizes_session(self):
        self.cap.isOpened.return_value = False

        with self.assertRaisesRegex(RuntimeError, "Unable to access webcam"):
            camera.main()

        self.tracker.start_session.assert_not_called()
        self.tracker.end_session.assert_not_called()
        self.backend.submit_metrics.assert_not_called()
        self.backend.complete_session.assert_called_once_with("UNABLE_TO_ASSESS")
        self.cap.release.assert_called_once()
        self.detector.close.assert_called_once()

    def test_processing_error_still_attempts_session_finalization(self):
        self.detector.detect_pose.side_effect = RuntimeError(
            "Simulated pose processing failure"
        )

        with self.assertRaisesRegex(
            RuntimeError, "Simulated pose processing failure"
        ):
            camera.main()

        self.backend.complete_session.assert_called_once_with("UNABLE_TO_ASSESS")
        self.cap.release.assert_called_once()
        self.detector.close.assert_called_once()

    def test_metrics_failure_still_attempts_session_completion(self):
        self.configure_successful_repetition()
        self.backend.submit_metrics.side_effect = RuntimeError(
            "Simulated backend metrics failure"
        )

        with self.assertRaisesRegex(
            RuntimeError, "Simulated backend metrics failure"
        ):
            camera.main()

        self.backend.submit_metrics.assert_called_once()
        self.backend.complete_session.assert_called_once_with("INCOMPLETE")
        self.cap.release.assert_called_once()
        self.detector.close.assert_called_once()

    def test_completion_failure_is_reported(self):
        self.backend.complete_session.side_effect = RuntimeError(
            "Simulated session completion failure"
        )

        with self.assertRaisesRegex(
            RuntimeError, "Simulated session completion failure"
        ):
            camera.main()

        self.backend.submit_metrics.assert_not_called()
        self.backend.complete_session.assert_called_once_with("UNABLE_TO_ASSESS")


if __name__ == "__main__":
    unittest.main(verbosity=2)
