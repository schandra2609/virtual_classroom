import React, { useRef, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { authService } from '@/api/auth.service';
import { userService } from '@/api/user.service';
import { logout, setAuthLoaded } from '@/features/auth/authSlice';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FiCamera, FiKey, FiLogOut, FiAlertCircle, FiClock, FiFileText } from "react-icons/fi";
import { BsShieldCheck } from "react-icons/bs";
import { MdUploadFile } from "react-icons/md";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const UserProfile = () => {
    const { user } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    
    const photoInputRef = useRef<HTMLInputElement>(null);
    const documentInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingDoc, setIsUploadingDoc] = useState(false);

    if (!user) return null;

    const handleLogout = async () => {
        try {
            await authService.logout();
            dispatch(logout());
            toast.success("Logged out successfully");
            navigate('/login');
        } catch (error) {
            toast.error("Failed to log out");
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await userService.uploadProfilePhoto(formData);
            toast.success(response.message);
            // Refresh user state to show new photo
            const updatedUser = await userService.getCurrentUser();
            dispatch(setAuthLoaded({ isAuthenticated: true, user: updatedUser.data.user }));
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to upload photo");
        }
    };

    const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== "application/pdf") {
            toast.error("Invalid file type. Please upload a PDF.");
            if (documentInputRef.current) documentInputRef.current.value = '';
            return;
        }

        const formData = new FormData();
        formData.append('document', file);
        setIsUploadingDoc(true);

        try {
            const qualificationResponse = await userService.uploadQualificationProof(formData);
            toast.success(qualificationResponse.message);
            
            // Refresh user state so the UI immediately switches to "PENDING"
            const response = await userService.getCurrentUser();
            dispatch(setAuthLoaded({ isAuthenticated: true, user: response.data.user }));
        } catch (error: any) {
            // This is where the 48-hour cooldown error from the backend is caught and shown!
            toast.error(error.response?.data?.message || "Failed to submit document");
        } finally {
            setIsUploadingDoc(false);
            if (documentInputRef.current) documentInputRef.current.value = '';
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            
            {/* Basic Profile Details */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Profile Details</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                    
                    {/* Avatar Section */}
                    <div className="relative group">
                        <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                            <AvatarImage src={user.profilePhotoUrl || undefined} alt={user.fullName} />
                            <AvatarFallback className="text-4xl bg-slate-100 text-slate-600">
                                {user.fullName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <button 
                            onClick={() => photoInputRef.current?.click()}
                            className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full shadow-md hover:bg-primary/90 transition-colors"
                        >
                            <FiCamera className="w-5 h-5" />
                        </button>
                        <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                    </div>

                    {/* Info Section */}
                    <div className="flex-1 space-y-4 text-center md:text-left">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">{user.fullName}</h2>
                            <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                                <span className="text-slate-500">{user.email}</span>
                                {user.isEmailVerified ? (
                                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 rounded-full">Verified</Badge>
                                ) : (
                                    <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 rounded-full">Unverified</Badge>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                            <Badge variant="default" className="capitalize px-3 py-1 text-sm">{user.accountType.toLowerCase()}</Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 🎓 TUTOR VERIFICATION HUB (Only visible to Tutors) */}
            {user.accountType === 'TUTOR' && (
                <Card className={
                    user.tutorVerificationStatus === 'VERIFIED' ? "border-green-200 bg-green-50/30" : 
                    user.tutorVerificationStatus === 'REJECTED' ? "border-red-200 bg-red-50/30" : 
                    "border-slate-200"
                }>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FiFileText className="w-5 h-5" /> Tutor Verification
                        </CardTitle>
                        <CardDescription>
                            Manage your teaching credentials to unlock classroom creation.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        
                        {/* Dynamic Status UI */}
                        {user.tutorVerificationStatus === 'VERIFIED' && (
                            <div className="flex items-start gap-3 p-4 bg-green-100 text-green-800 rounded-lg">
                                <BsShieldCheck className="w-6 h-6 mt-0.5 shrink-0" />
                                <div>
                                    <h4 className="font-semibold">Account Verified</h4>
                                    <p className="text-sm mt-1">Your qualifications have been approved. You have full access to create classrooms and manage students.</p>
                                </div>
                            </div>
                        )}

                        {user.tutorVerificationStatus === 'PENDING' && (
                            <div className="flex items-start gap-3 p-4 bg-yellow-100 text-yellow-800 rounded-lg">
                                <FiClock className="w-6 h-6 mt-0.5 shrink-0" />
                                <div>
                                    <h4 className="font-semibold">Under Review</h4>
                                    <p className="text-sm mt-1">Your documents are currently being reviewed by an administrator. This usually takes 1-2 business days.</p>
                                </div>
                            </div>
                        )}

                        {user.tutorVerificationStatus === 'REJECTED' && (
                            <div className="flex flex-col gap-3 p-4 bg-red-100 text-red-800 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <FiAlertCircle className="w-6 h-6 mt-0.5 shrink-0" />
                                    <div>
                                        <h4 className="font-semibold">Application Rejected</h4>
                                        <p className="text-sm mt-1">We could not verify your credentials. Please upload a clearer PDF document or an updated certificate.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Upload Form (Hidden if Verified or Pending) */}
                        {(user.tutorVerificationStatus === 'REJECTED' || !user.tutorVerificationStatus) && (
                            <div className="pt-2">
                                <input type="file" ref={documentInputRef} className="hidden" accept="application/pdf" onChange={handleDocumentUpload} />
                                <Button 
                                    onClick={() => documentInputRef.current?.click()} 
                                    disabled={isUploadingDoc}
                                    className="w-full sm:w-auto"
                                >
                                    <MdUploadFile className="w-4 h-4 mr-2" /> 
                                    {isUploadingDoc ? "Uploading..." : "Upload Qualification (PDF)"}
                                </Button>
                                <p className="text-xs text-slate-500 mt-2">Max file size: 5MB. Must be a valid PDF.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Actions Card */}
            <Card>
                <CardContent className="p-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <Button variant="outline" className="w-full sm:w-auto" onClick={() => {/* Trigger Password Modal */}}>
                        <FiKey className="w-4 h-4 mr-2" /> Change Password
                    </Button>
                    <Button variant="destructive" className="w-full sm:w-auto" onClick={handleLogout}>
                        <FiLogOut className="w-4 h-4 mr-2" /> Log Out
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default UserProfile;