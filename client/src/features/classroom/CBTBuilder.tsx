import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiPlus, FiTrash2, FiCheckCircle, FiCircle, FiArrowLeft, FiLoader } from "react-icons/fi";
import { MdDragIndicator } from "react-icons/md";
import { toast } from "sonner";

// Services & Types
import { qpaperService } from "@/api/qpaper.service";
import { questionService } from "@/api/question.service";
import type { QuestionPaper, Question, AddQuestionData } from "@/api/types";

// Shadcn Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Custom interface for the builder UI to track new vs existing questions
interface BuilderOption {
    text: string;
    isCorrect: boolean;
}

interface BuilderQuestion {
    id: string; // Will start with "new-" for unsaved questions
    type: 'MCQ' | 'MSQ' | 'NAT';
    text: string;
    marks: number;
    numericalCorrectAnswer?: number;
    options: BuilderOption[];
}

const CBTBuilder = () => {
    // Assuming you update App.tsx route to: /dashboard/cbt-builder/:classroomId/:paperId
    const { classroomId, paperId } = useParams<{ classroomId: string, paperId: string }>();
    const navigate = useNavigate();

    const [paper, setPaper] = useState<QuestionPaper | null>(null);
    const [questions, setQuestions] = useState<BuilderQuestion[]>([]);
    const [deletedQuestionIds, setDeletedQuestionIds] = useState<string[]>([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // --- Data Fetching ---
    useEffect(() => {
        const fetchExamData = async () => {
            if (!classroomId || !paperId) return;
            try {
                const response = await qpaperService.getQuestionPaperById(classroomId, paperId);
                if (response.success) {
                    setPaper(response.data);
                    
                    // Map existing backend questions to the builder state
                    // (Assuming your backend returns the nested questions in this route via Prisma 'include')
                    const existingQuestions: Question[] = (response.data as any).questions || [];
                    
                    if (existingQuestions.length > 0) {
                        setQuestions(existingQuestions.map(q => ({
                            id: q.id,
                            type: q.type,
                            text: q.text,
                            marks: q.marks,
                            numericalCorrectAnswer: q.numericalCorrectAnswer || undefined,
                            options: q.options?.map(o => ({ text: o.text, isCorrect: o.isCorrect })) || []
                        })));
                    } else {
                        // Start with one empty question if it's a brand new exam
                        handleAddQuestion();
                    }
                }
            } catch (error) {
                toast.error("Failed to load exam data.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchExamData();
    }, [classroomId, paperId]);

    // --- Question Management ---
    const handleAddQuestion = () => {
        setQuestions([
            ...questions,
            {
                id: `new-${Date.now()}`,
                type: "MCQ",
                text: "",
                marks: 1,
                options: [
                    { text: "Option 1", isCorrect: false }, 
                    { text: "Option 2", isCorrect: false }
                ],
            }
        ]);
    };

    const handleRemoveQuestion = (id: string) => {
        if (questions.length === 1) {
            return toast.error("An exam must have at least one question.");
        }
        
        // If it's a real question from the database, track its ID so we can delete it on save
        if (!id.startsWith("new-")) {
            setDeletedQuestionIds([...deletedQuestionIds, id]);
        }
        
        setQuestions(questions.filter(q => q.id !== id));
    };

    const handleUpdateQuestion = (id: string, field: keyof BuilderQuestion, value: any) => {
        setQuestions(questions.map(q => {
            if (q.id !== id) return q;
            const updated = { ...q, [field]: value };
            
            // Handle type switching logic
            if (field === "type") {
                if (value === "NAT") {
                    updated.options = [];
                } else if (updated.options.length === 0) {
                    updated.options = [
                        { text: "Option 1", isCorrect: false }, 
                        { text: "Option 2", isCorrect: false }
                    ];
                } else if (value === "MCQ") {
                    // Force only one correct answer if switching from MSQ to MCQ
                    let foundCorrect = false;
                    updated.options = updated.options.map(opt => {
                        if (opt.isCorrect && !foundCorrect) {
                            foundCorrect = true;
                            return opt;
                        }
                        return { ...opt, isCorrect: false };
                    });
                }
            }
            return updated;
        }));
    };

    // --- Option Management (MCQ/MSQ) ---
    const handleAddOption = (qId: string) => {
        setQuestions(questions.map(q => {
            if (q.id !== qId) return q;
            return { ...q, options: [...q.options, { text: `Option ${q.options.length + 1}`, isCorrect: false }] };
        }));
    };

    const handleUpdateOption = (qId: string, optIndex: number, newValue: string) => {
        setQuestions(questions.map(q => {
            if (q.id !== qId) return q;
            const newOptions = [...q.options];
            newOptions[optIndex].text = newValue;
            return { ...q, options: newOptions };
        }));
    };

    const handleRemoveOption = (qId: string, optIndex: number) => {
        setQuestions(questions.map(q => {
            if (q.id !== qId) return q;
            if (q.options.length <= 2) {
                toast.error("Multiple choice questions need at least two options.");
                return q;
            }
            return { ...q, options: q.options.filter((_, i) => i !== optIndex) };
        }));
    };

    // --- Correct Answer Toggling ---
    const toggleCorrectAnswer = (qId: string, optIndex: number) => {
        setQuestions(questions.map(q => {
            if (q.id !== qId) return q;
            const newOptions = [...q.options];

            if (q.type === "MCQ") {
                // MCQ: Only one correct answer allowed, wipe the rest
                newOptions.forEach((opt, idx) => opt.isCorrect = (idx === optIndex));
            } else if (q.type === "MSQ") {
                // MSQ: Toggle individual option
                newOptions[optIndex].isCorrect = !newOptions[optIndex].isCorrect;
            }

            return { ...q, options: newOptions };
        }));
    };

    // --- Save Handler ---
    const handleSaveExam = async () => {
        if (!classroomId || !paperId) return;

        // 1. Validation Sweep
        for (const [index, q] of questions.entries()) {
            if (!q.text.trim()) return toast.error(`Question ${index + 1} is missing text.`);
            
            if (q.type === "NAT") {
                if (q.numericalCorrectAnswer === undefined || q.numericalCorrectAnswer === null) {
                    return toast.error(`Question ${index + 1} is missing a numerical answer.`);
                }
            } else {
                const hasCorrectOption = q.options.some(opt => opt.isCorrect);
                if (!hasCorrectOption) return toast.error(`Question ${index + 1} has no correct option marked.`);
                
                const hasEmptyOption = q.options.some(opt => !opt.text.trim());
                if (hasEmptyOption) return toast.error(`Question ${index + 1} has an empty option.`);
            }
        }
        
        try {
            setIsSaving(true);

            // 2. Process Deletions First
            for (const id of deletedQuestionIds) {
                await questionService.deleteQuestion(classroomId, paperId, id);
            }

            // 3. Process Additions & Updates sequentially (or Promise.all if your DB allows rapid concurrent inserts)
            for (const q of questions) {
                const payload: AddQuestionData = {
                    text: q.text,
                    type: q.type,
                    marks: q.marks,
                    numericalCorrectAnswer: q.numericalCorrectAnswer,
                    options: q.options.length > 0 ? q.options : undefined
                };

                if (q.id.startsWith("new-")) {
                    await questionService.addQuestion(classroomId, paperId, payload);
                } else {
                    await questionService.updateQuestion(classroomId, paperId, q.id, payload);
                }
            }

            toast.success("Exam saved and published successfully!");
            setDeletedQuestionIds([]); // Reset queue
            
            // Redirect back to classroom details
            setTimeout(() => navigate(`/dashboard/classrooms/${classroomId}`), 1000);

        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to save exam.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="flex h-[50vh] items-center justify-center text-slate-500">Loading Exam Builder...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto py-8 space-y-8">
            {/* Header Area */}
            <div className="flex items-center justify-between bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <div>
                    <Button variant="ghost" className="-ml-4 mb-2 text-slate-500" onClick={() => navigate(-1)}>
                        <FiArrowLeft className="h-4 w-4 mr-2" /> Back to Classroom
                    </Button>
                    <h1 className="text-2xl font-bold text-slate-900">{paper?.title || "Exam Builder"}</h1>
                    <p className="text-slate-500 mt-1">Draft your questions and mark correct answers for auto-grading.</p>
                </div>
                <Button onClick={handleSaveExam} size="lg" disabled={isSaving}>
                    {isSaving ? <FiLoader className="h-4 w-4 mr-2 animate-spin" /> : null}
                    {isSaving ? "Saving..." : "Save Exam"}
                </Button>
            </div>

            <div className="space-y-6">
                {questions.map((q, index) => (
                    <Card key={q.id} className="border-slate-200 shadow-sm relative overflow-visible">
                        {/* Question Number Badge */}
                        <div className="absolute -left-3 -top-3 h-8 w-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold shadow-sm">
                            {index + 1}
                        </div>

                        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center gap-4">
                                    <Select 
                                        value={q.type} 
                                        onValueChange={(val: 'MCQ' | 'MSQ' | 'NAT') => handleUpdateQuestion(q.id, "type", val)}
                                    >
                                        <SelectTrigger className="w-[180px] bg-slate-50 font-medium">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MCQ">Multiple Choice (MCQ)</SelectItem>
                                            <SelectItem value="MSQ">Multiple Select (MSQ)</SelectItem>
                                            <SelectItem value="NAT">Numerical Answer (NAT)</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-slate-500">Points:</span>
                                        <Input 
                                            type="number" 
                                            value={q.marks} 
                                            onChange={(e) => handleUpdateQuestion(q.id, "marks", Number(e.target.value))}
                                            className="w-20 text-center"
                                            min={1}
                                        />
                                    </div>
                                </div>

                                <Textarea 
                                    placeholder="Type your question here..." 
                                    value={q.text}
                                    onChange={(e) => handleUpdateQuestion(q.id, "text", e.target.value)}
                                    className="resize-none min-h-[80px] text-base"
                                />
                            </div>

                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0" onClick={() => handleRemoveQuestion(q.id)}>
                                <FiTrash2 className="h-5 w-5" />
                            </Button>
                        </CardHeader>

                        <CardContent className="pt-4 border-t border-slate-100 bg-slate-50/50">
                            {q.type === "NAT" ? (
                                <div className="max-w-md">
                                    <label className="text-sm font-medium text-slate-700 mb-2 block">Correct Numerical Answer</label>
                                    <Input 
                                        type="number" 
                                        placeholder="e.g. 42" 
                                        value={q.numericalCorrectAnswer ?? ""}
                                        onChange={(e) => handleUpdateQuestion(q.id, "numericalCorrectAnswer", e.target.value === "" ? undefined : Number(e.target.value))}
                                        className="bg-white"
                                    />
                                    <p className="text-xs text-slate-500 mt-2">Students must enter this exact number to receive points.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-slate-700 block mb-3">
                                        Options <span className="font-normal text-slate-500">(Click the circle to mark correct answers)</span>
                                    </label>
                                    
                                    {q.options?.map((opt, optIndex) => (
                                        <div key={optIndex} className="flex items-center gap-3 group">
                                            <MdDragIndicator className="h-5 w-5 text-slate-300 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity" />
                                            
                                            <button 
                                                onClick={() => toggleCorrectAnswer(q.id, optIndex)}
                                                className={`shrink-0 flex items-center justify-center transition-colors ${
                                                    opt.isCorrect ? "text-green-600" : "text-slate-300 hover:text-slate-400"
                                                }`}
                                            >
                                                {opt.isCorrect ? <FiCheckCircle className="h-6 w-6" /> : <FiCircle className="h-6 w-6" />}
                                            </button>

                                            <Input 
                                                value={opt.text}
                                                onChange={(e) => handleUpdateOption(q.id, optIndex, e.target.value)}
                                                className={`bg-white transition-all ${opt.isCorrect ? "border-green-200 ring-1 ring-green-100" : ""}`}
                                            />

                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveOption(q.id, optIndex)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <FiTrash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}

                                    <Button variant="outline" size="sm" onClick={() => handleAddOption(q.id)} className="ml-14 mt-2 gap-2 text-primary border-primary/20 hover:bg-primary/5">
                                        <FiPlus className="h-4 w-4" /> Add Option
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Button onClick={handleAddQuestion} variant="outline" className="w-full py-8 border-dashed border-2 hover:bg-slate-50 gap-2 text-slate-600">
                <FiPlus className="h-5 w-5" /> Add New Question
            </Button>
        </div>
    );
};

export default CBTBuilder;