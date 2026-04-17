import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiLoader } from "react-icons/fi";
import { toast } from "sonner";

// Redux & API
import { useAppDispatch } from "@/hooks/redux";
import { setCredentials } from "@/features/auth/authSlice";
import { userService } from "@/api/user.service";

const OAuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    useEffect(() => {
        const handleCallback = async () => {
            const token = searchParams.get("token");

            if (!token) {
                toast.error("Authentication failed. Please try again.");
                navigate("/login", { replace: true });
                return;
            }

            // 1. Temporarily save the token to local storage so the API interceptor can use it
            localStorage.setItem("accessToken", token);

            try {
                // 2. Fetch the user's full profile
                const response = await userService.getCurrentUser();
                
                if (response.success) {
                    // 3. Populate Redux
                    const extractedUser = response.data?.user || response.data;
                    dispatch(setCredentials({
                        user: extractedUser,
                        accessToken: token
                    }));
                    
                    toast.success("Logged in successfully!");
                    navigate("/dashboard", { replace: true });
                } else {
                    throw new Error("Failed to fetch profile");
                }
            } catch (error) {
                localStorage.removeItem("accessToken");
                toast.error("Session initialization failed. Please log in again.");
                navigate("/login", { replace: true });
            }
        };

        handleCallback();
    }, [searchParams, navigate, dispatch]);

    return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-50 flex-col gap-4">
            <FiLoader className="h-10 w-10 animate-spin text-primary" />
            <p className="text-slate-600 font-medium animate-pulse">Authenticating securely...</p>
        </div>
    );
};

export default OAuthCallback;