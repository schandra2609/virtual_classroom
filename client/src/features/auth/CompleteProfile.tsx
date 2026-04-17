import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { FaGraduationCap } from "react-icons/fa";
import { FiBookOpen } from "react-icons/fi";

// Redux & Services
import { useAppDispatch } from "@/hooks/redux";
import { setCredentials } from "@/features/auth/authSlice";
import { authService } from "@/api/auth.service";

// Shadcn UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CompleteProfile = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    
    const [isLoading, setIsLoading] = useState(false);
    const [accountType, setAccountType] = useState<"STUDENT" | "TUTOR">("STUDENT");
    const setupToken = searchParams.get("setupToken");

    useEffect(() => {
        if (!setupToken) {
            toast.error("Invalid or missing setup token. Please try logging in again.");
            navigate("/login", { replace: true });
        }
    }, [setupToken, navigate]);

    const handleCompleteProfile = async () => {
        if (!setupToken) return;
        
        try {
            setIsLoading(true);
            const response = await authService.completeProfile({
                setupToken,
                accountType,
                qualificationUrl: "OAUTH_PENDING_UPLOAD" 
            });

            if (response.success && response.data) {
                const { user, accessToken } = response.data;
                
                // Populate Redux and LocalStorage
                dispatch(setCredentials({ user, accessToken }));
                
                toast.success("Profile completed successfully!");
                navigate("/dashboard", { replace: true });
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to complete profile.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!setupToken) return null;

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md shadow-lg border-slate-200">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                        <FaGraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Welcome to Virtual Classroom</CardTitle>
                    <CardDescription className="text-base">
                        Almost there! How will you be using the platform?
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Tabs 
                        value={accountType} 
                        onValueChange={(val) => setAccountType(val as "STUDENT" | "TUTOR")} 
                        className="w-full"
                    >
                        <TabsList className="grid w-full grid-cols-2 h-14 bg-slate-100">
                            <TabsTrigger value="STUDENT" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm gap-2">
                                <FiBookOpen className="h-4 w-4" /> Student
                            </TabsTrigger>
                            <TabsTrigger value="TUTOR" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm gap-2">
                                <FaGraduationCap className="h-4 w-4" /> Tutor
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm border border-blue-100">
                        {accountType === "STUDENT" 
                            ? "As a student, you'll be able to join classrooms, submit assignments, and take exams."
                            : "As a tutor, you'll be able to create classrooms, assign coursework, and grade students. (Note: Admin verification will be required)."}
                    </div>

                    <Button 
                        className="w-full h-11 text-base" 
                        onClick={handleCompleteProfile}
                        disabled={isLoading}
                    >
                        {isLoading ? "Completing setup..." : "Complete Setup & Login"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default CompleteProfile;