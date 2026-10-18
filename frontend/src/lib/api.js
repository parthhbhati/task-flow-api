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

api.interceptors.request.use((config) => {
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    // Let the browser add the multipart boundary for FormData requests.
    config.headers.delete("Content-Type");
  }
  return config;
});

let refreshPromise = null;
let refreshFailed = false;

const excludedAuthRequest = (url = "") =>
  /\/users\/(login|register|refresh-token|logout)(?:[/?#]|$)/.test(url);

api.interceptors.response.use(
  (response) => {
    if (/\/users\/login(?:[/?#]|$)/.test(response.config?.url || "")) {
      refreshFailed = false;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      refreshFailed ||
      excludedAuthRequest(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = api
        .post("/users/refresh-token")
        .catch((refreshError) => {
          refreshFailed = true;
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("taskflow:session-expired"));
          }
          throw refreshError;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    try {
      await refreshPromise;
      return api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);

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
