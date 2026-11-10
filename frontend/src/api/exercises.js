
import { apiRequest } from "./api";

export function getExercises() {
  return apiRequest("/api/exercises", { method: "GET" });
}
