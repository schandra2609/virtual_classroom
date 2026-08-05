import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FiArrowLeft, FiClock, FiFileText } from "react-icons/fi";
import { toast } from "sonner";
import { testattemptService } from "@/api/testattempt.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const AttemptList = () => {
    const { classroomId, paperId } = useParams<{ classroomId: string; paperId: string }>();
    const navigate = useNavigate();
    const [attempts, setAttempts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAttempts = async () => {
            if (!classroomId || !paperId) return;
            try {
                const res = await testattemptService.getMyAttemptsForPaper(classroomId, paperId);
                if (res.success) setAttempts(res.data);
            } catch (error) {
                toast.error("Failed to load attempts.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchAttempts();
    }, [classroomId, paperId]);

    return (
        <div className="space-y-6 max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard/classrooms/${classroomId}`)}>
                    <FiArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Test Attempts</h1>
                    <p className="text-sm text-slate-500">Review your past performance for this assessment.</p>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-10 text-slate-500">Loading attempts...</div>
            ) : attempts.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-slate-500">
                    <FiFileText className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                    No attempts found for this assessment.
                </div>
            ) : (
                <div className="grid gap-4">
                    {attempts.map((attempt) => (
                        <Link key={attempt.id} to={`/dashboard/classrooms/${classroomId}/papers/${paperId}/attempts/${attempt.id}`}>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer border-slate-200 hover:border-indigo-300">
                                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">{attempt.name}</h3>
                                        <div className="flex items-center gap-3 mt-2">
                                            <Badge variant={attempt.type === "OFFICIAL" ? "default" : "secondary"} className={attempt.type === "OFFICIAL" ? "bg-emerald-600 hover:bg-emerald-700" : ""}>
                                                {attempt.type}
                                            </Badge>
                                            <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                                                <FiClock className="h-3 w-3" />
                                                {new Date(attempt.date).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Marks Obtained</p>
                                        <p className="text-xl font-black text-indigo-700">
                                            {attempt.rawScore} <span className="text-slate-400 text-base font-medium">/ {attempt.maxScore}</span>
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AttemptList;