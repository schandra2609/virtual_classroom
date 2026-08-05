import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { FiUploadCloud, FiFileText, FiMonitor } from "react-icons/fi";

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
    targetDate: z.string().optional(), // Made optional so CBT doesn't trip the validation
    description: z.string().optional()
});

type CourseworkFormValues = z.infer<typeof courseworkSchema>;

const formatDateTimeLocal = (date: Date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
};

const CreateCourseworkDialog = ({ open, onOpenChange, onSuccess, editData }: CreateCourseworkDialogProps) => {
    const { id: classroomId } = useParams<{ id: string }>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const isEditMode = !!editData;

    const form = useForm<CourseworkFormValues>({
        resolver: zodResolver(courseworkSchema),
        defaultValues: {
            title: "",
            type: "ASSIGNMENT",
            targetDate: "",
            description: "",
        },
    });

    useEffect(() => {
        if (editData) {
            form.reset({
                title: editData.title,
                type: editData.type,
                targetDate: editData.targetDate ? formatDateTimeLocal(editData.targetDate) : "",
                description: editData.description || "",
            });
        } else {
            form.reset({
                title: "",
                type: "ASSIGNMENT",
                targetDate: "",
                description: "",
            });
            setSelectedFile(null);
        }
    }, [editData, form]);

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
                if (!values.targetDate) {
                    toast.error("Please provide a due date for the assignment.");
                    setIsSubmitting(false);
                    return;
                }

                if (isEditMode) {
                    const payload = {
                        title: values.title,
                        instructions: values.description || "",
                        deadline: new Date(values.targetDate).toISOString(),
                    };
                    const response = await assignmentService.updateAssignment(classroomId, editData.id, payload);
                    if (response.success) toast.success("Assignment updated successfully!");
                } else {
                    if (!selectedFile) {
                        toast.error("Please attach an assignment document (PDF).");
                        setIsSubmitting(false);
                        return;
                    }

                    const formData = new FormData();
                    formData.append("title", values.title);
                    formData.append("instruction", values.description || "");
                    formData.append("deadline", new Date(values.targetDate).toISOString());
                    formData.append("attachments", selectedFile); 

                    const response = await assignmentService.createAssignment(classroomId, formData);
                    if (response.success) toast.success("Assignment created successfully!");
                }

            } else if (values.type === "CBT_EXAM") {
                // Initialize with safe dummy defaults to satisfy backend requirements. 
                // The tutor will configure the real values in the final Generator stage.
                const payload = {
                    title: values.title,
                    liveAt: new Date(Date.now() + 86400000), // Default to +24 hours
                    duration: 60 // Default to 60 mins
                };

                if (isEditMode) {
                    // Only updating the title here, since dates are managed in the builder
                    const response = await qpaperService.updateQuestionPaper(classroomId, editData.id, { title: values.title });
                    if (response.success) toast.success("Exam title updated!");
                } else {
                    const response = await qpaperService.createQuestionPaper(classroomId, payload);
                    if (response.success) toast.success("Exam initialized! You can now configure it in the builder.");
                }
            }

            onSuccess();
            onOpenChange(false);
            
        } catch (error: any) {
            toast.error(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} coursework.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? "Edit Coursework" : "Create Coursework"}</DialogTitle>
                    <DialogDescription>
                        {isEditMode 
                            ? "Update the schedule, title, or instructions for this material." 
                            : "Upload an assignment PDF or initialize a secure CBT exam container."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Coursework Type</FormLabel>
                                        <Select 
                                            onValueChange={field.onChange} 
                                            defaultValue={field.value} 
                                            value={field.value}
                                            disabled={isEditMode}
                                        >
                                            <FormControl>
                                                <SelectTrigger className={`bg-slate-50 border-slate-300 ${isEditMode ? 'opacity-50' : ''}`}>
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

                        {selectedType === "ASSIGNMENT" && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {!isEditMode && (
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
                                )}

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

                                <div className="pt-2 border-t border-slate-100">
                                    <FormField
                                        control={form.control}
                                        name="targetDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Due Date & Time</FormLabel>
                                                <FormControl>
                                                    <Input type="datetime-local" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        )}

                        {selectedType === "CBT_EXAM" && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg flex gap-3">
                                    <FiMonitor className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-medium text-indigo-900">CBT Configuration</h4>
                                        <p className="text-xs text-indigo-700 mt-1">
                                            This initializes the exam wrapper. After clicking Create, you will set the **Live Schedule, Duration, and Rules** directly inside the AI Builder.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 mt-6">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : isEditMode ? "Save Changes" : selectedType === "CBT_EXAM" ? "Initialize Exam Container" : "Post Assignment"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateCourseworkDialog;