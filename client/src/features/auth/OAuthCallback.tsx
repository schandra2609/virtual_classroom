import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '../../hooks/store';
import { checkProfile } from '../../features/auth/authSlice';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const OAuthCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    useEffect(() => {
        const token = searchParams.get('token');
        
        if (token) {
            localStorage.setItem('access_token', token);
            dispatch(checkProfile())
                .unwrap()
                .then(() => {
                    toast.success('Successfully logged in with Google!');
                    navigate('/dashboard');
                })
                .catch((err) => {
                    toast.error(err || 'Failed to complete login');
                    navigate('/login');
                });
        } else {
            toast.error('Authentication failed: No token received');
            navigate('/login');
        }
    }, [searchParams, navigate, dispatch]);

    return (
        <div className="flex flex-col h-screen items-center justify-center bg-slate-50 space-y-4">
            <Loader2 className="animate-spin text-cyan-600" size={48} />
            <p className="text-slate-600 font-medium animate-pulse">Completing authentication...</p>
        </div>
    );
};

export default OAuthCallback;
