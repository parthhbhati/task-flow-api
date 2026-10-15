import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL;

if (!baseURL) {
  throw new Error("VITE_API_BASE_URL is not configured.");
}

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

export function getApiErrorMessage(error) {
  if (error.response) {
    return (
      error.response.data?.message ||
      `Request failed with status ${error.response.status}`
    );
  }

  if (error.request) {
    return "Cannot reach the server. Check that the API is running.";
  }

  return error.message || "An unexpected error occurred.";
}

export default api;
