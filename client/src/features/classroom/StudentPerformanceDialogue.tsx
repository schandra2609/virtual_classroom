import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

// import { classroomService } from "@/api/classroom.service";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

import type { StudentPerformanceDialogProps } from "@/api/types";
import { mockStudentPerformance } from "@/lib/dummy";

const StudentPerformanceDialog = ({ classroomId, studentId, open, onOpenChange }: StudentPerformanceDialogProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [chartData, setChartData] = useState<any[]>([]);
    const [studentName, setStudentName] = useState("");

    useEffect(() => {
        const fetchPerformance = async () => {
            if (!studentId || !open) return;
            
            setIsLoading(true);
            try {
                setTimeout(() => {
                    setChartData(mockStudentPerformance.performanceData);
                    setStudentName(mockStudentPerformance.studentName);
                }, 800);
            } catch (error) {
                toast.error("Failed to load student performance data.");
                onOpenChange(false);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPerformance();
    }, [classroomId, studentId, open, onOpenChange]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>Performance Analytics</DialogTitle>
                    <DialogDescription>
                        {isLoading ? "Loading data..." : `Comparing ${studentName}'s scores against the class highest.`}
                    </DialogDescription>
                </DialogHeader>

                <div className="pt-4 h-[400px] w-full">
                    {isLoading ? (
                        <Skeleton className="w-full h-full rounded-xl" />
                    ) : chartData.length === 0 ? (
                        <div className="flex items-center justify-center h-full border-2 border-dashed border-slate-200 rounded-xl text-slate-500 bg-slate-50">
                            No test data available for this student yet.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis 
                                    dataKey="testName" 
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    axisLine={{ stroke: '#cbd5e1' }}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis 
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                    dx={-10}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                
                                {/* The exact requested colors: Red for Student, Green for Highest */}
                                <Line 
                                    type="monotone" 
                                    dataKey="studentScore" 
                                    name="Marks Obtained" 
                                    stroke="#ef4444" // Tailwind red-500
                                    strokeWidth={3}
                                    activeDot={{ r: 8 }} 
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="highestScore" 
                                    name="Highest Marks" 
                                    stroke="#22c55e" // Tailwind green-500
                                    strokeWidth={3} 
                                    strokeDasharray="5 5" // Dotted line for highest score visualization
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