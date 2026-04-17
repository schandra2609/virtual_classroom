import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Landing = () => {
    return (
        <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 overflow-x-hidden">
            {/* Navigation Bar */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto flex min-h-14 flex-wrap items-center justify-between gap-4 px-4 py-4 sm:py-6 md:py-8 lg:py-10">
                    <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2 font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl tracking-wide">
                        Virtual Classroom
                    </div>
                    <nav className="flex items-center gap-3 sm:gap-4 md:gap-6">
                        <Link to="/login" className="text-xs sm:text-sm md:text-base lg:text-lg font-medium text-muted-foreground hover:text-foreground whitespace-nowrap">
                            Log in
                        </Link>
                        <Button asChild className="h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm md:h-11 md:px-8 md:text-base rounded-lg whitespace-nowrap">
                            <Link to="/register">Get Started</Link>
                        </Button>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex-1 w-full">
                <section className="container mx-auto flex w-full flex-col items-center justify-center gap-4 sm:gap-6 pb-8 pt-12 sm:pt-16 md:pt-24 lg:pt-32 px-4 sm:px-6 md:px-8 text-center">
                    
                    {/* Heading */}
                    <h1 
                        className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl tracking-widest uppercase text-slate-800 break-words" 
                        style={{ fontFamily: "Arial" }}
                    >
                        <span className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl text-primary">V</span>irtual
                        <br className="block sm:hidden" />
                        <span className="hidden sm:inline">&nbsp;</span>
                        <span className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl text-primary">C</span>lassroom
                    </h1>
                    
                    <p className="max-w-[90%] sm:max-w-[80%] md:max-w-2xl lg:max-w-[42rem] mx-auto text-xs sm:text-sm md:text-lg lg:text-xl xl:text-2xl leading-relaxed text-slate-600 sm:leading-7 md:leading-8 mt-2 sm:mt-4 px-2">
                        The all-in-one platform for tutors and students. Manage coursework, communicate effortlessly, and experience our state-of-the-art Computer-Based Test (CBT) engine.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row w-full sm:w-auto justify-center items-center gap-3 sm:gap-4 mt-6 sm:mt-8 px-4 sm:px-0">
                        <Button asChild className="w-full sm:w-auto max-w-[250px] h-10 px-6 text-sm md:h-12 md:px-8 md:text-base lg:h-14 lg:px-10 lg:text-lg rounded-md">
                            <Link to="/register" state={{ defaultTab: 'STUDENT' }}>Join as a Student</Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full sm:w-auto max-w-[250px] h-10 px-6 text-sm md:h-12 md:px-8 md:text-base lg:h-14 lg:px-10 lg:text-lg bg-white rounded-md">
                            <Link to="/register" state={{ defaultTab: 'TUTOR' }}>Apply as a Tutor</Link>
                        </Button>
                    </div>
                </section>

                {/* Feature Highlights */}
                <section className="container mx-auto py-10 px-4 sm:px-6 md:px-8 sm:py-16 md:py-24 lg:py-32">
                    <div className="grid gap-4 sm:gap-6 md:gap-8 lg:gap-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        
                        <div className="flex flex-col items-center space-y-2 sm:space-y-3 text-center border border-slate-200 p-4 sm:p-6 md:p-8 rounded-lg shadow-sm bg-white h-full">
                            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800">Interactive Classrooms</h2>
                            <p className="text-sm sm:text-base md:text-lg text-slate-600 flex-grow">
                                Join via unique codes. Access announcements, discussion threads, and structured class feeds in real-time.
                            </p>
                        </div>

                        <div className="flex flex-col items-center space-y-2 sm:space-y-3 text-center border border-slate-200 p-4 sm:p-6 md:p-8 rounded-lg shadow-sm bg-white h-full">
                            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800">Seamless Assignments</h2>
                            <p className="text-sm sm:text-base md:text-lg text-slate-600 flex-grow">
                                Tutors can upload attachments and set deadlines. Students can easily submit their solutions for grading.
                            </p>
                        </div>

                        <div className="flex flex-col items-center space-y-2 sm:space-y-3 text-center border border-slate-200 p-4 sm:p-6 md:p-8 rounded-lg shadow-sm bg-white h-full sm:col-span-2 lg:col-span-1">
                            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800">Advanced CBT Engine</h2>
                            <p className="text-sm sm:text-base md:text-lg text-slate-600 flex-grow">
                                Take timed, highly secure examinations with MCQ, MSQ, and NAT questions. Instant auto-grading included.
                            </p>
                        </div>

                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="w-full border-t border-slate-200 bg-white py-4 sm:py-6 md:py-8 mt-auto">
                <div className="container mx-auto flex flex-col items-center justify-center gap-2 md:flex-row px-4 text-xs sm:text-sm md:text-base text-slate-500 text-center">
                    <p>© 2026 Virtual Classroom MVP. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;