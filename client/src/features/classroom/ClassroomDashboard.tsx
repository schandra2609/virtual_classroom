import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { FiPlus, FiUsers, FiBookOpen, FiCopy, FiCheckCircle, FiInbox } from "react-icons/fi";
import { FaGraduationCap } from "react-icons/fa";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Redux & Services
import { useAppSelector } from "@/hooks/redux";
import { classroomService } from "@/api/classroom.service";
import type { Classroom } from "@/api/types";

// Shadcn Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// Validation Schemas
const createSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    subject: z.string().min(2, "Subject is required"),
    batch: z.string().min(2, "Batch is required"),
});

const joinSchema = z.object({
    joiningCode: z.string().length(8, "Joining code must be exactly 8 characters"),
});

const ClassroomsDashboard = () => {
    const { user } = useAppSelector((state) => state.auth);

    // All hooks must be declared unconditionally — React Rules of Hooks
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Form setups
    const createForm = useForm<z.infer<typeof createSchema>>({
        resolver: zodResolver(createSchema),
        defaultValues: { name: "", subject: "", batch: "" },
    });

    const joinForm = useForm<z.infer<typeof joinSchema>>({
        resolver: zodResolver(joinSchema),
        defaultValues: { joiningCode: "" },
    });

    useEffect(() => {
        // Don't fetch classrooms if this is an admin (they get redirected)
        if (user?.accountType === "ADMINISTRATOR") return;

        const fetchClassrooms = async () => {
            try {
                const response = await classroomService.getMyClassrooms();
                if (response.success) {
                    setClassrooms(response.data);
                }
            } catch (error: any) {
                toast.error(error.response?.data?.message || "Failed to load classrooms");
            } finally {
                setIsLoading(false);
            }
        };
        fetchClassrooms();
    }, [user?.accountType]);

    // Handlers
    const onCreateClassroom = async (values: z.infer<typeof createSchema>) => {
        try {
            const res = await classroomService.createClassroom(values);
            if (res.success) {
                setClassrooms([res.data, ...classrooms]);
                toast.success(res.message);
                setIsDialogOpen(false);
                createForm.reset();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create classroom");
        }
    };

    const onJoinClassroom = async (values: z.infer<typeof joinSchema>) => {
        try {
            const res = await classroomService.joinClassroom(values);
            if (res.success) {
                toast.success(res.message);
                setIsDialogOpen(false);
                joinForm.reset();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to send join request");
        }
    };

    const copyToClipboard = (code: string, id: string) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        toast.success("Joining code copied to clipboard!");
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="space-y-6">
            {/* Admin redirect — placed in JSX to keep hooks unconditional */}
            {user?.accountType === "ADMINISTRATOR" && (
                <Navigate to="/dashboard/applications" replace />
            )}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Your Classrooms
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Manage and access your enrolled courses.
                    </p>
                </div>

                {/* Role-Based Action Buttons */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {user?.accountType === "TUTOR" ? (
                        <>
                            <Button variant="outline" className="gap-2" asChild>
                                <Link to="/dashboard/invitations">
                                    <FiInbox className="h-4 w-4" /> Invitations
                                </Link>
                            </Button>

                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="gap-2">
                                        <FiPlus className="h-4 w-4" /> Create Classroom
                                    </Button>
                                </DialogTrigger>

                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Create New Classroom</DialogTitle>
                                        <DialogDescription>
                                            Set up a new environment for your students.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <Form {...createForm}>
                                        <form onSubmit={createForm.handleSubmit(onCreateClassroom)} className="space-y-4 pt-4">
                                            <FormField control={createForm.control} name="name" render={({ field }) => (
                                                <FormItem><FormLabel>Classroom Name</FormLabel><FormControl><Input placeholder="e.g. Intro to React" {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <FormField control={createForm.control} name="subject" render={({ field }) => (
                                                <FormItem><FormLabel>Subject</FormLabel><FormControl><Input placeholder="e.g. Web Development" {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <FormField control={createForm.control} name="batch" render={({ field }) => (
                                                <FormItem><FormLabel>Batch/Section</FormLabel><FormControl><Input placeholder="e.g. Fall 2026" {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <Button type="submit" className="w-full mt-4" disabled={createForm.formState.isSubmitting}>
                                                {createForm.formState.isSubmitting ? "Creating..." : "Create"}
                                            </Button>
                                        </form>
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        </>
                    ) : (
                        <>
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="gap-2">
                                        <FiPlus className="h-4 w-4" />
                                        {user?.accountType !== "STUDENT" ? "Create Classroom" : "Join Classroom"}
                                    </Button>
                                </DialogTrigger>
                                
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>
                                            {user?.accountType !== "STUDENT" ? "Create New Classroom" : "Join Classroom"}
                                        </DialogTitle>
                                        <DialogDescription>
                                            {user?.accountType !== "STUDENT" 
                                                ? "Set up a new environment for your students." 
                                                : "Enter the 8-character joining code."}
                                        </DialogDescription>
                                    </DialogHeader>

                                    {/* Conditional Form Render */}
                                    {user?.accountType !== "STUDENT" ? (
                                        <Form {...createForm}>
                                            <form onSubmit={createForm.handleSubmit(onCreateClassroom)} className="space-y-4 pt-4">
                                                <FormField control={createForm.control} name="name" render={({ field }) => (
                                                    <FormItem><FormLabel>Classroom Name</FormLabel><FormControl><Input placeholder="e.g. Intro to React" {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                                <FormField control={createForm.control} name="subject" render={({ field }) => (
                                                    <FormItem><FormLabel>Subject</FormLabel><FormControl><Input placeholder="e.g. Web Development" {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                                <FormField control={createForm.control} name="batch" render={({ field }) => (
                                                    <FormItem><FormLabel>Batch/Section</FormLabel><FormControl><Input placeholder="e.g. Fall 2026" {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                                <Button type="submit" className="w-full mt-4" disabled={createForm.formState.isSubmitting}>
                                                    {createForm.formState.isSubmitting ? "Creating..." : "Create"}
                                                </Button>
                                            </form>
                                        </Form>
                                    ) : (
                                        <Form {...joinForm}>
                                            <form onSubmit={joinForm.handleSubmit(onJoinClassroom)} className="space-y-4 pt-4">
                                                <FormField control={joinForm.control} name="joiningCode" render={({ field }) => (
                                                    <FormItem><FormLabel>Joining Code</FormLabel><FormControl><Input placeholder="e.g. X7b9kQ72" className="font-mono tracking-[10px] flex items-center justify-center border border-indigo-900" maxLength={8} {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                                <Button type="submit" className="w-full mt-4" disabled={joinForm.formState.isSubmitting}>
                                                    {joinForm.formState.isSubmitting ? "Requesting..." : "Request to Join"}
                                                </Button>
                                            </form>
                                        </Form>
                                    )}
                                </DialogContent>
                            </Dialog>
                        </>
                    )}
                </div>
            </div>

            {/* Classrooms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="overflow-hidden">
                            <Skeleton className="h-32 w-full rounded-none" />
                            <CardContent className="p-6">
                                <Skeleton className="h-6 w-3/4 mb-4" />
                                <Skeleton className="h-4 w-1/2" />
                            </CardContent>
                        </Card>
                    ))
                ) : classrooms.length === 0 ? (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
                        <FiBookOpen className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900">No classrooms yet</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mt-1">
                            {user?.accountType === "TUTOR" 
                                ? "Create your first classroom to start inviting students."
                                : "You haven't joined any classrooms yet. Use a joining code to get started."}
                        </p>
                    </div>
                ) : (
                    classrooms.map((cls) => (
                        <Card key={cls.id} className="group overflow-hidden transition-all hover:shadow-md hover:border-slate-300 flex flex-col">
                            <div className="relative h-28 bg-primary/10 flex items-center justify-center border-b border-slate-100">
                                <FaGraduationCap className="h-12 w-12 text-primary/40 group-hover:text-primary/60 transition-colors" />
                                
                                {/* Join Code Display (Only visible to Tutors/Creators) */}
                                {user?.accountType === "TUTOR" && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button 
                                                    onClick={() => copyToClipboard(cls.joiningCode, cls.id)}
                                                    className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/80 backdrop-blur-sm hover:bg-white text-xs font-semibold px-2.5 py-1 rounded-md shadow-sm border border-slate-200/60 transition-all text-slate-700 hover:text-primary"
                                                >
                                                    {copiedId === cls.id ? <FiCheckCircle className="h-3.5 w-3.5 text-green-600" /> : <FiCopy className="h-3.5 w-3.5" />}
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Copy Joining Code</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>
                            
                            <CardHeader className="pb-3 pt-5">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-xl line-clamp-1">{cls.name}</CardTitle>
                                </div>
                                <CardDescription className="font-medium text-primary mt-1">
                                    {cls.subject}
                                </CardDescription>
                            </CardHeader>
                            
                            <CardContent className="pb-4 flex-1">
                                <div className="flex items-center text-sm text-slate-500 gap-2">
                                    <FiUsers className="h-4 w-4" />
                                    <span>Batch: {cls.batch}</span>
                                </div>
                            </CardContent>
                            
                            <CardFooter className="bg-slate-50/50 pt-4 border-t border-slate-100 mt-auto">
                                <Button asChild variant="secondary" className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900">
                                    <Link to={`/dashboard/classrooms/${cls.id}`}>
                                        Enter Classroom
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default ClassroomsDashboard;