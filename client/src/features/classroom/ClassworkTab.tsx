import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiFileText, FiMonitor, FiMoreVertical, FiEdit2, FiTrash2, FiCheckCircle, FiClock, FiXCircle, FiTrendingUp } from "react-icons/fi";
import { toast } from "sonner";

// Redux, Services & Types
import { useAppSelector } from "@/hooks/redux";
import { assignmentService } from "@/api/assignment.service";
import { qpaperService } from "@/api/qpaper.service";
import { memberService } from "@/api/member.service";
import type { ClassworkTabProps, UnifiedClasswork, ClassroomMember } from "@/api/types";

// Shadcn Components
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

// Modals
import CreateCourseworkDialog from "@/features/classroom/CreateCourseworkDialog";
import CourseworkDetailsDialog from "@/features/classroom/CourseworkDetailsDialog";
import AttemptPerformanceDialog from "@/features/classroom/AttemptPerformanceDialog";

const ClassworkTab = ({ classroom }: ClassworkTabProps) => {
    const { user } = useAppSelector((state) => state.auth);
    const navigate = useNavigate();
    
    const [coursework, setCoursework] = useState<UnifiedClasswork[]>([]);
    const [totalStudents, setTotalStudents] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    
    // Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedWork, setSelectedWork] = useState<UnifiedClasswork | null>(null);
    const [workToEdit, setWorkToEdit] = useState<UnifiedClasswork | null>(null);
    
    // Attempt Performance Modal States
    const [isAttemptChartOpen, setIsAttemptChartOpen] = useState(false);
    const [selectedExamId, setSelectedExamId] = useState("");
    const [selectedExamTitle, setSelectedExamTitle] = useState("");
    
    const fetchUnifiedClasswork = useCallback(async () => {
        try {
            const [assignRes, qpRes, rosterRes] = await Promise.all([
                assignmentService.getClassroomAssignments(classroom.id),
                qpaperService.getAllQuestionPapers(classroom.id),
                memberService.getClassroomMembers(classroom.id, 'APPROVED').catch(() => ({ success: false, data: [] }))
            ]);

            if (rosterRes.success) {
                const students = rosterRes.data.filter((m: ClassroomMember) => m.role === "STUDENT");
                setTotalStudents(students.length);
            }

            let unifiedFeed: UnifiedClasswork[] = [];

            if (assignRes.success) {
                const mappedAssignments = assignRes.data.map(a => ({
                    id: a.id,
                    title: a.title,
                    description: a.instruction,
                    type: "ASSIGNMENT" as const,
                    targetDate: new Date(a.deadline),
                    creatorId: a.authorId,
                    rawPayload: a
                }));
                unifiedFeed = [...unifiedFeed, ...mappedAssignments];
            }

            if (qpRes.success) {
                const mappedExams = qpRes.data.map(qp => ({
                    id: qp.id,
                    title: qp.title,
                    description: `Duration: ${qp.duration} minutes`,
                    type: "CBT_EXAM" as const,
                    targetDate: new Date(qp.liveAt),
                    status: qp.status,
                    creatorId: qp.creatorId,
                    rawPayload: qp
                }));
                unifiedFeed = [...unifiedFeed, ...mappedExams];
            }

            unifiedFeed.sort((a, b) => b.targetDate.getTime() - a.targetDate.getTime());
            setCoursework(unifiedFeed);

        } catch (error) {
            toast.error("Failed to load classwork");
        } finally {
            setIsLoading(false);
        }
    }, [classroom.id]);

    useEffect(() => {
        fetchUnifiedClasswork();
    }, [fetchUnifiedClasswork]);

    const handleDelete = async (work: UnifiedClasswork) => {
        try {
            if (work.type === "ASSIGNMENT") {
                await assignmentService.deleteAssignment(classroom.id, work.id);
            } else {
                await qpaperService.deleteQuestionPaper(classroom.id, work.id);
            }
            setCoursework(coursework.filter(w => w.id !== work.id));
            toast.success("Deleted successfully");
        } catch (error) {
            toast.error("Failed to delete item");
        }
    };

    const handleCancelExam = async (work: UnifiedClasswork) => {
        try {
            await qpaperService.changePaperStatus(classroom.id, work.id, "CANCELLED");
            setCoursework(coursework.filter(w => w.id !== work.id));
            toast.success("Exam cancelled and deleted successfully");
        } catch (error) {
            toast.error("Failed to cancel exam");
        }
    };

    const handleCardClick = (work: UnifiedClasswork) => {
        setSelectedWork(work);
        setIsDetailsOpen(true);
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Coursework</h2>
                    <p className="text-sm text-slate-500">Track and manage your {classroom.subject} materials.</p>
                </div>
                
                {user?.accountType === "TUTOR" && (
                    <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 w-full sm:w-auto">
                        <FiPlus className="h-4 w-4" />
                        Create
                    </Button>
                )}
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-8 text-slate-500">Loading coursework...</div>
                ) : coursework.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
                        <FiFileText className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                        <p>No classwork assigned yet.</p>
                    </div>
                ) : (
                    coursework.map((work) => {
                        const canManage = user?.accountType === "TUTOR" && 
                            (work.creatorId === user?.id || classroom.creatorId === user?.id);

                        const mySubmission = work.rawPayload?.mySubmission || work.rawPayload?.submissions?.[0];
                        const submissionCount = work.rawPayload?._count?.submissions || 0;
                        
                        // Temporal Logic specific to exams
                        const now = new Date();
                        const isBeforeStart = now < work.targetDate;
                        let isBeforeEnd = true;
                        let isNotCancelled = true;

                        if (work.type === "CBT_EXAM") {
                            const paperPayload = work.rawPayload as import('@/api/types').QuestionPaper;
                            const durationMinutes = paperPayload.duration || 0;
                            const endTime = new Date(work.targetDate.getTime() + (durationMinutes * 60000));
                            isBeforeEnd = now < endTime;
                            isNotCancelled = work.status !== "CANCELLED";
                        }

                        const isExpired = work.type === "ASSIGNMENT" && now > work.targetDate;

                        return (
                            <Card 
                                key={work.id} 
                                onClick={() => handleCardClick(work)}
                                className={`bg-white border-slate-200 group relative hover:shadow-md cursor-pointer transition-shadow ${!isNotCancelled ? 'opacity-70 grayscale-[0.5]' : ''}`}
                            >
                                <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`mt-1 h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${work.type === 'CBT_EXAM' ? 'bg-indigo-100 text-indigo-600' : 'bg-primary/10 text-primary'}`}>
                                            {work.type === "CBT_EXAM" ? <FiMonitor className="h-5 w-5" /> : <FiFileText className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg group-hover:text-primary transition-colors">
                                                {work.title}
                                            </CardTitle>
                                            
                                            {work.type === "ASSIGNMENT" && work.rawPayload?.author?.fullName && (
                                                <p className="text-[13px] text-slate-400 font-light mt-0.5">
                                                    Posted by: {work.rawPayload.author.fullName}
                                                </p>
                                            )}

                                            <CardDescription className="mt-1 line-clamp-2">
                                                {work.description}
                                            </CardDescription>
                                            <div className="flex items-center gap-4 mt-2 text-xs font-medium text-slate-500">
                                                <span className={work.type === "CBT_EXAM" ? "text-indigo-600 font-semibold" : ""}>
                                                    {work.type === "CBT_EXAM" ? "Live At: " : "Due: "}{formatDate(work.targetDate)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 shrink-0 mt-2 sm:mt-0">
                                        
                                        {work.type === "CBT_EXAM" && !isNotCancelled && (
                                            <Badge variant="destructive" className="bg-slate-100 text-slate-600 border-none flex items-center gap-1">
                                                <FiXCircle className="h-3 w-3" /> Cancelled
                                            </Badge>
                                        )}

                                        {user?.accountType === "STUDENT" && work.type === "ASSIGNMENT" && (
                                            mySubmission ? (
                                                (mySubmission.marksObtained !== null && mySubmission.marksObtained !== undefined) ? (
                                                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none">
                                                        Graded ({mySubmission.marksObtained}/{work.rawPayload?.maxScore || 100})
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 border-none flex items-center gap-1">
                                                        <FiCheckCircle className="h-3 w-3" /> Submitted
                                                    </Badge>
                                                )
                                            ) : isExpired ? (
                                                <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100 border-none flex items-center gap-1">
                                                    <FiClock className="h-3 w-3" /> Expired
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-none flex items-center gap-1">
                                                    <FiClock className="h-3 w-3" /> Pending
                                                </Badge>
                                            )
                                        )}

                                        {canManage && work.type === "ASSIGNMENT" && (
                                            <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                                                {submissionCount} / {totalStudents} Submitted
                                            </Badge>
                                        )}

                                        {/* Tutor OR Student Controls */}
                                        {(canManage || (user?.accountType === "STUDENT" && work.type === "CBT_EXAM")) && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700">
                                                        <FiMoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    
                                                    {/* Student: View Performance */}
                                                    {user?.accountType === "STUDENT" && work.type === "CBT_EXAM" && (
                                                        <>
                                                            <DropdownMenuItem 
                                                                onClick={(e) => { 
                                                                    e.stopPropagation(); 
                                                                    setSelectedExamId(work.id); 
                                                                    setSelectedExamTitle(work.title);
                                                                    setIsAttemptChartOpen(true); 
                                                                }} 
                                                                className="cursor-pointer text-indigo-600"
                                                            >
                                                                <FiTrendingUp className="mr-2 h-4 w-4" /> View Performance
                                                            </DropdownMenuItem>

                                                            <DropdownMenuItem 
                                                                onClick={(e) => { 
                                                                    e.stopPropagation(); 
                                                                    navigate(`/dashboard/classrooms/${classroom.id}/papers/${work.id}/attempts`);
                                                                }} 
                                                                className="cursor-pointer font-medium text-slate-700"
                                                            >
                                                                <FiFileText className="mr-2 h-4 w-4" /> View Test Attempts
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}

                                                    {/* Tutor Controls */}
                                                    {canManage && (
                                                        <>
                                                            {(work.type === "ASSIGNMENT" || (work.type === "CBT_EXAM" && isBeforeStart)) && (
                                                                <DropdownMenuItem
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setWorkToEdit(work);
                                                                        setIsCreateModalOpen(true);
                                                                    }}
                                                                    className="cursor-pointer"
                                                                >
                                                                    <FiEdit2 className="mr-2 h-4 w-4" /> Edit
                                                                </DropdownMenuItem>
                                                            )}

                                                            {(work.type === "CBT_EXAM" && isBeforeEnd && isNotCancelled) && (
                                                                <DropdownMenuItem 
                                                                    onClick={(e) => { e.stopPropagation(); handleCancelExam(work); }} 
                                                                    className="cursor-pointer text-amber-600"
                                                                >
                                                                    <FiXCircle className="mr-2 h-4 w-4" /> Cancel Exam
                                                                </DropdownMenuItem>
                                                            )}

                                                            {(work.type === "ASSIGNMENT" || (work.type === "CBT_EXAM" && isBeforeStart)) && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem 
                                                                        onClick={(e) => { e.stopPropagation(); handleDelete(work); }} 
                                                                        className="cursor-pointer text-red-600"
                                                                    >
                                                                        <FiTrash2 className="mr-2 h-4 w-4" /> Delete
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>
                                </CardHeader>
                            </Card>
                        );
                    })
                )}
            </div>

            <CreateCourseworkDialog
                open={isCreateModalOpen}
                onOpenChange={(open) => {
                    setIsCreateModalOpen(open);
                    if (!open) setTimeout(() => setWorkToEdit(null), 200);
                }}
                onSuccess={fetchUnifiedClasswork}
                editData={workToEdit}
            />
            
            <CourseworkDetailsDialog
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                work={selectedWork}
                classroomId={classroom.id}
                onSuccess={fetchUnifiedClasswork}
            />

            <AttemptPerformanceDialog 
                classroomId={classroom.id}
                paperId={selectedExamId}
                paperTitle={selectedExamTitle}
                studentName={user?.fullName || "Student"}
                open={isAttemptChartOpen}
                onOpenChange={setIsAttemptChartOpen}
            />
        </div>
    );
};

export default ClassworkTab;