import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCheckCircle, FiXCircle, FiMinusCircle } from "react-icons/fi";
import { toast } from "sonner";
import { testattemptService } from "@/api/testattempt.service";
import type { AttemptReviewResponse, AttemptReviewDetail } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AttemptReview = () => {
    const { classroomId, paperId, attemptId } = useParams<{ classroomId: string; paperId: string; attemptId: string }>();
    const navigate = useNavigate();
    const [reviewData, setReviewData] = useState<AttemptReviewResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReview = async () => {
            if (!classroomId || !paperId || !attemptId) return;
            try {
                const res = await testattemptService.getAttemptReview(classroomId, paperId, attemptId);
                if (res.success) setReviewData(res.data);
            } catch (error) {
                toast.error("Failed to load review details.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchReview();
    }, [classroomId, paperId, attemptId]);

    const getStatus = (q: AttemptReviewDetail) => {
        if (q.studentAnswer === undefined || q.studentAnswer === null || q.studentAnswer === "") {
            return { msg: "Not Answered", color: "text-slate-400", icon: <FiMinusCircle className="inline mr-1" /> };
        }

        let isCorrect = false;
        if (q.type === "NAT") {
            isCorrect = Number(q.studentAnswer) === Number(q.correctAnswer);
        } else if (q.type === "MCQ") {
            isCorrect = q.studentAnswer === q.correctAnswer[0];
        } else if (q.type === "MSQ") {
            const studentArr = String(q.studentAnswer).split(",").sort();
            const correctArr = [...q.correctAnswer].sort();
            isCorrect = JSON.stringify(studentArr) === JSON.stringify(correctArr);
        }

        return isCorrect 
            ? { msg: "Correct", color: "text-green-600", icon: <FiCheckCircle className="inline mr-1" /> }
            : { msg: "Incorrect", color: "text-red-500", icon: <FiXCircle className="inline mr-1" /> };
    };

    if (isLoading) return <div className="text-center py-20 text-slate-500">Loading comprehensive review...</div>;
    if (!reviewData) return <div className="text-center py-20 text-slate-500">Review data not found.</div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto w-full pb-20 select-none">
            <div className="flex items-center gap-4 border-b border-slate-200 pb-4 sticky top-0 bg-slate-50 z-10 pt-2">
                <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="bg-white">
                    <FiArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-900">Attempt Review</h1>
                    <p className="text-sm text-slate-500">{reviewData.title}</p>
                </div>
                <div className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-lg font-bold">
                    Score: {reviewData.score}
                </div>
            </div>

            <div className="space-y-6">
                {reviewData.details.map((q, index) => {
                    const status = getStatus(q);
                    const studentAnsArr = q.type === "MSQ" ? String(q.studentAnswer || "").split(",") : [];

                    return (
                        <Card key={q.id} className="border-slate-200 shadow-sm overflow-hidden pointer-events-none">
                            <CardHeader className="bg-slate-100/50 border-b border-slate-100 py-3">
                                <CardTitle className="text-sm font-bold text-slate-700 flex justify-between items-center">
                                    <span>Question {index + 1} <span className="text-slate-400 font-normal ml-2">({q.type})</span></span>
                                    <span className="text-slate-500">{q.marks} Marks</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <p className="text-lg font-medium text-slate-900 whitespace-pre-wrap mb-2">{q.text}</p>
                                
                                {/* Status Message under Question */}
                                <div className={`text-sm font-bold mb-6 opacity-80 ${status.color}`}>
                                    {status.icon} {status.msg}
                                </div>

                                {/* Options Render */}
                                {(q.type === "MCQ" || q.type === "MSQ") && (
                                    <div className="space-y-3">
                                        {q.options.map((opt) => {
                                            const isSelected = q.type === "MCQ" ? q.studentAnswer === opt.id : studentAnsArr.includes(opt.id);
                                            const isMissed = q.type === "MSQ" && opt.isCorrect && !isSelected;
                                            
                                            let bgClass = "bg-white border-slate-200";
                                            if (opt.isCorrect) bgClass = "bg-green-50 border-green-400 ring-1 ring-green-400";
                                            else if (isSelected) bgClass = "bg-red-50 border-red-200";

                                            return (
                                                <div key={opt.id} className={`flex items-center justify-between p-4 border rounded-lg ${bgClass}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`h-5 w-5 border-2 flex items-center justify-center shrink-0 ${q.type === "MCQ" ? "rounded-full" : "rounded"} ${isSelected ? (opt.isCorrect ? "border-green-600" : "border-red-500") : "border-slate-300"}`}>
                                                            {isSelected && <div className={`h-2.5 w-2.5 ${q.type === "MCQ" ? "rounded-full" : "rounded-sm"} ${opt.isCorrect ? "bg-green-600" : "bg-red-500"}`} />}
                                                        </div>
                                                        <span className={`text-base font-medium ${opt.isCorrect ? "text-green-900" : isSelected ? "text-red-800" : "text-slate-700"}`}>
                                                            {opt.text}
                                                        </span>
                                                    </div>
                                                    
                                                    {/* MSQ Missed Indicator */}
                                                    {isMissed && (
                                                        <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded">MISSED</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* NAT Render */}
                                {q.type === "NAT" && (
                                    <div className="mt-4 flex gap-6">
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Your Answer</p>
                                            <div className={`p-4 rounded-lg border text-lg font-mono font-bold ${q.studentAnswer === q.correctAnswer ? "bg-green-50 border-green-200 text-green-800" : "bg-slate-50 border-slate-200 text-slate-700"}`}>
                                                {q.studentAnswer !== null ? q.studentAnswer : "N/A"}
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Correct Answer</p>
                                            <div className="p-4 rounded-lg border border-green-400 bg-green-50 text-green-900 text-lg font-mono font-bold">
                                                {q.correctAnswer}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default AttemptReview;