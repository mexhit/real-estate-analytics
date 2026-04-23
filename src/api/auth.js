import { apiClient, setAuthToken } from "@/api/client";

class AuthApi {
  login({ email, password }) {
    return apiClient
      .post("auth/login", { email, password })
      .then((response) => {
        const data = response.data;
        const token = data?.token ?? data?.accessToken ?? data?.data?.token;

        if (!token) {
          throw new Error("Login succeeded but no token was returned.");
        }

        setAuthToken(token);
        return data;
      });
  }

  logout() {
    return apiClient.post("/auth/logout");
  }
}

export const authApi = new AuthApi();
