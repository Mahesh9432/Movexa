
import { apiRequest } from "./api";

export function getPrescriptions() {
  return apiRequest("/api/prescriptions", { method: "GET" });
}

export function createPrescription(data) {
  return apiRequest("/api/prescriptions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
