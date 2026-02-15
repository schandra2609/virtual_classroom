import React, { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/store';
import { refreshToken } from '../../features/auth/authSlice';

const AuthManager: React.FC = () => {
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const refreshTimer = useRef<any>(null);

    useEffect(() => {
        const startRefreshTimer = () => {
            // Clear existing timer if any
            if (refreshTimer.current) {
                clearInterval(refreshTimer.current);
            }

            // Set interval for 30 seconds (30 * 1000 ms)
            refreshTimer.current = setInterval(() => {
                console.log('[AuthManager] Proactive token refresh triggered');
                dispatch(refreshToken());
            }, 30 * 1000);
        };

        if (user) {
            startRefreshTimer();
        } else {
            if (refreshTimer.current) {
                clearInterval(refreshTimer.current);
            }
        }

        return () => {
            if (refreshTimer.current) {
                clearInterval(refreshTimer.current);
            }
        };
    }, [user, dispatch]);

    return null; // Headless component
};

export default AuthManager;
