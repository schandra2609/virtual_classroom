import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
    BookOpen, 
    ChevronRight, 
    LayoutDashboard, 
    ShieldCheck, 
    Presentation, 
    ArrowRight,
    Chrome
} from 'lucide-react';

const Landing: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-cyan-100 selection:text-cyan-900">
            {/* Header */}
            <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-cyan-600 p-2 rounded-xl text-white shadow-lg shadow-cyan-200">
                            <BookOpen size={24} />
                        </div>
                        <span className="text-xl font-black bg-gradient-to-r from-cyan-600 to-indigo-600 bg-clip-text text-transparent tracking-tighter">
                            Virtual Classroom
                        </span>
                    </div>
                    
                    <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500">
                        <a href="#features" className="hover:text-cyan-600 transition-colors">Features</a>
                        <a href="#about" className="hover:text-cyan-600 transition-colors">About</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link 
                            to="/login"
                            className="text-sm font-bold text-slate-600 hover:text-cyan-600 transition-colors px-4 py-2"
                        >
                            Login
                        </Link>
                        <Link 
                            to="/register"
                            className="text-sm font-bold bg-slate-900 text-white px-6 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-40 pb-20 px-6 overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="flex-1 space-y-8 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-50 border border-cyan-100 rounded-full text-cyan-700 text-xs font-black uppercase tracking-widest animate-fade-in">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                                </span>
                                Next Generation Learning
                            </div>
                            
                            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight">
                                Teaching and Learning <br />
                                <span className="bg-gradient-to-r from-cyan-600 to-indigo-600 bg-clip-text text-transparent">Reimagined.</span>
                            </h1>
                            
                            <p className="text-lg text-slate-500 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                                A powerful, simple, and sleek platform to manage your classrooms, 
                                assignments, and real-time interaction in one place. 
                                Built for the modern educator.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                                <button 
                                    onClick={() => navigate('/register')}
                                    className="w-full sm:w-auto px-8 py-4 bg-cyan-600 text-white font-black rounded-2xl hover:bg-cyan-700 transition-all shadow-xl shadow-cyan-200 flex items-center justify-center gap-2 group active:scale-95"
                                >
                                    Start Teaching Free
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button 
                                    onClick={() => navigate('/register')}
                                    className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3 active:scale-95"
                                >
                                    <Chrome size={20} className="text-blue-500" />
                                    Signup with Google
                                </button>
                            </div>

                            <div className="flex items-center gap-12 justify-center lg:justify-start pt-8">
                                <div className="space-y-1">
                                    <p className="text-3xl font-black text-slate-900 tracking-tighter">10k+</p>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Students</p>
                                </div>
                                <div className="w-px h-10 bg-slate-100"></div>
                                <div className="space-y-1">
                                    <p className="text-3xl font-black text-slate-900 tracking-tighter">500+</p>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Top Tutors</p>
                                </div>
                            </div>
                        </div>

                        {/* Visual element */}
                        <div className="flex-1 relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-cyan-50 rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-pulse"></div>
                            <div className="relative bg-white border border-slate-200 rounded-[3rem] shadow-2xl overflow-hidden p-2 transform rotate-2 hover:rotate-0 transition-transform duration-700">
                                <div className="bg-slate-50 rounded-[2.5rem] p-8 aspect-[4/3] flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-cyan-600">
                                            <LayoutDashboard size={24} />
                                        </div>
                                        <div className="flex -space-x-3">
                                            {[1,2,3,4].map(i => (
                                                <div key={i} className="w-10 h-10 rounded-full bg-slate-200 border-4 border-white"></div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="h-4 bg-slate-200 rounded-full w-3/4"></div>
                                        <div className="h-4 bg-slate-100 rounded-full w-1/2"></div>
                                        <div className="grid grid-cols-2 gap-4 pt-4">
                                            <div className="h-20 bg-white rounded-3xl border border-slate-100 shadow-sm p-4 flex flex-col justify-end gap-2">
                                                <div className="h-2 bg-slate-50 rounded-full w-full"></div>
                                                <div className="h-2 bg-slate-50 rounded-full w-2/3"></div>
                                            </div>
                                            <div className="h-20 bg-cyan-600 rounded-3xl shadow-lg p-4 flex flex-col justify-end gap-2">
                                                <div className="h-2 bg-cyan-500/50 rounded-full w-full"></div>
                                                <div className="h-2 bg-cyan-500/50 rounded-full w-1/2"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Preview */}
            <section id="features" className="py-32 px-6 bg-slate-50/50 border-t border-slate-100">
                <div className="max-w-7xl mx-auto space-y-20">
                    <div className="text-center space-y-4 max-w-3xl mx-auto">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Everything you need for successful learning.</h2>
                        <p className="text-slate-500 font-medium leading-relaxed">
                            Stop juggling multiple apps. We've consolidated classroom management, 
                            real-time interaction, and assessments into a single, cohesive experience.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Presentation className="text-cyan-600" size={32} />,
                                title: "Real-time Stream",
                                desc: "Instantly share announcements and materials with your students through our real-time feed."
                            },
                            {
                                icon: <LayoutDashboard className="text-indigo-600" size={32} />,
                                title: "Assignment Tracking",
                                desc: "Manage submissions effortlessly. Students can upload work and track deadlines with ease."
                            },
                            {
                                icon: <ShieldCheck className="text-emerald-600" size={32} />,
                                title: "Secure & Organized",
                                desc: "Role-based access ensures every class remains a safe and productive environment."
                            }
                        ].map((feature, i) => (
                            <div key={i} className="group p-10 bg-white border border-slate-200 rounded-[2.5rem] hover:border-cyan-200 hover:shadow-xl hover:shadow-cyan-100/30 transition-all">
                                <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-4">{feature.title}</h3>
                                <p className="text-slate-500 font-medium leading-relaxed text-sm">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 px-6">
                <div className="max-w-7xl mx-auto bg-slate-900 rounded-[3rem] p-12 lg:p-24 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-600/20 rounded-full blur-[100px] -mr-48 -mt-48"></div>
                    <div className="relative z-10 text-center space-y-12 max-w-4xl mx-auto">
                        <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                            Ready to transform your virtual classroom experience?
                        </h2>
                        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
                            <button 
                                onClick={() => navigate('/register')}
                                className="w-full sm:w-auto px-10 py-5 bg-white text-slate-900 font-black rounded-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2 active:scale-95"
                            >
                                Get Started for Free
                                <ChevronRight size={20} />
                            </button>
                            <Link 
                                to="/login"
                                className="text-white/60 hover:text-white font-bold transition-colors px-6"
                            >
                                Already have an account? Log In
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-slate-100 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-100 p-2 rounded-xl text-slate-400">
                            <BookOpen size={20} />
                        </div>
                        <span className="text-sm font-bold text-slate-400">
                            © 2026 Virtual Classroom Inc.
                        </span>
                    </div>
                    <div className="flex items-center gap-8 text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <a href="#" className="hover:text-cyan-600">Privacy Policy</a>
                        <a href="#" className="hover:text-cyan-600">Terms of Service</a>
                        <a href="#" className="hover:text-cyan-600">Support</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
