import { useState, useEffect } from "react";
import { FiMoreVertical, FiTrendingUp as ChartIcon, FiCheck, FiX, FiClock, FiCreditCard, FiMail, FiUser } from "react-icons/fi";
import { MdRemoveModerator } from "react-icons/md";
import { toast } from "sonner";

// Redux, Services & Types
import { useAppSelector } from "@/hooks/redux";
import { memberService } from "@/api/member.service";
import type { Classroom, ClassroomMember } from "@/api/types";

// Shadcn Components
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

import StudentPerformanceDialog from "@/features/classroom/StudentPerformanceDialog";

interface PeopleTabProps {
    classroom: Classroom;
}

const PeopleTab = ({ classroom }: PeopleTabProps) => {
    const { user } = useAppSelector((state) => state.auth);
    
    const [approvedMembers, setApprovedMembers] = useState<ClassroomMember[]>([]);
    const [pendingMembers, setPendingMembers] = useState<ClassroomMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Analytics Modal State
    const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<{ id: string, name: string } | null>(null);

    useEffect(() => {
        const fetchRoster = async () => {
            try {
                setIsLoading(true);
                const approvedRes = await memberService.getClassroomMembers(classroom.id, 'APPROVED');
                if (approvedRes.success) setApprovedMembers(approvedRes.data);

                if (user?.accountType === "TUTOR") {
                    const pendingRes = await memberService.getClassroomMembers(classroom.id, 'PENDING');
                    if (pendingRes.success) setPendingMembers(pendingRes.data);
                }
            } catch (error) {
                toast.error("Failed to load class roster.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchRoster();
    }, [classroom.id, user?.accountType]);

    const handleApproveStudent = async (studentId: string) => {
        try {
            await memberService.approveStudent(classroom.id, studentId);
            const studentToMove = pendingMembers.find(m => m.userId === studentId);
            setPendingMembers(prev => prev.filter(m => m.userId !== studentId));

            if (studentToMove) {
                setApprovedMembers(prev => [...prev, { ...studentToMove, membershipStatus: 'APPROVED' }]);
                toast.success(`${studentToMove.user?.fullName} has been approved.`);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to approve request.");
        }
    };

    const handleRejectStudent = async (studentId: string) => {
        try {
            await memberService.removeMember(classroom.id, studentId);
            setPendingMembers(prev => prev.filter(m => m.userId !== studentId));
            toast.info("Request denied.");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to deny request.");
        }
    };

    const handleUpdatePayment = async (studentId: string) => {
        const durationStr = window.prompt("Enter subscription duration in months (1, 3, 6, 12):", "1");
        if (!durationStr) return; 
        
        const durationInMonths = parseInt(durationStr, 10);
        if (![1, 3, 6, 12].includes(durationInMonths)) {
            toast.error("Invalid duration. Allowed values are 1, 3, 6, or 12.");
            return;
        }

        try {
            const res = await memberService.updateStudentPayment(classroom.id, studentId, durationInMonths);
            toast.success(res.message || "Payment validity updated successfully.");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update payment.");
        }
    };

    // For Tutors to remove other students
    const handleRemoveMember = async (studentId: string) => {
        if (!window.confirm("Are you sure you want to remove this student? They will lose access to all coursework.")) return;

        try {
            await memberService.removeMember(classroom.id, studentId);
            setApprovedMembers(prev => prev.filter(m => m.userId !== studentId));
            toast.success("Student removed successfully.");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to remove student.");
        }
    };

    // For any user (Tutor or Student) to leave the classroom voluntarily
    const handleLeaveClassroom = async (userId: string) => {
        if (!window.confirm("Are you sure you want to leave this classroom? You will lose access to all coursework.")) return;

        try {
            await memberService.removeMember(classroom.id, userId);
            toast.success("Left classroom successfully.");
            window.location.href = "/dashboard";
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to leave classroom.");
        }
    };

    const openPerformanceChart = (studentId: string, studentName: string) => {
        setSelectedStudent({ id: studentId, name: studentName });
        setIsAnalyticsOpen(true);
    };

    const getInitials = (name?: string) => {
        if (!name || !name.trim()) return null;
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0][0].toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const tutors = approvedMembers.filter(m => m.role === "CREATOR" || m.role === "CO_TUTOR");
    const students = approvedMembers.filter(m => m.role === "STUDENT");

    if (isLoading) {
        return <div className="p-10 text-center text-slate-500">Loading roster...</div>;
    }

    return (
        <div className="space-y-12 bg-white p-6 sm:p-10 rounded-lg border border-slate-200 shadow-sm h-full overflow-y-auto">
            
            {/* Pending Requests Section (Tutor Only) */}
            {user?.accountType === "TUTOR" && pendingMembers.length > 0 && (
                <section className="bg-amber-50/50 p-6 rounded-xl border border-amber-200">
                    <div className="flex items-center gap-2 border-b border-amber-200 pb-3 mb-4">
                        <FiClock className="h-5 w-5 text-amber-600" />
                        <h2 className="text-xl font-semibold text-amber-900">Pending Requests</h2>
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 ml-2">
                            {pendingMembers.length}
                        </Badge>
                    </div>
                    
                    <div className="space-y-3">
                        {pendingMembers.map((pending) => (
                            <div key={pending.userId} className="flex items-center justify-between p-3 bg-white border border-amber-100 rounded-lg shadow-sm">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-10 w-10 border border-slate-100">
                                        <AvatarImage src={pending.user?.profilePhotoUrl || undefined} />
                                        <AvatarFallback className="bg-slate-100 text-slate-600 flex items-center justify-center">
                                            {getInitials(pending.user?.fullName) || <FiUser className="h-5 w-5 opacity-50" />}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium text-slate-900">{pending.user?.fullName}</div>
                                        <div className="text-xs text-slate-500">{pending.user?.email}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 h-8" onClick={() => handleRejectStudent(pending.userId)}>
                                        <FiX className="h-4 w-4 mr-1" /> Deny
                                    </Button>
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8 text-white" onClick={() => handleApproveStudent(pending.userId)}>
                                        <FiCheck className="h-4 w-4 mr-1" /> Approve
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Tutors Section */}
            <section>
                <div className="flex items-center justify-between border-b-2 border-primary pb-4 mb-6">
                    <h2 className="text-3xl font-normal text-primary tracking-tight">Tutors</h2>
                </div>
                
                <div className="space-y-2">
                    {tutors.map((tutor) => (
                        <div key={tutor.userId} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-md transition-colors group">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-10 w-10 border border-slate-100">
                                    <AvatarImage src={tutor.user?.profilePhotoUrl || undefined} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-medium flex items-center justify-center">
                                        {getInitials(tutor.user?.fullName) || <FiUser className="h-5 w-5 opacity-50" />}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-slate-800 tracking-wide">
                                        {tutor.user?.fullName} {tutor.userId === user?.id && "(You)"}
                                    </span>
                                    {tutor.role === "CREATOR" && (
                                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 border border-purple-500 rounded-full text-[10px] px-3 h-5 select-none">
                                            CREATOR
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-1">
                                {/* Connect via Email */}
                                {tutor.user?.email && tutor.userId !== user?.id && (
                                    <a 
                                        href={`mailto:${tutor.user.email}`} 
                                        title={`Email ${tutor.user.fullName}`}
                                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    >
                                        <FiMail className="h-4 w-4" />
                                    </a>
                                )}

                                {/* Self Action (Leave Class) for Tutors */}
                                {tutor.userId === user?.id && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <FiMoreVertical className="h-4 w-4 text-slate-500" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuItem className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700" onClick={() => handleLeaveClassroom(tutor.userId)}>
                                                <FiX className="mr-2 h-4 w-4" />
                                                Leave Classroom
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Students Section (Now Visible and Open to Everyone) */}
            <section>
                <div className="flex items-center justify-between border-b-2 border-primary pb-4 mb-6">
                    <h2 className="text-3xl font-normal text-primary tracking-tight">Students</h2>
                    <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                        {students.length} {students.length === 1 ? 'student' : 'students'}
                    </span>
                </div>
                
                <div className="space-y-2">
                    {students.length === 0 ? (
                        <div className="py-8 text-center text-slate-500">
                            No students have joined this class yet.
                        </div>
                    ) : (
                        students.map((student) => (
                            <div key={student.userId} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-md transition-colors group">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-10 w-10 border border-slate-100">
                                        <AvatarImage src={student.user?.profilePhotoUrl || undefined} />
                                        <AvatarFallback className="bg-slate-200 text-slate-700 font-medium flex items-center justify-center">
                                            {getInitials(student.user?.fullName) || <FiUser className="h-5 w-5 opacity-50" />}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium text-slate-800 tracking-wide">
                                        {student.user?.fullName} {student.userId === user?.id && "(You)"}
                                    </span>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                    {/* Mailto Connect Button (Visible if they have an email and are not the current user) */}
                                    {student.user?.email && student.userId !== user?.id && (
                                        <a 
                                            href={`mailto:${student.user.email}`} 
                                            title={`Email ${student.user.fullName}`}
                                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                        >
                                            <FiMail className="h-4 w-4" />
                                        </a>
                                    )}

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <FiMoreVertical className="h-4 w-4 text-slate-500" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            
                                            {/* Available to BOTH Tutors and Students */}
                                            <DropdownMenuItem onClick={() => openPerformanceChart(student.userId, student.user?.fullName || "Student")} className="cursor-pointer font-medium text-indigo-600 focus:bg-indigo-50 focus:text-indigo-700">
                                                <ChartIcon className="mr-2 h-4 w-4" />
                                                View Performance
                                            </DropdownMenuItem>

                                            {/* Tutor Only Actions (Cannot remove themselves using this button) */}
                                            {user?.accountType === "TUTOR" && user.id !== student.userId && (
                                                <>
                                                    <DropdownMenuItem onClick={() => handleUpdatePayment(student.userId)} className="cursor-pointer font-medium text-green-600 focus:bg-green-50 focus:text-green-700">
                                                        <FiCreditCard className="mr-2 h-4 w-4" />
                                                        Update Payment
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700" onClick={() => handleRemoveMember(student.userId)}>
                                                        <MdRemoveModerator className="mr-2 h-4 w-4" />
                                                        Remove from class
                                                    </DropdownMenuItem>
                                                </>
                                            )}

                                            {/* Self Action (Leave Class) for Students */}
                                            {student.userId === user?.id && (
                                                <DropdownMenuItem className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700" onClick={() => handleLeaveClassroom(student.userId)}>
                                                    <FiX className="mr-2 h-4 w-4" />
                                                    Leave Classroom
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
            
            {/* Expanded Analytics Modal */}
            <StudentPerformanceDialog 
                classroomId={classroom.id}
                studentId={selectedStudent?.id || ""}
                studentName={selectedStudent?.name || ""}
                open={isAnalyticsOpen}
                onOpenChange={setIsAnalyticsOpen}
            />
        </div>
    );
};

export default PeopleTab;