
class FormFeedback:

    def __init__(self):

        self.bottom_threshold = 110
        self.standing_threshold = 160

    def get_feedback(self, knee_angle, squat_state):

        if knee_angle is None:
            return "Unable to Assess"

        # Feedback during descent
        if squat_state == "DESCENDING":

            if knee_angle > self.bottom_threshold:
                return "Squat deeper"

            else:
                return "Good squat depth"

        # Feedback at bottom
        elif squat_state == "BOTTOM":

            return "Good squat depth"

        # Feedback while ascending
        elif squat_state == "ASCENDING":

            return "Keep pushing up"

        # Feedback while standing
        elif squat_state == "STANDING":

            if knee_angle >= self.standing_threshold:
                return "Stand straight"

        return "Keep moving"
