
from collections import deque


class AngleSmoother:

    def __init__(self, window_size=5):

        self.angles = deque(maxlen=window_size)

    def smooth(self, angle):

        if angle is None:
            return None

        self.angles.append(angle)

        smoothed_angle = sum(self.angles) / len(self.angles)

        return smoothed_angle
