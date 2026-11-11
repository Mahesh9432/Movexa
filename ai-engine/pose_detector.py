
from pathlib import Path
import cv2
import mediapipe as mp

from mediapipe.tasks import python
from mediapipe.tasks.python import vision


class PoseDetector:

    def __init__(self):

        model_path = str(
            Path(__file__).parent / "models" / "pose_landmarker_lite.task"
)

        base_options = python.BaseOptions(
            model_asset_path=model_path
        )

        options = vision.PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.VIDEO,
            num_poses=1
        )

        self.detector = vision.PoseLandmarker.create_from_options(
            options
        )

    def detect_pose(self, frame, timestamp_ms):

        rgb_frame = cv2.cvtColor(
            frame,
            cv2.COLOR_BGR2RGB
        )

        mp_image = mp.Image(
            image_format=mp.ImageFormat.SRGB,
            data=rgb_frame
        )

        result = self.detector.detect_for_video(
            mp_image,
            timestamp_ms
        )

        return result

    def close(self):

        self.detector.close()
