
import math


class TrunkAngleCalculator:

    def calculate_trunk_angle(self, shoulder, hip):

        if shoulder is None or hip is None:
            return None

        dx = shoulder[0] - hip[0]
        dy = shoulder[1] - hip[1]

        if dx == 0 and dy == 0:
            return None

        angle = math.degrees(
            math.atan2(abs(dx), abs(dy))
        )

        return round(angle, 2)
