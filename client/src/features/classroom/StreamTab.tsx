import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { FiSend, FiTrash2, FiEdit2, FiMoreVertical, FiPaperclip, FiFile, FiX } from "react-icons/fi";
import { BsMegaphone } from "react-icons/bs";
import { toast } from "sonner";

// Services & Redux
import { useAppSelector } from "@/hooks/redux";
import { announcementService } from "@/api/announcement.service";
import { commentService } from "@/api/comment.service";
import type { Classroom, Announcement, Comment } from "@/api/types";

// Shadcn UI
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface StreamTabProps {
    classroom: Classroom & { members?: any[] };
}

const getInitials = (name?: string) => name ? name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2) : "U";

// --- SUB-COMPONENT: COMMENTS SECTION ---
// (No changes here, keeping it exactly as you had it)
const CommentSection = ({ 
    announcementId, 
    classroom, 
    currentUserRole, 
    currentUserId 
}: { 
    announcementId: string, 
    classroom: StreamTabProps['classroom'], 
    currentUserRole: string | undefined, 
    currentUserId: string 
}) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAppSelector((state) => state.auth);

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const res = await commentService.getCommentsForAnnouncement(classroom.id, announcementId);
                if (res.success) setComments(res.data);
            } catch (error) {
                console.error("Failed to load comments", error);
            }
        };
        fetchComments();
    }, [classroom.id, announcementId]);

    const handlePostComment = async () => {
        if (!newComment.trim()) return;
        try {
            setIsSubmitting(true);
            const res = await commentService.createComment(classroom.id, announcementId, { text: newComment });
            if (res.success) {
                setComments(prev => [...prev, res.data]);
                setNewComment("");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to post comment");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!window.confirm("Delete this comment?")) return;
        try {
            await commentService.deleteComment(classroom.id, announcementId, commentId);
            setComments(prev => prev.filter(c => c.id !== commentId));
            toast.success("Comment deleted");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete comment");
        }
    };

    return (
        <div className="mt-2 pt-3 border-t border-slate-200 space-y-4">
            <div className="space-y-3">
                {comments.map((comment) => {
                    const isAuthor = comment.authorId === currentUserId;
                    const commentAuthorMember = classroom.members?.find(m => m.userId === comment.authorId);
                    const isStudentComment = commentAuthorMember?.role === "STUDENT";
                    const canDelete = currentUserRole === "CREATOR" || isAuthor || (currentUserRole === "CO_TUTOR" && isStudentComment);

                    return (
                        <div key={comment.id} className="flex gap-4 group">
                            <Avatar className="h-7 w-7">
                                <AvatarImage src={comment.author?.profilePhotoUrl || undefined} />
                                <AvatarFallback className="text-xs bg-slate-200">{getInitials(comment.author?.fullName)}</AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 bg-slate-100 rounded-2xl border border-slate-300 rounded-tl-none px-4 py-1 relative pr-10">
                                <div>
                                    <span className="text-sm font-semibold text-slate-900">{comment.author?.fullName}</span>
                                </div>

                                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{comment.text}</p>

                                <div className="flex justify-end -mr-8">
                                    <span className="text-[10px] text-slate-400 font-medium tracking-tight">
                                        {format(new Date(comment.createdAt), "MMM d, p")}
                                    </span>
                                </div>

                                {canDelete && (
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => handleDeleteComment(comment.id)}
                                        className="absolute right-1 top-1 h-8 w-8 text-red-500 hover:bg-red-50 transition-opacity"
                                        title="Delete Comment"
                                    >
                                        <FiTrash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex gap-3 items-start">
                <Avatar className="h-7 w-7">
                    <AvatarImage src={user?.profilePhotoUrl || undefined} alt={user?.fullName} />
                    <AvatarFallback className="text-xs bg-slate-200">{getInitials(user?.fullName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 relative">
                    <Textarea 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a class comment..."
                        className="min-h-[40px] resize-none pr-12 rounded-xl bg-white border-slate-200 focus-visible:ring-primary/20"
                        rows={1}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handlePostComment();
                            }
                        }}
                    />
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        className="absolute right-1 bottom-1 h-8 w-8 text-primary hover:bg-primary/10"
                        onClick={handlePostComment}
                        disabled={!newComment.trim() || isSubmitting}
                    >
                        <FiSend className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT: STREAM TAB ---
const StreamTab = ({ classroom }: StreamTabProps) => {
    const { user } = useAppSelector((state) => state.auth);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [newPostText, setNewPostText] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const currentUserMember = classroom.members?.find((m) => m.userId === user?.id);
    const currentUserRole = currentUserMember?.role; 
    const isStaff = currentUserRole === "CREATOR" || currentUserRole === "CO_TUTOR";

    useEffect(() => {
        const fetchStream = async () => {
            try {
                const res = await announcementService.getAnnouncements(classroom.id);
                if (res.success) setAnnouncements(res.data);
            } catch (error) {
                toast.error("Failed to load stream");
            }
        };
        fetchStream();
    }, [classroom.id]);

    // Handle file selection from hidden input
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setSelectedFiles((prev) => [...prev, ...filesArray]);
        }
        // Reset the input so the user can select the same file again if they remove it
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Remove a selected file before posting
    const removeFile = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handlePostAnnouncement = async () => {
        // Ensure there is text before posting
        if (!newPostText.trim()) {
            toast.error("Announcement text is required");
            return;
        }

        try {
            setIsPosting(true);
            const formData = new FormData();
            formData.append("message", newPostText);

            // Append selected files to FormData
            selectedFiles.forEach(file => formData.append("attachments", file));

            const res = await announcementService.createAnnouncement(classroom.id, formData);
            if (res.success) {
                setAnnouncements(prev => [res.data, ...prev]);
                setNewPostText("");
                setSelectedFiles([]);
                toast.success(res.message || "Announcement posted!");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to post");
        } finally {
            setIsPosting(false);
        }
    };

    const handleDeleteAnnouncement = async (id: string) => {
        if (!window.confirm("Permanently delete this announcement?")) return;
        try {
            const res = await announcementService.deleteAnnouncement(classroom.id, id);
            setAnnouncements(prev => prev.filter(a => a.id !== id));
            toast.success(res.message || "Announcement deleted");
        } catch (error: any) {
            toast.error(error.message || "Failed to delete");
        }
    };

    return (
        <div className="flex-1 overflow-y-auto pr-2 pb-12 space-y-6 w-full min-h-0">

            {/* Create Announcement Box */}
            {isStaff && (
                <Card className="shadow-sm border-slate-200 shrink-0">
                    <CardContent className="p-3 sm:p-4 flex gap-3 items-start">
                        <Avatar className="h-8 w-8 hidden sm:block border border-slate-100 mt-0.5">
                            <AvatarImage src={user?.profilePhotoUrl || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(user?.fullName)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                            <Textarea 
                                placeholder="Announce something to your class..."
                                value={newPostText}
                                onChange={e => setNewPostText(e.target.value)}
                                rows={1} 
                                className="resize-none border-slate-200 focus-visible:ring-primary/20 min-h-[40px] py-2 px-3 text-sm"
                            />

                            {/* Hidden File Input */}
                            <input 
                                type="file" 
                                multiple
                                accept=".pdf,.doc,.docx,image/jpeg,image/png,image/jpg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                className="hidden" 
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                            />

                            {/* Selected Files Preview Area */}
                            {selectedFiles.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-1 pb-2">
                                    {selectedFiles.map((file, idx) => (
                                        <div key={idx} className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md text-xs border border-slate-200">
                                            <FiFile className="h-3 w-3 text-slate-500" />
                                            <span className="truncate max-w-[120px] text-slate-700">{file.name}</span>
                                            <button 
                                                onClick={() => removeFile(idx)} 
                                                className="text-slate-400 hover:text-red-500 ml-1 transition-colors"
                                                title="Remove file"
                                            >
                                                <FiX className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-between items-center">
                                {/* Trigger hidden file input on click */}
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-slate-500 gap-1.5 h-8 text-xs hover:bg-slate-50 rounded-md shadow-md" 
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <FiPaperclip className="h-3.5 w-3.5" />
                                </Button>

                                <Button 
                                    onClick={handlePostAnnouncement} 
                                    size="sm"
                                    disabled={(!newPostText.trim() && selectedFiles.length === 0) || isPosting} 
                                    className="gap-1.5 h-8 text-xs rounded-md shadow-md"
                                >
                                    <FiSend className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Announcement Feed */}
            {announcements.length === 0 ? (
                <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <BsMegaphone className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <h3 className="text-lg font-medium text-slate-900">Stream is quiet</h3>
                    <p className="text-sm">This is where classroom announcements and updates will appear.</p>
                </div>
            ) : (
                announcements.map((announcement) => {
                    const isAuthor = announcement.authorId === user?.id;
                    const canDelete = currentUserRole === "CREATOR" || isAuthor;

                    return (
                        <Card key={announcement.id} className="shadow-md border-slate-200 overflow-hidden">
                            <CardHeader className="p-4 flex flex-row items-start justify-between">
                                <div className="flex gap-4 items-center">
                                    <Avatar className="h-10 w-10 border border-slate-100 shadow-sm">
                                        <AvatarImage src={announcement.author?.profilePhotoUrl || undefined} />
                                        <AvatarFallback className="bg-indigo-100 text-indigo-700 font-medium">
                                            {getInitials(announcement.author?.fullName)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 text-base leading-tight">
                                            {announcement.author?.fullName}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {format(new Date(announcement.createdAt), "MMM d, yyyy 'at' h:mm a")}
                                        </p>
                                    </div>
                                </div>

                                {canDelete && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="-mr-2 text-slate-500">
                                                <FiMoreVertical className="h-5 w-5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {isAuthor && (
                                                <DropdownMenuItem onClick={() => toast.info("Edit feature coming soon!")} className="cursor-pointer">
                                                    <FiEdit2 className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem onClick={() => handleDeleteAnnouncement(announcement.id)} className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700">
                                                <FiTrash2 className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </CardHeader>

                            <CardContent className="p-2 px-6">
                                <p className="text-slate-800 whitespace-pre-wrap text-sm leading-relaxed">
                                    {announcement.message}
                                </p>

                                {announcement.attachments && announcement.attachments.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                        {announcement.attachments.map(att => (
                                            <a key={att.id} href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-colors group">
                                                <div className="bg-white p-2 rounded-md shadow-sm text-red-500 group-hover:text-red-600">
                                                    <FiFile className="h-5 w-5" />
                                                </div>
                                                <span className="text-sm font-medium text-slate-700 truncate">{att.fileName}</span>
                                            </a>
                                        ))}
                                    </div>
                                )}

                                <CommentSection 
                                    announcementId={announcement.id} 
                                    classroom={classroom} 
                                    currentUserRole={currentUserRole}
                                    currentUserId={user?.id as string}
                                />
                            </CardContent>
                        </Card>
                    );
                })
            )}
        </div>
    );
};

export default StreamTab;