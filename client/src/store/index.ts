import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import classroomReducer from "../features/classroom/classroomSlice";
import announcementReducer from "../features/classroom/announcementSlice";
import assignmentReducer from "../features/classroom/assignmentSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    classroom: classroomReducer,
    announcement: announcementReducer,
    assignment: assignmentReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
