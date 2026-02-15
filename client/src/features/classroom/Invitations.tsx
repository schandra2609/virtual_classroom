import React, { useEffect, useState, useCallback } from 'react';
import { 
    Mail, 
    UserCheck, 
    UserX, 
    Clock, 
    Inbox, 
    BookOpen, 
    Check, 
    X, 
    Loader2,
    CheckCircle2
} from 'lucide-react';
import * as invitationService from '../../api/invitationService';
import * as classroomService from '../../api/classroomService';
import * as memberService from '../../api/memberService';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';

interface Invite {
    id: string;
    inviteeEmail: string;
    status: 'PENDING' | 'ACCEPTED' | 'EXPIRED';
    expiresAt: string;
    classroom: { name: string; subject: string; batch: string };
    inviter: { fullName: string };
    createdAt: string;
}

interface JoinRequest {
    userId: string;
    classroomId: string;
    membershipStatus: 'PENDING' | 'APPROVED';
    joinedAt: string;
    role: string;
    user: { id: string; fullName: string; email: string };
    classroomName?: string;
}

const Invitations: React.FC = () => {
    const [invites, setInvites] = useState<Invite[]>([]);
    const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch co-tutor invitations
            const invitesData = await invitationService.getMyInvitations();
            setInvites(invitesData);

            // Fetch join requests for each classroom the user owns/manages
            const classrooms = await classroomService.getMyClassrooms();

            const allRequests: JoinRequest[] = [];
            for (const cls of classrooms) {
                try {
                    const membersData = await memberService.getClassroomMembers(cls.id, 'PENDING');
                    const requestsWithClass = membersData.map((r: JoinRequest) => ({
                        ...r,
                        classroomName: cls.name
                    }));
                    allRequests.push(...requestsWithClass);
                } catch (e) {
                    console.error(`Failed to fetch requests for classroom ${cls.id}`);
                }
            }
            setJoinRequests(allRequests);
        } catch (error: any) {
            toast.error('Failed to fetch requests');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAcceptInvite = async (id: string) => {
        setIsProcessing(id);
        try {
            await invitationService.acceptInvite(id);
            toast.success('Invitation accepted!');
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to accept invitation');
        } finally {
            setIsProcessing(null);
        }
    };

    const handleApproveStudent = async (classroomId: string, studentId: string) => {
        const procId = `${classroomId}-${studentId}`;
        setIsProcessing(procId);
        try {
            await memberService.approveStudent(classroomId, studentId);
            toast.success('Student approved!');
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to approve student');
        } finally {
            setIsProcessing(null);
        }
    };

    const handleRejectStudent = async (classroomId: string, studentId: string) => {
        const procId = `${classroomId}-${studentId}`;
        setIsProcessing(procId);
        try {
            await memberService.removeMember(classroomId, studentId);
            toast.success('Request rejected');
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to reject request');
        } finally {
            setIsProcessing(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
                <p className="text-slate-500 font-bold animate-pulse uppercase tracking-[0.2em] text-xs">Loading requests...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-20">
            <div className="space-y-2">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Management Hub</h1>
                <p className="text-slate-500 font-medium">Handle co-tutor invitations and student join requests.</p>
            </div>

            {/* Co-Tutor Invitations Received */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Mail size={22} />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Received Invitations</h2>
                </div>

                {invites.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-slate-100 rounded-[2.5rem] p-12 text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                            <Inbox size={32} />
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No pending invitations</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {invites.map((invite) => (
                            <div key={invite.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 space-y-6 hover:shadow-xl hover:shadow-slate-100 transition-all group">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                                            <BookOpen size={24} />
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-black text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full uppercase tracking-widest">
                                            <Clock size={12} />
                                            Expires {dayjs(invite.expiresAt).fromNow()}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black text-slate-900 line-clamp-1">{invite.classroom.name}</h3>
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{invite.classroom.subject}</p>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs">
                                            {invite.inviter.fullName[0]}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Invited by</p>
                                            <p className="text-sm font-bold text-slate-700">{invite.inviter.fullName}</p>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleAcceptInvite(invite.id)}
                                    disabled={isProcessing === invite.id}
                                    className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isProcessing === invite.id ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                                    Accept Co-Tutor Role
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Student Join Requests */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-50 flex items-center justify-center text-cyan-600">
                        <UserCheck size={22} />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Student Join Requests</h2>
                </div>

                {joinRequests.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-slate-100 rounded-[2.5rem] p-12 text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                            <UserX size={32} />
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No pending join requests</p>
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Student</th>
                                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Classroom</th>
                                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Request Date</th>
                                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {joinRequests.map((req) => {
                                        const procId = `${req.classroomId}-${req.userId}`;
                                        return (
                                            <tr key={procId} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-700 font-black">
                                                            {req.user.fullName[0]}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-900">{req.user.fullName}</p>
                                                            <p className="text-xs font-bold text-slate-400">{req.user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2 text-slate-600 font-bold">
                                                        <BookOpen size={16} className="text-slate-400" />
                                                        {req.classroomName}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-sm font-bold text-slate-500">
                                                    {dayjs(req.joinedAt).format('MMM D, YYYY')}
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button 
                                                            onClick={() => handleRejectStudent(req.classroomId, req.userId)}
                                                            disabled={isProcessing === procId}
                                                            className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90 disabled:opacity-50"
                                                            title="Reject Request"
                                                        >
                                                            <X size={20} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleApproveStudent(req.classroomId, req.userId)}
                                                            disabled={isProcessing === procId}
                                                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all active:scale-95 disabled:opacity-50"
                                                        >
                                                            {isProcessing === procId ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                                            Approve
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Invitations;
