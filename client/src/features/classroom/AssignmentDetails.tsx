import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/store';
import { fetchAssignments } from './assignmentSlice';
import { 
    ChevronLeft, 
    FileText, 
    Clock, 
    Calendar, 
    X, 
    Loader2, 
    ExternalLink,
    AlertCircle,
    Plus
} from 'lucide-react';
import * as assignmentService from '../../api/assignmentService';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';

const AssignmentDetails: React.FC = () => {
    const { classroomId, assignmentId } = useParams<{ classroomId: string, assignmentId: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    
    const { assignments, loading: assignmentsLoading } = useAppSelector((state) => state.assignment);
    const { user } = useAppSelector((state) => state.auth);
    
    const [submission, setSubmission] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    
    const assignment = assignments.find(a => a.id === assignmentId);

    useEffect(() => {
        if (assignments.length === 0 && classroomId) {
            dispatch(fetchAssignments(classroomId));
        }
    }, [dispatch, classroomId, assignments.length]);

    useEffect(() => {
        const fetchSubmission = async () => {
            try {
                // The backend logic for fetching a single assignment might include the current user's submission
                // or we might need a specific endpoint. Assuming getAssignmentDetails handles this.
                const data = await assignmentService.getAssignmentDetails(classroomId!, assignmentId!);
                if (data.submission) {
                    setSubmission(data.submission);
                }
            } catch (error) {
                // Not submitted yet or error
            } finally {
                setLoading(false);
            }
        };
        if (assignmentId && classroomId && user?.accountType === 'STUDENT') {
            fetchSubmission();
        } else {
            setLoading(false);
        }
    }, [assignmentId, classroomId, user?.accountType]);

    const handleSubmit = async () => {
        if (files.length === 0) return toast.error('Please attach at least one file');
        
        setIsSubmitting(true);
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));

        try {
            const data = await assignmentService.submitAssignment(classroomId!, assignmentId!, formData);
            setSubmission(data);
            setFiles([]);
            toast.success('Assignment submitted successfully!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Submission failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUnsubmit = async () => {
        if (!window.confirm('Are you sure you want to unsubmit? This will remove your previous submission.')) return;
        
        setIsSubmitting(true);
        try {
            await assignmentService.unsubmitAssignment(classroomId!, assignmentId!);
            setSubmission(null);
            toast.success('Submission removed');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to unsubmit');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (assignmentsLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-cyan-600" size={40} />
            </div>
        );
    }

    if (!assignment) {
        return (
            <div className="text-center py-20 space-y-4">
                <AlertCircle size={48} className="mx-auto text-slate-300" />
                <h2 className="text-xl font-bold text-slate-900">Assignment not found</h2>
                <button onClick={() => navigate(-1)} className="text-cyan-600 font-bold hover:underline">Go back</button>
            </div>
        );
    }

    const isOverdue = dayjs().isAfter(dayjs(assignment.dueDate));

    return (
        <div className="max-w-6xl mx-auto pb-20">
            <button 
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-slate-500 hover:text-cyan-600 transition-colors text-sm font-semibold mb-8"
            >
                <ChevronLeft size={16} />
                Back to Classwork
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Assignment Info */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="space-y-4 border-b border-slate-100 pb-8">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <h1 className="text-4xl font-black text-slate-900 tracking-tight">{assignment.title}</h1>
                                <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    <span>{assignment.maxMarks} points</span>
                                    {isOverdue && <span className="text-red-500">Missing / Overdue</span>}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm font-semibold">
                            <div className="flex items-center gap-2 text-slate-500">
                                <Clock size={16} />
                                Posted {dayjs(assignment.createdAt).format('MMM D, YYYY')}
                            </div>
                            <div className="flex items-center gap-2 text-slate-900">
                                <Calendar size={16} />
                                Due {dayjs(assignment.dueDate).format('MMM D, h:mm A')}
                            </div>
                        </div>
                    </div>

                    <div className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {assignment.description || 'No instructions provided.'}
                    </div>

                    {assignment.attachments?.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-900">Reference Materials</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {assignment.attachments.map((file, idx) => (
                                    <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all group">
                                        <div className="bg-slate-50 p-2.5 rounded-xl text-slate-400 group-hover:text-cyan-600 transition-colors">
                                            <FileText size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-900 truncate">{file.fileName}</p>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">{file.fileType.split('/')[1]}</p>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Submission Sidebar (Student Only) */}
                {user?.accountType === 'STUDENT' && (
                    <div className="lg:col-span-1">
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 space-y-6 sticky top-8">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Your Work</h3>
                                <div className={submission ? "text-green-600 text-xs font-bold uppercase" : "text-slate-400 text-xs font-bold uppercase"}>
                                    {submission ? 'Turned In' : 'Assigned'}
                                </div>
                            </div>

                            {!submission ? (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        {files.map((file, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                                <div className="flex items-center gap-2 text-xs font-medium text-slate-600 min-w-0">
                                                    <FileText size={14} className="flex-shrink-0" />
                                                    <span className="truncate">{file.name}</span>
                                                </div>
                                                <button onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-500">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-3">
                                        <label className="w-full h-12 flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 cursor-pointer transition-all font-bold text-sm">
                                            <input 
                                                type="file" 
                                                multiple 
                                                className="hidden" 
                                                onChange={(e) => setFiles(prev => [...prev, ...Array.from(e.target.files || [])])}
                                            />
                                            <Plus size={18} />
                                            Add or Create
                                        </label>
                                        <button 
                                            onClick={handleSubmit}
                                            disabled={isSubmitting || files.length === 0}
                                            className="w-full py-4 bg-cyan-600 text-white font-bold rounded-2xl hover:bg-cyan-700 transition-all shadow-lg shadow-cyan-100 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Turn In'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        {submission.attachments?.map((file: any, idx: number) => (
                                            <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl group">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <FileText size={18} className="text-slate-400 group-hover:text-cyan-600 transition-colors" />
                                                    <span className="text-sm font-bold text-slate-700 truncate">{file.fileName}</span>
                                                </div>
                                                <ExternalLink size={14} className="text-slate-300" />
                                            </a>
                                        ))}
                                    </div>
                                    <button 
                                        onClick={handleUnsubmit}
                                        disabled={isSubmitting}
                                        className="w-full py-3.5 border-2 border-slate-200 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        Unsubmit
                                    </button>
                                </div>
                            )}

                            {submission?.isLate && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-[10px] font-black uppercase tracking-widest">
                                    <AlertCircle size={14} />
                                    Submitted Late
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssignmentDetails;
