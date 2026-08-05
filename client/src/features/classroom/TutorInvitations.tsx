import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { FiArrowLeft, FiInbox, FiCheck, FiX } from "react-icons/fi";
import { toast } from "sonner";

// Services & Redux
import { useAppSelector } from "@/hooks/redux";
import { invitationService } from "@/api/invitation.service"; 

// Shadcn UI
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const TutorInvitations = () => {
    const { user } = useAppSelector((state) => state.auth);

    // 🚨 RBAC BOUNCER: Strictly lock this page down to VERIFIED TUTORS only.
    if (user?.accountType !== "TUTOR" || user?.tutorVerificationStatus !== "VERIFIED") {
        toast.error("You must be a verified tutor to view invitations.");
        return <Navigate to="/dashboard" replace />;
    }

    const [invitations, setInvitations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchInvitations = async () => {
            try {
                // Ensure getMyInvitations() maps to GET /api/v1/invitations/my-invitations
                const res = await invitationService.getMyInvitations(); 
                if (res.success) setInvitations(res.data);
            } catch (error) {
                toast.error("Failed to load invitations.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchInvitations();
    }, []);

    const handleAccept = async (invitationId: string) => {
        try {
            setProcessingId(invitationId);
            // Ensure acceptInvitation() maps to POST /api/v1/invitations/:id/accept
            await invitationService.acceptCoTutorInvitation(invitationId);
            toast.success("Invitation accepted! You are now a Co-Tutor.");
            
            // Remove from list upon successful database transaction
            setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to process invitation.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleIgnore = (invitationId: string) => {
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
        toast.info("Invitation dismissed.");
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div>
                <Button variant="ghost" asChild className="mb-4 -ml-4 text-slate-500 hover:text-purple-800 hover:bg-transparent">
                    <Link to="/dashboard">
                        <FiArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold text-slate-900">Classroom Invitations</h1>
                <p className="text-slate-500 mt-1">Review requests to join classrooms as a Co-Tutor.</p>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-24 w-full rounded-xl"/>
                    <Skeleton className="h-24 w-full rounded-xl"/>
                </div>
            ) : invitations.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                    <FiInbox className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No pending invitations</h3>
                    <p className="text-slate-500">When a Creator invites you to co-teach, it will appear here.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {invitations.map(inv => (
                        <Card key={inv.id} className="overflow-hidden">
                            <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900">{inv.classroom?.name || "Classroom"}</h3>
                                    <p className="text-sm text-slate-500 mt-0.5">Invited by: {inv.inviterName}</p>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                    <Button 
                                        variant="outline" 
                                        className="flex-1 sm:flex-none text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900" 
                                        onClick={() => handleIgnore(inv.id)}
                                        disabled={processingId === inv.id}
                                    >
                                        <FiX className="mr-2 h-4 w-4" /> Ignore
                                    </Button>
                                    <Button 
                                        className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white" 
                                        onClick={() => handleAccept(inv.id)}
                                        disabled={processingId === inv.id}
                                    >
                                        <FiCheck className="mr-2 h-4 w-4" /> 
                                        {processingId === inv.id ? "Accepting..." : "Accept Invite"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TutorInvitations;