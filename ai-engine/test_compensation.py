
from compensation_detector import CompensationDetector

detector = CompensationDetector()

# Test 1: Normal squat
print("Test 1:", detector.detect_all(100, 105, 30))

# Test 2: Excessive forward lean
print("Test 2:", detector.detect_all(100, 105, 55))

# Test 3: Asymmetrical squat
print("Test 3:", detector.detect_all(90, 115, 30))

# Test 4: Multiple issues
print("Test 4:", detector.detect_all(90, 115, 55))
