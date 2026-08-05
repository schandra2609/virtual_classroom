import { Link, Outlet, useNavigate } from "react-router-dom";
import { FiSettings, FiLogOut, FiUser } from "react-icons/fi";
import { toast } from "sonner";

// Redux & Services
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { logout } from "@/features/auth/authSlice";
import { authService } from "@/api/auth.service";

// Shadcn Components
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DashboardLayout = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { user } = useAppSelector((state) => state.auth);

    const handleLogout = async () => {
        try {
            const response = await authService.logout();
            dispatch(logout());
            toast.success(response.message || "Logged out successfully");
            navigate("/login");
        } catch (error: any) {
            toast.error(error.message || "Failed to log out");
        }
    };

    const getInitials = (name: string) => {
        if (!name || !name.trim()) return null;
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0][0].toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    return (
        <div className="flex h-[100dvh] w-full flex-col bg-slate-50 text-slate-900 overflow-hidden">
            
            {/* Top Navigation Bar */}
            <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8 shadow-sm shrink-0 w-full">
                
                {/* Left side: Brand */}
                <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl tracking-wider uppercase" style={{ fontFamily: "Arial" }}>
                    <span className="text-primary">Virtual</span>
                    <span className="text-slate-800">Classroom</span>
                </Link>

                {/* Right side: User Info & Profile Dropdown */}
                <div className="ml-auto flex items-center gap-4">
                    
                    {/* User Info Block */}
                    <div className="hidden sm:flex flex-col items-end text-right mr-1">
                        <span className="text-sm font-bold text-slate-900 tracking-wide">
                            {user?.fullName}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
                            {user?.accountType}
                        </span>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full border-2 border-slate-200 p-0 overflow-hidden hover:border-primary transition-colors">
                                <Avatar className="h-full w-full">
                                    <AvatarImage src={user?.profilePhotoUrl || undefined} alt={user?.fullName} className="object-cover" />
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                                        {user ? getInitials(user.fullName) : <FiUser className="h-5 w-5" />}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                                    <p className="text-xs leading-none text-slate-500">{user?.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem onClick={() => navigate("/dashboard/profile")} className="cursor-pointer">
                                <FiUser className="mr-2 h-4 w-4" />
                                <span>My Profile</span>
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => navigate("/dashboard/settings")} className="cursor-pointer">
                                <FiSettings className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                                <FiLogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 overflow-y-auto flex flex-col min-h-0">
                <Outlet />
            </main>
        </div>
    );
};

export default DashboardLayout;