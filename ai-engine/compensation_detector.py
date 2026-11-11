
class CompensationDetector:

    def __init__(self):

        self.forward_lean_threshold = 45
        self.asymmetry_threshold = 15

    # Detect excessive forward lean
    def detect_forward_lean(self, trunk_angle):

        if trunk_angle is None:
            return False

        return trunk_angle > self.forward_lean_threshold

    # Detect asymmetrical squat
    def detect_asymmetry(
        self,
        left_knee_angle,
        right_knee_angle
    ):

        if left_knee_angle is None or right_knee_angle is None:
            return False

        difference = abs(
            left_knee_angle - right_knee_angle
        )

        return difference > self.asymmetry_threshold

    # Detect all available compensation patterns
    def detect_all(
        self,
        left_knee_angle,
        right_knee_angle,
        trunk_angle
    ):

        issues = []

        if self.detect_forward_lean(trunk_angle):
            issues.append("Excessive Forward Lean")

        if self.detect_asymmetry(
            left_knee_angle,
            right_knee_angle
        ):
            issues.append("Asymmetrical Squat")

        return issues
