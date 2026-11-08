import { apiRequest } from "./api";

export function getPatientProfile() {
  return apiRequest("/api/patients/me", {
    method: "GET",
  });
}

export function updatePatientProfile(data) {
  return apiRequest("/api/patients/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function getPhysiotherapistProfile() {
  return apiRequest("/api/physiotherapists/me", {
    method: "GET",
  });
}

export function updatePhysiotherapistProfile(data) {
  return apiRequest("/api/physiotherapists/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}