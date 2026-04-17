import { API } from "@/api/API";
import type { UserProfile, ChangePasswordData, VerifyEmailData, ApiResponse } from "@/api/types";

export const userService = {
    /**
     * @route GET /api/v1/users/me
     * @description Fetch the current authenticated user's profile
     */
    getCurrentUser: async (): Promise<ApiResponse<{ user: UserProfile }>> => {
        const response = await API.get('/users/me');
        return response.data;
    },

    /**
     * @route PATCH /api/v1/users/me
     * @description Update basic profile data
     */
    updateCurrentUser: async (data: Partial<UserProfile>): Promise<ApiResponse<{ user: UserProfile }>> => {
        const response = await API.patch('/users/me', data);
        return response.data;
    },

    /**
     * @route PATCH /api/v1/users/me/change-password
     * @description Logic for authenticated password rotation
     */
    changePassword: async (data: ChangePasswordData): Promise<ApiResponse<null>> => {
        const response = await API.patch('/users/me/change-password', data);
        return response.data;
    },

    /**
     * @route PATCH /api/v1/users/me/profile-photo
     * @description Multipart endpoint to update user avatar
     */
    uploadProfilePhoto: async (formData: FormData): Promise<ApiResponse<{ profilePhotoUrl: string }>> => {
        const response = await API.patch('/users/me/profile-photo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    /**
     * @route POST /api/v1/users/me/submit-qualifications
     * @description Multipart endpoint for tutors to submit verification documents
     */
    uploadQualificationProof: async (formData: FormData): Promise<ApiResponse<null>> => {
        const response = await API.post('/users/me/submit-qualifications', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    /**
     * @route POST /api/v1/users/me/send-verification-otp
     * @description Triggers the 2FA/Email verification process
     */
    sendVerificationOtp: async (): Promise<ApiResponse<null>> => {
        const response = await API.post('/users/me/send-verification-otp');
        return response.data;
    },

    /**
     * @route POST /api/v1/users/me/verify-email
     * @description Submits the OTP to complete email verification
     */
    verifyEmail: async (data: VerifyEmailData): Promise<ApiResponse<null>> => {
        const response = await API.post('/users/me/verify-email', data);
        return response.data;
    }
};