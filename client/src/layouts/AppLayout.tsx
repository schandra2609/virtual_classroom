import React, { useEffect } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks/store';
import { logout, checkProfile } from '../features/auth/authSlice';
import { LogOut, User as UserIcon, BookOpen, Clock, Settings, GraduationCap, Mail, ShieldCheck } from 'lucide-react';

export const PublicLayout: React.FC = () => {
    const { user, loading } = useAppSelector((state) => state.auth);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
            </div>
        );
    }

    if (user) return <Navigate to="/dashboard" replace />;
    
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <Outlet />
        </div>
    );
};

export const DashboardLayout: React.FC = () => {
    const { user, loading } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user && localStorage.getItem('access_token')) {
            dispatch(checkProfile());
        }
    }, [dispatch, user]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
            </div>
        );
    }

    if (!user && !localStorage.getItem('access_token')) {
        return <Navigate to="/login" replace />;
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col sticky top-0 h-screen">
                <div className="p-6 flex items-center gap-3">
                    <div className="bg-cyan-600 p-2 rounded-xl text-white shadow-lg shadow-cyan-200">
                        <BookOpen size={24} />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-indigo-600 bg-clip-text text-transparent">
                        Virtual Classroom
                    </span>
                </div>

                <nav className="flex-1 px-4 space-y-2 py-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-cyan-600 rounded-xl transition-all font-medium"
                    >
                        <GraduationCap size={20} />
                        Dashboard
                    </button>
                    <button
                        onClick={() => navigate('/dashboard/todo')}
                        className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-cyan-600 rounded-xl transition-all font-medium"
                    >
                        <Clock size={20} />
                        To-do
                    </button>
                    <button
                        onClick={() => navigate('/dashboard/settings')}
                        className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-cyan-600 rounded-xl transition-all font-medium"
                    >
                        <Settings size={20} />
                        Settings
                    </button>
                    {user?.accountType === 'TUTOR' && (
                        <button
                            onClick={() => navigate('/dashboard/invitations')}
                            className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-cyan-600 rounded-xl transition-all font-medium"
                        >
                            <Mail size={20} />
                            Join Requests
                        </button>
                    )}
                    {user?.accountType === 'ADMINISTRATOR' && (
                        <button
                            onClick={() => navigate('/dashboard/admin')}
                            className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-cyan-600 rounded-xl transition-all font-medium"
                        >
                            <ShieldCheck size={20} />
                            Admin Panel
                        </button>
                    )}
                </nav>

                <div className="p-4 border-t border-slate-100 space-y-4">
                    <div 
                        className="flex items-center gap-3 px-2 cursor-pointer hover:bg-slate-50 py-2 rounded-xl transition-colors"
                        onClick={() => navigate('/dashboard/profile')}
                    >
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                            {user.profilePhotoUrl ? (
                                <img src={user.profilePhotoUrl} alt={user.fullName} className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon size={20} className="text-slate-400" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{user.fullName}</p>
                            <p className="text-xs text-slate-500 truncate capitalize">{user.accountType.toLowerCase()}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => dispatch(logout())}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all font-medium"
                    >
                        <LogOut size={20} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile Sidebar Trigger / Placeholder for later */}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
                <main className="flex-1 p-6 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};
