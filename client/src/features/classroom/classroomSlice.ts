import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as classroomService from "../../api/classroomService";

interface Classroom {
  id: string;
  name: string;
  subject: string;
  batch: string;
  creatorId: string;
  classCode: string;
  _count?: {
    members: number;
  };
}

interface ClassroomState {
  classrooms: Classroom[];
  loading: boolean;
  error: string | null;
}

const initialState: ClassroomState = {
  classrooms: [],
  loading: false,
  error: null,
};

export const fetchClassrooms = createAsyncThunk(
  "classroom/fetchClassrooms",
  async (_, { rejectWithValue }) => {
    try {
      return await classroomService.getMyClassrooms();
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch classrooms",
      );
    }
  },
);

const classroomSlice = createSlice({
  name: "classroom",
  initialState,
  reducers: {
    clearClassrooms: (state) => {
      state.classrooms = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClassrooms.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchClassrooms.fulfilled, (state, action) => {
        state.classrooms = action.payload;
        state.loading = false;
      })
      .addCase(fetchClassrooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearClassrooms } = classroomSlice.actions;
export default classroomSlice.reducer;
