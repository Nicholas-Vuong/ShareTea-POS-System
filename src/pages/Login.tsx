import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [loginIdentifier, setLoginIdentifier] = useState(''); // Username or email for login
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'Manager' | 'Cashier' | 'Barista' | 'Customer'>('Customer');
  const [availableRoles, setAvailableRoles] = useState<Array<{ roleId: number; roleName: string }>>([]);
  
  // Validation errors
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const { toast } = useToast();

  useEffect(() => {
    // Load available roles for sign-up
    api.getAllRoles().then(setAvailableRoles).catch(() => {
      // If this fails, use default roles
      setAvailableRoles([
        { roleId: 1, roleName: 'Manager' },
        { roleId: 2, roleName: 'Cashier' },
        { roleId: 3, roleName: 'Barista' },
        { roleId: 4, roleName: 'Customer' },
      ]);
    });
  }, []);

  // Password validation function
  const validatePassword = (pwd: string): string => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must contain at least one capital letter';
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      return 'Password must contain at least one special symbol (!@#$%^&*()_+-=[]{}|;:,.<>?)';
    }
    return '';
  };

  // Check username availability
  const handleUsernameBlur = async () => {
    if (!username.trim()) {
      setUsernameError('');
      return;
    }

    setCheckingUsername(true);
    try {
      const exists = await api.checkUsernameExists(username);
      if (exists) {
        setUsernameError('Username is already taken');
      } else {
        setUsernameError('');
      }
    } catch (error) {
      // Silently fail - don't show error for network issues during validation
      setUsernameError('');
    } finally {
      setCheckingUsername(false);
    }
  };

  // Handle password blur
  const handlePasswordBlur = () => {
    if (!password.trim()) {
      setPasswordError('');
      return;
    }
    const error = validatePassword(password);
    setPasswordError(error);
  };

  const handleLogin = async () => {
    if (!loginIdentifier.trim()) {
      toast({
        title: 'Username or email required',
        description: 'Please enter your username or email',
        variant: 'destructive',
      });
      return;
    }

    if (!password.trim()) {
      toast({
        title: 'Password required',
        description: 'Please enter your password',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const user = await api.login(loginIdentifier, password);
      setUser({
        userId: user.userId,
        role: user.role,
        email: user.email,
      });
      
      toast({
        title: 'Login successful',
        description: `Welcome ${user.role}!`,
      });

      // Route based on role
      routeByRole(user.role);
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid username/email or password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!username.trim()) {
      toast({
        title: 'Username required',
        description: 'Please enter a username',
        variant: 'destructive',
      });
      return;
    }

    if (!password.trim()) {
      toast({
        title: 'Password required',
        description: 'Please enter a password',
        variant: 'destructive',
      });
      return;
    }

    const passwordValidationError = validatePassword(password);
    if (passwordValidationError) {
      toast({
        title: 'Invalid password',
        description: passwordValidationError,
        variant: 'destructive',
      });
      setPasswordError(passwordValidationError);
      return;
    }

    if (usernameError) {
      toast({
        title: 'Invalid username',
        description: usernameError,
        variant: 'destructive',
      });
      return;
    }

    if (!fullName.trim()) {
      toast({
        title: 'Full name required',
        description: 'Please enter your full name',
        variant: 'destructive',
      });
      return;
    }

    if (!email.trim()) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address',
        variant: 'destructive',
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const user = await api.signUp(username, password, fullName, selectedRole, email);
      setUser({
        userId: user.userId,
        role: user.role as 'manager' | 'cashier' | 'barista' | 'customer',
        email: user.email,
      });
      
      toast({
        title: 'Account created!',
        description: `Welcome ${user.role}!`,
      });

      // Route based on role
      routeByRole(user.role as 'manager' | 'cashier' | 'barista' | 'customer');
    } catch (error: any) {
      toast({
        title: 'Sign up failed',
        description: error.message || 'Failed to create account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-primary">Sharetea</h1>
          <p className="text-xl text-muted-foreground">Sign In or Create Account</p>
        </div>

        <Tabs value={isSignUp ? 'signup' : 'login'} onValueChange={(v) => setIsSignUp(v === 'signup')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-identifier">Username or Email</Label>
              <Input
                id="login-identifier"
                type="text"
                placeholder="Enter username or email"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && password) {
                    handleLogin();
                  }
                }}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleLogin();
                  }
                }}
                disabled={loading}
              />
            </div>

            <Button
              onClick={handleLogin}
              disabled={loading || !loginIdentifier.trim() || !password.trim()}
              className="w-full touch-target"
              size="lg"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-username">Username</Label>
              <Input
                id="signup-username"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setUsernameError(''); // Clear error when user types
                }}
                onBlur={handleUsernameBlur}
                disabled={loading || checkingUsername}
                className={usernameError ? 'border-destructive' : ''}
              />
              {usernameError && (
                <p className="text-sm text-destructive mt-1">{usernameError}</p>
              )}
              {checkingUsername && (
                <p className="text-sm text-muted-foreground mt-1">Checking availability...</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                placeholder="At least 8 characters, 1 capital, 1 symbol"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(''); // Clear error when user types
                }}
                onBlur={handlePasswordBlur}
                disabled={loading}
                className={passwordError ? 'border-destructive' : ''}
              />
              {passwordError && (
                <p className="text-sm text-destructive mt-1">{passwordError}</p>
              )}
              {!passwordError && password && (
                <p className="text-xs text-muted-foreground mt-1">
                  Password must be at least 8 characters with 1 capital letter and 1 special symbol
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-fullname">Full Name</Label>
              <Input
                id="signup-fullname"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-role">Role</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as typeof selectedRole)}>
                <SelectTrigger id="signup-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role.roleId} value={role.roleName}>
                      {role.roleName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                You can use your email or username to sign in later
              </p>
            </div>

            <Button
              onClick={handleSignUp}
              disabled={loading || !username.trim() || !password.trim() || !fullName.trim() || !email.trim() || !!usernameError || !!passwordError}
              className="w-full touch-target"
              size="lg"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </TabsContent>
        </Tabs>

        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground">
            Just browsing? Visit the{' '}
            <button
              onClick={() => navigate('/kiosk')}
              className="text-primary hover:underline font-medium"
            >
              self-service kiosk
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
}
