import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');

export const useClassroomSocket = (classroomId?: string) => {
    const socketRef = useRef<Socket | null>(null);
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token || !classroomId) return;

        // 1. Initialize the connection
        socketRef.current = io(BASE_URL, {
            path: '/socket.io',
            auth: { token },
            transports: ['websocket'],
        });

        const socket = socketRef.current;

        // 2. Lifecycle Events
        socket.on('connect', () => {
            console.log(`🔌 Socket connected. Joining classroom: ${classroomId}`);
            socket.emit('join_classroom', classroomId);
        });

        socket.on('disconnect', () => {
            console.log('🔌 Socket disconnected.');
        });

        // 3. Business Logic Events (Listeners)
        socket.on('new_announcement', (data) => {
            const preview = data.message?.length > 40 ? `${data.message.substring(0, 40)}...` : data.message;
            toast.info('New Announcement Posted!', {
                description: preview,
                duration: 5000,
            });
            // Note: If you want the feed to update instantly without a refresh, 
            // you can dispatch a Redux action or use a React Context here later!
        });

        socket.on('test_status_change', (data) => {
            toast.warning('Exam Status Update', {
                description: `A test status has been changed to ${data.status}.`,
                duration: 6000,
            });
        });

        // 4. Cleanup on unmount (when user leaves the classroom page)
        return () => {
            socket.emit('leave_classroom', classroomId);
            socket.disconnect();
            socketRef.current = null;
        };
    }, [classroomId]);

    return socketRef.current;
};