import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FiArrowLeft, FiFileText, FiUsers, FiInfo } from "react-icons/fi";
import { BsMegaphone } from "react-icons/bs";
import { toast } from "sonner";

// Redux & Services
import { useAppSelector } from "@/hooks/redux";
import { classroomService } from "@/api/classroom.service";
import type { Classroom } from "@/api/types";
import { useClassroomSocket } from "@/hooks/useClassroomSocket";

// Shadcn Components
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Sub-components
import StreamTab from "@/features/classroom/StreamTab";
import ClassworkTab from "@/features/classroom/ClassworkTab";
import PeopleTab from "@/features/classroom/PeopleTab";

const ClassroomDetails = () => {
    const { id: classroomId } = useParams<{ id: string }>();
    const { user } = useAppSelector((state) => state.auth);
    
    useClassroomSocket(classroomId);
    
    const [classroom, setClassroom] = useState<(Classroom & { members?: any[] }) | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchClassroomDetails = async () => {
            if (!classroomId) return;
            try {
                const response = await classroomService.getClassroomById(classroomId);
                if (response.success && response.data) {
                    setClassroom(response.data);
                }
            } catch (error: any) {
                toast.error(error.response?.data?.message || "Failed to load classroom details");
            } finally {
                setIsLoading(false);
            }
        };

        fetchClassroomDetails();
    }, [classroomId]);

    if (isLoading) {
        return (
            <div className="space-y-6 max-w-5xl mx-auto w-full">
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-10 w-full max-w-md" />
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        );
    }

    if (!classroom) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <h2 className="text-2xl font-bold text-slate-800">Classroom not found</h2>
                <p className="text-slate-500 mt-2">The classroom you are looking for does not exist or you do not have access.</p>
                <Button asChild className="mt-6">
                    <Link to="/dashboard">Return to Dashboard</Link>
                </Button>
            </div>
        );
    }

    const currentUserMember = classroom.members?.find((m: any) => m.userId === user?.id);
    const currentUserRole = currentUserMember?.role;

    return (
        <div className="flex flex-col h-full w-full max-w-5xl mx-auto gap-6 min-h-0">
            {/* 🚨 CHANGED: Banner now contains the buttons inside it */}
            <div className="shrink-0">
                <div className="relative h-48 rounded-xl bg-primary/10 border border-slate-200 overflow-hidden flex flex-col p-4 sm:p-6">
                    
                    {/* Top Row of Banner: Navigation & Settings Buttons */}
                    <div className="flex items-center justify-between relative z-20 w-full">
                        <Button variant="ghost" size="icon" asChild className="text-slate-700 hover:text-slate-900 hover:bg-black/5 rounded-full h-10 w-10">
                            <Link to="/dashboard">
                                <FiArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>

                        {/* STRICT RBAC: Only Creator and Co-Tutors can see Info */}
                        {(currentUserRole === "CREATOR" || currentUserRole === "CO_TUTOR") && (
                            <Button variant="ghost" size="icon" asChild className="text-slate-700 hover:text-slate-900 hover:bg-black/5 rounded-full h-10 w-10">
                                <Link to={`/dashboard/classrooms/${classroomId}/info`}>
                                    <FiInfo className="h-5 w-5" />
                                </Link>
                            </Button>
                        )}
                    </div>

                    {/* Bottom Row of Banner: Classroom Details */}
                    <div className="relative z-10 mt-auto px-2">
                        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                            {classroom.name}
                        </h1>
                        <p className="text-lg text-slate-700 mt-1 font-medium">
                            {classroom.subject} &bull; Batch {classroom.batch}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs Component (Unchanged) */}
            <Tabs defaultValue="stream" className="flex flex-col flex-1 overflow-hidden min-h-0 w-full">
                <div className="w-full flex justify-start mb-4 shrink-0">
                    <TabsList className="grid w-full grid-cols-3 h-12 items-center bg-slate-200/50">
                        <TabsTrigger value="stream" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <BsMegaphone className="mr-2 h-4 w-4 hidden sm:inline-block" />
                            Stream
                        </TabsTrigger>
                        <TabsTrigger value="classwork" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <FiFileText className="mr-2 h-4 w-4 hidden sm:inline-block" />
                            Classwork
                        </TabsTrigger>
                        <TabsTrigger value="people" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <FiUsers className="mr-2 h-4 w-4 hidden sm:inline-block" />
                            People
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="stream" className="flex-1 overflow-hidden data-[state=active]:flex flex-col m-0 outline-none min-h-0">
                    <StreamTab classroom={classroom} />
                </TabsContent>

                <TabsContent value="classwork" className="flex-1 overflow-y-auto m-0 outline-none pr-2 pb-6 min-h-0">
                    <ClassworkTab classroom={classroom} />
                </TabsContent>

                <TabsContent value="people" className="flex-1 overflow-y-auto m-0 outline-none pr-2 pb-6 min-h-0">
                    <PeopleTab classroom={classroom} />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ClassroomDetails;