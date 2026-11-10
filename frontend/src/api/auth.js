
import { apiRequest } from "./api";

export function loginUser(credentials) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function registerPatient(data) {
  return apiRequest("/api/auth/register/patient", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function registerPhysiotherapist(data) {
  return apiRequest("/api/auth/register/physiotherapist", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getCurrentUser() {
  return apiRequest("/api/auth/me", {
    method: "GET",
  });
}
