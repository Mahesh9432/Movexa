import { useEffect, useRef, useState } from "react";
import { calculatePoseMetrics, RomRepTracker } from "../lib/poseMath";
import { loadPoseLandmarker } from "../lib/poseEngine";

const DETECTION_INTERVAL_MS = 66;

export function usePoseTracking({
  videoRef,
  enabled,
  targetJoint = "Knee",
  onRep,
}) {
  const [status, setStatus] = useState("idle");
  const [metrics, setMetrics] = useState(null);
  const [landmarks, setLandmarks] = useState(null);
  const [error, setError] = useState("");
  const onRepRef = useRef(onRep);

  useEffect(() => {
    onRepRef.current = onRep;
  }, [onRep]);

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;
    let stream = null;
    let frameId = 0;
    let lastDetection = 0;
    let lastVideoTime = -1;
    let lockedSide = null;
    const tracker = new RomRepTracker();

    const stopStream = () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };

    const run = async () => {
      setStatus("loading");
      setMetrics(null);
      setLandmarks(null);
      setError("");

      try {
        const landmarker = await loadPoseLandmarker();
        if (cancelled) return;

        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (cancelled) {
          stopStream();
          return;
        }

        const video = videoRef.current;
        if (!video) {
          throw new Error("Video element is not available.");
        }

        video.srcObject = stream;
        await video.play();

        if (cancelled) {
          stopStream();
          return;
        }

        setStatus("tracking");

        const detect = () => {
          if (cancelled) return;
          frameId = requestAnimationFrame(detect);

          const now = performance.now();
          if (now - lastDetection < DETECTION_INTERVAL_MS) return;
          if (!video || video.readyState < 2 || video.videoWidth === 0) return;
          if (video.currentTime === lastVideoTime) return;

          lastDetection = now;
          lastVideoTime = video.currentTime;

          try {
            const result = landmarker.detectForVideo(video, now);
            const poseLandmarks = result.landmarks?.[0];

            if (!poseLandmarks) {
              setLandmarks(null);
              setMetrics(null);
              return;
            }

            const nextMetrics = calculatePoseMetrics(
              poseLandmarks,
              result.worldLandmarks?.[0],
              targetJoint,
              lockedSide
            );

            if (!nextMetrics) {
              setLandmarks(poseLandmarks);
              setMetrics(null);
              return;
            }

            if (!lockedSide) lockedSide = nextMetrics.side;

            const trackerState = tracker.update(
              nextMetrics.angle,
              nextMetrics.confidence
            );

            setLandmarks(poseLandmarks);
            setMetrics({
              ...nextMetrics,
              ...trackerState,
              present: true,
            });

            if (trackerState.repCompleted) {
              onRepRef.current?.({
                ...nextMetrics,
                ...trackerState,
                present: true,
              });
            }
          } catch (detectionError) {
            setError(detectionError?.message || "Pose detection failed.");
            setStatus("error");
            cancelAnimationFrame(frameId);
            stopStream();
          }
        };

        frameId = requestAnimationFrame(detect);
      } catch (runError) {
        if (cancelled) return;
        stopStream();
        const message =
          runError?.name === "NotAllowedError"
            ? "Camera permission was denied."
            : runError?.message || "Unable to start pose tracking.";
        setError(message);
        setStatus("error");
      }
    };

    run();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      stopStream();
    };
  }, [enabled, targetJoint, videoRef]);

  return {
    status: enabled ? status : "idle",
    metrics: enabled ? metrics : null,
    landmarks: enabled ? landmarks : null,
    error: enabled ? error : "",
    isTracking: Boolean(enabled) && status === "tracking",
    isLoading: Boolean(enabled) && status === "loading",
  };
}
