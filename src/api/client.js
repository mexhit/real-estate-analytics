import axios from "axios";

const url = "164.92.139.187";
//export const url = "localhost";
export const tokenStorageKey = "authToken";

export const apiClient = axios.create({
  baseURL: `http://${url}:3009`,
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
