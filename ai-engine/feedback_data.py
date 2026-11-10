
class FeedbackData:

    def __init__(
        self,
        feedback_id,
        issue_id,
        feedback_message,
        feedback_type,
        priority,
        target_body_region,
        timestamp,
        is_active
    ):

        self.feedback_id = feedback_id
        self.issue_id = issue_id
        self.feedback_message = feedback_message
        self.feedback_type = feedback_type
        self.priority = priority
        self.target_body_region = target_body_region
        self.timestamp = timestamp
        self.is_active = is_active

    def to_dict(self):
        return self.__dict__
