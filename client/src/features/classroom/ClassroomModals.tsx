import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useAppDispatch } from "../../hooks/store";
import { fetchClassrooms } from "./classroomSlice";
import * as classroomService from "../../api/classroomService";
import { toast } from 'react-hot-toast';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const JoinClassroomModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
    const [classCode, setClassCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const dispatch = useAppDispatch();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!classCode.trim()) return toast.error('Please enter a class code');

        setIsSubmitting(true);
        try {
            await classroomService.joinClassroom(classCode);
            toast.success('Successfully joined the classroom!');
            dispatch(fetchClassrooms());
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to join classroom');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 relative animate-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
                    <X size={20} />
                </button>
                
                <div className="space-y-6">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold text-slate-900">Join Classroom</h2>
                        <p className="text-slate-500 text-sm">Enter the code provided by your teacher</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Class Code</label>
                            <input
                                autoFocus
                                type="text"
                                value={classCode}
                                onChange={(e) => setClassCode(e.target.value)}
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-mono tracking-widest text-lg text-center"
                                placeholder="XJR-7W2"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Join Now'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export const CreateClassroomModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({ name: '', subject: '', batch: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const dispatch = useAppDispatch();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.subject || !formData.batch) {
            return toast.error('Please fill in all fields');
        }

        setIsSubmitting(true);
        try {
            await classroomService.createClassroom(formData);
            toast.success('Classroom created successfully!');
            dispatch(fetchClassrooms());
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create classroom');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 relative animate-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
                    <X size={20} />
                </button>
                
                <div className="space-y-6">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold text-slate-900">Create Classroom</h2>
                        <p className="text-slate-500 text-sm">Set up a new space for your students</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Class Name</label>
                            <input
                                autoFocus
                                type="text"
                                placeholder="e.g. Advanced Mathematics"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-medium"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Subject</label>
                            <input
                                type="text"
                                placeholder="e.g. Calculus & Linear Algebra"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-medium"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Batch / Section</label>
                            <input
                                type="text"
                                placeholder="e.g. Fall 2026 - Section A"
                                value={formData.batch}
                                onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-medium"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 bg-cyan-600 text-white font-bold rounded-2xl hover:bg-cyan-700 transition-all shadow-lg shadow-cyan-100 active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2 mt-4"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Create Classroom'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
