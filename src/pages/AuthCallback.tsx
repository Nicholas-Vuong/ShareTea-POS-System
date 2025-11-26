import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

/**
 * OAuth callback page
 * Handles Google OAuth redirect and creates/updates user in database
 */
export default function AuthCallback() {
    const navigate = useNavigate();
    const setUser = useAuthStore((state) => state.setUser);
    const { toast } = useToast();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Handle the OAuth callback and get user info
                const user = await api.handleGoogleOAuthCallback();
                
                // Set user in auth store
                setUser({
                    userId: user.userId,
                    role: user.role,
                    email: user.email,
                });

                toast({
                    title: 'Login successful',
                    description: `Welcome! You've successfully signed in with Google.`,
                });

                // Route based on role
                routeByRole(user.role);
            } catch (err: any) {
                const errorMessage = err.message || 'Failed to complete Google login. Please try again.';
                setError(errorMessage);
                toast({
                    title: 'Login failed',
                    description: errorMessage,
                    variant: 'destructive',
                });
                // Redirect to login after a short delay
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            }
        };

        handleCallback();
    }, [navigate, setUser, toast]);

    const routeByRole = (role: 'manager' | 'cashier' | 'barista' | 'customer') => {
        switch (role) {
            case 'manager':
                navigate('/manager');
                break;
            case 'cashier':
                navigate('/cashier');
                break;
            case 'barista':
                navigate('/kitchen');
                break;
            case 'customer':
                navigate('/kiosk');
                break;
            default:
                navigate('/kiosk');
        }
    };

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold text-destructive">Authentication Error</h1>
                    <p className="text-muted-foreground">{error}</p>
                    <p className="text-sm text-muted-foreground">Redirecting to login page...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
            <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <h1 className="text-2xl font-bold">Completing sign in...</h1>
                <p className="text-muted-foreground">Please wait while we finish setting up your account.</p>
            </div>
        </div>
    );
}

