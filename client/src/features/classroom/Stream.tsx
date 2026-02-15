import React, { useEffect, useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/store';
import { fetchAnnouncements, addAnnouncement } from './announcementSlice';
import { useSocket } from '../../context/SocketContext';
import { Send, Paperclip, MessageSquare, Clock, User as UserIcon, FileText, Image as ImageIcon, X, Loader2, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import * as announcementService from '../../api/announcementService';

dayjs.extend(relativeTime);

const Stream: React.FC = () => {
    const { classroomId } = useParams<{ classroomId: string }>();
    const { classroom } = useOutletContext<{ classroom: any }>();
    const dispatch = useAppDispatch();
    const { announcements, loading } = useAppSelector((state) => state.announcement);
    const { user } = useAppSelector((state) => state.auth);
    const { socket } = useSocket();

    const [message, setMessage] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [files, setFiles] = useState<File[]>([]);

    useEffect(() => {
        if (classroomId) {
            dispatch(fetchAnnouncements(classroomId));
            
            // Join classroom room for real-time updates
            if (socket) {
                socket.emit('join_classroom', classroomId);
                
                socket.on('new_announcement', (data: any) => {
                    dispatch(addAnnouncement(data));
                });

                return () => {
                    socket.emit('leave_classroom', classroomId);
                    socket.off('new_announcement');
                };
            }
        }
    }, [classroomId, dispatch, socket]);

    const handlePost = async () => {
        if (!message.trim() && files.length === 0) return;

        setIsPosting(true);
        const formData = new FormData();
        formData.append('message', message);
        files.forEach(file => formData.append('files', file));

        try {
            await announcementService.createAnnouncement(classroomId!, formData);
            setMessage('');
            setFiles([]);
            toast.success('Announcement posted!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to post announcement');
        } finally {
            setIsPosting(false);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar info */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-900 border-b border-slate-50 pb-2">Upcoming</h3>
                    <p className="text-slate-400 text-sm italic">No work due soon</p>
                    <button className="text-cyan-600 text-sm font-bold hover:underline">View all</button>
                </div>
            </div>

            {/* Feed */}
            <div className="lg:col-span-3 space-y-6">
                {/* Post Announcement Box */}
                {(user?.accountType === 'TUTOR' || user?.id === classroom.creatorId) && (
                    <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-4">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {user?.profilePhotoUrl ? (
                                    <img src={user.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon size={20} className="text-slate-400" />
                                )}
                            </div>
                            <div className="flex-1 space-y-4">
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Announce something to your class..."
                                    className="w-full min-h-[100px] bg-slate-50 border border-slate-100 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all resize-none text-slate-700 placeholder:text-slate-400"
                                />
                                
                                {files.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {files.map((file, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full text-xs font-medium text-slate-600">
                                                <FileText size={14} />
                                                <span className="max-w-[150px] truncate">{file.name}</span>
                                                <button onClick={() => removeFile(idx)} className="text-slate-400 hover:text-red-500 transition-colors">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                    <label className="flex items-center gap-2 text-slate-500 hover:text-cyan-600 cursor-pointer transition-colors text-sm font-semibold">
                                        <input 
                                            type="file" 
                                            multiple 
                                            className="hidden" 
                                            onChange={(e) => setFiles(prev => [...prev, ...Array.from(e.target.files || [])])}
                                        />
                                        <Paperclip size={18} />
                                        Add files
                                    </label>
                                    <button
                                        disabled={isPosting || (!message.trim() && files.length === 0)}
                                        onClick={handlePost}
                                        className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isPosting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                        Post
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Announcement List */}
                <div className="space-y-6">
                    {loading && announcements.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <Loader2 size={40} className="animate-spin mb-2" />
                            <p>Loading stream...</p>
                        </div>
                    ) : announcements.length === 0 ? (
                        <div className="text-center py-12 bg-white border border-slate-200 border-dashed rounded-[2rem]">
                            <p className="text-slate-400">This is where you'll see updates from your class.</p>
                        </div>
                    ) : (
                        announcements.map((announcement) => (
                            <div key={announcement.id} className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-6 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm font-bold text-cyan-600">
                                            {announcement.author.profilePhotoUrl ? (
                                                <img src={announcement.author.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                announcement.author.fullName.charAt(0)
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 leading-tight">{announcement.author.fullName}</h4>
                                            <p className="text-[10px] text-slate-400 flex items-center gap-1 font-bold uppercase tracking-wider">
                                                <Clock size={10} />
                                                {dayjs(announcement.createdAt).fromNow()}
                                            </p>
                                        </div>
                                    </div>
                                    <button className="p-2 text-slate-300 hover:bg-slate-50 rounded-full transition-colors">
                                        <Plus size={20} className="rotate-45" />
                                    </button>
                                </div>

                                <div className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                                    {announcement.message}
                                </div>

                                {announcement.attachments?.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {announcement.attachments.map((file) => (
                                            <a 
                                                key={file.id}
                                                href={file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors group"
                                            >
                                                <div className="p-2 bg-slate-50 text-slate-400 group-hover:text-cyan-600 transition-colors rounded-xl">
                                                    {file.fileType.startsWith('image/') ? <ImageIcon size={20} /> : <FileText size={20} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-slate-900 truncate">{file.fileName}</p>
                                                    <p className="text-[10px] text-slate-400 uppercase font-black">{file.fileType.split('/')[1]}</p>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                )}

                                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                    <button className="flex items-center gap-2 text-slate-500 hover:text-cyan-600 transition-colors text-sm font-bold group">
                                        <div className="p-2 bg-slate-50 group-hover:bg-cyan-50 rounded-xl transition-colors">
                                            <MessageSquare size={18} />
                                        </div>
                                        {announcement._count.comments} {announcement._count.comments === 1 ? 'Comment' : 'Comments'}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Stream;
