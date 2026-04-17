import { useState, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { 
    FiCheckCircle, 
    FiXCircle, 
    FiFileText, 
    FiExternalLink, 
    FiClock, 
    FiShield,
    FiSearch
} from "react-icons/fi";

// Services & Types
import { adminService } from "@/api/admin.service";
import type { TutorApplication } from "@/api/types";

// Shadcn Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

const TutorApplications = () => {
    const [applications, setApplications] = useState<TutorApplication[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<"PENDING" | "VERIFIED" | "REJECTED">("PENDING");
    const [searchTerm, setSearchTerm] = useState("");

    // Rejection State
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [selectedTutorId, setSelectedTutorId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    // Fetch applications from the REAL API whenever the tab changes
    useEffect(() => {
        const fetchApps = async () => {
            setIsLoading(true);
            try {
                const response = await adminService.getTutorApplications(statusFilter);
                if (response.success) {
                    setApplications(response.data);
                }
            } catch (error: any) {
                toast.error(error.response?.data?.message || "Failed to load applications");
            } finally {
                setIsLoading(false);
            }
        };
        fetchApps();
    }, [statusFilter]);

    // Live Handlers
    const handleApprove = async (tutorId: string) => {
        try {
            setIsProcessing(true);
            const response = await adminService.approveTutor(tutorId);
            if (response.success) {
                toast.success(response.message || "Tutor approved successfully");
                setApplications(apps => apps.filter(app => app.id !== tutorId));
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to approve tutor");
        } finally {
            setIsProcessing(false);
        }
    };

    const openRejectModal = (tutorId: string) => {
        setSelectedTutorId(tutorId);
        setRejectionReason("");
        setIsRejectModalOpen(true);
    };

    const handleReject = async () => {
        if (!selectedTutorId) return;
        if (!rejectionReason.trim()) return toast.error("Please provide a reason for rejection.");

        try {
            setIsProcessing(true);
            const response = await adminService.rejectTutor(selectedTutorId, rejectionReason);
            if (response.success) {
                toast.success(response.message || "Tutor application rejected");
                setApplications(apps => apps.filter(app => app.id !== selectedTutorId));
                setIsRejectModalOpen(false);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to reject tutor");
        } finally {
            setIsProcessing(false);
            setSelectedTutorId(null);
        }
    };

    const filteredApplications = applications.filter(app => 
        app.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        app.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case "VERIFIED":
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><FiCheckCircle className="mr-1 h-3 w-3" /> Verified</Badge>;
            case "REJECTED":
                return <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100"><FiXCircle className="mr-1 h-3 w-3" /> Rejected</Badge>;
            default:
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><FiClock className="mr-1 h-3 w-3" /> Pending</Badge>;
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            
            {/* Header */}
            <div className="flex items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="p-3 bg-primary/10 rounded-lg text-primary shrink-0">
                    <FiShield className="h-8 w-8" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Tutor Verification Hub</h1>
                    <p className="text-slate-500 text-sm sm:text-base">Review qualifications and manage educator access to the platform.</p>
                </div>
            </div>

            {/* Controls Row (Tabs & Search) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <Tabs 
                    defaultValue="PENDING" 
                    onValueChange={(val) => setStatusFilter(val as any)}
                    className="w-full sm:w-auto"
                >
                    <TabsList className="bg-slate-200/50 w-full sm:w-auto grid grid-cols-3 sm:flex">
                        <TabsTrigger value="PENDING" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Pending</TabsTrigger>
                        <TabsTrigger value="VERIFIED" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Verified</TabsTrigger>
                        <TabsTrigger value="REJECTED" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Rejected</TabsTrigger>
                    </TabsList>
                </Tabs>
                
                <div className="relative w-full sm:w-72 shrink-0">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Search name or email..." 
                        className="pl-9 bg-white" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Application List (Responsive Cards) */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="h-32 flex items-center justify-center text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed">
                        Loading applications...
                    </div>
                ) : filteredApplications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed">
                        <FiSearch className="h-12 w-12 text-slate-300 mb-3" />
                        <p className="text-lg font-medium text-slate-700">No applications found</p>
                        <p className="text-sm">Try adjusting your search or switching tabs.</p>
                    </div>
                ) : (
                    filteredApplications.map((app) => (
                        <Card key={app.applicationId} className="overflow-hidden hover:shadow-md transition-all">
                            <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row md:items-center justify-between p-5 gap-6">
                                    
                                    {/* Info Section */}
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-bold text-slate-900">{app.fullName}</h3>
                                            <StatusBadge status={app.tutorVerificationStatus} />
                                        </div>
                                        <p className="text-slate-500 text-sm font-medium">{app.email}</p>
                                        <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
                                            <span>Submitted: {format(new Date(app.createdAt), "MMM d, yyyy")}</span>
                                            {statusFilter !== "PENDING" && (
                                                <>
                                                    <span>&bull;</span>
                                                    <span>Actioned: {format(new Date(app.tutorStatusUpdatedAt), "MMM d, yyyy")}</span>
                                                </>
                                            )}
                                        </div>
                                        
                                        {app.tutorVerificationStatus === "REJECTED" && app.tutorRejectionReason && (
                                            <div className="mt-3 p-3 bg-red-50 text-red-800 text-sm rounded-md border border-red-100">
                                                <strong>Reason:</strong> {app.tutorRejectionReason}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Section */}
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                                        <Button asChild variant="outline" className="bg-primary/5 text-primary border-primary/20 hover:bg-primary/10">
                                            <a href={app.tutorQualificationUrl} target="_blank" rel="noopener noreferrer">
                                                <FiFileText className="h-4 w-4 mr-2" /> View PDF <FiExternalLink className="h-3 w-3 ml-1" />
                                            </a>
                                        </Button>

                                        {statusFilter === "PENDING" && (
                                            <div className="flex gap-2">
                                                <Button 
                                                    variant="outline" 
                                                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                    onClick={() => openRejectModal(app.id)}
                                                    disabled={isProcessing}
                                                >
                                                    Reject
                                                </Button>
                                                <Button 
                                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                                    onClick={() => handleApprove(app.id)}
                                                    disabled={isProcessing}
                                                >
                                                    Approve
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Rejection Modal */}
            <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Reject Application</DialogTitle>
                        <DialogDescription>
                            Provide a reason for rejecting this tutor. The user will see this message.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <Textarea 
                            placeholder="e.g., The provided ID document is blurry or expired..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="min-h-[100px] resize-none"
                        />
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button variant="ghost" onClick={() => setIsRejectModalOpen(false)} disabled={isProcessing} className="w-full sm:w-auto">
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleReject} disabled={isProcessing || !rejectionReason.trim()} className="w-full sm:w-auto">
                            {isProcessing ? "Processing..." : "Confirm Rejection"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TutorApplications;