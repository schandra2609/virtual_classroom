import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FiArrowLeft, FiSave, FiRefreshCw, FiCopy, FiAlertTriangle, FiEdit2, FiMail, FiTrash2, FiUser } from "react-icons/fi";
import { toast } from "sonner";

// Services & Redux
import { useAppSelector } from "@/hooks/redux";
import { classroomService } from "@/api/classroom.service";
import { memberService } from "@/api/member.service";
import type { Classroom, ClassroomMember } from "@/api/types";

// Shadcn UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const ClassroomInfo = () => {
    const { id: classroomId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAppSelector((state) => state.auth);

    const [classroom, setClassroom] = useState<Classroom | null>(null);
    const [coTutors, setCoTutors] = useState<ClassroomMember[]>([]);
    const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Toggle states
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isInviting, setIsInviting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({ name: "", subject: "", batch: "" });
    const [selectedNewOwner, setSelectedNewOwner] = useState<string>("");
    
    // Updated Invite State to match { inviteeEmail, inviteeName }
    const [inviteForm, setInviteForm] = useState({ inviteeEmail: "", inviteeName: "" });

    useEffect(() => {
        const fetchSettingsData = async () => {
            if (!classroomId) return;
            try {
                // Fetch Classroom Details
                const classRes = await classroomService.getClassroomById(classroomId);
                if (classRes.success) {
                    setClassroom(classRes.data);
                    setFormData({
                        name: classRes.data.name,
                        subject: classRes.data.subject,
                        batch: classRes.data.batch
                    });
                }

                // Fetch Members to determine roles and populate Co-Tutors list
                const memberRes = await memberService.getClassroomMembers(classroomId, 'APPROVED');
                if (memberRes.success) {
                    const tutorsOnly = memberRes.data.filter((m: ClassroomMember) => m.role === "CO_TUTOR");
                    setCoTutors(tutorsOnly);

                    // Determine current user's role
                    const myMembership = memberRes.data.find((m: ClassroomMember) => m.userId === user?.id);
                    const myRole = myMembership?.role || null;
                    setCurrentUserRole(myRole);

                    // 🚨 RBAC BOUNCER: Kick out Students
                    if (myRole === "STUDENT" || !myRole) {
                        toast.error("You do not have permission to view classroom settings.");
                        navigate(`/dashboard/classrooms/${classroomId}`);
                    }
                }
            } catch (error: any) {
                toast.error("Failed to load info.");
                navigate(`/dashboard/classrooms/${classroomId}`);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettingsData();
    }, [classroomId, navigate, user?.id]);

    // Role checks
    const isCreator = currentUserRole === "CREATOR";
    const isCoTutor = currentUserRole === "CO_TUTOR";

    // Dynamic Save Button Check: Only true if at least one field is different from the original
    const hasChanges = 
        formData.name !== classroom?.name || 
        formData.subject !== classroom?.subject || 
        formData.batch !== classroom?.batch;

    // --- HANDLERS ---
    
    const handleUpdateDetails = async () => {
        if (!hasChanges) return;
        try {
            setIsSaving(true);
            const res = await classroomService.updateClassroom(classroomId!, formData);
            if (res.success) {
                toast.success("Classroom information updated.");
                setClassroom(res.data);
                setIsEditing(false);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update details.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleRefreshCode = async () => {
        if (!isCreator) return toast.error("Only the Creator can refresh the code.");
        if (!window.confirm("Are you sure? The old joining code will immediately stop working.")) return;
        try {
            const res = await classroomService.refreshJoiningCode(classroomId!);
            if (res.success) {
                const newCode = (res.data as any).newJoiningCode || res.data;
                setClassroom(prev => prev ? { ...prev, joiningCode: newCode } : null);
                toast.success("Joining code refreshed successfully.");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to refresh code.");
        }
    };

    const copyCode = () => {
        if (classroom?.joiningCode) {
            navigator.clipboard.writeText(classroom.joiningCode);
            toast.success("Joining code copied to clipboard!");
        } else {
            toast.error("No code available to copy.");
        }
    };

    const handleInviteCoTutor = async () => {
        if (!inviteForm.inviteeEmail.trim() || !inviteForm.inviteeName.trim()) {
            return toast.error("Please enter both name and email.");
        }
        try {
            setIsInviting(true);
            await classroomService.inviteCoTutor(classroomId!, inviteForm);
            toast.success(`Invitation successfully sent to ${inviteForm.inviteeName}`);
            setInviteForm({ inviteeEmail: "", inviteeName: "" }); // Clear form
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to send invitation.");
        } finally {
            setIsInviting(false);
        }
    };

    const handleTransferOwnership = async () => {
        if (!selectedNewOwner) return toast.error("Please select a new owner.");
        try {
            await classroomService.transferOwnership(classroomId!, { newOwnerId: selectedNewOwner });
            toast.success("Ownership transferred successfully. You are now a Co-Tutor.");
            window.location.reload();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to transfer ownership.");
        }
    };

    const handleDeleteClassroom = async () => {
        if (!window.confirm("WARNING: Are you absolutely sure you want to delete this classroom? This will permanently erase all members, assignments, tests, and announcements. This action CANNOT be undone.")) return;
        
        try {
            await classroomService.deleteClassroom(classroomId!);
            toast.success("Classroom deleted successfully.");
            navigate("/dashboard");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete classroom.");
        }
    };

    if (isLoading) return <div className="p-10 space-y-4 max-w-4xl mx-auto"><Skeleton className="h-8 w-48"/><Skeleton className="h-64 w-full"/></div>;

    // Do not render anything if the user is somehow a student (prevents UI flicker before navigate fires)
    if (!isCreator && !isCoTutor) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12 h-full overflow-y-auto pr-2">
            <div>
                <Button variant="ghost" asChild className="mb-4 -ml-4 text-slate-500 hover:text-purple-800 hover:bg-transparent">
                    <Link to={`/dashboard/classrooms/${classroomId}`}>
                        <FiArrowLeft className="mr-2 h-4 w-4" /> Back to Classroom
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold text-slate-900">Classroom Information</h1>
                <p className="text-slate-500 mt-1">View and manage classroom configuration, access codes, and administration.</p>
            </div>

            {/* General Information Card */}
            <Card>
                <CardHeader className="flex flex-row items-start justify-between bg-slate-50/50 border-b border-slate-100 pb-4">
                    <div>
                        <CardTitle className="text-xl">Details & Access</CardTitle>
                        <CardDescription className="mt-1">
                            {isCreator ? "Click the pencil icon to modify details." : "You have view-only access to these details as a Co-Tutor."}
                        </CardDescription>
                    </div>
                    {/* 🚨 VISIBILITY: Pencil icon ONLY for Creator */}
                    {isCreator && (
                        <Button 
                            variant={isEditing ? "secondary" : "outline"} 
                            size="icon" 
                            onClick={() => setIsEditing(!isEditing)}
                            className={isEditing ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-none" : ""}
                            title={isEditing ? "Cancel editing" : "Edit details"}
                        >
                            <FiEdit2 className="h-4 w-4" />
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Classroom Name</Label>
                            <Input 
                                id="name" 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})} 
                                disabled={!isEditing} 
                                className="bg-white disabled:bg-slate-50 disabled:text-slate-600 disabled:opacity-100 font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="subject">Subject</Label>
                            <Input 
                                id="subject" 
                                value={formData.subject} 
                                onChange={e => setFormData({...formData, subject: e.target.value})} 
                                disabled={!isEditing} 
                                className="bg-white disabled:bg-slate-50 disabled:text-slate-600 disabled:opacity-100"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="batch">Batch / Section</Label>
                            <Input 
                                id="batch" 
                                value={formData.batch} 
                                onChange={e => setFormData({...formData, batch: e.target.value})} 
                                disabled={!isEditing} 
                                className="bg-white disabled:bg-slate-50 disabled:text-slate-600 disabled:opacity-100"
                            />
                        </div>
                        
                        {/* Joining Code Field */}
                        <div className="space-y-2">
                            <Label>Joining Code</Label>
                            <div className="flex gap-2">
                                <Input 
                                    value={classroom?.joiningCode || "--------"} 
                                    disabled 
                                    readOnly
                                    className="font-mono font-bold tracking-widest text-slate-900 bg-slate-100 opacity-100"
                                />
                                <Button variant="outline" size="icon" onClick={copyCode} title="Copy Code" className="shrink-0">
                                    <FiCopy className="h-4 w-4" />
                                </Button>
                                {/* 🚨 VISIBILITY: Refresh Code ONLY visible when editing (which means only Creator sees it) */}
                                {isEditing && (
                                    <Button 
                                        variant="outline" 
                                        size="icon"
                                        onClick={handleRefreshCode} 
                                        title="Regenerate Code"
                                        className="shrink-0 text-amber-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 transition-colors"
                                    >
                                        <FiRefreshCw className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                            <p className="text-xs text-slate-500">Students need this code to request enrollment.</p>
                        </div>
                    </div>

                    {/* 🚨 VISIBILITY: Save button ONLY appears when editing and is disabled if no changes made */}
                    {isEditing && (
                        <div className="flex justify-end pt-4 border-t border-slate-100">
                            <Button 
                                onClick={handleUpdateDetails} 
                                disabled={!hasChanges || isSaving} 
                                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500"
                            >
                                <FiSave className="mr-2 h-4 w-4" /> {isSaving ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 🚨 VISIBILITY: Invite Co-Tutor Card ONLY visible to Creator */}
            {isCreator && (
                <Card>
                    <CardHeader>
                        <CardTitle>Co-Tutor Management</CardTitle>
                        <CardDescription>Invite other registered Tutors to help manage this classroom.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-3 items-end">
                            <div className="flex-1 space-y-2 w-full">
                                <Label htmlFor="inviteeName">Tutor's Name</Label>
                                <div className="relative">
                                    <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                                    <Input 
                                        id="inviteeName" 
                                        placeholder="Enter tutor's full name" 
                                        value={inviteForm.inviteeName}
                                        onChange={(e) => setInviteForm({...inviteForm, inviteeName: e.target.value})}
                                        className="pl-9 w-full"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 space-y-2 w-full">
                                <Label htmlFor="inviteeEmail">Tutor's Email Address</Label>
                                <div className="relative">
                                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                                    <Input 
                                        id="inviteeEmail" 
                                        type="email" 
                                        placeholder="Enter registered email" 
                                        value={inviteForm.inviteeEmail}
                                        onChange={(e) => setInviteForm({...inviteForm, inviteeEmail: e.target.value})}
                                        className="pl-9 w-full"
                                    />
                                </div>
                            </div>
                            <Button 
                                onClick={handleInviteCoTutor} 
                                disabled={isInviting || !inviteForm.inviteeEmail.trim() || !inviteForm.inviteeName.trim()}
                                className="shrink-0 w-full sm:w-auto mt-2 sm:mt-0"
                            >
                                <FiMail className="mr-2 h-4 w-4" /> {isInviting ? "Sending..." : "Send Invite"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 🚨 VISIBILITY: Danger Zone ONLY visible to Creator */}
            {isCreator && (
                <Card className="border-red-200 shadow-sm mt-8">
                    <CardHeader className="bg-red-50/50 border-b border-red-100 rounded-t-xl">
                        <CardTitle className="text-red-700 flex items-center gap-2">
                            <FiAlertTriangle className="h-5 w-5" /> Danger Zone
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        
                        {/* Transfer Ownership */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-red-100 gap-4">
                            <div>
                                <h4 className="font-semibold text-slate-900">Transfer Ownership</h4>
                                <p className="text-sm text-slate-500">Transfer the CREATOR role to an existing Co-Tutor.</p>
                            </div>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 w-full sm:w-auto">Transfer Role</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Transfer Classroom Ownership</DialogTitle>
                                        <DialogDescription>
                                            Select a Co-Tutor to become the new Creator. You will be demoted to a Co-Tutor and lose administrative access to settings.
                                        </DialogDescription>
                                    </DialogHeader>
                                    
                                    <div className="py-4">
                                        {coTutors.length === 0 ? (
                                            <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
                                                You cannot transfer ownership because there are no active Co-Tutors in this classroom. Invite a Co-Tutor first.
                                            </p>
                                        ) : (
                                            <div className="space-y-4">
                                                <Label>Select New Owner</Label>
                                                <Select onValueChange={setSelectedNewOwner}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a verified Co-Tutor" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {coTutors.map(tutor => (
                                                            <SelectItem key={tutor.userId} value={tutor.userId}>
                                                                {tutor.user?.fullName} ({tutor.user?.email})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-end gap-2">
                                        <Button 
                                            variant="destructive" 
                                            onClick={handleTransferOwnership} 
                                            disabled={!selectedNewOwner}
                                        >
                                            Confirm Transfer
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* Delete Classroom */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h4 className="font-semibold text-slate-900">Delete Classroom</h4>
                                <p className="text-sm text-slate-500">Permanently remove this classroom and all associated data.</p>
                            </div>
                            <Button 
                                variant="destructive" 
                                onClick={handleDeleteClassroom}
                                className="bg-red-600 hover:bg-red-700 text-white shadow-sm w-full sm:w-auto"
                            >
                                <FiTrash2 className="mr-2 h-4 w-4" /> Delete Classroom
                            </Button>
                        </div>

                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default ClassroomInfo;