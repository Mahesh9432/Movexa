
import time


class SquatAnalyzer:

    def __init__(self):

        self.state = "STANDING"
        self.rep_count = 0

        # Provisional thresholds
        self.standing_threshold = 160
        self.bottom_threshold = 110

        # Repetition tracking
        self.completed_reps = []
        self.rep_start_time = None
        self.min_knee_angle = None
        self.max_knee_angle = None
        self.sample_count = 0

        # Preliminary quality checks
        self.minimum_samples = 5
        self.minimum_duration = 0.5

    def analyze(self, knee_angle):

        if knee_angle is None:
            return self.state, self.rep_count

        # Reject invalid knee angles
        if not 0 <= knee_angle <= 180:
            return self.state, self.rep_count

        # Standing -> Descending
        if self.state == "STANDING":

            if knee_angle < self.standing_threshold:

                self.state = "DESCENDING"

                self.rep_start_time = time.time()
                self.min_knee_angle = knee_angle
                self.max_knee_angle = knee_angle
                self.sample_count = 1

        # Track repetition measurements
        if self.rep_start_time is not None:

            self.min_knee_angle = min(
                self.min_knee_angle, knee_angle
            )

            self.max_knee_angle = max(
                self.max_knee_angle, knee_angle
            )

            self.sample_count += 1

        # Descending -> Bottom
        if self.state == "DESCENDING":

            if knee_angle <= self.bottom_threshold:
                self.state = "BOTTOM"

        # Bottom -> Ascending
        elif self.state == "BOTTOM":

            if knee_angle > self.bottom_threshold:
                self.state = "ASCENDING"

        # Ascending -> Standing
        elif self.state == "ASCENDING":

            if knee_angle >= self.standing_threshold:

                self.state = "STANDING"
                self.rep_count += 1

                end_time = time.time()

                rep_duration = (
                    end_time - self.rep_start_time
                )

                rom = (
                    self.max_knee_angle -
                    self.min_knee_angle
                )

                # Assess repetition quality
                if (
                    self.sample_count >= self.minimum_samples
                    and rep_duration >= self.minimum_duration
                ):
                    assessment_status = "ASSESSED"
                else:
                    assessment_status = "UNABLE_TO_ASSESS"

                rep_result = {
                    "rep_number": self.rep_count,
                    "min_knee_angle": round(
                        self.min_knee_angle, 2
                    ),
                    "max_knee_angle": round(
                        self.max_knee_angle, 2
                    ),
                    "rom_degrees": round(rom, 2),
                    "duration_seconds": round(
                        rep_duration, 2
                    ),
                    "sample_count": self.sample_count,
                    "assessment_status": assessment_status
                }

                self.completed_reps.append(rep_result)

                # Reset tracking
                self.rep_start_time = None
                self.min_knee_angle = None
                self.max_knee_angle = None
                self.sample_count = 0

        return self.state, self.rep_count

    def get_completed_reps(self):
        return self.completed_reps
