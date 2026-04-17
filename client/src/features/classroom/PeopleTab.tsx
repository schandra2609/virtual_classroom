import { useState, useEffect } from "react";
import { FiMoreVertical, FiTrendingUp as ChartIcon, FiCheck, FiX, FiClock, FiCreditCard } from "react-icons/fi";
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

import StudentPerformanceDialog from "@/features/classroom/StudentPerformanceDialogue";

interface PeopleTabProps {
    classroom: Classroom;
}

const PeopleTab = ({ classroom }: PeopleTabProps) => {
    const { user } = useAppSelector((state) => state.auth);
    
    const [approvedMembers, setApprovedMembers] = useState<ClassroomMember[]>([]);
    const [pendingMembers, setPendingMembers] = useState<ClassroomMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Analytics Modal State
    const [isChartOpen, setIsChartOpen] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

    // Fetch roster logic
    useEffect(() => {
        const fetchRoster = async () => {
            try {
                setIsLoading(true);
                // Fetch approved members for everyone
                const approvedRes = await memberService.getClassroomMembers(classroom.id, 'APPROVED');
                if (approvedRes.success) setApprovedMembers(approvedRes.data);

                // If the user is a Tutor, also fetch the pending requests queue
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

    // 🚨 Fixed: Specific Approval Handler
    const handleApproveStudent = async (studentId: string) => {
        try {
            await memberService.approveStudent(classroom.id, studentId);
            
            // Find and move the student in the UI
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

    // 🚨 Fixed: Specific Rejection Handler
    const handleRejectStudent = async (studentId: string) => {
        try {
            await memberService.removeMember(classroom.id, studentId);
            setPendingMembers(prev => prev.filter(m => m.userId !== studentId));
            toast.info("Request denied.");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to deny request.");
        }
    };

    // 🚨 New: Specific Payment Update Handler
    const handleUpdatePayment = async (studentId: string) => {
        const durationStr = window.prompt("Enter subscription duration in months (1, 3, 6, 12):", "1");
        if (!durationStr) return; // User cancelled
        
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

    const handleRemoveStudent = async (studentId: string) => {
        if (!window.confirm("Are you sure you want to remove this student? They will lose access to all coursework.")) return;

        try {
            await memberService.removeMember(classroom.id, studentId);
            setApprovedMembers(prev => prev.filter(m => m.userId !== studentId));
            toast.success("Student removed successfully.");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to remove student.");
        }
    };

    const openPerformanceChart = (studentId: string) => {
        setSelectedStudentId(studentId);
        setIsChartOpen(true);
    };

    // Filter based on the role stored in the membership bridge table
    const tutors = approvedMembers.filter(m => m.role === "CREATOR" || m.role === "CO_TUTOR");
    const students = approvedMembers.filter(m => m.role === "STUDENT");

    const getInitials = (name?: string) => {
        if (!name) return "U";
        return name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
    };

    if (isLoading) {
        return <div className="p-10 text-center text-slate-500">Loading roster...</div>;
    }

    return (
        <div className="space-y-12 bg-white p-6 sm:p-10 rounded-lg border border-slate-200 shadow-sm">
            
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
                                        <AvatarImage src={pending.user?.profilePhotoUrl || ""} />
                                        <AvatarFallback className="bg-slate-100 text-slate-600">
                                            {getInitials(pending.user?.fullName)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium text-slate-900">{pending.user?.fullName}</div>
                                        <div className="text-xs text-slate-500">{pending.user?.email}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 h-8"
                                        onClick={() => handleRejectStudent(pending.userId)}
                                    >
                                        <FiX className="h-4 w-4 mr-1" /> Deny
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        className="bg-green-600 hover:bg-green-700 h-8"
                                        onClick={() => handleApproveStudent(pending.userId)}
                                    >
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
                        <div key={tutor.userId} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-md transition-colors">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={tutor.user?.profilePhotoUrl || ""} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                        {getInitials(tutor.user?.fullName)}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-slate-800 tracking-wide">{tutor.user?.fullName}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Students Section */}
            <section>
                <div className="flex items-center justify-between border-b-2 border-primary pb-4 mb-6">
                    <h2 className="text-3xl font-normal text-primary tracking-tight">Students</h2>
                    <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                        {students.length} students
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
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={student.user?.profilePhotoUrl || ""} />
                                        <AvatarFallback className="bg-slate-200 text-slate-700 font-medium">
                                            {getInitials(student.user?.fullName)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium text-slate-800 tracking-wide">{student.user?.fullName}</span>
                                </div>
                                
                                {/* Management Dropdown (Only visible to Tutors) */}
                                {user?.accountType === "TUTOR" && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <FiMoreVertical className="h-4 w-4 text-slate-500" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuItem onClick={() => openPerformanceChart(student.userId)} className="cursor-pointer font-medium text-indigo-600">
                                                <ChartIcon className="mr-2 h-4 w-4" />
                                                View Performance
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleUpdatePayment(student.userId)} className="cursor-pointer font-medium text-green-600">
                                                <FiCreditCard className="mr-2 h-4 w-4" />
                                                Update Payment
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="cursor-pointer text-red-600" onClick={() => handleRemoveStudent(student.userId)}>
                                                <MdRemoveModerator className="mr-2 h-4 w-4" />
                                                Remove from class
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </section>
            
            <StudentPerformanceDialog 
                classroomId={classroom.id}
                studentId={selectedStudentId}
                open={isChartOpen}
                onOpenChange={setIsChartOpen}
            />
        </div>
    );
};

export default PeopleTab;