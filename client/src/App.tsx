import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout, PublicLayout } from './layouts/AppLayout';
import { useAppDispatch, useAppSelector } from './hooks/store';
import { checkProfile } from './features/auth/authSlice';

import Login from './features/auth/Login';
import Register from './features/auth/Register';
import Home from './features/classroom/Home';
import ClassroomLayout from './features/classroom/ClassroomLayout';
import Stream from './features/classroom/Stream';
import People from './features/classroom/People';
import Classwork from './features/classroom/Classwork';
import AssignmentDetails from './features/classroom/AssignmentDetails';
import Landing from './features/landing/Landing';
import Profile from './features/profile/Profile';
import Invitations from './features/classroom/Invitations';
import AuthManager from './components/auth/AuthManager';
import AdminDashboard from './features/admin/AdminDashboard';
import OAuthCallback from './features/auth/OAuthCallback';
import CompleteProfile from './features/auth/CompleteProfile';

const App: React.FC = () => {
    const dispatch = useAppDispatch();
    const { loading } = useAppSelector((state) => state.auth);

    useEffect(() => {
        if (localStorage.getItem('access_token')) {
            dispatch(checkProfile());
        }
    }, [dispatch]);

    if (loading && localStorage.getItem('access_token')) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
            </div>
        );
    }

    return (
        <BrowserRouter>
            <AuthManager />
            <Routes>
                {/* Public / Generic Routes */}
                <Route path="/" element={<Landing />} />
                
                {/* Auth Routes */}
                <Route element={<PublicLayout />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/auth/callback" element={<OAuthCallback />} />
                    <Route path="/auth/complete-profile" element={<CompleteProfile />} />
                </Route>

                {/* Workspace / Dashboard Routes */}
                <Route path="/dashboard" element={<DashboardLayout />}>
                    <Route index element={<Home />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="invitations" element={<Invitations />} />
                    <Route path="admin" element={<AdminDashboard />} />
                    <Route path="todo" element={<div className="text-center py-12"><h1 className="text-2xl font-bold">To-do List - Coming Soon</h1></div>} />
                    <Route path="settings" element={<div className="text-center py-12"><h1 className="text-2xl font-bold">Settings - Coming Soon</h1></div>} />
                    
                    {/* Classroom Nested Routes */}
                    <Route path="classroom/:classroomId" element={<ClassroomLayout />}>
                        <Route index element={<Stream />} />
                        <Route path="classwork" element={<Classwork />} />
                        <Route path="people" element={<People />} />
                        <Route path="assignment/:assignmentId" element={<AssignmentDetails />} />
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;
