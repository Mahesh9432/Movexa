import requests
import uuid
import websocket
import json
import cv2
import time

from result_formatter import ResultFormatter
from session_tracker import SessionTracker
from form_feedback import FormFeedback
from pose_detector import PoseDetector
from angle_calculator import calculate_angle
from angle_smoother import AngleSmoother
from squat_analyzer import SquatAnalyzer
from confidence_checker import ConfidenceChecker
from compensation_detector import CompensationDetector
from trunk_angle_calculator import TrunkAngleCalculator


# Pose landmark connections
POSE_CONNECTIONS = [
    (11, 12),
    (11, 13), (13, 15),
    (12, 14), (14, 16),
    (11, 23), (12, 24),
    (23, 24),
    (23, 25), (25, 27),
    (24, 26), (26, 28)
]

ws = websocket.WebSocket()

try:
    ws.connect("ws://127.0.0.1:8000/ws/ai/live")
    print("Connected to Movexa WebSocket")
except Exception as e:
    print("WebSocket connection failed:", e)
    ws = None
# Initialize webcam
cap = cv2.VideoCapture(0)

# Initialize AI components
detector = PoseDetector()
squat_analyzer = SquatAnalyzer()
left_angle_smoother = AngleSmoother(window_size=5)
confidence_checker = ConfidenceChecker(
    visibility_threshold=0.5
)
compensation_detector = CompensationDetector()
trunk_angle_calculator = TrunkAngleCalculator()

form_feedback = FormFeedback()
feedback_text = "Waiting for movement..."
compensation_issues = []
session_id = str(uuid.uuid4())

session_tracker = SessionTracker()
session_tracker.start_session()
result_formatter = ResultFormatter()

# Initialize variables
squat_state = "STANDING"
squat_count = 0
status_text = "Waiting for pose..."
smoothed_left_angle = None
last_printed_count = -1

start_time = time.time()

last_printed_count = 0
while cap.isOpened():

    success, frame = cap.read()

    if not success:
        print("Unable to access webcam")
        break

    # Mirror camera
    frame = cv2.flip(frame, 1)

    # MediaPipe timestamp
    timestamp_ms = int((time.time() - start_time) * 1000)

    # Detect pose
    result = detector.detect_pose(frame, timestamp_ms)

    if result.pose_landmarks:

        landmarks = result.pose_landmarks[0]
       

       # Calculate average visibility for both legs
        left_visibility = sum(
            landmarks[i].visibility for i in [23, 25, 27]
        ) / 3
        
        right_visibility = sum(
            landmarks[i].visibility for i in [24, 26, 28]
         ) / 3

        # Select the more visible leg
        if left_visibility >= right_visibility:
            selected_leg = "LEFT"
            selected_indices = [23, 25, 27]
        else:
            selected_leg = "RIGHT"
            selected_indices = [24, 26, 28]

        # Check selected leg confidence
        is_confident = confidence_checker.check_landmarks(
        landmarks,
        selected_indices
        )


        height, width, _ = frame.shape
        points = []

        # Convert landmarks into pixel coordinates
        for landmark in landmarks:

            x = int(landmark.x * width)
            y = int(landmark.y * height)

            points.append((x, y))

            cv2.circle(
                frame,
                (x, y),
                5,
                (0, 255, 0),
                -1
            )

        # Draw skeleton
        for connection in POSE_CONNECTIONS:

            start_point = points[connection[0]]
            end_point = points[connection[1]]

            cv2.line(
                frame,
                start_point,
                end_point,
                (255, 0, 0),
                2
            )

            print(
                "Left leg visibility:",
                round(landmarks[23].visibility, 2),
                round(landmarks[25].visibility, 2),
                round(landmarks[27].visibility, 2)
            )

            print(
                "Right leg visibility:",
                round(landmarks[24].visibility, 2),
                round(landmarks[26].visibility, 2),
                round(landmarks[28].visibility, 2)
            )
            
        # Calculate left knee angle
        left_knee_angle = calculate_angle(
            points[23],
            points[25],
            points[27]
        )

        # Calculate right knee angle
        right_knee_angle = calculate_angle(
            points[24],
            points[26],
            points[28]
        )
        # Select knee angle from the more visible leg
        selected_knee_angle = (
            left_knee_angle
            if selected_leg == "LEFT"
            else right_knee_angle
        
        )
            # Calculate trunk angle
        left_shoulder = points[11]
        left_hip = points[23]

        trunk_angle = trunk_angle_calculator.calculate_trunk_angle(
            left_shoulder,
            left_hip
        )
        # Confidence-based squat analysis
        if is_confident and selected_knee_angle is not None:

            # Smooth angle
           
            smoothed_left_angle = left_angle_smoother.smooth(
                selected_knee_angle
            )

            # Analyze squat
            squat_state, squat_count = squat_analyzer.analyze(
                smoothed_left_angle
            )
            session_tracker.update_reps(squat_count)

           
            # Update squat phase
            status_text = f"Squat Phase: {squat_state}"

            # Generate normal squat feedback
            feedback_text = form_feedback.get_feedback(
                smoothed_left_angle,
                squat_state
            )

            # Detect compensation issues
            compensation_issues = compensation_detector.detect_all(
                left_knee_angle,
                right_knee_angle,
                trunk_angle
            )

            # Add compensation warnings to feedback
            if compensation_issues:
                feedback_text += " | " + " | ".join(compensation_issues)

            # Generate structured JSON result
            
# Print JSON only when squat count changes
      
        # Generate structured JSON result
        session_summary = session_tracker.get_summary()

        json_result = result_formatter.format_result(
            session_id=session_id,
            exercise="Squat",
            squat_count=squat_count,
            squat_state=squat_state,
            knee_angle=smoothed_left_angle,
            feedback=feedback_text,
            session_summary=session_summary,
            completed_reps=squat_analyzer.get_completed_reps(),
            compensation_issues=compensation_issues
        )

        # Send live AI results to FastAPI
        # if ws is not None and ws.connected:
            # try:
            #     ws.send(json.dumps(json_result))
            # except Exception as e:
            #     print("WebSocket disconnected:", e)
            #     try:
            #         ws.close()
            #     except Exception:
            #         pass
            #     ws = None

        # Print JSON only when squat count changes
        if squat_count != last_printed_count:
            print("\n========== MOVEXA JSON RESULT ==========")
            print(json.dumps(json_result, indent=4))
            print("========================================")
            last_printed_count = squat_count

        else:

            status_text = "Unable to Assess"

        # Display squat phase
        cv2.putText(
            frame,
            status_text,
            (30, 140),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 255, 0) if is_confident else (0, 0, 255),
            2
        )

        # Display repetition count
        cv2.putText(
            frame,
            f"Squat Count: {squat_count}",
            (30, 190),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 255, 255),
            2
        )

        # Display form feedback
        cv2.putText(
            frame,
            f"Feedback: {feedback_text}",
            (30, 240),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 0),
            2
        )

        # Display left knee angle only when available
        if smoothed_left_angle is not None:

            cv2.putText(
                frame,
                f"Left Knee: {int(smoothed_left_angle)}",
                (30, 50),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (0, 255, 255),
                2
            )

        # Display right knee angle
       # Display right knee angle safely
        if right_knee_angle is not None:

            cv2.putText(
                frame,
                f"Right Knee: {int(right_knee_angle)}",
                (30, 90),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (0, 255, 255),
                2
            )

    else:

        status_text = "No Pose Detected"

        cv2.putText(
            frame,
            status_text,
            (30, 50),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 0, 255),
            2
        )

    # Show webcam
    cv2.imshow(
        "Movexa - AI Movement Analysis",
        frame
    )

    # Press Q to exit
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

# Stop session timer
session_tracker.end_session()

# Generate session summary
summary = session_tracker.get_summary()

# Generate final session JSON after stopping timer

final_json_result = result_formatter.format_result(
    session_id=session_id,
    exercise="Squat",
    squat_count=squat_count,
    squat_state=squat_state,
    knee_angle=smoothed_left_angle,
    feedback=feedback_text,
    session_summary=summary,
    completed_reps=squat_analyzer.get_completed_reps(),
    compensation_issues=compensation_issues
)


# Send final session result to FastAPI REST endpoint


try:
    response = requests.post(
        "http://127.0.0.1:8000/api/ai/results",
        json=final_json_result,
        timeout=10
    )

    if response.status_code == 200:
        print("Final session result sent to FastAPI successfully!")
        print("Backend response (JSON):")
        print(json.dumps(response.json(), indent=4))
    else:
        print("FastAPI error:", response.status_code)
        print(response.text)

except requests.exceptions.RequestException as e:
    print("Could not send final session result:", e)


# Send live AI results to FastAPI
if ws is not None and ws.connected:
    try:
        ws.send(json.dumps(json_result))
    except Exception as e:
        print("WebSocket disconnected:", e)

        try:
            ws.close()
        except Exception:
            pass

        ws = None

print("\n========== FINAL MOVEXA SESSION JSON ==========")
# Print final JSON in readable format
if isinstance(final_json_result, str):
    print(json.dumps(json.loads(final_json_result), indent=4))
else:
    print(json.dumps(final_json_result, indent=4))
print("================================================")

if summary is not None:

    print("\n========== MOVEXA SESSION SUMMARY ==========")

    print("Total Squats:", summary["total_reps"])

    print(
        "Duration:",
        summary["duration_seconds"],
        "seconds"
    )

    print(
        "Reps Per Minute:",
        summary["reps_per_minute"]
    )

    print("========================================")

# Release resources
cap.release()
detector.close()
cv2.destroyAllWindows()
