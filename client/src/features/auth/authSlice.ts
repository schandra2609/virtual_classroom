import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UserProfile } from '@/api/types';

interface AuthState {
    isAuthenticated: boolean;
    user?: UserProfile;
    accessToken?: string;
    isLoading: boolean;
}

const initialState: AuthState = {
    isAuthenticated: false,
    isLoading: true,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (
            state,
            action: PayloadAction<{ user: UserProfile; accessToken: string }>
        ) => {
            state.user = action.payload.user;
            state.accessToken = action.payload.accessToken;
            state.isAuthenticated = true;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setAuthLoaded: (
            state,
            action: PayloadAction<{ isAuthenticated: boolean; user?: UserProfile; accessToken?: string }>
        ) => {
            state.isLoading = false;
            state.isAuthenticated = action.payload.isAuthenticated;
            if (action.payload.user) {
                state.user = action.payload.user;
            }
            if (action.payload.accessToken) {
                state.accessToken = action.payload.accessToken;
            }
        },
        logout: (state) => {
            state.user = undefined;
            state.isAuthenticated = false;
            state.accessToken = undefined;
        },
    },
});

export const { setCredentials, setLoading, setAuthLoaded, logout } = authSlice.actions;
export default authSlice.reducer;