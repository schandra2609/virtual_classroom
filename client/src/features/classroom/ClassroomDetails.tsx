import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FiArrowLeft, FiFileText, FiUsers } from "react-icons/fi";
import { BsMegaphone } from "react-icons/bs";
import { toast } from "sonner";

// Redux & Services
import { classroomService } from "@/api/classroom.service";
import type { Classroom } from "@/api/types";
import { useClassroomSocket } from "@/hooks/useClassroomSocket";

// Shadcn Components
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Sub-components
import StreamTab from "./StreamTab";
import ClassworkTab from "./ClassworkTab";
import PeopleTab from "./PeopleTab";

const ClassroomDetails = () => {
    const { id: classroomId } = useParams<{ id: string }>();
    useClassroomSocket(classroomId);
    
    const [classroom, setClassroom] = useState<Classroom | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchClassroomDetails = async () => {
            if (!classroomId) return;
            try {
                const response = await classroomService.getClassroomById(classroomId);
                if (response.success) {
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
            <div className="space-y-6">
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

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            
            {/* Back Button & Header */}
            <div>
                <Button variant="ghost" asChild className="mb-4 -ml-4 text-slate-500 hover:text-slate-900">
                    <Link to="/dashboard">
                        <FiArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>

                {/* Hero Banner */}
                <div className="relative h-48 rounded-xl bg-primary/10 border border-slate-200 overflow-hidden flex flex-col justify-end p-6 sm:p-8">
                    <div className="relative z-10">
                        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                            {classroom.name}
                        </h1>
                        <p className="text-lg text-slate-700 mt-1 font-medium">
                            {classroom.subject} &bull; Batch {classroom.batch}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="stream" className="flex flex-col w-full">
                
                {/* Tab Navigation Menu */}
                <div className="w-full flex justify-start mb-6">
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

                {/* Stream Content */}
                <TabsContent value="stream" className="w-full focus-visible:outline-none focus-visible:ring-0">
                    <StreamTab classroom={classroom} />
                </TabsContent>

                {/* Classwork Content */}
                <TabsContent value="classwork" className="w-full focus-visible:outline-none focus-visible:ring-0">
                    <ClassworkTab classroom={classroom} />
                </TabsContent>

                {/* People Content */}
                <TabsContent value="people" className="w-full focus-visible:outline-none focus-visible:ring-0">
                    <PeopleTab classroom={classroom} />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ClassroomDetails;