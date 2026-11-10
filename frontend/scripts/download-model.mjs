import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const modelDir = resolve(root, "public/models");
const modelPath = resolve(modelDir, "pose_landmarker_lite.task");
const modelUrl =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

await mkdir(modelDir, { recursive: true });

try {
  await access(modelPath);
  console.log(`Pose model already exists at ${modelPath}`);
} catch {
  console.log("Downloading pose landmarker model...");
  const response = await fetch(modelUrl);
  if (!response.ok) {
    throw new Error(`Model download failed with HTTP ${response.status}`);
  }
  const buffer = new Uint8Array(await response.arrayBuffer());
  await writeFile(modelPath, buffer);
  console.log(`Downloaded pose model to ${modelPath}`);
}
