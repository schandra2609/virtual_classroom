// import API from "./API.ts";

export interface LoginData { email: string; password: string; }
export interface RegisterData { fullName: string; email: string; password: string; accountType: 'STUDENT' | 'TUTOR'; }
export interface OAuthCompleteData { accountType: 'STUDENT' | 'TUTOR'; }

const DUMMY_USER = {
    id: 'usr_123',
    fullName: 'Demo Student',
    email: 'student@demo.com',
    accountType: 'STUDENT',
};

const DUMMY_ACCESS_TOKEN = "eyMockedAccessToken.123456789";

export const authService = {
    /**
     * @route POST /api/v1/auth/register
     * @description Register a new user and return an access token
     */
    register: async (data: RegisterData) => {
        console.log('Mock API: Registering...', data);
        return new Promise((resolve) => {
            setTimeout(() => {
                localStorage.setItem('accessToken', DUMMY_ACCESS_TOKEN);
                resolve({
                    message: 'Registration successful',
                    accessToken: DUMMY_ACCESS_TOKEN,
                    user: { ...DUMMY_USER, ...data }
                });
            }, 2000);
        });
    },

    /**
     * @route POST /api/v1/auth/login
     * @description Authenticate a user with email and password
     */
    login: async (data: LoginData) => {
        console.log('Mock API: Logging in...', data);
        return new Promise((resolve) => {
            setTimeout(() => {
                localStorage.setItem('accessToken', DUMMY_ACCESS_TOKEN);
                resolve({
                    message: 'Login successful',
                    accessToken: DUMMY_ACCESS_TOKEN,
                    user: DUMMY_USER
                });
            }, 2000);
        });
    },

    /**
     * @route POST /api/v1/auth/logout
     * @description Log the user out, clear memory tokens, and clear HTTP-only cookies on backend
     */
    logout: async () => {
        console.log('Mock API: Logging out...');
        return new Promise((resolve) => {
            setTimeout(() => {
                localStorage.removeItem('accessToken');
                resolve({ message: 'Logged out successfully' });
            }, 1000);
        });
    },

    /**
     * @route POST /api/v1/auth/refresh-token
     * @description Perform token rotation using the HTTP-only refresh token cookie
     */
    refreshToken: async () => {
        console.log('Mock API: Rotating tokens...');
        return new Promise((resolve) => {
            setTimeout(() => {
                const newMockToken = "eyRotatedAccessToken.987654321";
                localStorage.setItem('accessToken', newMockToken);
                resolve({ accessToken: newMockToken });
            }, 1000);
        });
    },

    /**
     * @route POST /api/v1/auth/complete-profile
     * @description Second step for OAuth users to provide additional required details (e.g., Role)
     */
    completeProfile: async (data: OAuthCompleteData) => {
        console.log('Mock API: Completing OAuth profile...', data);
        return new Promise((resolve) => {
            setTimeout(() => {
                localStorage.setItem('accessToken', DUMMY_ACCESS_TOKEN);
                resolve({
                    message: 'Profile completed',
                    accessToken: DUMMY_ACCESS_TOKEN,
                    user: { ...DUMMY_USER, ...data }
                });
            }, 1000);
        });
    },
};