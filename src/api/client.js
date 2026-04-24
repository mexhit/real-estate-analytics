import axios from "axios";

export const tokenStorageKey = "authToken";
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
});

export function getAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(tokenStorageKey);
}

export function setAuthToken(token) {
  localStorage.setItem(tokenStorageKey, token);
}

export function clearAuthToken() {
  localStorage.removeItem(tokenStorageKey);
}

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      typeof window !== "undefined" &&
      error.response?.status === 401 &&
      window.location.pathname !== "/login"
    ) {
      clearAuthToken();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);
