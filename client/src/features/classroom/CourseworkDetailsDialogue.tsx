import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { FiFileText, FiMonitor, FiUploadCloud, FiExternalLink, FiCheckCircle, FiShield, FiFile } from "react-icons/fi";

// Redux & Services
import { useAppSelector } from "@/hooks/redux";
import { assignmentService } from "@/api/assignment.service";
import type { Assignment, CourseworkDetailsDialogProps } from "@/api/types";

// Shadcn
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const CourseworkDetailsDialog = ({ open, onOpenChange, work, classroomId }: CourseworkDetailsDialogProps) => {
    const { user } = useAppSelector((state) => state.auth);
    const navigate = useNavigate();
    
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    if (!work) return null;

    const isAssignment = work.type === "ASSIGNMENT";
    const rawAssignment = work.rawPayload as Assignment;

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
            formData.append("document", selectedFile);

            const response = await assignmentService.submitSolution(classroomId, work.id, formData);
            if (response.success) {
                toast.success("Solution submitted successfully!");
                setIsSubmitted(true);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to submit solution.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLaunchSecureBrowser = () => {
        // This will attempt to open the Electron app via a custom deep link protocol
        window.location.href = `vc-exam://start?classroomId=${classroomId}&paperId=${work.id}&token=TEMP_SECURE_TOKEN`;
        toast.info("Attempting to launch Secure CBT Browser...");
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) {
                setSelectedFile(null); // Reset on close
                setIsSubmitted(false);
            }
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
                        
                        {/* Tutor Attachments (Only for Assignments) */}
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
                                // PDF Upload Area
                                isSubmitted ? (
                                    <div className="flex items-center gap-3 p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg">
                                        <FiCheckCircle className="h-6 w-6" />
                                        <div>
                                            <p className="font-semibold text-sm">Successfully Submitted</p>
                                            <p className="text-xs mt-0.5">Your work has been securely uploaded to the ledger.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
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
                                            {isSubmitting ? "Uploading to secure ledger..." : "Turn In Assignment"}
                                        </Button>
                                    </div>
                                )
                            ) : (
                                // CBT Exam Launch Area
                                <div className="space-y-4">
                                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3">
                                        <FiShield className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold text-amber-900">Secure Browser Required</p>
                                            <p className="text-xs text-amber-700 mt-1">
                                                This examination uses the proprietary Pause/Resume algorithm and requires our Electron Desktop App to monitor background processes and prevent tab-switching.
                                            </p>
                                        </div>
                                    </div>
                                    <Button 
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2" 
                                        size="lg"
                                        onClick={handleLaunchSecureBrowser}
                                    >
                                        <FiMonitor className="h-4 w-4" />
                                        Launch Desktop App
                                    </Button>
                                    <p className="text-center text-xs text-slate-500">
                                        Don't have the app? <a href="#" className="text-primary hover:underline">Download it here</a>.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tutor Action Area (Grading Access) */}
                    {user?.accountType === "TUTOR" && (
                        <div className="pt-2 border-t border-slate-200 mt-4">
                            <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                                <div>
                                    <h4 className="text-sm font-semibold text-indigo-900">Grading & Submissions</h4>
                                    <p className="text-xs text-indigo-700 mt-1">
                                        {isAssignment 
                                            ? "Review student PDFs and assign grades." 
                                            : "View auto-graded results and CBT analytics."}
                                    </p>
                                </div>
                                <Button 
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                    onClick={() => {
                                        if (isAssignment) {
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
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CourseworkDetailsDialog;