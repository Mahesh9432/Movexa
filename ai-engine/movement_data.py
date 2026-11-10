class MovementData:

    def __init__(
        self,
        timestamp,
        exercise,
        phase,
        left_knee_angle,
        right_knee_angle,
        hip_angle,
        ankle_angle,
        pose_confidence,
        repetition_count
    ):

        self.timestamp = timestamp
        self.exercise = exercise
        self.phase = phase

        self.left_knee_angle = left_knee_angle
        self.right_knee_angle = right_knee_angle

        self.hip_angle = hip_angle
        self.ankle_angle = ankle_angle

        self.pose_confidence = pose_confidence
        self.repetition_count = repetition_count

    def to_dict(self):

        return self.__dict__