import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore, UserRole } from '@/store/authStore';

interface UnauthorizedState {
  from?: string;
  reason?: 'auth-required' | 'role-restricted';
  allowedRoles?: UserRole[];
  actualRole?: UserRole;
}

export default function Unauthorized() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state || {}) as UnauthorizedState;
  const { user } = useAuthStore();

  const title =
    state.reason === 'auth-required'
      ? 'Please sign in'
      : 'Access denied';

  const description =
    state.reason === 'role-restricted'
      ? `You are signed in as ${user?.role ?? 'an unknown role'}, which does not have permission to view ${
          state.from ?? 'this page'
        }.`
      : 'You need to be signed in to continue.';

  const helper =
    state.reason === 'role-restricted' && state.allowedRoles
      ? `Allowed roles: ${state.allowedRoles.join(', ')}`
      : undefined;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-lg p-8 space-y-6 text-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
          {helper && (
            <p className="text-sm text-muted-foreground mt-2">{helper}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button onClick={() => navigate('/login')}>Go to login</Button>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go back
          </Button>
        </div>
      </Card>
    </div>
  );
}

