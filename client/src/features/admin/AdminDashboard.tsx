import React, { useEffect, useState, useCallback } from 'react';
import * as adminService from '../../api/adminService';
import { 
    CheckCircle2, 
    XCircle, 
    Clock, 
    ExternalLink, 
    Search, 
    Filter,
    User,
    ShieldCheck,
    Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';

interface TutorApplication {
    id: string;
    fullName: string;
    email: string;
    tutorQualificationUrl: string;
    tutorVerificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'UNVERIFIED';
    tutorStatusUpdatedAt: string;
}

const AdminDashboard: React.FC = () => {
    const [applications, setApplications] = useState<TutorApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('PENDING');
    const [search, setSearch] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchApplications = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminService.getTutorApplications(statusFilter);
            setApplications(data);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch applications');
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    const handleApprove = async (id: string) => {
        setProcessingId(id);
        try {
            await adminService.approveTutor(id);
            toast.success('Tutor approved successfully');
            fetchApplications();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to approve tutor');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: string) => {
        if (!window.confirm('Are you sure you want to reject this application?')) return;
        setProcessingId(id);
        try {
            await adminService.rejectTutor(id);
            toast.success('Tutor application rejected');
            fetchApplications();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to reject tutor');
        } finally {
            setProcessingId(null);
        }
    };

    const filteredApps = applications.filter(app => 
        app.fullName.toLowerCase().includes(search.toLowerCase()) || 
        app.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        Admin Dashboard
                        <ShieldCheck className="text-cyan-600" size={32} />
                    </h1>
                    <p className="text-slate-500 font-medium">Manage tutor verification queue and platform oversight</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {['PENDING', 'VERIFIED', 'REJECTED'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                statusFilter === status 
                                ? 'bg-slate-900 text-white shadow-lg' 
                                : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-4 flex flex-col md:flex-row items-center gap-4 shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search tutors by name or email..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-cyan-500 transition-all font-medium"
                    />
                </div>
                <div className="flex items-center gap-2 px-4 py-3 text-slate-500 font-bold border-l border-slate-100 hidden md:flex">
                    <Filter size={18} />
                    <span>{filteredApps.length} Results</span>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-cyan-600" size={48} />
                </div>
            ) : filteredApps.length === 0 ? (
                <div className="py-20 text-center bg-white border-2 border-dashed border-slate-200 rounded-[3rem] space-y-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                        <User size={40} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">No applications found</h3>
                        <p className="text-slate-500">There are no {statusFilter.toLowerCase()} tutor applications at the moment.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredApps.map((app) => (
                        <div key={app.id} className="bg-white border border-slate-200 rounded-[2rem] p-8 space-y-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all border-l-[6px] border-l-cyan-600">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-slate-900">{app.fullName}</h3>
                                    <p className="text-slate-500 font-bold text-sm tracking-tight">{app.email}</p>
                                </div>
                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    app.tutorVerificationStatus === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                                    app.tutorVerificationStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                    'bg-amber-100 text-amber-700'
                                }`}>
                                    {app.tutorVerificationStatus}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="p-3 bg-white rounded-xl shadow-sm">
                                    <Clock size={20} className="text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Last Updated</p>
                                    <p className="font-bold text-slate-900">{dayjs(app.tutorStatusUpdatedAt).format('MMM D, YYYY · h:mm A')}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <a 
                                    href={app.tutorQualificationUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg"
                                >
                                    <ExternalLink size={18} />
                                    View Qualifications
                                </a>
                                
                                {statusFilter === 'PENDING' && (
                                    <>
                                        <button 
                                            onClick={() => handleApprove(app.id)}
                                            disabled={!!processingId}
                                            className="w-14 h-14 bg-green-500 text-white flex items-center justify-center rounded-2xl hover:bg-green-600 transition-all shadow-lg disabled:opacity-50"
                                            title="Approve"
                                        >
                                            {processingId === app.id ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle2 size={24} />}
                                        </button>
                                        <button 
                                            onClick={() => handleReject(app.id)}
                                            disabled={!!processingId}
                                            className="w-14 h-14 bg-red-500 text-white flex items-center justify-center rounded-2xl hover:bg-red-600 transition-all shadow-lg disabled:opacity-50"
                                            title="Reject"
                                        >
                                            {processingId === app.id ? <Loader2 className="animate-spin" size={24} /> : <XCircle size={24} />}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
