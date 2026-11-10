export const POSE_WASM_PATH = "/wasm";
export const POSE_MODEL_PATH = "/models/pose_landmarker_lite.task";

let landmarkerPromise = null;

function createOptions(delegate) {
  return {
    baseOptions: {
      modelAssetPath: POSE_MODEL_PATH,
      delegate,
    },
    runningMode: "VIDEO",
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  };
}

export function loadPoseLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { FilesetResolver, PoseLandmarker } = await import(
        "@mediapipe/tasks-vision"
      );
      const vision = await FilesetResolver.forVisionTasks(POSE_WASM_PATH);

      try {
        return await PoseLandmarker.createFromOptions(
          vision,
          createOptions("GPU")
        );
      } catch (error) {
        console.warn("GPU pose inference unavailable; using CPU.", error);
        return PoseLandmarker.createFromOptions(vision, createOptions("CPU"));
      }
    })().catch((error) => {
      landmarkerPromise = null;
      throw error;
    });
  }

  return landmarkerPromise;
}
