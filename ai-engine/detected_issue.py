
class DetectedIssue:

    def __init__(
        self,
        issue_id,
        issue_name,
        body_region,
        detected,
        severity,
        confidence,
        deviation_value,
        timestamp,
        rep_number
    ):

        self.issue_id = issue_id
        self.issue_name = issue_name
        self.body_region = body_region
        self.detected = detected
        self.severity = severity
        self.confidence = confidence
        self.deviation_value = deviation_value
        self.timestamp = timestamp
        self.rep_number = rep_number

    def to_dict(self):
        return self.__dict__
