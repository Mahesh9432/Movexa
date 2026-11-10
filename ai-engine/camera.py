import json
import time

import cv2

from angle_calculator import calculate_angle
from angle_smoother import AngleSmoother
from backend_client import MovexaBackendClient
from compensation_detector import CompensationDetector
from confidence_checker import ConfidenceChecker
from form_feedback import FormFeedback
from pose_detector import PoseDetector
from result_formatter import ResultFormatter
from session_tracker import SessionTracker
from squat_analyzer import SquatAnalyzer
from trunk_angle_calculator import TrunkAngleCalculator


POSE_CONNECTIONS = [
    (11, 12),
    (11, 13), (13, 15),
    (12, 14), (14, 16),
    (11, 23), (12, 24),
    (23, 24),
    (23, 25), (25, 27),
    (24, 26), (26, 28),
]


def draw_skeleton(frame, landmarks):
    height, width, _ = frame.shape
    points = []

    for landmark in landmarks:
        x = int(landmark.x * width)
        y = int(landmark.y * height)
        points.append((x, y))

        cv2.circle(frame, (x, y), 5, (0, 255, 0), -1)

    for start_index, end_index in POSE_CONNECTIONS:
        cv2.line(
            frame,
            points[start_index],
            points[end_index],
            (255, 0, 0),
            2,
        )

    return points


def draw_text(frame, text, position, color=(0, 255, 255), scale=0.8):
    cv2.putText(
        frame,
        str(text),
        position,
        cv2.FONT_HERSHEY_SIMPLEX,
        scale,
        color,
        2,
    )


def main():
    backend_client = MovexaBackendClient.from_environment()

    detector = None
    cap = None

    session_tracker = SessionTracker()
    squat_analyzer = SquatAnalyzer()
    angle_smoother = AngleSmoother(window_size=5)

    confidence_checker = ConfidenceChecker(
        visibility_threshold=0.5
    )

    compensation_detector = CompensationDetector()
    trunk_angle_calculator = TrunkAngleCalculator()
    form_feedback = FormFeedback()
    result_formatter = ResultFormatter()

    squat_state = "STANDING"
    squat_count = 0
    feedback_text = "Waiting for movement..."
    compensation_issues = []
    smoothed_knee_angle = None
    last_printed_count = -1

    session_timer_started = False
    processing_error = None
    metrics_error = None
    completion_error = None

    try:
        detector = PoseDetector()
        cap = cv2.VideoCapture(0)

        if not cap.isOpened():
            raise RuntimeError("Unable to access webcam.")

        session_tracker.start_session()
        session_timer_started = True

        print("Movexa AI camera started.")
        print("Press Q to end the session.")

        start_time = time.time()

        while cap.isOpened():
            success, frame = cap.read()

            if not success:
                print("Unable to read webcam frame.")
                break

            frame = cv2.flip(frame, 1)

            timestamp_ms = int(
                (time.time() - start_time) * 1000
            )

            result = detector.detect_pose(frame, timestamp_ms)

            is_confident = False
            left_knee_angle = None
            right_knee_angle = None
            selected_knee_angle = None

            if result.pose_landmarks:
                landmarks = result.pose_landmarks[0]

                left_visibility = sum(
                    landmarks[index].visibility
                    for index in [23, 25, 27]
                ) / 3

                right_visibility = sum(
                    landmarks[index].visibility
                    for index in [24, 26, 28]
                ) / 3

                if left_visibility >= right_visibility:
                    selected_leg = "LEFT"
                    selected_indices = [23, 25, 27]
                else:
                    selected_leg = "RIGHT"
                    selected_indices = [24, 26, 28]

                is_confident = confidence_checker.check_landmarks(
                    landmarks,
                    selected_indices,
                )

                points = draw_skeleton(frame, landmarks)

                left_knee_angle = calculate_angle(
                    points[23],
                    points[25],
                    points[27],
                )

                right_knee_angle = calculate_angle(
                    points[24],
                    points[26],
                    points[28],
                )

                trunk_angle = trunk_angle_calculator.calculate_trunk_angle(
                    points[11],
                    points[23],
                )

                selected_knee_angle = (
                    left_knee_angle
                    if selected_leg == "LEFT"
                    else right_knee_angle
                )

                if is_confident and selected_knee_angle is not None:
                    smoothed_knee_angle = angle_smoother.smooth(
                        selected_knee_angle
                    )

                    squat_state, squat_count = squat_analyzer.analyze(
                        smoothed_knee_angle
                    )

                    session_tracker.update_reps(squat_count)

                    status_text = f"Squat Phase: {squat_state}"

                    feedback_text = form_feedback.get_feedback(
                        smoothed_knee_angle,
                        squat_state,
                    )

                    compensation_issues = compensation_detector.detect_all(
                        left_knee_angle,
                        right_knee_angle,
                        trunk_angle,
                    )

                    if compensation_issues:
                        feedback_text += " | " + " | ".join(
                            compensation_issues
                        )

                else:
                    status_text = "Unable to Assess"
                    feedback_text = "Improve camera positioning"

                current_result = result_formatter.format_result(
                    session_id=backend_client.session_id,
                    exercise="Squat",
                    squat_count=squat_count,
                    squat_state=squat_state,
                    knee_angle=smoothed_knee_angle,
                    feedback=feedback_text,
                    session_summary=session_tracker.get_summary(),
                    completed_reps=squat_analyzer.get_completed_reps(),
                    compensation_issues=compensation_issues,
                )

                if squat_count != last_printed_count:
                    print("\n========== MOVEXA AI RESULT ==========")
                    print(json.dumps(current_result, indent=4))
                    print("======================================")
                    last_printed_count = squat_count

                draw_text(
                    frame,
                    status_text,
                    (30, 140),
                    (0, 255, 0) if is_confident else (0, 0, 255),
                )

                draw_text(
                    frame,
                    f"Squat Count: {squat_count}",
                    (30, 190),
                )

                draw_text(
                    frame,
                    f"Feedback: {feedback_text}",
                    (30, 240),
                    (255, 255, 0),
                    0.6,
                )

                if smoothed_knee_angle is not None:
                    draw_text(
                        frame,
                        f"{selected_leg} Knee: {int(smoothed_knee_angle)}",
                        (30, 50),
                    )

                if left_knee_angle is not None:
                    draw_text(
                        frame,
                        f"Left Knee: {int(left_knee_angle)}",
                        (30, 90),
                    )

                if right_knee_angle is not None:
                    draw_text(
                        frame,
                        f"Right Knee: {int(right_knee_angle)}",
                        (30, 115),
                    )

            else:
                status_text = "No Pose Detected"

                draw_text(
                    frame,
                    status_text,
                    (30, 50),
                    (0, 0, 255),
                )

            cv2.imshow(
                "Movexa - AI Movement Analysis",
                frame,
            )

            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

    except KeyboardInterrupt:
        print("\nCamera session interrupted by user.")

    except Exception as exc:
        processing_error = exc
        print(f"AI processing error: {exc}")

    finally:
        if session_timer_started:
            try:
                session_tracker.end_session()
            except Exception as exc:
                print(f"Session timer cleanup failed: {exc}")

        if cap is not None:
            try:
                cap.release()
            except Exception as exc:
                print(f"Camera cleanup failed: {exc}")

        if detector is not None:
            try:
                detector.close()
            except Exception as exc:
                print(f"Pose detector cleanup failed: {exc}")

        try:
            cv2.destroyAllWindows()
        except Exception as exc:
            print(f"Window cleanup failed: {exc}")

    summary = session_tracker.get_summary()
    completed_reps = squat_analyzer.get_completed_reps()

    final_result = result_formatter.format_result(
        session_id=backend_client.session_id,
        exercise="Squat",
        squat_count=squat_count,
        squat_state=squat_state,
        knee_angle=smoothed_knee_angle,
        feedback=feedback_text,
        session_summary=summary,
        completed_reps=completed_reps,
        compensation_issues=compensation_issues,
    )

    print("\n========== FINAL MOVEXA SESSION ==========")
    print(json.dumps(final_result, indent=4))
    print("==========================================")

    print("\n========== SESSION SUMMARY ==========")
    print("Total Squats:", summary["total_reps"])
    print("Duration:", summary["duration_seconds"], "seconds")
    print("Reps Per Minute:", summary["reps_per_minute"])
    print("=====================================")

    if completed_reps:
        completion_status = "INCOMPLETE"

        try:
            print("\nSubmitting repetition metrics...")

            metrics_response = backend_client.submit_metrics(
                final_result
            )

            print("Metrics submitted successfully.")
            print(json.dumps(metrics_response, indent=4))

        except Exception as exc:
            metrics_error = exc
            print(f"Metrics submission failed: {exc}")

    else:
        completion_status = "UNABLE_TO_ASSESS"
        print("\nNo completed repetitions were recorded.")

    try:
        completion_response = backend_client.complete_session(
            completion_status
        )

        print("\nBackend session status updated:")
        print(json.dumps(completion_response, indent=4))

    except Exception as exc:
        completion_error = exc
        print(f"Backend session finalization failed: {exc}")

    if processing_error is not None:
        raise processing_error

    if metrics_error is not None:
        raise metrics_error

    if completion_error is not None:
        raise completion_error


if __name__ == "__main__":
    main()
