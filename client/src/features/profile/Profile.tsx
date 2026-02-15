import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks/store';
import { 
    User as UserIcon, 
    Mail, 
    Shield, 
    Calendar, 
    Upload, 
    CheckCircle2, 
    AlertCircle, 
    Clock, 
    XCircle,
    FileText,
    Camera
} from 'lucide-react';
import * as userService from '../../api/userService';
import { toast } from 'react-hot-toast';
import { checkProfile } from '../auth/authSlice';
import dayjs from 'dayjs';

const Profile: React.FC = () => {
    const { user } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    if (!user) return null;

    const handleQualificationUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (file.size > 5 * 1024 * 1024) return toast.error('File size must be less than 5MB');
        
        const formData = new FormData();
        formData.append('document', file);

        setIsUploading(true);
        try {
            await userService.uploadQualifications(formData, (percent) => {
                setUploadProgress(percent);
            });
            toast.success('Qualifications uploaded successfully and are now under review.');
            dispatch(checkProfile());
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Upload failed');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const StatusBadge = () => {
        if (user.accountType !== 'TUTOR') return null;

        const statusConfig = {
            UNVERIFIED: { icon: Clock, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', text: 'Unverified' },
            PENDING: { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', text: 'Pending Review' },
            VERIFIED: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'Verified' },
            REJECTED: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', text: 'Rejected' },
        };

        const config = statusConfig[user.tutorVerificationStatus || 'UNVERIFIED'];
        const Icon = config.icon;

        return (
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border ${config.bg} ${config.border} ${config.color} text-sm font-bold`}>
                <Icon size={18} />
                {config.text}
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Profile Header */}
            <div className="relative group">
                <div className="h-48 bg-gradient-to-r from-cyan-600 to-indigo-600 rounded-[2.5rem] shadow-xl shadow-cyan-100"></div>
                <div className="absolute -bottom-12 left-12 flex items-end gap-6">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-[2.5rem] bg-white p-1.5 shadow-xl">
                            <div className="w-full h-full rounded-[2rem] bg-slate-100 flex items-center justify-center overflow-hidden border-4 border-white">
                                {user.profilePhotoUrl ? (
                                    <img src={user.profilePhotoUrl} alt={user.fullName} className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon size={48} className="text-slate-300" />
                                )}
                            </div>
                        </div>
                        <button className="absolute bottom-1 right-1 p-2.5 bg-slate-900 text-white rounded-2xl shadow-lg hover:scale-110 transition-transform active:scale-95">
                            <Camera size={18} />
                        </button>
                    </div>
                    <div className="pb-4 space-y-1">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{user.fullName}</h1>
                        <div className="flex items-center gap-2 text-slate-500 font-bold text-sm uppercase tracking-wider">
                            <Shield size={16} className="text-cyan-600" />
                            {user.accountType}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-12">
                {/* Basic Info */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 space-y-8">
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                <FileText size={18} />
                            </div>
                            Account Details
                        </h2>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 font-bold group hover:border-cyan-200 transition-colors">
                                    <Mail size={20} className="text-slate-400 group-hover:text-cyan-600" />
                                    {user.email}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Verification Status</label>
                                <div className="block pt-1">
                                    <StatusBadge />
                                </div>
                            </div>
                        </div>
                    </div>

                    {user.accountType === 'TUTOR' && user.tutorVerificationStatus !== 'VERIFIED' && (
                        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-600/20 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:bg-cyan-600/30 transition-colors"></div>
                            
                            <div className="relative z-10 space-y-6">
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black tracking-tight">Verify Your Account</h3>
                                    <p className="text-slate-400 font-medium leading-relaxed">
                                        To start creating classrooms and inviting students, we need to verify your teaching qualifications. 
                                        Please upload a valid certificate or ID.
                                    </p>
                                </div>

                                {isUploading ? (
                                    <div className="space-y-3">
                                        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                                            <div 
                                                className="bg-cyan-500 h-full transition-all duration-300"
                                                style={{ width: `${uploadProgress}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-sm font-bold text-cyan-400 animate-pulse">Uploading documents... {uploadProgress}%</p>
                                    </div>
                                ) : (
                                    <label className="inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-900 font-black rounded-2xl hover:bg-slate-100 transition-all cursor-pointer active:scale-95">
                                        <Upload size={20} />
                                        Upload Qualification Document
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            accept=".pdf,image/*" 
                                            onChange={handleQualificationUpload}
                                        />
                                    </label>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-8">
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 space-y-6">
                        <h3 className="text-lg font-black text-slate-900">Activity Summary</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <Calendar size={18} className="text-slate-400" />
                                    <span className="text-sm font-bold text-slate-600">Joined</span>
                                </div>
                                <span className="text-sm font-black text-slate-900 tracking-tight">Today</span>
                            </div>
                            {user.tutorStatusUpdatedAt && (
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <Clock size={18} className="text-slate-400" />
                                        <span className="text-sm font-bold text-slate-600">Status Update</span>
                                    </div>
                                    <span className="text-sm font-black text-slate-900 tracking-tight">
                                        {dayjs(user.tutorStatusUpdatedAt).format('MMM D, YYYY')}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[2.5rem] space-y-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                            <Shield size={24} />
                        </div>
                        <h4 className="font-black text-indigo-900">Privacy Policy</h4>
                        <p className="text-sm text-indigo-700/70 font-medium leading-relaxed">
                            Your qualification documents are strictly encrypted and visible only to verified administrators.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
