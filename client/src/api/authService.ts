import api from "./axios";

export const login = async (credentials: any) =>
  (await api.post("/auth/login", credentials)).data;

export const register = async (userData: any) =>
  (await api.post("/auth/register", userData)).data;

export const logout = async () => (await api.post("/auth/logout")).data;

export const refreshTokens = async () =>
  (await api.post("/auth/refresh-token")).data.data;

export const completeUserProfile = async (data: any) =>
  (await api.post("/auth/complete-profile", data)).data;
