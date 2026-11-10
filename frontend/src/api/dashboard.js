import { apiRequest } from "./api";

export function getPatientDashboard() {
  return apiRequest("/api/patients/me/dashboard", {
    method: "GET",
  });
}

export function getPhysiotherapistDashboard() {
  return apiRequest("/api/physiotherapists/me/dashboard", {
    method: "GET",
  });
}

export function getPhysiotherapistPatients() {
  return apiRequest("/api/physiotherapists/me/patients", {
    method: "GET",
  });
}

export function getPatientProgress(patientId) {
  if (!patientId) {
    throw new Error("Patient ID is required.");
  }

  return apiRequest(
    `/api/physiotherapists/me/patients/${encodeURIComponent(patientId)}/progress`,
    {
      method: "GET",
    }
  );
}