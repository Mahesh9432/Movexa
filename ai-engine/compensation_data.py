class CompensationData:

    def __init__(
        self,
        compensation_detected,
        compensation_type,
        body_region,
        severity,
        deviation_angle,
        timestamp,
        feedback
    ):

        self.compensation_detected = compensation_detected
        self.compensation_type = compensation_type
        self.body_region = body_region
        self.severity = severity
        self.deviation_angle = deviation_angle
        self.timestamp = timestamp
        self.feedback = feedback

    def to_dict(self):

        return self.__dict__