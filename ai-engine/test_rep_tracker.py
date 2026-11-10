import time

from squat_analyzer import SquatAnalyzer

analyzer = SquatAnalyzer()

# Simulate one squat repetition
angles = [
    170, 150, 130, 105,
    100, 110, 130, 150, 165
]

for angle in angles:
    analyzer.analyze(angle)
    time.sleep(0.2)

print("MOVEXA INDIVIDUAL REP RESULTS")

for rep in analyzer.get_completed_reps():
    print(rep)

print("Total repetitions:", analyzer.rep_count)
