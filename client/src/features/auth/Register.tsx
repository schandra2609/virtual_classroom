import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { FiEye, FiEyeOff } from "react-icons/fi";

// Redux & Services
import { useAppDispatch } from "@/hooks/redux";
import { setCredentials } from "./authSlice";
import { authService } from "@/api/auth.service";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// 1. Define the validation schema with the strong password requirements
const registerSchema = z.object({
    fullName: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    accountType: z.enum(["STUDENT", "TUTOR"], { message: "Please select an account type." }),
    password: z
        .string()
        .min(8, { message: "Password must be at least 8 characters." })
        .regex(/[a-z]/, { message: "Must contain at least one lowercase letter." })
        .regex(/[A-Z]/, { message: "Must contain at least one uppercase letter." })
        .regex(/[0-9]/, { message: "Must contain at least one number." })
        .regex(/[^a-zA-Z0-9]/, { message: "Must contain at least one symbol." }),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"], // This targets the error message to the confirmPassword field
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    // Read the intended tab from the router state
    const location = useLocation();
    const defaultTab = location.state?.defaultTab || 'STUDENT';

    // 2. Initialize the form dynamically based on the router state
    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            fullName: "",
            email: "",
            password: "",
            confirmPassword: "",
            accountType: defaultTab, // Dynamically set the default account type!
        },
    });

    // 3. Handle the submission
    const onSubmit = async (values: RegisterFormValues) => {
        try {
            setIsLoading(true);
            const { confirmPassword, ...registerData } = values;      
            const response = await authService.register(registerData);

            if(response.success) {
                dispatch(setCredentials({ 
                    user: response.data.user, 
                    accessToken: response.data.accessToken 
                }));
                toast.success(response.message|| "Registration successful!");
                navigate("/dashboard");
            } else {
                toast.success("Account created successfully! Please log in.");
                navigate("/login");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Registration failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4 py-8">
            <Card className="w-full max-w-md shadow-lg sm:p-4">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold tracking-tight">Create an account</CardTitle>
                    <CardDescription>
                        Join the Virtual Classroom. Select your role below to get started.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            {/* Role Selection using Shadcn Tabs */}
                            <FormField
                                control={form.control}
                                name="accountType"
                                render={({ field }) => (
                                    <FormItem className="mb-6">
                                        <FormControl>
                                            <Tabs 
                                                value={field.value} // Use 'value' instead of 'defaultValue' for a controlled component
                                                onValueChange={field.onChange} 
                                                className="w-full"
                                            >
                                                <TabsList className="grid w-full grid-cols-2">
                                                    <TabsTrigger 
                                                        value="STUDENT" 
                                                        disabled={isLoading}
                                                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                                    >
                                                        Student
                                                    </TabsTrigger>
                                                    <TabsTrigger 
                                                        value="TUTOR" 
                                                        disabled={isLoading}
                                                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                                    >
                                                        Tutor
                                                    </TabsTrigger>
                                                </TabsList>
                                            </Tabs>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="fullName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John Doe" {...field} disabled={isLoading} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="student@demo.com" {...field} disabled={isLoading} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    {...field}
                                                    disabled={isLoading}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                                >
                                                    {showPassword ? ( <FiEyeOff className="h-4 w-4" /> ) : ( <FiEye className="h-4 w-4" /> )}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Confirm Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    {...field}
                                                    disabled={isLoading}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                                                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                                >
                                                    {showConfirmPassword ? ( <FiEyeOff className="h-4 w-4" /> ) : ( <FiEye className="h-4 w-4" /> )}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                                {isLoading ? "Creating account..." : "Register"}
                            </Button>

                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-2 text-slate-500">Or continue with</span>
                                </div>
                            </div>

                            <Button 
                                type="button" 
                                variant="outline" 
                                className="w-full gap-2"
                                onClick={() => {
                                    const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
                                    window.location.href = `${BASE_URL}/auth/google`;
                                }}
                            >
                                <svg className="h-4 w-4" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Google
                            </Button>

                            {/* Login Link Section */}
                            <div className="mt-4 text-center text-sm text-muted-foreground">
                                Already have an account?{" "}
                                <Link to="/login" className="font-medium text-primary hover:underline">
                                    Log in here
                                </Link>
                            </div>

                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
};

export default Register;