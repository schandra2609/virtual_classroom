import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FiMonitor, FiClock, FiShield, FiAlertTriangle, FiCheckCircle, FiChevronLeft, FiChevronRight } from "react-icons/fi";

// Services
import { testattemptService } from "@/api/testattempt.service";
import { qpaperService } from "@/api/qpaper.service";

// Shadcn UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type ExamStatus = "LOADING" | "STANDBY" | "IN_PROGRESS" | "SUBMITTED";

const CBTPlayer = () => {
    const { classroomId, paperId } = useParams<{ classroomId: string; paperId: string }>();
    const navigate = useNavigate();

    // --- Core State ---
    const [status, setStatus] = useState<ExamStatus>("LOADING");
    const [paperDetails, setPaperDetails] = useState<any>(null);
    const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);
    
    // --- Exam Interaction State ---
    const [currentIndex, setCurrentIndex] = useState(0);
    const [localAnswers, setLocalAnswers] = useState<Record<string, any>>({});
    const [visitedQuestions, setVisitedQuestions] = useState<Set<string>>(new Set());

    // --- Timer State ---
    const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

    // --- Security & Warning State ---
    const MAX_WARNINGS = 10;
    const WARNING_DURATION_SEC = 5;
    const PENALTY_SEC = 600; // 10 minutes
    
    const [isWarningActive, setIsWarningActive] = useState(false);
    const [warningsUsed, setWarningsUsed] = useState(0);
    const [warningReason, setWarningReason] = useState("");
    const [warningTimeLeft, setWarningTimeLeft] = useState(WARNING_DURATION_SEC);
    
    const examTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const warningTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ==========================================
    // INITIALIZATION
    // ==========================================
    useEffect(() => {
        const fetchDetails = async () => {
            if (!classroomId || !paperId) return;
            try {
                const response = await qpaperService.getQuestionPaperById(classroomId, paperId);
                if (response.success) {
                    setPaperDetails(response.data);
                    setRemainingSeconds((response.data.duration || 60) * 60);
                    
                    // Mark the first question as visited instantly if it exists
                    if (response.data.questions && response.data.questions.length > 0) {
                        setVisitedQuestions(new Set([response.data.questions[0].id]));
                    }
                    
                    setStatus("STANDBY");
                }
            } catch (error: any) {
                toast.error("Failed to load exam details");
                navigate(`/dashboard/classrooms/${classroomId}`);
            }
        };
        fetchDetails();
    }, [classroomId, paperId, navigate]);

    // ==========================================
    // SUBMISSION & SYNC LOGIC
    // ==========================================
    const handleSubmitExam = useCallback(async (isAutoSubmit = false) => {
        if (!activeAttemptId && !isAutoSubmit) return;

        if (examTimerRef.current) clearInterval(examTimerRef.current);
        if (warningTimerRef.current) clearInterval(warningTimerRef.current);

        try {
            if (activeAttemptId) {
                await testattemptService.submitTestAttempt(classroomId!, paperId!, activeAttemptId);
            }
            setStatus("SUBMITTED");
            
            if (document.fullscreenElement) {
                await document.exitFullscreen().catch(console.error);
            }
            
            toast.success(isAutoSubmit ? "Time expired. Exam auto-submitted." : "Exam submitted successfully!");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to submit exam.");
        }
    }, [activeAttemptId, classroomId, paperId]);

    const syncAnswerToServer = async (questionId: string, payload: any) => {
        if (!activeAttemptId) return;
        try {
            await testattemptService.submitAnswer(classroomId!, paperId!, activeAttemptId, {
                questionId,
                ...payload
            });
        } catch (error) {
            console.error("Failed to sync answer to server", error);
        }
    };

    // ==========================================
    // PENALTY & WARNING ALGORITHM
    // ==========================================
    const applyPenalty = useCallback((_reasonLog: string) => {
        setRemainingSeconds(prev => {
            const newTime = prev - PENALTY_SEC;
            if (newTime <= 0) {
                handleSubmitExam(true);
                return 0;
            }
            toast.error("PENALTY APPLIED: 10 minutes deducted from your timer.", { duration: 5000 });
            return newTime;
        });
    }, [handleSubmitExam]);

    const resolveWarning = useCallback(() => {
        if (warningTimerRef.current) clearInterval(warningTimerRef.current);
        setIsWarningActive(false);
    }, []);

    const triggerWarning = useCallback((reason: string) => {
        if (status !== "IN_PROGRESS" || isWarningActive) return;

        setIsWarningActive(true);
        setWarningReason(reason);
        setWarningTimeLeft(WARNING_DURATION_SEC);
        
        const currentWarnings = warningsUsed + 1;
        setWarningsUsed(currentWarnings);

        if (currentWarnings > MAX_WARNINGS) {
            applyPenalty("Max warnings exhausted.");
            resolveWarning();
            return;
        }

        if (warningTimerRef.current) clearInterval(warningTimerRef.current);
        warningTimerRef.current = setInterval(() => {
            setWarningTimeLeft((prev) => {
                if (prev <= 1) {
                    applyPenalty("Warning timer exhausted.");
                    resolveWarning();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [status, isWarningActive, warningsUsed, applyPenalty, resolveWarning]);

    const attemptAutoResolve = useCallback(() => {
        if (!document.hidden && document.hasFocus() && document.fullscreenElement) {
            resolveWarning();
        }
    }, [resolveWarning]);

    // ==========================================
    // AGGRESSIVE SECURITY LISTENERS
    // ==========================================
    useEffect(() => {
        if (status !== "IN_PROGRESS") return;

        // 1. Total Keyboard Blackout - Blocks EVERYTHING, triggers NO warnings.
        const blockKeyboard = (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        // 2. Tab Switching / Minimizing
        const handleVisibilityChange = () => {
            if (document.hidden) triggerWarning("Tab switched or window minimized.");
            else attemptAutoResolve(); 
        };

        // 3. Exiting Fullscreen
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) triggerWarning("Fullscreen mode exited.");
            else attemptAutoResolve();
        };

        // 4. Focus Loss
        const handleBlur = () => triggerWarning("Window lost focus.");
        const handleFocus = () => attemptAutoResolve();

        // 5. Block Context Menu & Copy/Paste
        const blockEvent = (e: Event) => e.preventDefault();

        // Attach Blackout Listeners (Capture Phase)
        window.addEventListener("keydown", blockKeyboard, { capture: true });
        window.addEventListener("keyup", blockKeyboard, { capture: true });
        window.addEventListener("keypress", blockKeyboard, { capture: true });

        // Attach Detection Listeners
        document.addEventListener("visibilitychange", handleVisibilityChange);
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        window.addEventListener("blur", handleBlur);
        window.addEventListener("focus", handleFocus);
        document.addEventListener("contextmenu", blockEvent);
        document.addEventListener("copy", blockEvent);
        document.addEventListener("paste", blockEvent);

        return () => {
            window.removeEventListener("keydown", blockKeyboard, { capture: true });
            window.removeEventListener("keyup", blockKeyboard, { capture: true });
            window.removeEventListener("keypress", blockKeyboard, { capture: true });
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            window.removeEventListener("blur", handleBlur);
            window.removeEventListener("focus", handleFocus);
            document.removeEventListener("contextmenu", blockEvent);
            document.removeEventListener("copy", blockEvent);
            document.removeEventListener("paste", blockEvent);
        };
    }, [status, triggerWarning, attemptAutoResolve]);

    // ==========================================
    // EXAM MAIN TIMER
    // ==========================================
    useEffect(() => {
        if (status === "IN_PROGRESS") {
            examTimerRef.current = setInterval(() => {
                setRemainingSeconds((prev) => {
                    if (prev <= 1) {
                        handleSubmitExam(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (examTimerRef.current) clearInterval(examTimerRef.current);
        }
        return () => { if (examTimerRef.current) clearInterval(examTimerRef.current); };
    }, [status, handleSubmitExam]);


    // ==========================================
    // ACTION HANDLERS
    // ==========================================
    const handleStartExam = async () => {
        try {
            await document.documentElement.requestFullscreen();
            const response = await testattemptService.startTestAttempt(classroomId!, paperId!);
            
            if (response.success && response.data) {
                setActiveAttemptId(response.data.id);

                // BUG D FIX: Seed the timer from the server's authoritative value
                // (accounts for accumulated pauseTime, not just raw duration)
                try {
                    const timerRes = await qpaperService.getTimerSync(classroomId!, paperId!);
                    if (timerRes.success && timerRes.data?.remainingSeconds !== undefined) {
                        setRemainingSeconds(timerRes.data.remainingSeconds);
                    }
                } catch {
                    // Fallback to local duration if sync fails
                    setRemainingSeconds((paperDetails?.duration || 60) * 60);
                }

                setStatus("IN_PROGRESS");
                toast.success("Exam started. Good luck!");
            }
        } catch (error: any) {
            toast.error("Failed to start exam. Ensure your browser allows fullscreen.");
        }
    };

    const manuallyRestoreFullscreen = async () => {
        try {
            await document.documentElement.requestFullscreen();
            attemptAutoResolve();
        } catch (error) {
            console.error("User must interact to enter fullscreen");
        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    // ==========================================
    // ANSWER INPUT HANDLERS
    // ==========================================
    const handleMCQSelect = (questionId: string, optionId: string) => {
        setLocalAnswers(prev => ({ ...prev, [questionId]: optionId }));
        syncAnswerToServer(questionId, { selectedOptionId: optionId });
    };

    const handleMSQSelect = (questionId: string, optionId: string) => {
        setLocalAnswers(prev => {
            const currentArr = prev[questionId] || [];
            const isChecked = currentArr.includes(optionId);
            const newArr = isChecked ? currentArr.filter((id: string) => id !== optionId) : [...currentArr, optionId];
            syncAnswerToServer(questionId, { selectedOptionId: newArr });
            return { ...prev, [questionId]: newArr };
        });
    };

    const handleNATKeypad = (questionId: string, key: string | number) => {
        setLocalAnswers(prev => {
            const currentVal = prev[questionId] ? String(prev[questionId]) : "";
            let newVal = currentVal;
            
            if (key === 'Del') {
                newVal = currentVal.slice(0, -1);
            } else if (key === '-' && currentVal === "") {
                newVal = "-";
            } else if (key === '.' && !currentVal.includes('.')) {
                newVal += '.';
            } else if (typeof key === 'number') {
                newVal += key;
            }

            const numVal = parseFloat(newVal);
            if (!isNaN(numVal) || newVal === "") {
                syncAnswerToServer(questionId, { numericalAnswer: newVal === "" ? null : numVal });
            }

            return { ...prev, [questionId]: newVal };
        });
    };

    // ==========================================
    // NAVIGATION HANDLERS
    // ==========================================
    const navigateToQuestion = (index: number) => {
        setCurrentIndex(index);
        const qId = paperDetails.questions[index].id;
        setVisitedQuestions(prev => new Set(prev).add(qId));
    };

    const isQuestionAnswered = (qId: string) => {
        const ans = localAnswers[qId];
        if (ans === undefined || ans === null) return false;
        if (typeof ans === "string" && ans.trim() === "") return false;
        if (Array.isArray(ans) && ans.length === 0) return false;
        return true;
    };


    // ==========================================
    // RENDER SCREENS
    // ==========================================
    if (status === "LOADING") return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Skeleton className="h-64 w-full max-w-md" /></div>;
    
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
                                <li>Do not <strong>switch tabs</strong>, open other applications, or minimize the browser.</li>
                                <li><strong>Keyboard is completely disabled.</strong> Use the mouse to interact.</li>
                            </ul>
                            <p className="text-xs text-amber-700 mt-4 border-t border-amber-200 pt-3">
                                Violations trigger a countdown. Failing to return to fullscreen/focus in time applies a <strong>10-minute penalty</strong>.
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

    if (status === "SUBMITTED") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 p-4">
                <div className="text-center space-y-6 max-w-md">
                    <FiCheckCircle className="h-24 w-24 text-green-500 mx-auto" />
                    <h2 className="text-3xl font-bold text-slate-900">Exam Submitted!</h2>
                    <Button onClick={() => navigate(`/dashboard/classrooms/${classroomId}`)} className="bg-green-600 hover:bg-green-700">
                        Return to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    // ==========================================
    // IN_PROGRESS VIEW
    // ==========================================
    const questions = paperDetails?.questions || [];
    const currentQuestion = questions[currentIndex];

    return (
        <div className={`min-h-screen flex flex-col select-none transition-all ${isWarningActive ? 'bg-red-50' : 'bg-slate-100'}`}>
            
            {/* INTRUSIVE RED BORDER FOR WARNINGS */}
            {isWarningActive && (
                <div className="fixed inset-0 border-[12px] border-red-600 z-[100] pointer-events-none animate-pulse"></div>
            )}

            {/* WARNING BANNER */}
            {isWarningActive && (
                <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between shadow-lg relative z-50">
                    <div className="flex items-center gap-3">
                        <FiAlertTriangle className="h-8 w-8 animate-bounce" />
                        <div>
                            <h2 className="font-bold text-lg uppercase tracking-wider">Security Violation: {warningReason}</h2>
                            <p className="text-sm font-medium">Return to the exam screen immediately. Penalty applies in {String(warningTimeLeft).padStart(2, '0')}s.</p>
                        </div>
                    </div>
                    
                    {!document.fullscreenElement && (
                        <Button onClick={manuallyRestoreFullscreen} variant="secondary" className="font-bold border-2 border-white">
                            Click to Resume Fullscreen
                        </Button>
                    )}
                </div>
            )}

            <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-md">
                <div className="flex items-center gap-3">
                    <FiShield className="h-6 w-6 text-emerald-400" />
                    <div>
                        <h1 className="font-bold text-lg leading-tight">{paperDetails?.title || "Examination in Progress"}</h1>
                        <p className="text-xs text-slate-400 font-medium tracking-wider">SECURE ENVIRONMENT &bull; WARNINGS: {warningsUsed}/{MAX_WARNINGS}</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                        <FiClock className={`h-5 w-5 ${remainingSeconds < 300 ? 'text-red-500 animate-pulse' : 'text-amber-400'}`} />
                        <span className={`font-mono text-xl font-bold tracking-widest ${remainingSeconds < 300 ? 'text-red-500' : 'text-white'}`}>
                            {formatTime(remainingSeconds)}
                        </span>
                    </div>

                    <Button variant="destructive" onClick={() => handleSubmitExam(false)}>
                        Finish Exam
                    </Button>
                </div>
            </header>

            <main className="flex-1 max-w-5xl w-full mx-auto p-6 flex flex-col mt-4 gap-6 relative z-10 pb-32">
                {currentQuestion ? (
                    <Card className="flex-1 shadow-sm border-slate-200">
                        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                            <CardTitle className="text-lg text-slate-700 flex justify-between">
                                <span>Question {currentIndex + 1} of {questions.length}</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold bg-slate-200 text-slate-600 px-3 py-1 rounded-full uppercase tracking-wider">{currentQuestion.type}</span>
                                    <span className="text-sm font-normal bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">+{currentQuestion.marks} Marks</span>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        
                        <CardContent className="p-8">
                            <p className="text-lg text-slate-900 font-medium mb-8 whitespace-pre-wrap">
                                {currentQuestion.text}
                            </p>
                            
                            {/* PURE REACT MCQ RENDER */}
                            {currentQuestion.type === "MCQ" && (
                                <div className="space-y-3">
                                    {currentQuestion.options.map((opt: any) => {
                                        const isSelected = localAnswers[currentQuestion.id] === opt.id;
                                        return (
                                            <div 
                                                key={opt.id} 
                                                onClick={() => handleMCQSelect(currentQuestion.id, opt.id)}
                                                className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'hover:bg-slate-50 border-slate-200'}`}
                                            >
                                                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-indigo-600' : 'border-slate-300'}`}>
                                                    {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-indigo-600" />}
                                                </div>
                                                <span className={`text-base font-medium ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{opt.text}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* PURE REACT MSQ RENDER */}
                            {currentQuestion.type === "MSQ" && (
                                <div className="space-y-3">
                                    {currentQuestion.options.map((opt: any) => {
                                        const isChecked = (localAnswers[currentQuestion.id] || []).includes(opt.id);
                                        return (
                                            <div 
                                                key={opt.id} 
                                                onClick={() => handleMSQSelect(currentQuestion.id, opt.id)}
                                                className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${isChecked ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500' : 'hover:bg-slate-50 border-slate-200'}`}
                                            >
                                                <div className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 ${isChecked ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'}`}>
                                                    {isChecked && <FiCheckCircle className="text-white h-3 w-3" />}
                                                </div>
                                                <span className={`text-base font-medium ${isChecked ? 'text-emerald-900' : 'text-slate-700'}`}>{opt.text}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* NAT RENDER & VIRTUAL KEYPAD */}
                            {currentQuestion.type === "NAT" && (
                                <div className="mt-4 pt-6 border-t border-slate-200 max-w-sm">
                                    <div className="bg-slate-100 border border-slate-300 rounded-lg p-4 mb-6 text-2xl font-mono text-center tracking-widest min-h-[64px] flex items-center justify-center">
                                        {localAnswers[currentQuestion.id] !== undefined ? localAnswers[currentQuestion.id] : ""}
                                        <span className="animate-pulse ml-1 text-slate-400">|</span>
                                    </div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider text-center">Virtual Keypad</h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'Del', '-'].map(key => (
                                            <Button 
                                                key={key} 
                                                variant="outline" 
                                                className={`h-14 text-xl font-mono shadow-sm ${key === 'Del' ? 'text-red-500 border-red-200' : 'text-slate-700'} ${key === '-' ? 'col-span-3' : ''}`}
                                                onClick={() => handleNATKeypad(currentQuestion.id, key)}
                                            >
                                                {key}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex-1 flex items-center justify-center"><Skeleton className="h-64 w-full" /></div>
                )}
            </main>

            {/* FIXED BOTTOM QUESTION NAVIGATOR */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40 px-4 py-3">
                <div className="max-w-5xl mx-auto flex items-center gap-4">
                    
                    <Button 
                        variant="outline" 
                        size="icon"
                        disabled={currentIndex === 0} 
                        onClick={() => navigateToQuestion(currentIndex - 1)} 
                        className="shrink-0"
                    >
                        <FiChevronLeft className="h-5 w-5" />
                    </Button>

                    <div className="flex-1 flex items-center gap-3 overflow-x-auto no-scrollbar py-2 px-1">
                        {questions.map((q: any, i: number) => {
                            const answered = isQuestionAnswered(q.id);
                            const visited = visitedQuestions.has(q.id);
                            const isCurrent = i === currentIndex;

                            let colorClasses = "bg-white text-slate-900 border-slate-300"; // Unvisited
                            if (answered) {
                                colorClasses = "bg-green-200 text-green-700 border-green-700";
                            } else if (visited) {
                                colorClasses = "bg-red-200 text-red-700 border-red-700";
                            }

                            return (
                                <button
                                    key={q.id}
                                    onClick={() => navigateToQuestion(i)}
                                    className={`
                                        shrink-0 h-10 w-10 rounded-full border-2 font-bold text-sm transition-all flex items-center justify-center
                                        ${colorClasses}
                                        ${isCurrent ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110 shadow-md' : 'hover:scale-105'}
                                    `}
                                >
                                    {i + 1}
                                </button>
                            );
                        })}
                    </div>

                    <Button 
                        variant="outline" 
                        size="icon"
                        disabled={currentIndex === questions.length - 1} 
                        onClick={() => navigateToQuestion(currentIndex + 1)} 
                        className="shrink-0"
                    >
                        <FiChevronRight className="h-5 w-5" />
                    </Button>
                    
                </div>
            </div>

            {/* Add global styles to hide scrollbar for the navigator while keeping it functional */}
            <style dangerouslySetInnerHTML={{__html: `
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </div>
    );
};

export default CBTPlayer;