import assert from "node:assert/strict";
import {
  angleAt,
  calculatePoseMetrics,
  kneeValgusOffset,
  RomRepTracker,
  trunkLeanDegrees,
} from "../src/lib/poseMath.js";

function makeLandmarks() {
  return Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 0.9,
  }));
}

const rightAngle = angleAt(
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 }
);
assert.ok(Math.abs(rightAngle - 90) < 1e-6);

const straightAngle = angleAt(
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 2, y: 0 }
);
assert.ok(Math.abs(straightAngle - 180) < 1e-6);

const leanLandmarks = makeLandmarks();
leanLandmarks[11] = { x: 0.55, y: 0.2, z: 0, visibility: 0.9 };
leanLandmarks[12] = { x: 0.65, y: 0.2, z: 0, visibility: 0.9 };
leanLandmarks[23] = { x: 0.35, y: 0.4, z: 0, visibility: 0.9 };
leanLandmarks[24] = { x: 0.45, y: 0.4, z: 0, visibility: 0.9 };
assert.ok(Math.abs(trunkLeanDegrees(leanLandmarks) - 45) < 1e-6);

const valgusLandmarks = makeLandmarks();
valgusLandmarks[23] = { x: 0.6, y: 0.4, z: 0, visibility: 0.9 };
valgusLandmarks[24] = { x: 0.4, y: 0.4, z: 0, visibility: 0.9 };
valgusLandmarks[25] = { x: 0.54, y: 0.6, z: 0, visibility: 0.9 };
valgusLandmarks[27] = { x: 0.6, y: 0.8, z: 0, visibility: 0.9 };
assert.equal(kneeValgusOffset(valgusLandmarks, "left").flagged, true);

valgusLandmarks[25] = { x: 0.6, y: 0.6, z: 0, visibility: 0.9 };
assert.equal(kneeValgusOffset(valgusLandmarks, "left").flagged, false);

const metrics = calculatePoseMetrics(
  valgusLandmarks,
  valgusLandmarks,
  "Knee"
);
assert.equal(metrics.side, "left");
assert.equal(metrics.joint, "knee");
assert.ok(Number.isFinite(metrics.angle));
assert.ok(metrics.confidence > 0.8);

const tracker = new RomRepTracker({ minExcursion: 20, smoothingAlpha: 1 });
let completed = null;
for (const angle of [170, 160, 140, 120, 100, 90, 95, 110, 130, 150, 168]) {
  const state = tracker.update(angle, 0.9);
  if (state.repCompleted) completed = state.rep;
}
assert.ok(completed);
assert.equal(completed.repNumber, 1);
assert.ok(Math.abs(completed.range - 80) < 1e-6);

const smallMovement = new RomRepTracker({
  minExcursion: 20,
  smoothingAlpha: 1,
});
let countedSmallMovement = false;
for (const angle of [170, 160, 155, 160, 170]) {
  countedSmallMovement =
    countedSmallMovement || smallMovement.update(angle, 0.9).repCompleted;
}
assert.equal(countedSmallMovement, false);

console.log("Pose math checks passed.");
