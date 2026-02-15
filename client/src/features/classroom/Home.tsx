import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/store';
import { fetchClassrooms } from './classroomSlice';
import { Plus, UserPlus, BookOpen, MoreVertical, Users } from 'lucide-react';
import { JoinClassroomModal, CreateClassroomModal } from './ClassroomModals';
import { toast } from 'react-hot-toast';

const Home: React.FC = () => {
    const dispatch = useAppDispatch();
    const { classrooms, loading, error } = useAppSelector((state) => state.classroom);
    const { user } = useAppSelector((state) => state.auth);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

    useEffect(() => {
        if (error) {
            toast.error(error);
        }
    }, [error]);

    useEffect(() => {
        if (user?.accountType === 'ADMINISTRATOR') {
            window.location.href = '/dashboard/admin';
        }
        dispatch(fetchClassrooms());
    }, [dispatch, user]);

    if (loading && classrooms.length === 0) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-3xl p-6 h-52 animate-pulse flex flex-col justify-between">
                        <div className="space-y-3">
                            <div className="h-6 bg-slate-100 rounded-lg w-2/3"></div>
                            <div className="h-4 bg-slate-50 rounded-lg w-1/2"></div>
                        </div>
                        <div className="h-10 bg-slate-50 rounded-xl w-full"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Your Classrooms</h1>
                    <p className="text-slate-500 mt-1">Manage your learning and teaching spaces</p>
                </div>
                <div className="flex items-center gap-3">
                    {user?.accountType === 'STUDENT' && (
                        <button
                            onClick={() => setIsJoinModalOpen(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all active:scale-95"
                        >
                            <UserPlus size={18} />
                            Join Class
                        </button>
                    )}
                    {user?.accountType === 'TUTOR' && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-cyan-600 text-white font-semibold rounded-xl hover:bg-cyan-700 transition-all shadow-lg shadow-cyan-100 active:scale-95"
                        >
                            <Plus size={18} />
                            Create Class
                        </button>
                    )}
                </div>
            </div>

            {classrooms.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center max-w-2xl mx-auto space-y-6">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto text-slate-300">
                        <BookOpen size={40} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-slate-900">No classrooms yet</h3>
                        <p className="text-slate-500">
                            {user?.accountType === 'STUDENT' 
                                ? "Ask your teacher for a class code to join your first classroom." 
                                : user?.accountType === 'TUTOR' 
                                    ? "Create your first classroom to start teaching and sharing materials."
                                    : "No classrooms are currently assigned to you."}
                        </p>
                    </div>
                    {(user?.accountType === 'STUDENT' || user?.accountType === 'TUTOR') && (
                        <button
                            onClick={() => user?.accountType === 'STUDENT' ? setIsJoinModalOpen(true) : setIsCreateModalOpen(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all"
                        >
                            {user?.accountType === 'STUDENT' ? <UserPlus size={20} /> : <Plus size={20} />}
                            {user?.accountType === 'STUDENT' ? "Join a Classroom" : "Create New Classroom"}
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classrooms.map((classroom) => (
                        <div 
                            key={classroom.id}
                            className="group bg-white border border-slate-200 rounded-[2rem] p-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer relative overflow-hidden"
                            onClick={() => window.location.href = `/classroom/${classroom.id}`}
                        >
                            {/* Decorative gradient corner */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-50 to-transparent -mr-12 -mt-12 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                            
                            <div className="relative z-10 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="bg-slate-50 p-3 rounded-2xl text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white transition-colors duration-300">
                                        <BookOpen size={24} />
                                    </div>
                                    <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors">
                                        <MoreVertical size={20} />
                                    </button>
                                </div>
                                
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-slate-900 line-clamp-1 group-hover:text-cyan-600 transition-colors">
                                        {classroom.name}
                                    </h3>
                                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{classroom.subject}</p>
                                </div>

                                <div className="pt-4 flex items-center justify-between border-t border-slate-50">
                                    <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                                        <Users size={16} />
                                        <span>{classroom._count?.members || 0} students</span>
                                    </div>
                                    <div className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase tracking-tighter">
                                        {classroom.batch}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <JoinClassroomModal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} />
            <CreateClassroomModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
        </div>
    );
};

export default Home;
