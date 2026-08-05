import { useState } from "react";
import { FiCheckCircle, FiShield, FiLock, FiMail, FiUser, FiCamera, FiAlertCircle, FiEye, FiEyeOff, FiAlertTriangle } from "react-icons/fi";
import { toast } from "sonner";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import { setAuthLoaded } from "@/features/auth/authSlice";
import { userService } from "@/api/user.service";
// import { API } from "@/api/API";

// Shadcn & UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const UserProfile = () => {
    const { user } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();

    // General Form State
    const [fullName, setFullName] = useState(user?.fullName || "");
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

    // Security Form State
    const [passwords, setPasswords] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);

    // OTP & Staging State
    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
    const [otpValue, setOtpValue] = useState("");
    const [stagedOtp, setStagedOtp] = useState<string | null>(null);
    const [activePurpose, setActivePurpose] = useState<"EMAIL_VERIFICATION" | "CHANGE_PASSWORD" | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // --- HANDLERS: GENERAL ---

    const handleUpdateName = async () => {
        if (!fullName.trim() || fullName === user?.fullName) return;
        try {
            setIsUpdatingProfile(true);
            const res = await userService.updateCurrentUser({ fullName });
            if (res.success) {
                toast.success("Name updated successfully");
                dispatch(setAuthLoaded({ isAuthenticated: true, user: { ...user!, fullName: res.data.user.fullName } }));
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Update failed");
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("image", file);

        try {
            setIsUpdatingProfile(true);
            const res = await userService.uploadProfilePhoto(formData);
            if (res.success) {
                toast.success("Profile photo updated");
                dispatch(setAuthLoaded({ isAuthenticated: true, user: { ...user!, profilePhotoUrl: res.data.profilePhotoUrl } }));
            }
        } catch (error: any) {
            toast.error("Failed to upload photo.");
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    // --- HANDLERS: SECURITY (OTP & PASSWORDS) ---

    const handleRequestOtp = async (purpose: "EMAIL_VERIFICATION" | "CHANGE_PASSWORD") => {
        if (purpose === "CHANGE_PASSWORD" && !passwords.oldPassword) {
            return toast.error("Please enter your current password first.");
        }
        try {
            setIsProcessing(true);
            await userService.sendOtp({ purpose });
            setActivePurpose(purpose);
            setIsOtpModalOpen(true);
            toast.success("OTP sent to your email.");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to send OTP.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleModalConfirm = async () => {
        if (!otpValue || otpValue.length !== 6) return toast.error("Enter a valid 6-digit OTP.");
        
        // If changing password, we just stage the OTP locally and reveal the new password fields
        if (activePurpose === "CHANGE_PASSWORD") {
            setStagedOtp(otpValue);
            setIsOtpModalOpen(false);
            setOtpValue("");
            toast.success("OTP accepted. Please enter your new password.");
            return;
        }

        // If verifying email, execute the backend verification immediately
        try {
            setIsProcessing(true);
            const res = await userService.verifyOtp({ otp: otpValue, purpose: activePurpose as string });
            toast.success(res.message);
            setIsOtpModalOpen(false);
            setOtpValue("");

            if (user) {
                dispatch(setAuthLoaded({ isAuthenticated: true, user: { ...user, isEmailVerified: true } }));
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Verification failed.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleChangePasswordSubmit = async () => {
        if (!stagedOtp) return toast.error("OTP is missing.");
        if (passwords.newPassword !== passwords.confirmPassword) {
            return toast.error("New passwords do not match.");
        }

        try {
            setIsProcessing(true);
            const payload = { oldPassword: passwords.oldPassword, newPassword: passwords.newPassword };
            const res = await userService.verifyOtp({ otp: stagedOtp, purpose: "CHANGE_PASSWORD", payload });

            toast.success(res.message);
            setStagedOtp(null);
            setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to change password.");
            // If the OTP expired or failed on the backend, reset the flow so they request a new one
            setStagedOtp(null);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm(
            "WARNING: Are you absolutely sure you want to permanently delete your account? This action will wipe all your data from our servers and cannot be undone."
        );
        if (!confirmed) return;

        try {
            setIsProcessing(true);
            await userService.deleteUser();
            toast.success("Account deleted successfully.");
            
            localStorage.removeItem('accessToken');
            window.location.href = '/login';
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete account.");
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto h-full flex flex-col space-y-6 pb-12 pr-2">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Account Settings</h1>
                <p className="text-slate-500 mt-1">Manage your identity, contact details, and security protocols.</p>
            </div>

            {/* Horizontal Tabs */}
            <Tabs defaultValue="general" className="w-full flex flex-col flex-1">
                
                <TabsList className="inline-flex h-11 items-center justify-center rounded-lg bg-slate-100 p-1 text-slate-500 w-full max-w-[400px] mb-6">
                    <TabsTrigger value="general" className="w-full h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 rounded-md">General</TabsTrigger>
                    <TabsTrigger value="security" className="w-full h-full data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 rounded-md">Security</TabsTrigger>
                </TabsList>

                <div className="flex-1 w-full relative">
                    
                    {/* --- GENERAL TAB --- */}
                    <TabsContent value="general" className="space-y-6 m-0 outline-none animate-in fade-in duration-300">
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="pb-4 border-b border-slate-50">
                                <CardTitle className="text-xl">Public Profile</CardTitle>
                                <CardDescription>This information will be visible to members of your classrooms.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-8 space-y-8">
                                
                                {/* Avatar Section */}
                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                    <div className="relative group">
                                        <Avatar className="h-24 w-24 ring-4 ring-slate-50 shadow-sm">
                                            <AvatarImage src={user?.profilePhotoUrl || undefined} />
                                            <AvatarFallback className="text-2xl bg-indigo-50 text-indigo-600 font-bold">
                                                {user?.fullName?.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <label htmlFor="photo-upload" className="absolute bottom-0 right-0 p-1.5 bg-white border border-slate-200 rounded-full shadow-md cursor-pointer hover:bg-slate-50 transition-colors">
                                            <FiCamera className="h-4 w-4 text-slate-600" />
                                            <input id="photo-upload" type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={isUpdatingProfile} />
                                        </label>
                                    </div>
                                    <div className="text-center sm:text-left">
                                        <h4 className="font-semibold text-slate-900">Profile Picture</h4>
                                        <p className="text-sm text-slate-500 mt-1">JPG, PNG or WebP. Max 2MB.</p>
                                    </div>
                                </div>

                                {/* Name Input Section */}
                                <div className="grid grid-cols-1 gap-6 pt-4 border-t border-slate-50">
                                    <div className="space-y-2 max-w-md">
                                        <Label htmlFor="fullname" className="text-slate-700">Display Name</Label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <Input 
                                                    id="fullname" 
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    className="pl-10"
                                                />
                                            </div>
                                            <Button onClick={handleUpdateName} disabled={isUpdatingProfile || fullName === user?.fullName || !fullName.trim()}>
                                                Update
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Account Stats / Role Badge (Read Only) */}
                        <Card className="bg-slate-50/50 border-dashed">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                                        <FiShield className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Account Privilege</p>
                                        <p className="text-lg font-bold text-slate-900">{user?.accountType}</p>
                                    </div>
                                </div>
                                <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none px-4 py-1">Active Account</Badge>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* --- SECURITY TAB --- */}
                    <TabsContent value="security" className="space-y-6 m-0 outline-none animate-in fade-in duration-300">
                        
                        {/* Email Verification Card */}
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="pb-4 border-b border-slate-50">
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <FiMail className="text-slate-400" /> Primary Email
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <p className="text-lg font-semibold text-slate-900">{user?.email}</p>
                                    <div className="flex items-center gap-2">
                                        {user?.isEmailVerified ? (
                                            <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase tracking-tighter border border-green-100">
                                                <FiCheckCircle className="mr-1 h-3 w-3" /> Identity Verified
                                            </span>
                                        ) : (
                                            <span className="flex items-center text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase tracking-tighter border border-amber-100">
                                                <FiAlertCircle className="mr-1 h-3 w-3" /> Verification Required
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {!user?.isEmailVerified && (
                                    <Button onClick={() => handleRequestOtp("EMAIL_VERIFICATION")} disabled={isProcessing} variant="secondary" className="bg-indigo-600 text-white hover:bg-indigo-700">
                                        Verify Now
                                    </Button>
                                )}
                            </CardContent>
                        </Card>

                        {/* Password Management Card */}
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="pb-4 border-b border-slate-50">
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <FiLock className="text-slate-400" /> Password Management
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                
                                {/* 2nd Row: Current Password + Request OTP */}
                                <div className="flex flex-col sm:flex-row items-end gap-4">
                                    <div className="space-y-2 flex-1 max-w-sm">
                                        <Label htmlFor="oldPass">Current Password</Label>
                                        <div className="relative">
                                            <Input 
                                                id="oldPass" 
                                                type={showCurrent ? "text" : "password"} 
                                                value={passwords.oldPassword} 
                                                onChange={(e) => setPasswords({...passwords, oldPassword: e.target.value})} 
                                                placeholder="••••••••" 
                                                disabled={stagedOtp !== null}
                                                className="pr-10"
                                            />
                                            <button 
                                                type="button" 
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                                                onClick={() => setShowCurrent(!showCurrent)}
                                                disabled={stagedOtp !== null}
                                            >
                                                {showCurrent ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <Button 
                                        onClick={() => handleRequestOtp("CHANGE_PASSWORD")} 
                                        disabled={isProcessing || !passwords.oldPassword || stagedOtp !== null}
                                        variant="secondary"
                                        className="w-full sm:w-auto shrink-0"
                                    >
                                        Request OTP
                                    </Button>
                                </div>

                                {/* 3rd & 4th Rows: Progressively Revealed after OTP */}
                                {stagedOtp !== null && (
                                    <div className="space-y-6 pt-6 mt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
                                        
                                        {/* 3rd Row: New Password */}
                                        <div className="space-y-2 max-w-sm">
                                            <Label htmlFor="newPass">New Password</Label>
                                            <div className="relative">
                                                <Input 
                                                    id="newPass" 
                                                    type={showNew ? "text" : "password"} 
                                                    value={passwords.newPassword} 
                                                    onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})} 
                                                    placeholder="••••••••" 
                                                    className="pr-10"
                                                />
                                                <button 
                                                    type="button" 
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                    onClick={() => setShowNew(!showNew)}
                                                >
                                                    {showNew ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* 4th Row: Confirm Password + Change Password Button */}
                                        <div className="flex flex-col sm:flex-row items-end gap-4">
                                            <div className="space-y-2 flex-1 max-w-sm">
                                                <Label htmlFor="confirmPass">Confirm Password</Label>
                                                <Input 
                                                    id="confirmPass" 
                                                    type="password" 
                                                    value={passwords.confirmPassword} 
                                                    onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})} 
                                                    placeholder="••••••••" 
                                                />
                                            </div>
                                            <Button 
                                                onClick={handleChangePasswordSubmit} 
                                                disabled={isProcessing || !passwords.newPassword || !passwords.confirmPassword}
                                                className="w-full sm:w-auto shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white"
                                            >
                                                Change Password
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Danger Zone Card */}
                        <Card className="border-red-200 shadow-sm mt-8">
                            <CardHeader className="bg-red-50/50 border-b border-red-100 rounded-t-xl">
                                <CardTitle className="text-red-700 flex items-center gap-2">
                                    <FiAlertTriangle className="h-5 w-5" /> Danger Zone
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h4 className="font-semibold text-slate-900">Delete Account</h4>
                                        <p className="text-sm text-slate-500">Permanently remove your account and all associated data from the server. This action cannot be undone.</p>
                                    </div>
                                    <Button 
                                        variant="destructive" 
                                        onClick={handleDeleteAccount}
                                        disabled={isProcessing}
                                        className="w-full sm:w-auto shrink-0 bg-red-600 hover:bg-red-700"
                                    >
                                        Delete My Account
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>

            {/* Universal OTP Dialog */}
            <Dialog open={isOtpModalOpen} onOpenChange={setIsOtpModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Security Challenge</DialogTitle>
                        <DialogDescription className="text-slate-500">
                            We've sent a 6-digit verification code to <strong>{user?.email}</strong>. This code expires in 15 minutes.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6 space-y-6">
                        <div className="space-y-3">
                            <Label className="text-center block text-slate-600 font-medium">Enter Code</Label>
                            <Input 
                                value={otpValue}
                                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                className="text-center text-3xl tracking-[0.4em] font-mono h-16 border-2 focus:border-indigo-500"
                            />
                        </div>
                        <Button onClick={handleModalConfirm} disabled={otpValue.length !== 6 || isProcessing} className="w-full h-12 text-lg shadow-lg shadow-indigo-100">
                            {isProcessing ? "Processing..." : "Confirm Action"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

// Helper components for consistency
const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${className}`}>
        {children}
    </span>
);

export default UserProfile;