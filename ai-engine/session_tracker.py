
import time


class SessionTracker:

    def __init__(self):
        self.start_time = None
        self.end_time = None
        self.total_reps = 0

    def start_session(self):
        self.start_time = time.time()
        self.end_time = None
        self.total_reps = 0

    def update_reps(self, reps):
        self.total_reps = reps

    def end_session(self):
        if self.start_time is not None and self.end_time is None:
            self.end_time = time.time()

    def get_summary(self):

        if self.start_time is None:
            return None

        finish_time = self.end_time if self.end_time is not None else time.time()

        duration = finish_time - self.start_time
        minutes = duration / 60

        if minutes > 0:
            reps_per_minute = self.total_reps / minutes
        else:
            reps_per_minute = 0

        return {
            "total_reps": self.total_reps,
            "duration_seconds": round(duration, 2),
            "reps_per_minute": round(reps_per_minute, 2)
        }
