import { Link, Outlet, useNavigate } from "react-router-dom";
import { FiBookOpen, FiCalendar, FiSettings, FiLogOut, FiMenu, FiUser } from "react-icons/fi";
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
            await authService.logout();
            dispatch(logout());
            toast.success("Logged out successfully");
            navigate("/login");
        } catch (error) {
            toast.error("Failed to log out");
        }
    };

    // Get initials for the avatar fallback (e.g., "Sayan Chandra" -> "SC")
    const getInitials = (name: string) => {
        return name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
    };

    return (
        <div className="flex min-h-screen w-full flex-col bg-slate-50 md:flex-row text-slate-900">
            
            {/* Desktop Sidebar */}
            <aside className="hidden w-72 flex-col border-r border-slate-200 bg-white md:flex">
                <div className="flex h-20 items-center border-b border-slate-200 px-6">
                    <Link to="/dashboard" className="flex items-center gap-2 font-bold text-lg tracking-tight uppercase" style={{ fontFamily: "Arial" }}>
                        <div className="flex items-center gap-2 font-bold text-xl tracking-wide">
                            <span className="text-primary">Virtual</span>Classroom
                        </div>
                    </Link>
                </div>
                
                <nav className="flex-1 space-y-2 p-4">
                    <Link to="/dashboard" className="flex items-center gap-3 rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900 transition-colors">
                        <FiBookOpen className="h-4 w-4" />
                        Classrooms
                    </Link>
                    <Link to="/dashboard/calendar" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                        <FiCalendar className="h-4 w-4" />
                        Calendar
                    </Link>
                    <Link to="/dashboard/settings" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                        <FiSettings className="h-4 w-4" />
                        Settings
                    </Link>
                </nav>

                {/* Bottom Sidebar info */}
                <div className="border-t border-slate-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">{user?.fullName}</span>
                            <span className="text-xs text-slate-500 capitalize">{user?.accountType.toLowerCase()}</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col">
                
                {/* Top Navigation Bar */}
                <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6 shadow-sm">
                    {/* Mobile Hamburger Menu (Hidden on Desktop) */}
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <FiMenu className="h-5 w-5" />
                        <span className="sr-only">Toggle menu</span>
                    </Button>

                    <div className="md:hidden flex items-center font-bold tracking-tight uppercase" style={{ fontFamily: "Arial" }}>
                        <span className="text-primary text-lg">V</span><span className="text-primary text-lg">C</span>
                    </div>

                    {/* Right side Profile Dropdown */}
                    <div className="ml-auto flex items-center gap-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full border border-slate-200 p-0 overflow-hidden">
                                    <Avatar className="h-8 w-8 hover:opacity-80 transition-opacity">
                                        <AvatarImage src={user?.profilePhotoUrl || ""} alt={user?.fullName} />
                                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                            {user ? getInitials(user.fullName) : <FiUser className="h-4 w-4" />}
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
                                
                                {/* New Profile Navigation Item */}
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

                {/* Page Content injected here */}
                <main className="flex-1 p-4 md:p-6 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;