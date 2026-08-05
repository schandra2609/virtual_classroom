import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { FiLoader, FiTrendingUp } from "react-icons/fi";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import type { StudentPerformanceDialogProps } from "@/api/types";
import { memberService } from "@/api/member.service";

const CustomClassTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white p-4 border border-slate-100 shadow-lg rounded-xl min-w-[200px]">
                <p className="font-bold text-slate-800 text-base mb-2 border-b pb-2">{label}</p>
                <div className="space-y-1">
                    <p className="text-sm text-slate-600 flex justify-between">Highest Marks: <span className="font-bold text-green-600 ml-4">{data["Highest Score"]}%</span></p>
                    {data["Student Score"] !== null && (
                        <p className="text-sm text-slate-600 flex justify-between">Marks Obtained: <span className="font-bold text-red-500 ml-4">{data["Student Score"]}%</span></p>
                    )}
                </div>
                <p className="text-xs text-slate-400 font-medium mt-3 pt-2 border-t">{new Date(data.liveAt).toLocaleString()}</p>
            </div>
        );
    }
    return null;
};

const StudentPerformanceDialog = ({ classroomId, studentId, studentName, open, onOpenChange }: StudentPerformanceDialogProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [chartData, setChartData] = useState<any[]>([]);

    useEffect(() => {
        const fetchPerformance = async () => {
            if (!studentId || !classroomId || !open) return;
            
            setIsLoading(true);
            try {
                const response = await memberService.getStudentPerformance(classroomId, studentId);
                if (response.success) {
                    setChartData(response.data);
                }
            } catch (error) {
                toast.error("Failed to load student performance data.");
                onOpenChange(false);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPerformance();
        
        if (!open) {
            setChartData([]);
        }
    }, [classroomId, studentId, open, onOpenChange]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* Expanded to max-w-5xl for maximum visual precision and width */}
            <DialogContent className="sm:max-w-5xl p-6 bg-white">
                <DialogHeader className="mb-2">
                    <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <FiTrendingUp className="text-indigo-600" />
                        Performance Analytics
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 text-base">
                        {isLoading 
                            ? "Analyzing historical exam data..." 
                            : `Comparing ${studentName || 'the student'}'s scores against the class highest across all exams.`
                        }
                    </DialogDescription>
                </DialogHeader>

                {/* Increased height to 500px for a more spacious vertical axis */}
                <div className="pt-6 h-[500px] w-full mt-2 bg-slate-50/50 rounded-xl border border-slate-100 p-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
                            <FiLoader className="animate-spin h-10 w-10 text-indigo-500" />
                            <p className="font-medium">Aggregating test records...</p>
                        </div>
                    ) : chartData.length === 0 ? (
                        <div className="flex items-center justify-center h-full border-2 border-dashed border-slate-200 rounded-xl text-slate-500 bg-white">
                            No completed test data available for this student yet.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis 
                                    dataKey="examName" 
                                    tick={false}
                                    axisLine={{ stroke: '#cbd5e1' }}
                                    tickLine={false}
                                    dy={15}
                                />
                                <YAxis 
                                    tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }}
                                    axisLine={false}
                                    tickLine={false}
                                    dx={-10}
                                    domain={[(dataMin: number) => Math.min(0, dataMin), 100]} 
                                    tickFormatter={(value: number) => `${value}%`}
                                />
                                <Tooltip 
                                    content={<CustomClassTooltip />}
                                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }}
                                />
                                <Legend 
                                    wrapperStyle={{ paddingTop: '30px' }} 
                                    iconType="circle"
                                />
                                
                                {/* Highest Marks (Green, Dashed) */}
                                <Line 
                                    type="monotone" 
                                    dataKey="Highest Score" 
                                    stroke="#22c55e" 
                                    strokeWidth={3} 
                                    strokeDasharray="6 6" 
                                    dot={{ r: 5, fill: '#22c55e', strokeWidth: 0 }}
                                    activeDot={{ r: 8, strokeWidth: 0 }} 
                                />

                                {/* Student Marks (Red, Solid) */}
                                <Line 
                                    type="monotone" 
                                    dataKey="Student Score" 
                                    stroke="#ef4444" 
                                    strokeWidth={3}
                                    connectNulls={true} 
                                    dot={{ r: 5, fill: '#ef4444', strokeWidth: 0 }}
                                    activeDot={{ r: 8, strokeWidth: 0 }} 
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default StudentPerformanceDialog;