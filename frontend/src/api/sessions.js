import { apiRequest } from "./api";

export function createSession(data) {
  return apiRequest("/api/sessions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getSession(sessionId) {
  if (!sessionId) {
    throw new Error("Session ID is required.");
  }

  return apiRequest(`/api/sessions/${encodeURIComponent(sessionId)}`, {
    method: "GET",
  });
}

export function completeSession(
  sessionId,
  status,
  completedAt = new Date().toISOString()
) {
  if (!sessionId) {
    throw new Error("Session ID is required.");
  }

  if (!["COMPLETED", "INCOMPLETE", "UNABLE_TO_ASSESS"].includes(status)) {
    throw new Error(
      "Session status must be COMPLETED, INCOMPLETE, or UNABLE_TO_ASSESS."
    );
  }

  return apiRequest(
    `/api/sessions/${encodeURIComponent(sessionId)}/complete`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status,
        completed_at: completedAt,
      }),
    }
  );
}

export function syncSession(sessionId, repetitionsData) {
  if (!sessionId) {
    throw new Error("Session ID is required.");
  }

  const options = { method: "POST" };

  if (repetitionsData !== undefined) {
    if (!Array.isArray(repetitionsData)) {
      throw new Error("Repetition data must be an array.");
    }

    options.body = JSON.stringify({
      repetitions_data: repetitionsData,
    });
  }

  return apiRequest(
    `/api/sessions/${encodeURIComponent(sessionId)}/sync`,
    options
  );
}