import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FiMonitor, FiClock, FiShield, FiAlertTriangle, FiLock, FiCheckCircle } from "react-icons/fi";

// Services
import { testattemptService } from "@/api/testattempt.service";
import { qpaperService } from "@/api/qpaper.service";

// Shadcn UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type ExamStatus = "LOADING" | "STANDBY" | "IN_PROGRESS" | "LOCKED" | "SUBMITTED";

const CBTPlayer = () => {
    const { classroomId, paperId } = useParams<{ classroomId: string; paperId: string }>();
    const navigate = useNavigate();

    const [status, setStatus] = useState<ExamStatus>("LOADING");
    const [paperDetails, setPaperDetails] = useState<any>(null);
    const [lockReason, setLockReason] = useState<string>("");
    const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);

    // Fetch initial paper details on mount
    useEffect(() => {
        const fetchDetails = async () => {
            if (!classroomId || !paperId) return;
            try {
                // Fetch paper metadata to show on the standby screen
                const response = await qpaperService.getQuestionPaperById(classroomId, paperId);
                if (response.success) {
                    setPaperDetails(response.data);
                    setStatus("STANDBY");
                }
            } catch (error: any) {
                toast.error(error.response?.data?.message || "Failed to load exam details");
                navigate(`/dashboard/classrooms/${classroomId}`);
            }
        };
        fetchDetails();
    }, [classroomId, paperId, navigate]);

    const triggerSecurityLock = useCallback(async (reason: string) => {
        // Prevent locking if it's already locked or not running, or if we don't have an active attempt
        if (status !== "IN_PROGRESS" || !activeAttemptId) return;

        setStatus("LOCKED");
        setLockReason(reason);
        toast.error(`Security Violation: ${reason}`, { duration: Infinity });

        // Ensure we exit fullscreen if they haven't already
        if (document.fullscreenElement) {
            await document.exitFullscreen().catch(console.error);
        }

        try {
            // Hit the Express backend to pause the timer and lock the exam using the specific attempt ID
            await testattemptService.pauseAttempt(classroomId!, paperId!, activeAttemptId);
        } catch (error) {
            console.error("Failed to sync pause state with server:", error);
        }
    }, [classroomId, paperId, status, activeAttemptId]);

    useEffect(() => {
        if (status !== "IN_PROGRESS") return;

        // 1. Tab Switching / Minimizing
        const handleVisibilityChange = () => {
            if (document.hidden) {
                triggerSecurityLock("Tab switching or window minimization detected.");
            }
        };

        // 2. Exiting Fullscreen (Esc key)
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                triggerSecurityLock("Fullscreen mode was exited.");
            }
        };

        // 3. Disable Context Menu (Right Click)
        const handleContextMenu = (e: Event) => e.preventDefault();

        // 4. Disable Copy/Paste
        const handleCopyPaste = (e: Event) => e.preventDefault();

        // 5. Warn on accidental reload/close
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "Leaving this page will lock your exam. Are you sure?";
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        document.addEventListener("contextmenu", handleContextMenu);
        document.addEventListener("copy", handleCopyPaste);
        document.addEventListener("paste", handleCopyPaste);
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            document.removeEventListener("contextmenu", handleContextMenu);
            document.removeEventListener("copy", handleCopyPaste);
            document.removeEventListener("paste", handleCopyPaste);
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [status, triggerSecurityLock]);

    const handleStartExam = async () => {
        try {
            // 1. Request Fullscreen FIRST
            const docElm = document.documentElement;
            if (docElm.requestFullscreen) {
                await docElm.requestFullscreen();
            }

            // 2. Start the attempt on the backend
            const response = await testattemptService.startTestAttempt(classroomId!, paperId!);
            
            if (response.success && response.data) {
                setActiveAttemptId(response.data.id);
                setStatus("IN_PROGRESS");
                toast.success("Exam started. Good luck!");
            }
        } catch (error: any) {
            toast.error("Failed to start exam. Ensure your browser allows fullscreen.");
        }
    };

    const handleSubmitExam = async () => {
        if (!activeAttemptId) return;

        try {
            await testattemptService.submitTestAttempt(classroomId!, paperId!, activeAttemptId);
            setStatus("SUBMITTED");
            
            if (document.fullscreenElement) {
                await document.exitFullscreen().catch(console.error);
            }
            
            toast.success("Exam submitted successfully!");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to submit exam.");
        }
    };

    // --- RENDER HELPERS ---

    if (status === "LOADING") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="space-y-4 w-full max-w-md">
                    <Skeleton className="h-8 w-3/4 mx-auto" />
                    <Skeleton className="h-4 w-1/2 mx-auto" />
                    <Skeleton className="h-64 w-full mt-8" />
                </div>
            </div>
        );
    }

    if (status === "STANDBY") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
                <Card className="max-w-2xl w-full border-slate-200 shadow-lg">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                            <FiMonitor className="h-8 w-8 text-indigo-600" />
                        </div>
                        <CardTitle className="text-3xl font-bold text-slate-900">{paperDetails?.title || "Secure Examination"}</CardTitle>
                        <p className="text-slate-500 mt-2">Duration: {paperDetails?.duration || 60} Minutes</p>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-4">
                        <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl space-y-3">
                            <div className="flex items-center gap-2 text-amber-900 font-bold text-lg">
                                <FiAlertTriangle className="h-5 w-5" />
                                <h3>Strict Anti-Cheat Rules</h3>
                            </div>
                            <ul className="text-amber-800 text-sm space-y-2 list-disc pl-5 font-medium">
                                <li>The exam requires <strong>Fullscreen Mode</strong>.</li>
                                <li>Do not press the <strong>Esc</strong> key.</li>
                                <li>Do not <strong>switch tabs</strong>, open other applications, or minimize the browser.</li>
                                <li>Right-clicking, copying, and pasting are disabled.</li>
                            </ul>
                            <p className="text-xs text-amber-700 mt-4 border-t border-amber-200 pt-3">
                                Violating any of these rules will instantly lock your exam and notify your tutor via the Pause/Resume algorithm.
                            </p>
                        </div>

                        <Button size="lg" className="w-full text-lg h-14 bg-indigo-600 hover:bg-indigo-700" onClick={handleStartExam}>
                            I Understand &mdash; Start Exam
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (status === "LOCKED") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-4">
                <Card className="max-w-lg w-full border-red-200 shadow-2xl">
                    <CardContent className="pt-10 pb-8 px-8 text-center space-y-6">
                        <div className="mx-auto bg-red-100 w-20 h-20 rounded-full flex items-center justify-center">
                            <FiLock className="h-10 w-10 text-red-600" />
                        </div>
                        <h2 className="text-3xl font-black text-red-700 uppercase tracking-tight">Exam Locked</h2>
                        
                        <div className="bg-white p-4 rounded-lg border border-red-100 text-left">
                            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider mb-1">Reason for lock:</p>
                            <p className="text-slate-900 font-semibold">{lockReason}</p>
                        </div>

                        <p className="text-red-800 text-sm font-medium">
                            Your attempt has been paused securely. You cannot continue until a Tutor reviews your activity and unlocks your exam from the dashboard.
                        </p>

                        <Button variant="outline" className="w-full" onClick={() => navigate(`/dashboard/classrooms/${classroomId}`)}>
                            Return to Classroom
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (status === "SUBMITTED") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 p-4">
                <div className="text-center space-y-6 max-w-md">
                    <FiCheckCircle className="h-24 w-24 text-green-500 mx-auto" />
                    <h2 className="text-3xl font-bold text-slate-900">Exam Submitted!</h2>
                    <p className="text-slate-600">Your responses have been securely saved and sent to the grading engine.</p>
                    <Button onClick={() => navigate(`/dashboard/classrooms/${classroomId}`)} className="bg-green-600 hover:bg-green-700">
                        Return to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    // --- IN_PROGRESS VIEW ---
    return (
        <div className="min-h-screen bg-slate-100 flex flex-col select-none">
            {/* Secure Header */}
            <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
                <div className="flex items-center gap-3">
                    <FiShield className="h-6 w-6 text-emerald-400" />
                    <div>
                        <h1 className="font-bold text-lg leading-tight">{paperDetails?.title || "Examination in Progress"}</h1>
                        <p className="text-xs text-slate-400 font-medium tracking-wider">SECURE ENVIRONMENT ACTIVE</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Timer Placeholder */}
                    <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                        <FiClock className="h-5 w-5 text-amber-400" />
                        <span className="font-mono text-xl font-bold tracking-widest">
                            --:--:--
                        </span>
                    </div>

                    <Button variant="destructive" onClick={handleSubmitExam}>
                        Finish & Submit
                    </Button>
                </div>
            </header>

            {/* Exam Content Area */}
            <main className="flex-1 max-w-5xl w-full mx-auto p-6 flex flex-col mt-4 gap-6">
                <Card className="flex-1 shadow-sm border-slate-200">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                        <CardTitle className="text-lg text-slate-700 flex justify-between">
                            <span>Question 1</span>
                            <span className="text-sm font-normal bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">+4 Marks</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <p className="text-lg text-slate-900 font-medium mb-8">
                            (Question content and options will be rendered here based on the active question index from your backend API...)
                        </p>
                        
                        {/* Placeholder for Options */}
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="p-4 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border-slate-200">
                                    Option {i}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default CBTPlayer;