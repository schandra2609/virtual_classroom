import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "@/hooks/redux";
import { FiLoader } from "react-icons/fi";

const ProtectedRoute = () => {
    const { isAuthenticated, isLoading, user } = useAppSelector((state) => state.auth);

    // 1. Wait for App.tsx to finish talking to the backend
    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-50">
                <FiLoader className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // 2. Strict Check: Must be authenticated AND have a valid user object
    return isAuthenticated && user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;