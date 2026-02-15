import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import * as assignmentService from "../../api/assignmentService";

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxMarks: number;
  creatorId: string;
  createdAt: string;
  attachments: any[];
  _count: {
    submissions: number;
  };
}

interface AssignmentState {
  assignments: Assignment[];
  loading: boolean;
  error: string | null;
}

const initialState: AssignmentState = {
  assignments: [],
  loading: false,
  error: null,
};

export const fetchAssignments = createAsyncThunk(
  "assignment/fetchAssignments",
  async (classroomId: string, { rejectWithValue }) => {
    try {
      return await assignmentService.fetchAssignments(classroomId);
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch assignments",
      );
    }
  },
);

const assignmentSlice = createSlice({
  name: "assignment",
  initialState,
  reducers: {
    addAssignment: (state, action: PayloadAction<Assignment>) => {
      state.assignments.unshift(action.payload);
    },
    clearAssignments: (state) => {
      state.assignments = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssignments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAssignments.fulfilled, (state, action) => {
        state.assignments = action.payload;
        state.loading = false;
      })
      .addCase(fetchAssignments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { addAssignment, clearAssignments } = assignmentSlice.actions;
export default assignmentSlice.reducer;
