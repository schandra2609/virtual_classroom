import { useState, useEffect } from "react";
import { FiSend, FiMessageSquare } from "react-icons/fi";
import { toast } from "sonner";

// Redux, Services & Types
import { useAppSelector } from "@/hooks/redux";
import { announcementService } from "@/api/announcement.service";
import type { Classroom, Announcement } from "@/api/types";

// Shadcn Components
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface StreamTabProps {
    classroom: Classroom;
}

const StreamTab = ({ classroom }: StreamTabProps) => {
    const { user } = useAppSelector((state) => state.auth);
    const [newPost, setNewPost] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch real announcements on mount
    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const response = await announcementService.getAnnouncements(classroom.id);
                if (response.success) {
                    setAnnouncements(response.data);
                }
            } catch (error) {
                toast.error("Failed to load stream");
            } finally {
                setIsLoading(false);
            }
        };
        fetchAnnouncements();
    }, [classroom.id]);

    const handlePostAnnouncement = async () => {
        if (!newPost.trim()) return;

        try {
            setIsSubmitting(true);
            
            // Using FormData in preparation for when you add file attachments!
            const formData = new FormData();
            formData.append("message", newPost);

            const response = await announcementService.createAnnouncement(classroom.id, formData);
            
            if (response.success) {
                // Add the new post to the top of the feed
                setAnnouncements([response.data, ...announcements]);
                setNewPost("");
                toast.success(response.message);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to post announcement");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (date: Date | string) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
        }).format(new Date(date));
    };

    const getInitials = (name: string) => {
        return name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
    };

    return (
        <div className="space-y-6">
            
            {/* Announcement Form */}
            {user?.accountType === "TUTOR" && (
                <Card className="bg-white shadow-sm border-slate-200">
                    <CardContent className="pt-6">
                        <div className="flex gap-4">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={user?.profilePhotoUrl || ""} />
                                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                    {user ? getInitials(user.fullName) : "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-3">
                                <Textarea 
                                    placeholder="Announce something to your class..." 
                                    className="min-h-[100px] resize-none bg-slate-50 border-slate-200 focus-visible:ring-primary"
                                    value={newPost}
                                    onChange={(e) => setNewPost(e.target.value)}
                                    disabled={isSubmitting}
                                />
                                <div className="flex justify-end">
                                    <Button onClick={handlePostAnnouncement} disabled={!newPost.trim() || isSubmitting} className="gap-2">
                                        <FiSend className="h-4 w-4" />
                                        {isSubmitting ? "Posting..." : "Post"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Announcements Feed */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-8 text-slate-500">Loading stream...</div>
                ) : announcements.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
                        <FiMessageSquare className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                        <p>No announcements yet.</p>
                        <p className="text-sm">Check back later for updates!</p>
                    </div>
                ) : (
                    announcements.map((post) => (
                        <Card key={post.id} className="bg-white shadow-sm border-slate-200">
                            <CardHeader className="flex flex-row items-start gap-4 pb-4">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={post.author?.profilePhotoUrl || ""} />
                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                        {getInitials(post.author?.fullName || "U")}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-slate-900">{post.author?.fullName}</span>
                                        {post.authorId === classroom.creatorId && (
                                            <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium">
                                                Instructor
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-slate-500 mt-0.5">
                                        {formatDate(post.createdAt)}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-700 whitespace-pre-wrap">{post.message}</p>
                                
                                {/* Render Attachments if any exist */}
                                {post.attachments && post.attachments.length > 0 && (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {post.attachments.map(file => (
                                            <a key={file.id} href={file.url} target="_blank" rel="noreferrer" className="text-sm bg-slate-100 px-3 py-1.5 rounded-md text-primary hover:underline border border-slate-200">
                                                📎 {file.fileName}
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default StreamTab;