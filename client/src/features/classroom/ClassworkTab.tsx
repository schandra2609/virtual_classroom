import { useState, useEffect } from "react";
import { FiPlus, FiFileText, FiMonitor, FiMoreVertical, FiEdit2, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";

// Redux, Services & Types
import { useAppSelector } from "@/hooks/redux";
import { assignmentService } from "@/api/assignment.service";
import { qpaperService } from "@/api/qpaper.service";
import type { ClassworkTabProps, UnifiedClasswork } from "@/api/types";

// Shadcn Components
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Modals
import CreateCourseworkDialog from "@/features/classroom/CreateCourseworkDialogue";
import CourseworkDetailsDialog from "@/features/classroom/CourseworkDetailsDialogue";

const ClassworkTab = ({ classroom }: ClassworkTabProps) => {
    const { user } = useAppSelector((state) => state.auth);
    
    const [coursework, setCoursework] = useState<UnifiedClasswork[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedWork, setSelectedWork] = useState<UnifiedClasswork | null>(null);

    useEffect(() => {
        const fetchUnifiedClasswork = async () => {
            try {
                const [assignRes, qpRes] = await Promise.all([
                    assignmentService.getClassroomAssignments(classroom.id),
                    qpaperService.getAllQuestionPapers(classroom.id)
                ]);

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
        };

        fetchUnifiedClasswork();
    }, [classroom.id]);

    const handleCourseworkCreated = () => {
        window.location.reload(); 
    };

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

    // Click handler to open the student details dialog
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

                        return (
                            <Card 
                                key={work.id} 
                                onClick={() => handleCardClick(work)}
                                className="bg-white border-slate-200 group relative hover:shadow-md cursor-pointer transition-shadow"
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
                                    
                                    <div className="flex items-center gap-3 shrink-0">
                                        {/* Tutor Controls */}
                                        {canManage && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700">
                                                        <FiMoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsCreateModalOpen(true); }} className="cursor-pointer">
                                                        <FiEdit2 className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(work); }} className="cursor-pointer text-red-600">
                                                        <FiTrash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
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
                onOpenChange={setIsCreateModalOpen} 
                onSuccess={handleCourseworkCreated} 
            />
            
            <CourseworkDetailsDialog 
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                work={selectedWork}
                classroomId={classroom.id}
            />
        </div>
    );
};

export default ClassworkTab;