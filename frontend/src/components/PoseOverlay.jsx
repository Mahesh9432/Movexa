import { useEffect, useRef } from "react";
import { POSE_CONNECTIONS } from "../lib/poseMath";

export default function PoseOverlay({ videoRef, landmarks, className = "" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return;

    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, width, height);
    if (!landmarks) return;

    const isVisible = (index) => {
      const point = landmarks[index];
      return point && (point.visibility === undefined || point.visibility > 0.35);
    };

    context.lineWidth = Math.max(2, width / 320);
    context.strokeStyle = "rgba(34, 211, 238, 0.9)";
    context.fillStyle = "rgba(34, 211, 238, 0.95)";

    for (const [startIndex, endIndex] of POSE_CONNECTIONS) {
      if (!isVisible(startIndex) || !isVisible(endIndex)) continue;
      const start = landmarks[startIndex];
      const end = landmarks[endIndex];
      context.beginPath();
      context.moveTo(start.x * width, start.y * height);
      context.lineTo(end.x * width, end.y * height);
      context.stroke();
    }

    for (const point of landmarks) {
      if (!point || (point.visibility !== undefined && point.visibility <= 0.35)) {
        continue;
      }
      context.beginPath();
      context.arc(
        point.x * width,
        point.y * height,
        Math.max(2, width / 240),
        0,
        Math.PI * 2
      );
      context.fill();
    }
  }, [landmarks, videoRef]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
