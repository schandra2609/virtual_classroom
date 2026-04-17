import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UserProfile } from '@/api/types';

interface AuthState {
    isAuthenticated: boolean;
    user?: UserProfile;
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
            state.isAuthenticated = true;
            if (action.payload.accessToken && action.payload.accessToken !== "undefined") {
                localStorage.setItem('accessToken', action.payload.accessToken);
            }
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setAuthLoaded: (
            state,
            action: PayloadAction<{ isAuthenticated: boolean; user?: UserProfile }>
        ) => {
            state.isLoading = false;
            state.isAuthenticated = action.payload.isAuthenticated;
            if (action.payload.user) {
                state.user = action.payload.user;
            }
        },
        logout: (state) => {
            state.user = undefined;
            state.isAuthenticated = false;
            localStorage.removeItem('accessToken');
        },
    },
});

export const { setCredentials, setLoading, setAuthLoaded, logout } = authSlice.actions;
export default authSlice.reducer;