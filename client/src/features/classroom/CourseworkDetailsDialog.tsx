import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { FiFileText, FiMonitor, FiUploadCloud, FiExternalLink, FiCheckCircle, FiShield, FiFile, FiClock, FiCpu } from "react-icons/fi";

// Redux & Services
import { useAppSelector } from "@/hooks/redux";
import { assignmentService } from "@/api/assignment.service";
import type { Assignment, CourseworkDetailsDialogProps } from "@/api/types";

// Shadcn
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const CourseworkDetailsDialog = ({ open, onOpenChange, work, classroomId, onSuccess }: CourseworkDetailsDialogProps) => {
    const { user } = useAppSelector((state) => state.auth);
    const navigate = useNavigate();
    
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!work) return null;

    const isAssignment = work.type === "ASSIGNMENT";
    const rawAssignment = work.rawPayload as Assignment;
    
    // Extract submission and calculate expiry dynamically
    const mySubmission = rawAssignment.mySubmission || rawAssignment.submissions?.[0];
    const isExpired = new Date() > work.targetDate;

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== "application/pdf") {
                toast.error("Please upload a PDF document.");
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleSubmitSolution = async () => {
        if (!selectedFile) return toast.error("Please attach a file first.");
        
        try {
            setIsSubmitting(true);
            const formData = new FormData();
            formData.append("solutions", selectedFile); 

            const response = await assignmentService.submitSolution(classroomId, work.id, formData);
            if (response.success) {
                toast.success("Solution submitted successfully!");
                if (onSuccess) onSuccess(); // Trigger the parent list refresh
                onOpenChange(false); 
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to submit solution.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLaunchSecureBrowser = () => {
        toast.info("Entering secure exam environment...");
        navigate(`/dashboard/cbt-player/${classroomId}/${work.id}`);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) setSelectedFile(null); // Reset on close
            onOpenChange(val);
        }}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${isAssignment ? 'bg-primary/10 text-primary' : 'bg-indigo-100 text-indigo-600'}`}>
                            {isAssignment ? <FiFileText className="h-6 w-6" /> : <FiMonitor className="h-6 w-6" />}
                        </div>
                        <div>
                            <DialogTitle className="text-xl">{work.title}</DialogTitle>
                            <DialogDescription className="mt-1 font-medium text-slate-600">
                                {isAssignment ? "Due: " : "Live At: "} 
                                {format(work.targetDate, "PPP 'at' p")}
                                {isAssignment && rawAssignment.maxScore && (
                                    <span className="ml-2 text-primary font-semibold">&bull; {rawAssignment.maxScore} Points</span>
                                )}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 pt-2">
                    {/* Instructions Section */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <h4 className="text-sm font-semibold text-slate-900 mb-2">Instructions</h4>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">
                            {work.description || "No additional instructions provided."}
                        </p>
                        
                        {/* Tutor Attachments */}
                        {isAssignment && rawAssignment.attachments && rawAssignment.attachments.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-200">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Reference Materials</h4>
                                <div className="flex flex-col gap-2">
                                    {rawAssignment.attachments.map((file) => (
                                        <a 
                                            key={file.id} 
                                            href={file.url} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="flex items-center gap-2 p-2 rounded-md bg-white border border-slate-200 hover:border-primary hover:shadow-sm transition-all group"
                                        >
                                            <FiFile className="h-5 w-5 text-red-500" />
                                            <span className="text-sm font-medium text-slate-700 group-hover:text-primary truncate flex-1">{file.fileName}</span>
                                            <FiExternalLink className="h-4 w-4 text-slate-400 group-hover:text-primary" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Student Action Area */}
                    {user?.accountType === "STUDENT" && (
                        <div className="pt-2">
                            <h4 className="text-sm font-semibold text-slate-900 mb-3">Your Work</h4>
                            
                            {isAssignment ? (
                                mySubmission?.marksObtained !== null && mySubmission?.marksObtained !== undefined ? (
                                    // STATE 1: Graded & Locked
                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-semibold text-blue-900 flex items-center gap-2">
                                                <FiCheckCircle className="h-5 w-5" /> Graded
                                            </span>
                                            <span className="text-lg font-bold text-blue-700">
                                                {mySubmission?.marksObtained} / {rawAssignment.maxScore}
                                            </span>
                                        </div>
                                        <p className="text-xs text-blue-700 mt-1">This assignment has been graded. Submissions are locked.</p>
                                        {mySubmission?.attachments?.[0] && (
                                            <a href={mySubmission.attachments[0].url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline">
                                                <FiFile className="h-4 w-4" /> View Submitted Document
                                            </a>
                                        )}
                                    </div>
                                ) : isExpired ? (
                                    // STATE 2: Expired & Locked
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <div className="flex items-center gap-2 text-red-900 font-semibold mb-1">
                                            <FiClock className="h-5 w-5" /> Deadline Passed
                                        </div>
                                        <p className="text-sm text-red-700">
                                            This assignment is past due and is no longer accepting submissions. Contact your tutor if you require an extension.
                                        </p>
                                        {mySubmission?.attachments?.[0] && (
                                            <a href={mySubmission.attachments[0].url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:underline">
                                                <FiFile className="h-4 w-4" /> View Your Submission
                                            </a>
                                        )}
                                    </div>
                                ) : (
                                    // STATE 3: Active (Upload or Replace)
                                    <div className="space-y-4">
                                        {mySubmission && (
                                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
                                                <span className="font-semibold">Note:</span> You have already submitted a solution. Uploading a new PDF will overwrite your previous file.
                                            </div>
                                        )}

                                        <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-slate-50 relative hover:bg-slate-100 transition-colors">
                                            <input 
                                                type="file" 
                                                accept=".pdf" 
                                                onChange={handleFileUpload}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                                disabled={isSubmitting}
                                            />
                                            {selectedFile ? (
                                                <>
                                                    <FiFile className="h-10 w-10 text-primary mb-2" />
                                                    <p className="text-sm font-medium text-slate-900">{selectedFile.name}</p>
                                                    <p className="text-xs text-slate-500 mt-1">Click to replace file</p>
                                                </>
                                            ) : mySubmission?.attachments?.[0] ? (
                                                <>
                                                    <FiFileText className="h-10 w-10 text-green-500 mb-2" />
                                                    <p className="text-sm font-medium text-slate-900">Current: {mySubmission.attachments[0].fileName}</p>
                                                    <p className="text-xs text-slate-500 mt-1">Click to replace your submission</p>
                                                </>
                                            ) : (
                                                <>
                                                    <FiUploadCloud className="h-10 w-10 text-slate-400 mb-2" />
                                                    <p className="text-sm font-medium text-slate-900">Upload your solution</p>
                                                    <p className="text-xs text-slate-500 mt-1">PDF documents only (Max 5MB)</p>
                                                </>
                                            )}
                                        </div>
                                        <Button 
                                            className="w-full" 
                                            disabled={!selectedFile || isSubmitting}
                                            onClick={handleSubmitSolution}
                                        >
                                            {isSubmitting ? "Uploading..." : mySubmission ? "Replace Submission" : "Turn In Assignment"}
                                        </Button>
                                    </div>
                                )
                            ) : (
                                // CBT Exam Launch Area
                                <div className="space-y-4">
                                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3">
                                        <FiShield className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold text-amber-900">Strict Anti-Cheat Enforced</p>
                                            <p className="text-xs text-amber-700 mt-1">
                                                This exam requires Fullscreen mode. Leaving the browser will instantly lock your exam.
                                            </p>
                                        </div>
                                    </div>
                                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2" size="lg" onClick={handleLaunchSecureBrowser}>
                                        <FiMonitor className="h-4 w-4" /> Start Secure Exam
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tutor Action Area */}
                    {user?.accountType === "TUTOR" && (
                        <div className="pt-2 border-t border-slate-200 mt-4">
                            <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-lg gap-4">
                                <div>
                                    <h4 className="text-sm font-semibold text-indigo-900">
                                        {isAssignment ? "Grading & Submissions" : "Exam Management"}
                                    </h4>
                                    <p className="text-xs text-indigo-700 mt-1">
                                        {isAssignment 
                                            ? `Review student PDFs and assign grades. (${rawAssignment._count?.submissions || 0} Submitted)` 
                                            : "Generate AI questions or view CBT analytics."}
                                    </p>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    {!isAssignment && (
                                        <Button 
                                            variant="outline" 
                                            className="border-indigo-600 text-indigo-600 hover:bg-indigo-100 w-full sm:w-auto"
                                            onClick={() => {
                                                onOpenChange(false);
                                                navigate(`/dashboard/cbt/${classroomId}/${work.id}/generate`);
                                            }}
                                        >
                                            <FiCpu className="mr-2 h-4 w-4" /> AI Generator
                                        </Button>
                                    )}
                                    <Button 
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto"
                                        onClick={() => {
                                            if (isAssignment) {
                                                onOpenChange(false);
                                                navigate(`/dashboard/grade/${classroomId}/${work.id}`);
                                            } else {
                                                toast.info("CBT Analytics Dashboard coming soon!");
                                            }
                                        }}
                                    >
                                        Open Dashboard
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CourseworkDetailsDialog;