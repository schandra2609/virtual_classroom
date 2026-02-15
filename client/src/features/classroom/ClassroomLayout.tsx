import React, { useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link, Outlet, Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/store';
import { fetchClassrooms } from './classroomSlice';
import { BookOpen, Users, ClipboardList, Settings, ChevronLeft, Share2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { toast } from 'react-hot-toast';

const ClassroomLayout: React.FC = () => {
    const { classroomId } = useParams<{ classroomId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { classrooms } = useAppSelector((state) => state.classroom);
    
    const classroom = classrooms.find(c => c.id === classroomId);
    const activeTab = location.pathname.split('/').pop() || 'stream';

    useEffect(() => {
        if (classrooms.length === 0) {
            dispatch(fetchClassrooms());
        }
    }, [dispatch, classrooms.length]);

    const copyCode = () => {
        if (classroom?.classCode) {
            navigator.clipboard.writeText(classroom.classCode);
            toast.success('Class code copied to clipboard!');
        }
    };

    if (!classroom && classrooms.length > 0) {
        return <Navigate to="/" replace />;
    }

    if (!classroom) return null;

    const tabs = [
        { id: 'stream', label: 'Stream', icon: BookOpen, path: `/classroom/${classroomId}` },
        { id: 'classwork', label: 'Classwork', icon: ClipboardList, path: `/classroom/${classroomId}/classwork` },
        { id: 'people', label: 'People', icon: Users, path: `/classroom/${classroomId}/people` },
    ];

    return (
        <div className="space-y-6">
            {/* Breadcrumbs / Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <button 
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-slate-500 hover:text-cyan-600 transition-colors text-sm font-semibold"
                    >
                        <ChevronLeft size={16} />
                        Back to Classes
                    </button>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">{classroom.name}</h1>
                        <p className="text-slate-500 font-medium flex items-center gap-2 mt-1 uppercase tracking-widest text-xs">
                            {classroom.subject} • {classroom.batch}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden lg:flex flex-col items-end px-4 py-2 bg-white border border-slate-200 rounded-2xl shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Class Code</span>
                        <div className="flex items-center gap-2">
                            <code className="text-sm font-mono font-bold text-cyan-700">{classroom.classCode}</code>
                            <button onClick={copyCode} className="text-slate-400 hover:text-cyan-600 transition-colors">
                                <Share2 size={14} />
                            </button>
                        </div>
                    </div>
                    <button className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-cyan-600 rounded-2xl transition-all shadow-sm">
                        <Settings size={20} />
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-[1.5rem] w-fit">
                {tabs.map((tab) => (
                    <Link
                        key={tab.id}
                        to={tab.path}
                        className={twMerge(
                            "flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold transition-all",
                            (activeTab === tab.id || (activeTab === classroomId && tab.id === 'stream'))
                                ? "bg-white text-cyan-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                        )}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </Link>
                ))}
            </div>

            {/* Content Area */}
            <div className="mt-8">
                <Outlet context={{ classroom }} />
            </div>
        </div>
    );
};

export default ClassroomLayout;
