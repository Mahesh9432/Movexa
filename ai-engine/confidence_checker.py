
import math


class ConfidenceChecker:

    def __init__(self, visibility_threshold=0.3):
        self.visibility_threshold = visibility_threshold

    def check_landmarks(self, landmarks, required_indices):

        if not landmarks or not required_indices:
            return False

        for index in required_indices:

            # Check whether landmark index exists
            if index >= len(landmarks) or index < 0:
                return False

            landmark = landmarks[index]

            if landmark is None:
                return False

            # Check landmark visibility
            visibility = getattr(landmark, "visibility", None)

            if visibility is None:
                return False

            if not math.isfinite(visibility):
                return False

            if visibility < self.visibility_threshold:
                return False

            # Check landmark coordinates
            if not math.isfinite(landmark.x):
                return False

            if not math.isfinite(landmark.y):
                return False

        return True
