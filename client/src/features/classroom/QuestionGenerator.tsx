import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { FiArrowLeft, FiCpu, FiSave, FiCheckSquare, FiCircle, FiHash, FiExternalLink, FiLoader, FiCalendar, FiAlertTriangle, FiBookOpen, FiClock } from "react-icons/fi";

// Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

// Services
import { assignmentService } from "@/api/assignment.service";
import { announcementService } from "@/api/announcement.service";
import { qpaperService } from "@/api/qpaper.service";
import { questionService } from "@/api/question.service";

// Local Types for the Editor State
type DraftOption = { id: string; text: string; isCorrect: boolean };
type DraftQuestion = {
    id: string;
    text: string;
    type: "MCQ" | "MSQ" | "NAT";
    marks: number;
    options?: DraftOption[];
    numericalCorrectAnswer?: number | "";
};

const formatDateTimeLocal = (dateString?: Date | string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
};

const QuestionGenerator = () => {
    const { classroomId, paperId } = useParams<{ classroomId: string; paperId: string }>();
    const navigate = useNavigate();

    // Context & Files State
    const [subject, setSubject] = useState("");
    const [availableFiles, setAvailableFiles] = useState<{ id: string, title: string, url: string }[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [isFetchingFiles, setIsFetchingFiles] = useState(true);

    // Configuration State
    const [difficulty, setDifficulty] = useState("Medium");
    const [mcq, setMcq] = useState({ count: 5, marks: 4 });
    const [msq, setMsq] = useState({ count: 2, marks: 4 });
    const [nat, setNat] = useState({ count: 2, marks: 4 });
    const [customPrompt, setCustomPrompt] = useState("");

    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState<DraftQuestion[]>([]);

    // Final Stage Form State
    const [liveAt, setLiveAt] = useState("");
    const [duration, setDuration] = useState<number | "">(60);
    const [negativeMarkingEnabled, setNegativeMarkingEnabled] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!classroomId || !paperId) return;

        const loadInitialData = async () => {
            try {
                // Fetch Exam Metadata
                const paperRes = await qpaperService.getQuestionPaperById(classroomId, paperId);
                if (paperRes.success) {
                    if (paperRes.data.liveAt) setLiveAt(formatDateTimeLocal(paperRes.data.liveAt));
                    if (paperRes.data.duration) setDuration(paperRes.data.duration);
                    if (paperRes.data.negativeMarking !== undefined) setNegativeMarkingEnabled(paperRes.data.negativeMarking);
                }

                // Cleanly fetch from BOTH service files
                const [assignRes, annRes] = await Promise.all([
                    assignmentService.getClassroomAssignments(classroomId).catch(() => ({ success: false, data: [] })),
                    announcementService.getAnnouncements(classroomId).catch(() => ({ success: false, data: [] }))
                ]);

                const files: { id: string, title: string, url: string }[] = [];

                if (assignRes.success && assignRes.data) {
                    assignRes.data.forEach((assignment: any) => {
                        (assignment.attachments || []).forEach((att: any) => {
                            files.push({ id: att.id, title: `[Assignment] ${att.fileName}`, url: att.url });
                        });
                    });
                }

                if (annRes.success && annRes.data) {
                    annRes.data.forEach((announcement: any) => {
                        (announcement.attachments || []).forEach((att: any) => {
                            files.push({ id: att.id, title: `[Stream] ${att.fileName}`, url: att.url });
                        });
                    });
                }

                setAvailableFiles(files);
            } catch (error) {
                toast.error("Failed to load dashboard data.");
            } finally {
                setIsFetchingFiles(false);
            }
        };
        
        loadInitialData();
    }, [classroomId, paperId]);

    const toggleFileSelection = (fileUrl: string) => {
        setSelectedFiles(prev => 
            prev.includes(fileUrl) ? prev.filter(url => url !== fileUrl) : [...prev, fileUrl]
        );
    };

    const handleGenerate = async () => {
        if (!classroomId || !paperId) return toast.error("Missing classroom or paper ID.");
        if (!subject.trim()) return toast.error("Please provide a subject or topic name.");
        if (mcq.count + msq.count + nat.count === 0) return toast.error("Please request at least one question.");

        try {
            setIsGenerating(true);
            setGeneratedQuestions([]); 

            const payload = {
                subject: subject.trim(),
                contextFiles: selectedFiles,
                difficulty,
                config: { mcq, msq, nat },
                customPrompt
            };

            const response = await questionService.generateQuestion(classroomId, paperId, payload);
            
            if (response.success && response.data) {
                const mappedQs = response.data.map((q: any) => ({
                    ...q,
                    id: uuidv4(), 
                    options: q.options?.map((o: any) => ({ ...o, id: uuidv4() }))
                }));
                
                setGeneratedQuestions(mappedQs);
                toast.success("Questions generated successfully! You can now fine-tune them.");
                
                setTimeout(() => {
                    document.getElementById('editor-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "AI Generation failed. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const updateQuestionText = (qId: string, text: string) => {
        setGeneratedQuestions(qs => qs.map(q => q.id === qId ? { ...q, text } : q));
    };

    const updateOptionText = (qId: string, optId: string, text: string) => {
        setGeneratedQuestions(qs => qs.map(q => {
            if (q.id !== qId) return q;
            return { ...q, options: q.options?.map(o => o.id === optId ? { ...o, text } : o) };
        }));
    };

    const toggleCorrectOption = (qId: string, optId: string, isMCQ: boolean) => {
        setGeneratedQuestions(qs => qs.map(q => {
            if (q.id !== qId) return q;
            return {
                ...q,
                options: q.options?.map(o => {
                    if (isMCQ) return { ...o, isCorrect: o.id === optId };
                    return o.id === optId ? { ...o, isCorrect: !o.isCorrect } : o; 
                })
            };
        }));
    };

    const updateNatAnswer = (qId: string, answer: number | "") => {
        setGeneratedQuestions(qs => qs.map(q => q.id === qId ? { ...q, numericalCorrectAnswer: answer } : q));
    };

    const handleFinalize = async () => {
        if (!classroomId || !paperId) return;
        if (!liveAt) return toast.error("Please set a Live Date & Time for the exam.");
        if (!duration || duration <= 0) return toast.error("Please provide a valid exam duration in minutes.");

        try {
            setIsSaving(true);
            
            // Explicitly sending the negative marking boolean in the API payload
            await qpaperService.updateQuestionPaper(classroomId, paperId, {
                liveAt: new Date(liveAt).toISOString(),
                duration: Number(duration),
                negativeMarkingEnabled: negativeMarkingEnabled 
            } as any);

            for (const q of generatedQuestions) {
                await questionService.addQuestion(classroomId, paperId, {
                    text: q.text,
                    type: q.type,
                    marks: q.marks,
                    numericalCorrectAnswer: q.type === "NAT" ? Number(q.numericalCorrectAnswer) : undefined,
                    options: q.options?.map(o => ({ text: o.text, isCorrect: o.isCorrect }))
                });
            }
            
            toast.success("Exam finalized and successfully published!");
            navigate(`/dashboard/classrooms/${classroomId}`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to save exam.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="h-full w-full overflow-y-auto bg-slate-50/50">
            <div className="max-w-5xl mx-auto space-y-8 p-4 md:p-8 pb-24">
                <div className="flex items-center gap-4 border-b pb-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <FiArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">AI Exam Generator</h1>
                        <p className="text-sm text-slate-500">Auto-generate, review, and finalize secure CBT questions.</p>
                    </div>
                </div>

                <Card className="border-blue-100 shadow-sm">
                    <CardHeader className="bg-blue-50/50 pb-4">
                        <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                            <FiBookOpen className="text-blue-600"/> 1. Context & Knowledge Base
                        </CardTitle>
                        <CardDescription>Provide the subject and optionally select stream files for context.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div>
                            <Label className="mb-2 block font-semibold text-slate-700">Subject / Topic <span className="text-red-500">*</span></Label>
                            <Input 
                                placeholder="e.g., Advanced Data Structures, Organic Chemistry, etc." 
                                value={subject} 
                                onChange={e => setSubject(e.target.value)} 
                                className="bg-white text-md py-5"
                            />
                        </div>

                        <div>
                            <Label className="mb-2 block font-semibold text-slate-700">Reference Files (Optional)</Label>
                            {isFetchingFiles ? (
                                <div className="text-sm text-slate-500 flex items-center gap-2"><FiLoader className="animate-spin" /> Loading files...</div>
                            ) : availableFiles.length === 0 ? (
                                <div className="text-sm text-slate-500 bg-slate-50 p-4 rounded border border-dashed text-center">No reference files found in the classroom.</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {availableFiles.map(file => (
                                        <div key={file.id} className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${selectedFiles.includes(file.url) ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50 bg-white'}`}>
                                            <Checkbox id={file.id} checked={selectedFiles.includes(file.url)} onCheckedChange={() => toggleFileSelection(file.url)} />
                                            <div className="flex-1 overflow-hidden">
                                                <a href={file.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-slate-700 hover:text-blue-600 truncate flex items-center gap-2">
                                                    {file.title} <FiExternalLink className="h-3 w-3 shrink-0" />
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="pb-4 border-b border-slate-100">
                        <CardTitle className="text-lg">2. Generation Parameters</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8 pt-6">
                        
                        <div>
                            <Label className="mb-3 block font-semibold text-slate-700">Overall Difficulty</Label>
                            <div className="flex flex-wrap gap-3">
                                {["Easy", "Medium", "Hard", "Expert"].map(lvl => (
                                    <Button
                                        key={lvl}
                                        type="button"
                                        variant={difficulty === lvl ? "default" : "outline"}
                                        onClick={() => setDifficulty(lvl)}
                                        className={`min-w-[100px] ${difficulty === lvl ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm' : 'text-slate-600 bg-white hover:bg-slate-50'}`}
                                    >
                                        {lvl}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
                                <h4 className="font-semibold text-sm flex items-center gap-2 text-slate-800"><FiCircle className="text-blue-500"/> MCQ</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><Label>Questions</Label><Input type="number" min={0} value={mcq.count} onChange={e => setMcq({...mcq, count: Number(e.target.value)})} className="bg-white mt-1"/></div>
                                    <div><Label>Marks (+)</Label><Input type="number" min={1} value={mcq.marks} onChange={e => setMcq({...mcq, marks: Number(e.target.value)})} className="bg-white mt-1"/></div>
                                </div>
                            </div>
                            <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
                                <h4 className="font-semibold text-sm flex items-center gap-2 text-slate-800"><FiCheckSquare className="text-green-500"/> MSQ</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><Label>Questions</Label><Input type="number" min={0} value={msq.count} onChange={e => setMsq({...msq, count: Number(e.target.value)})} className="bg-white mt-1"/></div>
                                    <div><Label>Marks (+)</Label><Input type="number" min={1} value={msq.marks} onChange={e => setMsq({...msq, marks: Number(e.target.value)})} className="bg-white mt-1"/></div>
                                </div>
                            </div>
                            <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
                                <h4 className="font-semibold text-sm flex items-center gap-2 text-slate-800"><FiHash className="text-orange-500"/> NAT</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><Label>Questions</Label><Input type="number" min={0} value={nat.count} onChange={e => setNat({...nat, count: Number(e.target.value)})} className="bg-white mt-1"/></div>
                                    <div><Label>Marks (+)</Label><Input type="number" min={1} value={nat.marks} onChange={e => setNat({...nat, marks: Number(e.target.value)})} className="bg-white mt-1"/></div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label className="mb-2 block font-semibold text-slate-700">Custom Requirements (Optional)</Label>
                            <Textarea 
                                placeholder="e.g., Focus heavily on chapter 3 formulas. Make sure distractors represent common calculation errors." 
                                value={customPrompt} 
                                onChange={e => setCustomPrompt(e.target.value)} 
                                className="h-20 resize-none bg-white"
                            />
                        </div>

                        <Button onClick={handleGenerate} disabled={isGenerating} className="w-full h-12 text-md gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-md">
                            {isGenerating ? <FiLoader className="animate-spin h-5 w-5" /> : <FiCpu className="h-5 w-5" />}
                            {isGenerating ? "Analyzing Context & Generating..." : "Generate Test Bank"}
                        </Button>
                    </CardContent>
                </Card>

                {isGenerating && (
                    <div className="space-y-4 animate-in fade-in duration-500">
                        <h2 className="text-xl font-bold text-slate-900 mt-8">Generating Questions...</h2>
                        {[1, 2, 3].map(i => (
                            <Card key={i}>
                                <CardHeader className="pb-3"><Skeleton className="h-4 w-[150px]" /></CardHeader>
                                <CardContent className="space-y-3">
                                    <Skeleton className="h-[60px] w-full" />
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {!isGenerating && generatedQuestions.length > 0 && (
                    <div id="editor-section" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">3. Review & Refine</h2>
                            <p className="text-sm text-slate-500 mt-1">Edit the AI-generated text, adjust options, and verify correct answers.</p>
                        </div>

                        <div className="grid gap-6">
                            {generatedQuestions.map((q, index) => (
                                <Card key={q.id} className="border-l-4 overflow-hidden shadow-sm" style={{ borderLeftColor: q.type === 'MCQ' ? '#3b82f6' : q.type === 'MSQ' ? '#22c55e' : '#f97316' }}>
                                    <CardHeader className="bg-slate-50 py-3 pb-4 border-b border-slate-100">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                                                Question {index + 1} &bull; <span className={q.type === 'MCQ' ? 'text-blue-600' : q.type === 'MSQ' ? 'text-green-600' : 'text-orange-600'}>{q.type}</span>
                                            </CardTitle>
                                            <div className="text-sm font-semibold text-slate-600">
                                                {q.marks} Marks
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-5 space-y-5">
                                        <div>
                                            <Label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block font-semibold">Question Text</Label>
                                            <Textarea 
                                                value={q.text} 
                                                onChange={e => updateQuestionText(q.id, e.target.value)}
                                                className="min-h-[80px] font-medium text-slate-900 text-base"
                                            />
                                        </div>

                                        {(q.type === "MCQ" || q.type === "MSQ") && q.options && (
                                            <div className="space-y-3 pt-2">
                                                <Label className="text-xs text-slate-500 uppercase tracking-wider block font-semibold">Options & Answer Key</Label>
                                                {q.options.map((opt, optIndex) => (
                                                    <div key={opt.id} className="flex items-center gap-3 bg-white">
                                                        <div className="flex items-center justify-center bg-slate-100 rounded border h-10 w-10 shrink-0 font-bold text-slate-500">
                                                            {String.fromCharCode(65 + optIndex)}
                                                        </div>
                                                        
                                                        <div className="pt-1">
                                                            {q.type === "MCQ" ? (
                                                                <RadioGroup value={q.options?.find(o => o.isCorrect)?.id}>
                                                                    <RadioGroupItem value={opt.id} onClick={() => toggleCorrectOption(q.id, opt.id, true)} className="h-5 w-5" />
                                                                </RadioGroup>
                                                            ) : (
                                                                <Checkbox checked={opt.isCorrect} onCheckedChange={() => toggleCorrectOption(q.id, opt.id, false)} className="h-5 w-5" />
                                                            )}
                                                        </div>

                                                        <Input 
                                                            value={opt.text} 
                                                            onChange={e => updateOptionText(q.id, opt.id, e.target.value)}
                                                            className={`flex-1 transition-all ${opt.isCorrect ? 'border-green-400 bg-green-50/50 font-medium text-green-900 ring-1 ring-green-400' : ''}`}
                                                        />
                                                    </div>
                                                ))}
                                                {q.type === "MSQ" && <p className="text-xs text-slate-400 italic mt-2">* Check multiple boxes to require all of them for a correct answer.</p>}
                                            </div>
                                        )}

                                        {q.type === "NAT" && (
                                            <div className="pt-2 w-full md:w-1/2">
                                                <Label className="text-xs text-slate-500 uppercase tracking-wider block mb-2 font-semibold">Correct Numerical Answer</Label>
                                                <Input 
                                                    type="number" 
                                                    value={q.numericalCorrectAnswer} 
                                                    onChange={e => updateNatAnswer(q.id, e.target.value ? Number(e.target.value) : "")}
                                                    className="border-orange-300 bg-orange-50/50 font-bold text-orange-800 text-lg py-6"
                                                />
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <Card className="border-emerald-100 shadow-md overflow-hidden mt-12">
                            <div className="bg-emerald-600 h-2 w-full" />
                            <CardContent className="p-6 sm:p-8 space-y-8 bg-white">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">4. Finalize Exam Configuration</h3>
                                    <p className="text-sm text-slate-500 mt-1">Set the schedule and penalty rules before publishing to students.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-3">
                                        <Label className="font-semibold text-slate-700 flex items-center gap-2"><FiCalendar /> Scheduled Start Time</Label>
                                        <Input 
                                            type="datetime-local" 
                                            value={liveAt} 
                                            onChange={e => setLiveAt(e.target.value)} 
                                            className="h-12 text-md bg-white"
                                        />
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <Label className="font-semibold text-slate-700 flex items-center gap-2"><FiClock /> Duration (Mins)</Label>
                                        <Input 
                                            type="number" 
                                            min={5}
                                            value={duration} 
                                            onChange={e => setDuration(e.target.value === "" ? "" : Number(e.target.value))} 
                                            className="h-12 text-md bg-white"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="font-semibold text-slate-700 flex items-center gap-2"><FiAlertTriangle /> Marking Scheme</Label>
                                        <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 h-12">
                                            <span className="text-sm font-semibold text-slate-900 select-none">
                                                Negative Marking
                                            </span>
                                            
                                            {/* Robust HTML Toggle Button Implementation */}
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={negativeMarkingEnabled}
                                                onClick={() => setNegativeMarkingEnabled(!negativeMarkingEnabled)}
                                                className={`
                                                    relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                                                    transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2
                                                    ${negativeMarkingEnabled ? 'bg-emerald-600' : 'bg-slate-300'}
                                                `}
                                            >
                                                <span className="sr-only">Toggle Negative Marking</span>
                                                <span
                                                    aria-hidden="true"
                                                    className={`
                                                        pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                                                        ${negativeMarkingEnabled ? 'translate-x-5' : 'translate-x-0'}
                                                    `}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {negativeMarkingEnabled && (
                                    <div className="bg-red-50 text-red-700 p-3 rounded text-sm border border-red-100 animate-in fade-in duration-300">
                                        <FiAlertTriangle className="inline mr-2"/>
                                        Incorrect answers for MCQ & MSQ will deduct <strong>25% (1/4)</strong> of the question's positive marks. NATs are never penalized.
                                    </div>
                                )}

                                <Button onClick={handleFinalize} disabled={isSaving} className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-700 gap-2 shadow-lg">
                                    {isSaving ? <FiLoader className="animate-spin" /> : <FiSave />}
                                    {isSaving ? "Saving securely to database..." : "Publish Exam"}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuestionGenerator;