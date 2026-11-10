import { apiRequest } from "./api";

/**
 * Retrieve saved repetition metrics for a session.
 *
 * GET /api/sessions/{session_id}/metrics
 */
export function getSessionMetrics(sessionId) {
  if (!sessionId) {
    throw new Error("Session ID is required.");
  }

  return apiRequest(
    `/api/sessions/${encodeURIComponent(sessionId)}/metrics`,
    {
      method: "GET",
    }
  );
}

/**
 * Save a batch of repetition-level assessment metrics.
 *
 * POST /api/sessions/{session_id}/metrics
 *
 * Each repetition must contain:
 * - rep_number
 * - assessment_status
 * - range_of_motion
 * - confidence
 * - movement_data
 * - compensation_flags
 * - detected_issues
 * - feedback
 */
export function saveSessionMetrics(sessionId, repetitionsData) {
  if (!sessionId) {
    throw new Error("Session ID is required.");
  }

  if (!Array.isArray(repetitionsData) || repetitionsData.length === 0) {
    throw new Error("At least one repetition metric is required.");
  }

  const repNumbers = new Set();

  repetitionsData.forEach((rep) => {
    if (!Number.isInteger(rep.rep_number) || rep.rep_number <= 0) {
      throw new Error("Each repetition must have a valid positive rep_number.");
    }

    if (repNumbers.has(rep.rep_number)) {
      throw new Error("Duplicate repetition numbers are not allowed.");
    }

    repNumbers.add(rep.rep_number);

    if (
      !["ASSESSED", "UNABLE_TO_ASSESS"].includes(rep.assessment_status)
    ) {
      throw new Error(
        `Invalid assessment status for repetition ${rep.rep_number}.`
      );
    }

    if (
      rep.confidence !== null &&
      rep.confidence !== undefined &&
      (typeof rep.confidence !== "number" ||
        rep.confidence < 0 ||
        rep.confidence > 1)
    ) {
      throw new Error(
        `Confidence for repetition ${rep.rep_number} must be between 0 and 1.`
      );
    }

    if (
      rep.assessment_status === "UNABLE_TO_ASSESS" &&
      rep.range_of_motion !== null
    ) {
      throw new Error(
        `Range of motion must be null when repetition ${rep.rep_number} is unable to be assessed.`
      );
    }
  });

  return apiRequest(
    `/api/sessions/${encodeURIComponent(sessionId)}/metrics`,
    {
      method: "POST",
      body: JSON.stringify({
        repetitions_data: repetitionsData,
      }),
    }
  );
}