import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiLoader } from "react-icons/fi";
import { toast } from "sonner";

// Redux & API
import { useAppDispatch } from "@/hooks/redux";
import { setCredentials } from "@/features/auth/authSlice";
import { userService } from "@/api/user.service";
import { setInMemoryToken } from "@/api/API";

const OAuthCallback = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Fetch profile; API interceptor handles silent refresh via HttpOnly cookie if token is missing
                const response = await userService.getCurrentUser();
                
                if (response.success) {
                    const extractedUser = response.data?.user || response.data;
                    dispatch(setCredentials({
                        user: extractedUser,
                        accessToken: "" // Handled via HttpOnly Cookie / silent refresh
                    }));
                    
                    toast.success("Logged in successfully!");
                    navigate("/dashboard", { replace: true });
                } else {
                    throw new Error("Failed to fetch profile");
                }
            } catch (error) {
                setInMemoryToken(null);
                toast.error("Session initialization failed. Please log in again.");
                navigate("/login", { replace: true });
            }
        };

        handleCallback();
    }, [navigate, dispatch]);

    return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-50 flex-col gap-4">
            <FiLoader className="h-10 w-10 animate-spin text-primary" />
            <p className="text-slate-600 font-medium animate-pulse">Authenticating securely...</p>
        </div>
    );
};

export default OAuthCallback;