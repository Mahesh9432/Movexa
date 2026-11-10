import unittest
from unittest.mock import patch

from squat_analyzer import SquatAnalyzer


class SquatAnalyzerTests(unittest.TestCase):

    def setUp(self):
        self.analyzer = SquatAnalyzer()

    def test_complete_squat_records_one_assessed_repetition(self):
        angles = [
            170, 150, 130, 105,
            100, 110, 130, 150, 165
        ]

        with patch(
            "squat_analyzer.time.time",
            side_effect=[0.0, 0.8]
        ):
            for angle in angles:
                self.analyzer.analyze(angle)

        self.assertEqual(self.analyzer.rep_count, 1)
        self.assertEqual(self.analyzer.state, "STANDING")

        reps = self.analyzer.get_completed_reps()
        self.assertEqual(len(reps), 1)
        self.assertEqual(reps[0]["assessment_status"], "ASSESSED")
        self.assertEqual(reps[0]["min_knee_angle"], 100)
        self.assertEqual(reps[0]["max_knee_angle"], 165)
        self.assertGreaterEqual(
            reps[0]["sample_count"],
            self.analyzer.minimum_samples
        )
        self.assertGreaterEqual(
            reps[0]["duration_seconds"],
            self.analyzer.minimum_duration
        )

    def test_short_repetition_is_unable_to_assess(self):
        angles = [
            170, 150, 130, 105,
            100, 110, 130, 150, 165
        ]

        with patch(
            "squat_analyzer.time.time",
            side_effect=[0.0, 0.3]
        ):
            for angle in angles:
                self.analyzer.analyze(angle)

        reps = self.analyzer.get_completed_reps()

        self.assertEqual(self.analyzer.rep_count, 1)
        self.assertEqual(len(reps), 1)
        self.assertEqual(
            reps[0]["assessment_status"],
            "UNABLE_TO_ASSESS"
        )
        self.assertLess(
            reps[0]["duration_seconds"],
            self.analyzer.minimum_duration
        )

    def test_repetition_at_minimum_duration_is_assessed(self):
        angles = [
            170, 150, 130, 105,
            100, 110, 130, 150, 165
        ]

        with patch(
            "squat_analyzer.time.time",
            side_effect=[2.0, 2.5]
        ):
            for angle in angles:
                self.analyzer.analyze(angle)

        reps = self.analyzer.get_completed_reps()

        self.assertEqual(len(reps), 1)
        self.assertEqual(reps[0]["assessment_status"], "ASSESSED")
        self.assertGreaterEqual(
            reps[0]["duration_seconds"],
            self.analyzer.minimum_duration
        )

    def test_incomplete_squat_returns_to_standing_without_counting(self):
        angles = [170, 150, 140, 155, 170]

        for angle in angles:
            self.analyzer.analyze(angle)

        self.assertEqual(self.analyzer.rep_count, 0)
        self.assertEqual(self.analyzer.state, "STANDING")
        self.assertEqual(self.analyzer.get_completed_reps(), [])
        self.assertIsNone(self.analyzer.rep_start_time)
        self.assertIsNone(self.analyzer.min_knee_angle)
        self.assertIsNone(self.analyzer.max_knee_angle)
        self.assertEqual(self.analyzer.sample_count, 0)

    def test_complete_squat_can_follow_incomplete_attempt(self):
        incomplete_angles = [170, 150, 140, 170]
        complete_angles = [
            170, 150, 130, 105,
            100, 110, 130, 150, 165
        ]

        with patch(
            "squat_analyzer.time.time",
            side_effect=[0.0, 1.0, 2.0]
        ):
            for angle in incomplete_angles + complete_angles:
                self.analyzer.analyze(angle)

        self.assertEqual(self.analyzer.rep_count, 1)
        self.assertEqual(len(self.analyzer.get_completed_reps()), 1)
        self.assertEqual(self.analyzer.state, "STANDING")

    def test_none_angle_does_not_change_state(self):
        self.analyzer.analyze(150)

        previous_state = self.analyzer.state
        previous_count = self.analyzer.rep_count

        self.analyzer.analyze(None)

        self.assertEqual(self.analyzer.state, previous_state)
        self.assertEqual(self.analyzer.rep_count, previous_count)

    def test_invalid_angle_does_not_change_state(self):
        self.analyzer.analyze(150)

        previous_state = self.analyzer.state
        previous_count = self.analyzer.rep_count

        self.analyzer.analyze(181)

        self.assertEqual(self.analyzer.state, previous_state)
        self.assertEqual(self.analyzer.rep_count, previous_count)


if __name__ == "__main__":
    unittest.main(verbosity=2)
