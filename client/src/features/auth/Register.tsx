import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../hooks/store';
import { setCredentials } from '../../features/auth/authSlice';
import * as authService from '../../api/authService';
import { toast } from 'react-hot-toast';
import { Mail, Lock, UserPlus, User, GraduationCap, FileText } from 'lucide-react';
import { GoogleIcon } from '../../components/common/Icons';
import { twMerge } from 'tailwind-merge';
import axios from 'axios';

const Register: React.FC = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [accountType, setAccountType] = useState<'STUDENT' | 'TUTOR'>('STUDENT');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName || !email || !password) {
            return toast.error('Please fill in all fields');
        }

        setIsSubmitting(true);
        const toastId = toast.loading('Creating account...');

        try {
            const data = await authService.register({ 
                fullName, 
                email, 
                password, 
                accountType 
            });
            const { accessToken, user } = data.data;
            
            dispatch(setCredentials({ user, token: accessToken }));
            toast.success('Account created! Welcome aboard.', { id: toastId });
            navigate('/');
        } catch (error: any) {
            if(axios.isAxiosError(error)) {
                if(error.response?.status === 409) {
                    toast.error('Email already in use. Please try logging in.', { id: toastId });
                }
                toast.error(error.response?.data?.message || 'Registration failed. Please try again.', { id: toastId });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
    };

    return (
        <div className="max-w-md w-full mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Get started</h2>
                <p className="mt-2 text-sm text-slate-500">
                    Already have an account?{' '}
                    <Link to="/login" className="font-semibold text-cyan-600 hover:text-cyan-500 transition-colors">
                        Sign in here
                    </Link>
                </p>
            </div>

            <div className="bg-white py-10 px-8 shadow-2xl shadow-slate-200 rounded-3xl border border-slate-100">
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setAccountType('STUDENT')}
                            className={twMerge(
                                "flex flex-col items-center gap-2 p-4 border-2 rounded-2xl transition-all",
                                accountType === 'STUDENT' ? "border-cyan-600 bg-cyan-50 text-cyan-600" : "border-slate-100 text-slate-400 hover:border-slate-200"
                            )}
                        >
                            <User size={24} />
                            <span className="text-xs font-bold uppercase tracking-wider">Student</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setAccountType('TUTOR')}
                            className={twMerge(
                                "flex flex-col items-center gap-2 p-4 border-2 rounded-2xl transition-all",
                                accountType === 'TUTOR' ? "border-indigo-600 bg-indigo-50 text-indigo-600" : "border-slate-100 text-slate-400 hover:border-slate-200"
                            )}
                        >
                            <GraduationCap size={24} />
                            <span className="text-xs font-bold uppercase tracking-wider">Tutor</span>
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="block w-full px-4 py-3 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <Mail size={18} />
                            </div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <Lock size={18} />
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                                placeholder="Min. 8 characters"
                                minLength={8}
                            />
                        </div>
                    </div>
                    
                    {
                        accountType === 'TUTOR' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Qualification Proof</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                        <FileText size={18} />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                                        placeholder="Min. 8 characters"
                                        minLength={8}
                                    />
                                </div>
                            </div>
                        )
                    }

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-cyan-100 text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                Joining...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <UserPlus size={18} />
                                Create Account
                            </span>
                        )}
                    </button>
                </form>

                <div className="mt-8 border-t border-slate-100 pt-8">
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-xl shadow-sm text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-all active:scale-95"
                    >
                        <GoogleIcon size={20} className="mr-2" />
                        <span>Sign up with Google</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Register;
