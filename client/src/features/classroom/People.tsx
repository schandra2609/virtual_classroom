import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as memberService from '../../api/memberService';
import { User, Mail, ShieldCheck, GraduationCap, Search, UserMinus } from 'lucide-react';
import { useAppSelector } from '../../hooks/store';

interface Member {
    id: string;
    fullName: string;
    email: string;
    accountType: string;
    profilePhotoUrl?: string;
    role: 'TUTOR' | 'STUDENT';
}

const People: React.FC = () => {
    const { classroomId } = useParams<{ classroomId: string }>();
    const { user: currentUser } = useAppSelector((state) => state.auth);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const data = await memberService.getClassroomMembers(classroomId!);
                setMembers(data);
            } catch (error) {
                console.error('Failed to fetch members', error);
            } finally {
                setLoading(false);
            }
        };
        fetchMembers();
    }, [classroomId]);

    const teachers = members.filter(m => m.role === 'TUTOR' || m.accountType === 'TUTOR');
    const students = members.filter(m => m.role === 'STUDENT' && m.accountType !== 'TUTOR');

    const filteredStudents = students.filter(s => 
        s.fullName.toLowerCase().includes(search.toLowerCase()) || 
        s.email.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse">
                {[1, 2].map(i => (
                    <div key={i} className="space-y-4">
                        <div className="h-8 bg-slate-100 rounded-lg w-32"></div>
                        <div className="space-y-2">
                            {[1, 2, 3].map(j => (
                                <div key={j} className="h-16 bg-white border border-slate-100 rounded-2xl"></div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-20">
            {/* Teachers Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <h2 className="text-3xl font-black text-cyan-600 tracking-tight flex items-center gap-3">
                        Teachers
                    </h2>
                    <span className="bg-cyan-50 text-cyan-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                        {teachers.length} {teachers.length === 1 ? 'Teacher' : 'Teachers'}
                    </span>
                </div>
                <div className="grid gap-3">
                    {teachers.map((teacher) => (
                        <div key={teacher.id} className="group flex items-center justify-between p-4 bg-white border border-slate-200 rounded-[1.5rem] hover:border-cyan-200 hover:shadow-lg hover:shadow-cyan-100/50 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100">
                                    {teacher.profilePhotoUrl ? (
                                        <img src={teacher.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="text-slate-300" size={24} />
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                        {teacher.fullName}
                                        <ShieldCheck size={16} className="text-cyan-500" />
                                    </h4>
                                    <p className="text-xs text-slate-400 font-medium">{teacher.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-xl transition-all">
                                    <Mail size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Students Section */}
            <section className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Students</h2>
                        <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                            {students.length} Total
                        </span>
                    </div>
                    
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all w-full sm:w-64"
                        />
                    </div>
                </div>

                <div className="grid gap-3">
                    {filteredStudents.length === 0 ? (
                        <div className="py-12 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem]">
                            <p className="text-slate-400 font-medium">No students found</p>
                        </div>
                    ) : (
                        filteredStudents.map((student) => (
                            <div key={student.id} className="group flex items-center justify-between p-4 bg-white border border-slate-200 rounded-[1.5rem] hover:border-slate-300 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100">
                                        {student.profilePhotoUrl ? (
                                            <img src={student.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <GraduationCap className="text-slate-300" size={24} />
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">{student.fullName}</h4>
                                        <p className="text-xs text-slate-400 font-medium">{student.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-2.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-xl transition-all" title="Email Student">
                                        <Mail size={18} />
                                    </button>
                                    {currentUser?.accountType === 'TUTOR' && (
                                        <button className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Remove from class">
                                            <UserMinus size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
};

export default People;
