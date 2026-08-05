import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiFileText, FiCheckCircle, FiClock, FiExternalLink, FiSave, FiXCircle } from "react-icons/fi";
import { toast } from "sonner";
import { format } from "date-fns";

// Services & Types
import { assignmentService } from "@/api/assignment.service";
import { memberService } from "@/api/member.service";
import type { Assignment, ClassroomMember, UnifiedStudentRow } from "@/api/types";

// Shadcn Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";


const GradingDashboard = () => {
    const { classroomId, assignmentId } = useParams<{ classroomId: string, assignmentId: string }>();
    const navigate = useNavigate();

    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [roster, setRoster] = useState<UnifiedStudentRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState<string | null>(null);

    // Local state to manage grade inputs before saving
    const [grades, setGrades] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchGradingData = async () => {
            if (!classroomId || !assignmentId) return;

            try {
                // Fetch assignment details, submissions, AND the approved class roster concurrently
                const [assignRes, subRes, rosterRes] = await Promise.all([
                    assignmentService.getClassroomAssignments(classroomId),
                    assignmentService.getAssignmentSubmissions(classroomId, assignmentId),
                    memberService.getClassroomMembers(classroomId, 'APPROVED')
                ]);

                if (assignRes.success) {
                    const found = assignRes.data.find((a: Assignment) => a.id === assignmentId);
                    if (found) setAssignment(found);
                }

                if (rosterRes.success && subRes.success) {
                    // 1. Filter out tutors, we only want to grade students
                    const students = rosterRes.data.filter((m: ClassroomMember) => m.role === "STUDENT");
                    const liveSubmissions = subRes.data || [];

                    // 2. Cross-reference students with submissions to find who is missing
                    const unifiedRoster: UnifiedStudentRow[] = students.map((member: ClassroomMember) => {
                        const submission = liveSubmissions.find((s: any) => s.studentId === member.userId);
                        
                        return {
                            rowId: submission ? submission.id : `missing-${member.userId}`,
                            studentId: member.userId,
                            studentName: member.user?.fullName || "Unknown Student",
                            studentEmail: member.user?.email || "No Email",
                            isMissing: !submission,
                            submissionId: submission ? submission.id : null,
                            documentUrl: submission?.attachments?.[0]?.url || null,
                            documentName: submission?.attachments?.[0]?.fileName || null,
                            submittedAt: submission ? new Date(submission.submittedAt) : null,
                            marksObtained: submission?.marksObtained ?? null,
                        };
                    });

                    setRoster(unifiedRoster);
                    
                    // 3. Initialize local grades state
                    const initialGrades: Record<string, string> = {};
                    unifiedRoster.forEach(row => {
                        if (!row.isMissing) {
                            initialGrades[row.submissionId!] = row.marksObtained !== null ? row.marksObtained.toString() : "";
                        }
                    });
                    setGrades(initialGrades);
                }

            } catch (error) {
                toast.error("Failed to load grading data. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchGradingData();
    }, [classroomId, assignmentId]);

    const handleGradeChange = (submissionId: string, value: string) => {
        setGrades(prev => ({ ...prev, [submissionId]: value }));
    };

    const handleSaveGrade = async (submissionId: string | null) => {
        if (!classroomId || !assignmentId || !submissionId) {
            return toast.error("Cannot grade a missing submission.");
        }
        
        const score = Number(grades[submissionId]);
        if (isNaN(score) || score < 0 || (assignment?.maxScore && score > assignment.maxScore)) {
            return toast.error(`Invalid score. Must be between 0 and ${assignment?.maxScore || 100}`);
        }

        try {
            setIsSaving(submissionId);
            await assignmentService.gradeSubmission(classroomId, assignmentId, submissionId, score);
            
            setRoster(prev => prev.map(row => 
                row.submissionId === submissionId ? { ...row, marksObtained: score } : row
            ));
            toast.success("Grade saved successfully");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to save grade");
        } finally {
            setIsSaving(null);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6 max-w-5xl mx-auto py-8">
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
        );
    }

    if (!assignment) {
        return <div className="text-center py-24 text-slate-500 font-medium">Assignment not found.</div>;
    }

    const gradedCount = roster.filter(r => r.marksObtained !== null).length;
    const submittedCount = roster.filter(r => !r.isMissing).length;

    return (
        <div className="max-w-5xl mx-auto py-8 space-y-6">
            {/* Header Area */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <Button variant="ghost" className="-ml-4 mb-4 text-slate-500" onClick={() => navigate(`/dashboard/classrooms/${classroomId}`)}>
                    <FiArrowLeft className="h-4 w-4 mr-2" /> Back to Classwork
                </Button>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{assignment.title}</h1>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                            <span className="flex items-center gap-1"><FiClock className="h-4 w-4" /> Due: {format(new Date(assignment.deadline), "PPP")}</span>
                            <span>&bull;</span>
                            <span className="font-medium text-slate-700">Max Score: {assignment.maxScore || 100}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 self-start md:self-auto">
                        <Badge variant="outline" className="bg-slate-50 text-slate-600">
                            {submittedCount} / {roster.length} Submitted
                        </Badge>
                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50">
                            {gradedCount} / {submittedCount} Graded
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Submissions Data Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="w-[200px] text-center font-bold uppercase tracking-wide">Student</TableHead>
                                <TableHead className="text-center font-bold uppercase tracking-wide">Status</TableHead>
                                <TableHead className="text-center font-bold uppercase tracking-wide">Document</TableHead>
                                <TableHead className="w-[150px] text-center font-bold uppercase tracking-wide">Score</TableHead>
                                <TableHead className="w-[100px] text-center font-bold uppercase tracking-wide">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {roster.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center text-slate-500">
                                        No students are currently enrolled in this class.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                roster.map((row) => (
                                    <TableRow key={row.rowId} className="hover:bg-slate-50/50">
                                        <TableCell>
                                            <div className="font-medium text-slate-900">{row.studentName}</div>
                                            <div className="text-xs text-slate-500">{row.studentEmail}</div>
                                        </TableCell>
                                        <TableCell>
                                            {row.isMissing ? (
                                                <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100 border-none">
                                                    <FiXCircle className="mr-1 h-3 w-3" /> Missing
                                                </Badge>
                                            ) : row.marksObtained !== null ? (
                                                <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 border-none">
                                                    <FiCheckCircle className="mr-1 h-3 w-3" /> Graded
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none">
                                                    <FiClock className="mr-1 h-3 w-3" /> Needs Review
                                                </Badge>
                                            )}
                                            {!row.isMissing && row.submittedAt && (
                                                <div className="text-xs text-slate-400 mt-1">
                                                    {format(row.submittedAt, "MMM d, h:mm a")}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {row.isMissing || !row.documentUrl ? (
                                                <span className="text-sm text-slate-400 italic">--</span>
                                            ) : (
                                                <a 
                                                    href={row.documentUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline bg-primary/5 px-2 py-1 rounded-md"
                                                >
                                                    <FiFileText className="h-4 w-4 shrink-0" />
                                                    <span className="truncate max-w-[150px]">{row.documentName}</span>
                                                    <FiExternalLink className="h-3 w-3 text-slate-400 shrink-0" />
                                                </a>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Input 
                                                    type="number"
                                                    disabled={row.isMissing}
                                                    className={`w-20 text-center ${!row.isMissing && row.marksObtained !== null && Number(grades[row.submissionId!]) === row.marksObtained ? 'border-green-200 bg-green-50' : ''} ${row.isMissing ? 'bg-slate-50 opacity-50' : ''}`}
                                                    value={row.submissionId ? (grades[row.submissionId] || "") : ""}
                                                    onChange={(e) => row.submissionId && handleGradeChange(row.submissionId, e.target.value)}
                                                    placeholder="--"
                                                />
                                                <span className="text-sm text-slate-500">/ {assignment.maxScore}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button 
                                                size="sm" 
                                                variant={!row.isMissing && row.marksObtained !== null && Number(grades[row.submissionId!]) === row.marksObtained ? "secondary" : "default"}
                                                disabled={row.isMissing || isSaving === row.submissionId || !row.submissionId || grades[row.submissionId] === ""}
                                                onClick={() => handleSaveGrade(row.submissionId)}
                                                className="p-2 rounded-md"
                                            >
                                                <FiSave className="h-5 w-5" />
                                                {/* {isSaving === row.submissionId ? "..." : "Save"} */}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
};

export default GradingDashboard;