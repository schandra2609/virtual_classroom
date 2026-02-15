import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '../../hooks/store';
import { setCredentials } from '../../features/auth/authSlice';
import * as authService from '../../api/authService';
import { toast } from 'react-hot-toast';
import { GraduationCap, Users, ArrowRight, Loader2, Link as LinkIcon } from 'lucide-react';

const CompleteProfile: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [accountType, setAccountType] = useState<'STUDENT' | 'TUTOR' | null>(null);
    const [qualificationUrl, setQualificationUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    
    const setupToken = searchParams.get('setupToken');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!setupToken) return toast.error('Setup token missing. Please try signing in again.');
        if (!accountType) return toast.error('Please select an account type');
        if (accountType === 'TUTOR' && !qualificationUrl.trim()) return toast.error('Tutors must provide a qualification URL');

        setIsSubmitting(true);
        const toastId = toast.loading('Finalizing your profile...');

        try {
            const response = await authService.completeUserProfile({
                setupToken,
                accountType,
                qualificationUrl: accountType === 'TUTOR' ? qualificationUrl : null
            });

            const { accessToken, user } = response.data;
            dispatch(setCredentials({ user, token: accessToken }));
            
            toast.success('Profile completed successfully!', { id: toastId });
            navigate('/dashboard');
        } catch (error: unknown) {
            toast.error(error.response?.data?.message || 'Failed to complete profile', { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!setupToken) {
        return (
            <div className="text-center p-12 space-y-4">
                <h1 className="text-2xl font-bold text-red-600">Invalid Link</h1>
                <p className="text-slate-600">The setup link is invalid or has expired.</p>
                <button onClick={() => navigate('/login')} className="text-cyan-600 font-bold">Back to Login</button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl w-full mx-auto space-y-12 py-12">
            <div className="text-center space-y-4">
                <h2 className="text-5xl font-black text-slate-900 tracking-tight">One last step...</h2>
                <p className="text-slate-500 text-lg font-medium">Choose how you want to use Virtual Classroom</p>
            </div>

            <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100">
                <form onSubmit={handleSubmit} className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div 
                            onClick={() => setAccountType('STUDENT')}
                            className={`p-8 rounded-[2rem] border-4 cursor-pointer transition-all space-y-4 group ${
                                accountType === 'STUDENT' 
                                ? 'border-cyan-500 bg-cyan-50' 
                                : 'border-slate-50 bg-slate-50 hover:border-slate-200'
                            }`}
                        >
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
                                accountType === 'STUDENT' ? 'bg-cyan-500 text-white' : 'bg-white text-slate-400 group-hover:text-cyan-500'
                            }`}>
                                <Users size={32} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-slate-900">Student</h3>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">Join classrooms, submit assignments, and learn from experts.</p>
                            </div>
                        </div>

                        <div 
                            onClick={() => setAccountType('TUTOR')}
                            className={`p-8 rounded-[2rem] border-4 cursor-pointer transition-all space-y-4 group ${
                                accountType === 'TUTOR' 
                                ? 'border-cyan-500 bg-cyan-50' 
                                : 'border-slate-50 bg-slate-50 hover:border-slate-200'
                            }`}
                        >
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
                                accountType === 'TUTOR' ? 'bg-cyan-500 text-white' : 'bg-white text-slate-400 group-hover:text-cyan-500'
                            }`}>
                                <GraduationCap size={32} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-slate-900">Tutor</h3>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">Create classrooms, share materials, and manage student progress.</p>
                            </div>
                        </div>
                    </div>

                    {accountType === 'TUTOR' && (
                        <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-2 uppercase tracking-wider">
                                <LinkIcon size={16} />
                                Qualification Proof URL
                            </label>
                            <input 
                                type="url" 
                                placeholder="Link to your certificate or portfolio (e.g., LinkedIn, Drive)"
                                value={qualificationUrl}
                                onChange={(e) => setQualificationUrl(e.target.value)}
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-all font-medium"
                                required
                            />
                            <p className="text-xs text-slate-400 ml-2">Administrators will review this link before granting tutor access.</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting || !accountType}
                        className="w-full py-5 bg-slate-900 text-white font-black text-lg rounded-[2rem] hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl"
                    >
                        {isSubmitting ? (
                            <Loader2 className="animate-spin" size={24} />
                        ) : (
                            <>
                                Get Started
                                <ArrowRight size={24} />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CompleteProfile;
