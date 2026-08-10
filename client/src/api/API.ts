import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://192.168.0.130:5000/api/v1';

let inMemoryAccessToken: string | null = null;
export const setInMemoryToken = (token: string | null) => {
    inMemoryAccessToken = token;
};

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
        if (inMemoryAccessToken) {
            config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
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
                setInMemoryToken(newAccessToken);
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return API(originalRequest);
            } catch (refreshError) {
                setInMemoryToken(null);
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);