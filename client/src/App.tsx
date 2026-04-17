import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";

// Redux
import { useAppDispatch } from "@/hooks/redux";
import { setAuthLoaded } from "@/features/auth/authSlice"

import { userService } from "@/api/user.service";

// Pages & Layouts
import Login from "@/features/auth/Login";
import Register from "@/features/auth/Register";
import OAuthCallback from "@/features/auth/OAuthCallback";
import CompleteProfile from "@/features/auth/CompleteProfile";
import TutorApplications from "@/features/admin/TutorApplications";
import Landing from "@/features/marketing/Landing";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import CBTBuilder from "@/features/classroom/CBTBuilder";
import ClassroomsDashboard from "@/features/classroom/ClassroomDashboard";
import ClassroomDetails from "@/features/classroom/ClassroomDetails";
import GradingDashboard from "@/features/classroom/GradingDashboard";
import UserProfile from "@/features/profile/UserProfile";

const App = () => {
    const dispatch = useAppDispatch();

    useEffect(() => {
        const bootstrapAuth = async () => {
            const token = localStorage.getItem('accessToken');
            
            if (token && token !== "undefined" && token !== "null") {
                try {
                    const response = await userService.getCurrentUser();
                    const extractedUser = response.data?.user || response.data;

                    if(response.success && extractedUser?.id) {
                        dispatch(setAuthLoaded({
                            isAuthenticated: true,
                            user: extractedUser
                        }));
                    } else {
                        throw new Error("Invalid session");
                    }
                } catch (error) {
                    localStorage.removeItem('accessToken');
                    dispatch(setAuthLoaded({ isAuthenticated: false }));
                }
            } else {
                dispatch(setAuthLoaded({ isAuthenticated: false }));
            }
        };

        bootstrapAuth();
    }, [ dispatch ]);

    return (
        <BrowserRouter>
            <div className="min-h-screen bg-background font-sans antialiased">
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/auth/callback" element={<OAuthCallback />} />
                    <Route path="/auth/complete-profile" element={<CompleteProfile />} />

                    {/* Protected Routes Wrapper */}
                    <Route element={<ProtectedRoute />}>
                        {/* Dashboard Layout Wrapper */}
                        <Route path="/dashboard" element={<DashboardLayout />}>
                            {/* The specific pages inside the dashboard */}
                            <Route index element={<ClassroomsDashboard />} />
                            <Route path="classrooms/:id" element={<ClassroomDetails />} />
                            <Route path="cbt-builder/:classroomId/:paperId" element={<CBTBuilder />} />
                            <Route path="profile" element={<UserProfile />} />
                            <Route path="applications" element={<TutorApplications />} />
                            <Route path="grade/:classroomId/:assignmentId" element={<GradingDashboard />} />

                            <Route path="calendar" element={<div>Calendar Route (Coming Soon)</div>} />
                            <Route path="settings" element={<div>Settings Route (Coming Soon)</div>} />
                        </Route>
                    </Route>

                    {/* Fallback to login */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </div>

            {/* Global Toast Notifications */}
            <Toaster position="top-right" richColors />
        </BrowserRouter>
    );
};

export default App;