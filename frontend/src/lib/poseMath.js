export const POSE_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10],
  [11, 12],
  [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [24, 26], [25, 27], [26, 28],
  [27, 29], [28, 30], [29, 31], [30, 32], [27, 31], [28, 32],
];

const JOINT_CONFIG = {
  knee: {
    left: [23, 25, 27],
    right: [24, 26, 28],
  },
  shoulder: {
    left: [23, 11, 13],
    right: [24, 12, 14],
  },
  elbow: {
    left: [11, 13, 15],
    right: [12, 14, 16],
  },
  hip: {
    left: [11, 23, 25],
    right: [12, 24, 26],
  },
  ankle: {
    left: [25, 27, 31],
    right: [26, 28, 32],
  },
};

const LEFT_VISIBILITY_INDICES = [11, 13, 15, 23, 25, 27, 31];
const RIGHT_VISIBILITY_INDICES = [12, 14, 16, 24, 26, 28, 32];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function asPoint(point) {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    return null;
  }
  return point;
}

export function normalizeJointName(targetJoint) {
  const value = String(targetJoint || "").toLowerCase();
  const match = Object.keys(JOINT_CONFIG).find((joint) => value.includes(joint));
  return match || "knee";
}

function parsePreferredSide(targetJoint) {
  const value = String(targetJoint || "").toLowerCase();
  if (value.includes("left")) return "left";
  if (value.includes("right")) return "right";
  return null;
}

export function angleAt(first, vertex, third, use3d = false) {
  const a = asPoint(first);
  const b = asPoint(vertex);
  const c = asPoint(third);
  if (!a || !b || !c) return null;

  const ax = a.x - b.x;
  const ay = a.y - b.y;
  const az = use3d ? (a.z || 0) - (b.z || 0) : 0;
  const cx = c.x - b.x;
  const cy = c.y - b.y;
  const cz = use3d ? (c.z || 0) - (b.z || 0) : 0;

  const magnitudeA = Math.hypot(ax, ay, az);
  const magnitudeC = Math.hypot(cx, cy, cz);
  if (magnitudeA === 0 || magnitudeC === 0) return null;

  const cosine = (ax * cx + ay * cy + az * cz) / (magnitudeA * magnitudeC);
  return (Math.acos(clamp(cosine, -1, 1)) * 180) / Math.PI;
}

export function averageVisibility(points) {
  const valid = points.filter(Boolean);
  if (valid.length === 0) return 0;
  const total = valid.reduce(
    (sum, point) => sum + (Number.isFinite(point.visibility) ? point.visibility : 0),
    0
  );
  return total / valid.length;
}

export function chooseSide(landmarks, joint, preferredSide = null) {
  if (preferredSide === "left" || preferredSide === "right") {
    return preferredSide;
  }

  const config = JOINT_CONFIG[joint] || JOINT_CONFIG.knee;
  const leftVisibility = averageVisibility(
    config.left.map((index) => landmarks[index]).filter(Boolean)
  );
  const rightVisibility = averageVisibility(
    config.right.map((index) => landmarks[index]).filter(Boolean)
  );

  if (leftVisibility === 0 && rightVisibility === 0) {
    const leftPoseVisibility = averageVisibility(
      LEFT_VISIBILITY_INDICES.map((index) => landmarks[index]).filter(Boolean)
    );
    const rightPoseVisibility = averageVisibility(
      RIGHT_VISIBILITY_INDICES.map((index) => landmarks[index]).filter(Boolean)
    );
    return leftPoseVisibility >= rightPoseVisibility ? "left" : "right";
  }

  return leftVisibility >= rightVisibility ? "left" : "right";
}

export function trunkLeanDegrees(landmarks) {
  if (!Array.isArray(landmarks)) return null;

  const leftShoulder = asPoint(landmarks[11]);
  const rightShoulder = asPoint(landmarks[12]);
  const leftHip = asPoint(landmarks[23]);
  const rightHip = asPoint(landmarks[24]);

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return null;

  const shoulderX = (leftShoulder.x + rightShoulder.x) / 2;
  const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
  const hipX = (leftHip.x + rightHip.x) / 2;
  const hipY = (leftHip.y + rightHip.y) / 2;

  const horizontal = Math.abs(shoulderX - hipX);
  const vertical = Math.abs(shoulderY - hipY);
  if (horizontal === 0 && vertical === 0) return 0;

  return (Math.atan2(horizontal, vertical) * 180) / Math.PI;
}

export function kneeValgusOffset(landmarks, side, threshold = 0.05) {
  if (!Array.isArray(landmarks)) {
    return { offset: null, flagged: false };
  }

  const indices = side === "right" ? [24, 26, 28] : [23, 25, 27];
  const hip = asPoint(landmarks[indices[0]]);
  const knee = asPoint(landmarks[indices[1]]);
  const ankle = asPoint(landmarks[indices[2]]);
  const leftHip = asPoint(landmarks[23]);
  const rightHip = asPoint(landmarks[24]);

  if (!hip || !knee || !ankle || !leftHip || !rightHip) {
    return { offset: null, flagged: false };
  }

  const verticalSpan = ankle.y - hip.y;
  const ratio = verticalSpan === 0 ? 0.5 : (knee.y - hip.y) / verticalSpan;
  const expectedKneeX = hip.x + (ankle.x - hip.x) * clamp(ratio, 0, 1);
  const midlineX = (leftHip.x + rightHip.x) / 2;
  const inwardDirection = Math.sign(midlineX - expectedKneeX) || 1;
  const offset = (knee.x - expectedKneeX) * inwardDirection;

  return { offset, flagged: offset > threshold };
}

export function kneeValgusFlag(landmarks, side, threshold = 0.05) {
  return kneeValgusOffset(landmarks, side, threshold).flagged;
}

export function calculatePoseMetrics(
  landmarks,
  worldLandmarks,
  targetJoint,
  preferredSide = null
) {
  if (!Array.isArray(landmarks) || landmarks.length < 29) return null;

  const joint = normalizeJointName(targetJoint);
  const side = chooseSide(
    landmarks,
    joint,
    preferredSide || parsePreferredSide(targetJoint)
  );
  const indices = JOINT_CONFIG[joint][side];
  const normalizedPoints = indices.map((index) => landmarks[index]);

  if (normalizedPoints.some((point) => !asPoint(point))) return null;

  const worldPoints =
    Array.isArray(worldLandmarks) && worldLandmarks.length >= 29
      ? indices.map((index) => worldLandmarks[index])
      : null;

  const angle = worldPoints
    ? angleAt(worldPoints[0], worldPoints[1], worldPoints[2], true)
    : angleAt(normalizedPoints[0], normalizedPoints[1], normalizedPoints[2]);

  if (angle === null) return null;

  const confidence = averageVisibility(normalizedPoints);
  const compositionPoints =
    Array.isArray(worldLandmarks) && worldLandmarks.length >= 25
      ? worldLandmarks
      : landmarks;
  const valgus = kneeValgusOffset(landmarks, side);

  return {
    joint,
    side,
    angle,
    confidence,
    trunkLean: trunkLeanDegrees(compositionPoints),
    kneeValgus: valgus.flagged,
    kneeValgusOffset: valgus.offset,
  };
}

export class RomRepTracker {
  constructor({
    minExcursion = 15,
    smoothingAlpha = 0.35,
    returnFraction = 0.1,
  } = {}) {
    this.minExcursion = minExcursion;
    this.smoothingAlpha = clamp(smoothingAlpha, 0.05, 1);
    this.returnFraction = clamp(returnFraction, 0.05, 0.5);
    this.reps = 0;
    this.reset();
  }

  reset() {
    this.smoothedAngle = null;
    this.direction = 0;
    this.lowAngle = null;
    this.highAngle = null;
    this.repStartSide = null;
    this.repStartAngle = null;
  }

  snapshot(confidence) {
    return {
      repCompleted: false,
      reps: this.reps,
      angle: this.smoothedAngle,
      minAngle: this.lowAngle,
      maxAngle: this.highAngle,
      range:
        this.lowAngle === null || this.highAngle === null
          ? 0
          : this.highAngle - this.lowAngle,
      confidence,
    };
  }

  update(angle, confidence = 1) {
    if (!Number.isFinite(angle)) {
      return this.snapshot(confidence);
    }

    if (this.smoothedAngle === null) {
      this.smoothedAngle = angle;
      this.lowAngle = angle;
      this.highAngle = angle;
      return this.snapshot(confidence);
    }

    const previous = this.smoothedAngle;
    this.smoothedAngle =
      previous + this.smoothingAlpha * (angle - previous);
    const delta = this.smoothedAngle - previous;
    if (Math.abs(delta) >= 0.1) {
      this.direction = Math.sign(delta);
    }

    this.lowAngle = Math.min(this.lowAngle, this.smoothedAngle);
    this.highAngle = Math.max(this.highAngle, this.smoothedAngle);
    const excursion = this.highAngle - this.lowAngle;

    if (
      this.repStartSide === null &&
      excursion >= this.minExcursion * 0.4 &&
      this.direction !== 0
    ) {
      this.repStartSide = this.direction > 0 ? "low" : "high";
      this.repStartAngle =
        this.direction > 0 ? this.lowAngle : this.highAngle;
    }

    if (this.repStartSide !== null && excursion >= this.minExcursion) {
      const returnGap = Math.max(excursion * this.returnFraction, 5);
      const returned =
        this.repStartSide === "high"
          ? this.direction > 0 &&
            this.smoothedAngle >= this.highAngle - returnGap
          : this.direction < 0 &&
            this.smoothedAngle <= this.lowAngle + returnGap;

      if (returned) {
        this.reps += 1;
        const rep = {
          repNumber: this.reps,
          minAngle: this.lowAngle,
          maxAngle: this.highAngle,
          range: excursion,
          startAngle: this.repStartAngle,
          confidence,
        };

        this.lowAngle = this.smoothedAngle;
        this.highAngle = this.smoothedAngle;
        this.direction = 0;
        this.repStartSide = null;
        this.repStartAngle = this.smoothedAngle;

        return {
          ...this.snapshot(confidence),
          repCompleted: true,
          rep,
        };
      }
    }

    return this.snapshot(confidence);
  }
}
