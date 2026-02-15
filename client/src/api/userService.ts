import api from "./axios";

export const checkProfile = async () => {
  const response = await api.get("/users/me");
  return response.data.data;
};

export const updateProfile = async (data: any) => {
  const response = await api.patch("/users/me", data);
  return response.data.data;
};

export const uploadPhoto = async (formData: FormData) => {
  const response = await api.patch("/users/me/profile-photo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
};

export const uploadQualifications = async (
  formData: FormData,
  onProgress?: (percent: number) => void,
) => {
  const response = await api.post("/users/me/submit-qualifications", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percent = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 100),
        );
        onProgress(percent);
      }
    },
  });
  return response.data.data;
};

export const changePassword = async (data: any) => {
  const response = await api.patch("/users/me/change-password", data);
  return response.data;
};

export const sendOtp = async () => {
  const response = await api.post("/users/me/send-verification-otp");
  return response.data;
};

export const verifyEmail = async (otp: string) => {
  const response = await api.post("/users/me/verify-email", { otp });
  return response.data;
};
