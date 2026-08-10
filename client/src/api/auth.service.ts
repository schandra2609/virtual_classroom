import { API } from "@/api/API";
import type { ApiResponse, UserProfile } from "@/api/types";

export const authService = {
    /**
     * @route POST /api/v1/auth/login
     * @description Authenticates a user and returns a short-lived access token + user profile.
     * The backend MUST attach the refresh token as an HttpOnly cookie in the response.
     */
    login: async (credentials: any): Promise<ApiResponse<{ accessToken: string; user: UserProfile }>> => {
        const response = await API.post('/auth/login', credentials);
        return response.data;
    },

    /**
     * @route POST /api/v1/auth/register
     * @description Creates a new user and logs them in immediately.
     */
    register: async (userData: any): Promise<ApiResponse<{ accessToken: string; user: UserProfile }>> => {
        const response = await API.post('/auth/register', userData);
        return response.data;
    },

    /**
     * @route POST /api/v1/auth/logout
     * @description Tells the backend to clear the HttpOnly refresh token cookie.
     */
    logout: async (): Promise<ApiResponse<null>> => {
        const response = await API.post('/auth/logout');
        return response.data;
    },

    /**
     * @route POST /api/v1/auth/refresh-token
     * @description Silent token rotation via HttpOnly Cookie
     */
    refreshTokens: async (): Promise<ApiResponse<{ accessToken: string }>> => {
        const response = await API.post('/auth/refresh-token');
        return response.data;
    },

    /**
     * @route POST /api/v1/auth/complete-profile
     * @description Completes the profile setup for a newly registered user.
     */
    completeProfile: async (data: { setupToken: string; accountType: string; qualificationUrl: string }) => {
        const response = await API.post('/auth/complete-profile', data);
        return response.data;
    }
};