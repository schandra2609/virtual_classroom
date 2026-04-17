import { useState } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { FiUploadCloud, FiFileText, FiClock, FiMonitor } from "react-icons/fi";

// Services & Types
import { assignmentService } from "@/api/assignment.service";
import { qpaperService } from "@/api/qpaper.service";
import type { CreateCourseworkDialogProps } from "@/api/types";

// Shadcn Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Updated Validation Schema
const courseworkSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters."),
    type: z.enum(["ASSIGNMENT", "CBT_EXAM"], { message: "Please select a coursework type." }),
    targetDate: z.string().min(1, "Date is required."),
    description: z.string().optional(),
    duration: z.number().min(5, "Exam must be at least 5 minutes.").optional(),
});

type CourseworkFormValues = z.infer<typeof courseworkSchema>;

const CreateCourseworkDialog = ({ open, onOpenChange, onSuccess }: CreateCourseworkDialogProps) => {
    const { id: classroomId } = useParams<{ id: string }>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const form = useForm<CourseworkFormValues>({
        resolver: zodResolver(courseworkSchema),
        defaultValues: {
            title: "",
            type: "ASSIGNMENT",
            targetDate: "",
            description: "",
            duration: 60,
        },
    });

    const selectedType = form.watch("type");

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== "application/pdf") {
                toast.error("Please upload a PDF document.");
                return;
            }
            setSelectedFile(file);
            toast.success("Assignment document attached.");
        }
    };

    const onSubmit = async (values: CourseworkFormValues) => {
        if (!classroomId) return toast.error("Classroom ID missing.");

        try {
            setIsSubmitting(true);
            
            if (values.type === "ASSIGNMENT") {
                if (!selectedFile) {
                    toast.error("Please attach an assignment document (PDF).");
                    setIsSubmitting(false);
                    return;
                }

                const formData = new FormData();
                formData.append("title", values.title);
                formData.append("instruction", values.description || "");
                formData.append("deadline", new Date(values.targetDate).toISOString());
                formData.append("document", selectedFile); // Ensure this key matches your backend multer config!

                const response = await assignmentService.createAssignment(classroomId, formData);
                if (response.success) toast.success("Assignment created successfully!");

            } else if (values.type === "CBT_EXAM") {
                if (!values.duration) {
                    toast.error("Please specify the exam duration.");
                    setIsSubmitting(false);
                    return;
                }

                const payload = {
                    title: values.title,
                    liveAt: new Date(values.targetDate),
                    duration: values.duration
                };

                const response = await qpaperService.createQuestionPaper(classroomId, payload);
                if (response.success) toast.success("Exam scheduled! You can now add questions in the CBT Builder.");
            }

            onSuccess();
            form.reset();
            setSelectedFile(null);
            onOpenChange(false);
            
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create coursework.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Coursework</DialogTitle>
                    <DialogDescription>
                        Upload an assignment PDF or schedule a secure CBT exam.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                        
                        {/* 1. Global Setup */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Coursework Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-slate-50 border-slate-300">
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="ASSIGNMENT">Standard Assignment (PDF)</SelectItem>
                                                <SelectItem value="CBT_EXAM">Secure CBT Exam</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Midterm Assessment" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* 2A. ASSIGNMENT SPECIFIC UI */}
                        {selectedType === "ASSIGNMENT" && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-slate-50 relative hover:bg-slate-100 transition-colors">
                                    <input 
                                        type="file" 
                                        accept=".pdf" 
                                        onChange={handleFileUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                    />
                                    {selectedFile ? (
                                        <>
                                            <FiFileText className="h-10 w-10 text-primary mb-2" />
                                            <p className="text-sm font-medium text-slate-900">{selectedFile.name}</p>
                                            <p className="text-xs text-slate-500 mt-1">Click to replace file</p>
                                        </>
                                    ) : (
                                        <>
                                            <FiUploadCloud className="h-10 w-10 text-slate-400 mb-2" />
                                            <p className="text-sm font-medium text-slate-900">Upload Assignment Document</p>
                                            <p className="text-xs text-slate-500 mt-1">Students will view this PDF and submit their own.</p>
                                        </>
                                    )}
                                </div>

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Additional Instructions (Optional)</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="e.g. Ensure your final answers are boxed." className="resize-none h-20" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        {/* 2B. CBT EXAM SPECIFIC UI */}
                        {selectedType === "CBT_EXAM" && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg flex gap-3">
                                    <FiMonitor className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-medium text-indigo-900">CBT Configuration</h4>
                                        <p className="text-xs text-indigo-700 mt-1">
                                            This will initialize the exam container. Once created, you can navigate to the CBT Builder to write your questions, configure options, or use the Gemini AI generator.
                                        </p>
                                    </div>
                                </div>
                                <FormField
                                    control={form.control}
                                    name="duration"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Duration (in minutes)</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <FiClock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                    <Input type="number" className="pl-9" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        {/* 3. Global Configuration (Schedule) */}
                        <div className="pt-2 border-t border-slate-100">
                            <FormField
                                control={form.control}
                                name="targetDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{selectedType === "ASSIGNMENT" ? "Due Date & Time" : "Live At (Scheduled Start Time)"}</FormLabel>
                                        <FormControl>
                                            <Input type="datetime-local" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 mt-6">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : selectedType === "CBT_EXAM" ? "Initialize Exam" : "Post Assignment"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateCourseworkDialog;