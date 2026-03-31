// import API from "./API.ts";

export interface UserProfile {
    id: string;
    fullName: string;
    email: string;
    accountType: 'STUDENT' | 'TUTOR' | 'ADMINISTRATOR';
    profilePhotoUrl?: string | null; 
    isEmailVerified: boolean;
    tutorVerificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export interface ChangePasswordData {
    oldPassword: string;
    newPassword: string;
}

export interface VerifyEmailData {
    otp: string;
}

// Mutable dummy data to simulate state changes during the mock phase
let DUMMY_USER: UserProfile = {
    id: 'usr_123',
    fullName: 'Demo Student',
    email: 'student@demo.com',
    accountType: 'STUDENT',
    profilePhotoUrl: null,
    isEmailVerified: false,
    tutorVerificationStatus: 'PENDING'
};

export const userService = {
    /**
     * @route GET /api/v1/users/me
     * @description Fetch the current authenticated user's profile
     */
    getCurrentUser: async () => {
        console.log('Mock API: Fetching current user profile from /users/me');
        return new Promise<{ user: UserProfile }>((resolve, reject) => {
            setTimeout(() => {
                const token = localStorage.getItem('accessToken');
                if (token) {
                    resolve({ user: DUMMY_USER });
                } else {
                    reject(new Error("Unauthorized: No access token found"));
                }
            }, 2000);
        });
    },

    /**
     * @route PATCH /api/v1/users/me
     * @description Update basic profile data
     */
    updateCurrentUser: async (data: Partial<UserProfile>) => {
        console.log('Mock API: Updating user profile...', data);
        return new Promise<{ message: string; user: UserProfile }>((resolve) => {
            setTimeout(() => {
                DUMMY_USER = { ...DUMMY_USER, ...data };
                resolve({ message: 'Profile updated successfully', user: DUMMY_USER });
            }, 1000);
        });
    },

    /**
     * @route PATCH /api/v1/users/me/change-password
     * @description Logic for authenticated password rotation
     */
    changePassword: async (_data: ChangePasswordData) => {
        console.log('Mock API: Changing password...');
        // console.log(data);
        return new Promise<{ message: string }>((resolve) => {
            setTimeout(() => {
                resolve({ message: 'Password changed successfully' });
            }, 1000);
        });
    },

    /**
     * @route POST /api/v1/users/me/send-verification-otp
     * @description Triggers the 2FA/Email verification process
     */
    sendVerificationOtp: async () => {
        console.log('Mock API: Sending verification OTP...');
        return new Promise<{ message: string }>((resolve) => {
            setTimeout(() => {
                resolve({ message: 'OTP sent to your email' });
            }, 800);
        });
    },

    /**
     * @route POST /api/v1/users/me/verify-email
     * @description Submits the OTP to complete email verification
     */
    verifyEmail: async (data: VerifyEmailData) => {
        console.log('Mock API: Verifying email with OTP...', data);
        return new Promise<{ message: string; user: UserProfile }>((resolve) => {
            setTimeout(() => {
                DUMMY_USER = { ...DUMMY_USER, isEmailVerified: true };
                resolve({ message: 'Email verified successfully', user: DUMMY_USER });
            }, 1000);
        });
    },

    /**
     * @route PATCH /api/v1/users/me/profile-photo
     * @description Multipart endpoint to update user avatar
     */
    uploadProfilePhoto: async (formData: FormData) => {
        console.log('Mock API: Uploading profile photo...', formData.get('image'));
        return new Promise<{ message: string; profilePhotoUrl: string }>((resolve) => {
            setTimeout(() => {
                const mockUrl = "https://mock-storage.com/avatar.jpg";
                DUMMY_USER = { ...DUMMY_USER, profilePhotoUrl: mockUrl };
                resolve({ message: 'Profile photo updated', profilePhotoUrl: mockUrl });
            }, 1500);
        });
    },

    /**
     * @route POST /api/v1/users/me/submit-qualifications
     * @description Multipart endpoint for tutors to submit verification documents
     */
    uploadQualificationProof: async (formData: FormData) => {
        console.log('Mock API: Submitting qualifications...', formData.get('document'));
        return new Promise<{ message: string }>((resolve) => {
            setTimeout(() => {
                resolve({ message: 'Qualifications submitted for verification successfully' });
            }, 1500);
        });
    }
};