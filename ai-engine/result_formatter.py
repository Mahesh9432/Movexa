
class ResultFormatter:

    def format_result(
        self,
        session_id,
        exercise,
        squat_count,
        squat_state,
        knee_angle,
        feedback,
        session_summary,
        completed_reps,
        compensation_issues=None
    ):

        result = {
            "session_id": session_id,
            "exercise": exercise,
            "repetitions": squat_count,
            "current_phase": squat_state,

            "knee_angle": (
                round(knee_angle, 2)
                if knee_angle is not None
                else None
            ),

            "feedback": feedback,
            "session_summary": session_summary,

            "individual_repetitions": completed_reps,

            "compensation_issues": (
                compensation_issues
                if compensation_issues is not None
                else []
            )
        }

        return result
