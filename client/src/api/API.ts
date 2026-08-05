import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://192.168.0.130:5000/api/v1';

export const API = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// REQUEST INTERCEPTOR: Attach the short-lived access token
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR: Handle silent token rotation
API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 (Unauthorized) and we haven't already tried to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Silently request a new token. The browser automatically sends the refresh cookie!
                const refreshResponse = await axios.post(
                    `${BASE_URL}/auth/refresh-token`, 
                    {}, 
                    { withCredentials: true }
                );

                const newAccessToken = refreshResponse.data.data.accessToken;
                
                // Save the new token and update the failed request's header
                localStorage.setItem('accessToken', newAccessToken);
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                // Retry the original request seamlessly
                return API(originalRequest);

            } catch (refreshError) {
                // If refresh fails (e.g., refresh token expired/revoked), log them out
                localStorage.removeItem('accessToken');
                window.location.href = '/login'; // Force redirect to login
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);