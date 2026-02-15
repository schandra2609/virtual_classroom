import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import * as announcementService from "../../api/announcementService";

interface Attachment {
  id: string;
  url: string;
  fileName: string;
  fileType: string;
}

interface Announcement {
  id: string;
  message: string;
  author: {
    fullName: string;
    profilePhotoUrl?: string;
  };
  attachments: Attachment[];
  createdAt: string;
  _count: {
    comments: number;
  };
}

interface AnnouncementState {
  announcements: Announcement[];
  loading: boolean;
  error: string | null;
}

const initialState: AnnouncementState = {
  announcements: [],
  loading: false,
  error: null,
};

export const fetchAnnouncements = createAsyncThunk(
  "announcement/fetchAnnouncements",
  async (classroomId: string, { rejectWithValue }) => {
    try {
      return await announcementService.fetchAnnouncements(classroomId);
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch announcements",
      );
    }
  },
);

const announcementSlice = createSlice({
  name: "announcement",
  initialState,
  reducers: {
    addAnnouncement: (state, action: PayloadAction<Announcement>) => {
      state.announcements.unshift(action.payload);
    },
    clearAnnouncements: (state) => {
      state.announcements = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnnouncements.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAnnouncements.fulfilled, (state, action) => {
        state.announcements = action.payload;
        state.loading = false;
      })
      .addCase(fetchAnnouncements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { addAnnouncement, clearAnnouncements } =
  announcementSlice.actions;
export default announcementSlice.reducer;
