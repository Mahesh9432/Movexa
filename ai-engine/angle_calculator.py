
import math


def calculate_angle(point_a, point_b, point_c):

    """
    Calculate angle between three points.

    point_b is the vertex (middle point).

    Returns angle in degrees.
    """

    ax, ay = point_a
    bx, by = point_b
    cx, cy = point_c

    # Calculate vectors from the middle point
    vector_1 = (ax - bx, ay - by)
    vector_2 = (cx - bx, cy - by)

    # Calculate dot product
    dot_product = (
        vector_1[0] * vector_2[0]
        + vector_1[1] * vector_2[1]
    )

    # Calculate magnitudes of vectors
    magnitude_1 = math.sqrt(
        vector_1[0] ** 2 + vector_1[1] ** 2
    )

    magnitude_2 = math.sqrt(
        vector_2[0] ** 2 + vector_2[1] ** 2
    )

    # Prevent division by zero
    if magnitude_1 == 0 or magnitude_2 == 0:
        return None

    # Calculate cosine of the angle
    cosine_angle = dot_product / (
        magnitude_1 * magnitude_2
    )

    # Avoid numerical errors
    cosine_angle = max(
        -1.0, min(1.0, cosine_angle)
    )

    # Convert radians to degrees
    angle = math.degrees(
        math.acos(cosine_angle)
    )

    return angle
