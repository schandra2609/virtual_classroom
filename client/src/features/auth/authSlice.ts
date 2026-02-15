import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import * as authService from "../../api/authService";
import * as userService from "../../api/userService";

interface User {
  id: string;
  email: string;
  fullName: string;
  accountType: "STUDENT" | "TUTOR" | "ADMINISTRATOR";
  isEmailVerified: boolean;
  profilePhotoUrl?: string;
  tutorVerificationStatus?: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  tutorStatusUpdatedAt?: string;
  tutorQualificationUrl?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: !!localStorage.getItem("access_token"),
  error: null,
};

// Async Thunks
export const checkProfile = createAsyncThunk(
  "auth/checkProfile",
  async (_, { rejectWithValue }) => {
    try {
      return await userService.checkProfile();
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch profile",
      );
    }
  },
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      localStorage.removeItem("access_token");
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Logout failed");
    }
  },
);

export const refreshToken = createAsyncThunk(
  "auth/refreshToken",
  async (_, { rejectWithValue }) => {
    try {
      const data = await authService.refreshTokens();
      localStorage.setItem("access_token", data.accessToken);
      return data;
    } catch (err: any) {
      localStorage.removeItem("access_token");
      return rejectWithValue(err.response?.data?.message || "Session expired");
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>,
    ) => {
      state.user = action.payload.user;
      localStorage.setItem("access_token", action.payload.token);
      state.loading = false;
    },
    clearCredentials: (state) => {
      state.user = null;
      localStorage.removeItem("access_token");
      state.loading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkProfile.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.loading = false;
      })
      .addCase(checkProfile.rejected, (state) => {
        state.user = null;
        state.loading = false;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.loading = false;
      })
      .addCase(refreshToken.fulfilled, (state) => {
        state.loading = false;
        // The token is also stored in localStorage inside the thunk
      })
      .addCase(refreshToken.rejected, (state) => {
        state.user = null;
        state.loading = false;
      });
  },
});

export const { setCredentials, clearCredentials, setLoading } =
  authSlice.actions;
export default authSlice.reducer;
