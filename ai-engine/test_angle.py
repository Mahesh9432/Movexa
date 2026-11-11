
from angle_calculator import calculate_angle


# Test 1: Right angle
angle = calculate_angle(
    (0, 0),
    (0, 1),
    (1, 1)
)

print("Test 1:", angle)


# Test 2: Straight angle
angle = calculate_angle(
    (0, 0),
    (1, 0),
    (2, 0)
)

print("Test 2:", angle)


# Test 3: Acute angles
angle = calculate_angle(
    (0, 0),
    (0, 1),
    (1, 2)
)

print("Test 3:", angle)
