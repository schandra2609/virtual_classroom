import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FiLoader, FiTrendingUp } from "react-icons/fi";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import { testattemptService } from "@/api/testattempt.service";
import type { AttemptPerformanceDialogProps } from "@/api/types";

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white p-4 border border-slate-100 shadow-lg rounded-xl">
                <p className="font-bold text-slate-800 text-base mb-1">{label}</p>
                <p className="text-sm text-slate-600 mb-1">Attempt: <span className={`font-bold ${data.type === 'OFFICIAL' ? 'text-emerald-600' : 'text-amber-600'}`}>{data.type}</span></p>
                <p className="text-sm text-slate-600 mb-2">Marks Obtained: <span className="font-bold text-indigo-600">{data.score}%</span></p>
                <p className="text-xs text-slate-400 font-medium">{new Date(data.date).toLocaleString()}</p>
            </div>
        );
    }
    return null;
};

const AttemptPerformanceDialog = ({ classroomId, paperId, paperTitle, studentName, open, onOpenChange }: AttemptPerformanceDialogProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [chartData, setChartData] = useState<any[]>([]);

    useEffect(() => {
        const fetchAttempts = async () => {
            if (!paperId || !classroomId || !open) return;
            setIsLoading(true);
            try {
                const response = await testattemptService.getMyAttemptsForPaper(classroomId, paperId);
                if (response.success) setChartData(response.data);
            } catch (error) {
                toast.error("Failed to load attempt data.");
                onOpenChange(false);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAttempts();
        if (!open) setChartData([]);
    }, [classroomId, paperId, open, onOpenChange]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl p-6 bg-white">
                <DialogHeader className="mb-2">
                    <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <FiTrendingUp className="text-indigo-600" />
                        Attempt History
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 text-base">
                        {paperTitle} attempts for {studentName}
                    </DialogDescription>
                </DialogHeader>

                <div className="pt-6 h-[400px] w-full mt-2 bg-slate-50/50 rounded-xl border border-slate-100 p-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
                            <FiLoader className="animate-spin h-10 w-10 text-indigo-500" />
                        </div>
                    ) : chartData.length === 0 ? (
                        <div className="flex items-center justify-center h-full border-2 border-dashed border-slate-200 rounded-xl text-slate-500">
                            You have not attempted this exam yet.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} dy={15} />
                                <YAxis 
                                    tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} 
                                    axisLine={false} tickLine={false} dx={-10} 
                                    domain={[(dataMin: number) => Math.min(0, dataMin), 100]} 
                                    tickFormatter={(v: any) => `${v}%`} 
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }} />
                                <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} dot={{ r: 5, fill: '#4f46e5', strokeWidth: 0 }} activeDot={{ r: 8, strokeWidth: 0 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AttemptPerformanceDialog;