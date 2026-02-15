import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/store';
import { fetchAssignments } from './assignmentSlice';
import { ClipboardList, Plus, ChevronRight, Calendar } from 'lucide-react';
import dayjs from 'dayjs';

const Classwork: React.FC = () => {
    const { classroomId } = useParams<{ classroomId: string }>();
    const dispatch = useAppDispatch();
    const { assignments, loading } = useAppSelector((state) => state.assignment);
    const { user } = useAppSelector((state) => state.auth);

    useEffect(() => {
        if (classroomId) {
            dispatch(fetchAssignments(classroomId));
        }
    }, [classroomId, dispatch]);

    if (loading && assignments.length === 0) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-white border border-slate-100 rounded-2xl animate-pulse"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Header Actions */}
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    Classwork
                </h2>
                {user?.accountType !== 'STUDENT' && (
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 transition-all shadow-lg shadow-cyan-100 active:scale-95">
                        <Plus size={20} />
                        Create Assignment
                    </button>
                )}
            </div>

            {/* Assignment List */}
            <div className="space-y-4">
                {assignments.length === 0 ? (
                    <div className="py-20 text-center bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] space-y-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                            <ClipboardList size={32} />
                        </div>
                        <div className="space-y-1">
                            <p className="font-bold text-slate-900">No work assigned yet</p>
                            <p className="text-slate-500 text-sm">Check back later for updates from your teacher</p>
                        </div>
                    </div>
                ) : (
                    assignments.map((assignment) => {
                        const isOverdue = dayjs().isAfter(dayjs(assignment.dueDate));
                        return (
                            <div 
                                key={assignment.id}
                                className="group bg-white border border-slate-200 rounded-3xl p-5 hover:border-cyan-200 hover:shadow-xl hover:shadow-cyan-100/30 transition-all cursor-pointer flex items-center justify-between"
                                onClick={() => window.location.href = `/classroom/${classroomId}/assignment/${assignment.id}`}
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition-colors duration-300">
                                        <ClipboardList size={24} />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-slate-900 line-clamp-1">{assignment.title}</h3>
                                        <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-wider">
                                            <p className="text-slate-400">Posted {dayjs(assignment.createdAt).format('MMM D')}</p>
                                            <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                                            <div className={isOverdue ? "text-red-500 flex items-center gap-1.5" : "text-slate-500 flex items-center gap-1.5"}>
                                                <Calendar size={12} />
                                                Due {dayjs(assignment.dueDate).format('MMM D, h:mm A')}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="hidden sm:flex flex-col items-end px-4 border-r border-slate-100">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Max Marks</span>
                                        <span className="text-sm font-bold text-slate-700">{assignment.maxMarks} pts</span>
                                    </div>
                                    <div className="p-2 text-slate-300 group-hover:text-cyan-600 group-hover:bg-cyan-50 rounded-xl transition-all">
                                        <ChevronRight size={20} />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default Classwork;
