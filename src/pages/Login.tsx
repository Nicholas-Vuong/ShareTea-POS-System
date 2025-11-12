import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/authStore';
import { useAccessibilityStore } from '@/store/accessibilityStore';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { translateText, translateMultiple } from '@/lib/translate';

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
    const { language } = useAccessibilityStore();

    // Translated text state
    const [translatedTexts, setTranslatedTexts] = useState<Record<string, string>>({});
    const [translatedRoles, setTranslatedRoles] = useState<Array<{ roleId: number; roleName: string; translatedName: string }>>([]);
    const [isTranslating, setIsTranslating] = useState(false);

    // Load roles and translate them
    useEffect(() => {
        // Default roles that should always be available
        const defaultRoles = [
            { roleId: 1, roleName: 'Manager' },
            { roleId: 2, roleName: 'Cashier' },
            { roleId: 3, roleName: 'Barista' },
            { roleId: 4, roleName: 'Customer' },
        ];

        // Load available roles for sign-up, but ensure all 4 roles are always available
        api.getAllRoles()
            .then((apiRoles) => {
                // Merge API roles with defaults, ensuring all 4 roles are present
                const roleMap = new Map(apiRoles.map(r => [r.roleName.toLowerCase(), r]));
                // Add any default roles that aren't in the API response
                defaultRoles.forEach(defaultRole => {
                    if (!roleMap.has(defaultRole.roleName.toLowerCase())) {
                        roleMap.set(defaultRole.roleName.toLowerCase(), defaultRole);
                    }
                });
                // Convert back to array, ensuring we have all 4 roles
                const mergedRoles = defaultRoles.map(defaultRole => {
                    const apiRole = Array.from(roleMap.values()).find(
                        r => r.roleName.toLowerCase() === defaultRole.roleName.toLowerCase()
                    );
                    return apiRole || defaultRole;
                });
                setAvailableRoles(mergedRoles);
            })
            .catch(() => {
                // If API fails, use default roles
                setAvailableRoles(defaultRoles);
            });
    }, []);

    // Translate all text when language or roles change
    useEffect(() => {
        let cancelled = false;

        const translateAllText = async () => {
            if (language === 'en') {
                // Reset to English (original text)
                setTranslatedTexts({});
                setTranslatedRoles(availableRoles.map(r => ({ ...r, translatedName: r.roleName })));
                return;
            }

            setIsTranslating(true);
            try {
                // Define all static text that needs translation
                const staticTexts = {
                    'Sharetea': 'Sharetea',
                    'Sign In or Create Account': 'Sign In or Create Account',
                    'Sign In': 'Sign In',
                    'Sign Up': 'Sign Up',
                    'Username or Email': 'Username or Email',
                    'Enter username or email': 'Enter username or email',
                    'Password': 'Password',
                    'Enter password': 'Enter password',
                    'Signing in...': 'Signing in...',
                    'Username': 'Username',
                    'Choose a username': 'Choose a username',
                    'Checking availability...': 'Checking availability...',
                    'At least 8 characters, 1 capital, 1 symbol': 'At least 8 characters, 1 capital, 1 symbol',
                    'Password must be at least 8 characters with 1 capital letter and 1 special symbol': 'Password must be at least 8 characters with 1 capital letter and 1 special symbol',
                    'Full Name': 'Full Name',
                    'Enter your full name': 'Enter your full name',
                    'Role': 'Role',
                    'Email (optional)': 'Email (optional)',
                    'Enter your email (optional)': 'Enter your email (optional)',
                    'Add an email to allow signing in with it later. You can always sign in with your username.': 'Add an email to allow signing in with it later. You can always sign in with your username.',
                    'Creating account...': 'Creating account...',
                    'Create Account': 'Create Account',
                    'Just browsing? Visit the': 'Just browsing? Visit the',
                    'self-service kiosk': 'self-service kiosk',
                };

                // Translate static texts
                const textsToTranslate = Object.values(staticTexts);
                const translatedValues = await translateMultiple(textsToTranslate, language, 'en');

                if (cancelled) return;

                const translated: Record<string, string> = {};
                Object.keys(staticTexts).forEach((key, index) => {
                    translated[key] = translatedValues[index] || key;
                });

                // Translate role names from database (only if we have roles)
                let translatedRolesData = availableRoles.map(r => ({ ...r, translatedName: r.roleName }));
                if (availableRoles.length > 0) {
                    const roleNames = availableRoles.map(r => r.roleName);
                    const translatedRoleNames = await translateMultiple(roleNames, language, 'en');

                    if (!cancelled) {
                        translatedRolesData = availableRoles.map((role, index) => ({
                            ...role,
                            translatedName: translatedRoleNames[index] || role.roleName,
                        }));
                    }
                }

                if (!cancelled) {
                    setTranslatedTexts(translated);
                    setTranslatedRoles(translatedRolesData);
                }
            } catch (error) {
                console.error('Translation error:', error);
                if (!cancelled) {
                    // Fallback to English
                    setTranslatedTexts({});
                    setTranslatedRoles(availableRoles.map(r => ({ ...r, translatedName: r.roleName })));
                }
            } finally {
                if (!cancelled) {
                    setIsTranslating(false);
                }
            }
        };

        translateAllText();

        // Cleanup function to cancel if component unmounts or dependencies change
        return () => {
            cancelled = true;
        };
    }, [language, availableRoles.length]); // Only depend on length to avoid infinite loops

    // Helper function to get translated text (always returns a string, never undefined)
    const t = (key: string): string => {
        if (!key) return '';
        return translatedTexts[key] || key;
    };

    // Password validation function with translation
    const validatePassword = async (pwd: string): Promise<string> => {
        let error = '';
        if (pwd.length < 8) {
            error = 'Password must be at least 8 characters long';
        } else if (!/[A-Z]/.test(pwd)) {
            error = 'Password must contain at least one capital letter';
        } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
            error = 'Password must contain at least one special symbol (!@#$%^&*()_+-=[]{}|;:,.<>?)';
        }

        if (error && language !== 'en') {
            return await translateText(error, language, 'en');
        }
        return error;
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
                const errorMsg = 'Username is already taken';
                const translatedError = language !== 'en'
                    ? await translateText(errorMsg, language, 'en')
                    : errorMsg;
                setUsernameError(translatedError);
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
    const handlePasswordBlur = async () => {
        if (!password.trim()) {
            setPasswordError('');
            return;
        }
        const error = await validatePassword(password);
        setPasswordError(error);
    };

    const handleLogin = async () => {
        if (!loginIdentifier.trim()) {
            const title = language !== 'en' ? await translateText('Username or email required', language, 'en') : 'Username or email required';
            const desc = language !== 'en' ? await translateText('Please enter your username or email', language, 'en') : 'Please enter your username or email';
            toast({
                title,
                description: desc,
                variant: 'destructive',
            });
            return;
        }

        if (!password.trim()) {
            const title = language !== 'en' ? await translateText('Password required', language, 'en') : 'Password required';
            const desc = language !== 'en' ? await translateText('Please enter your password', language, 'en') : 'Please enter your password';
            toast({
                title,
                description: desc,
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

            const title = language !== 'en' ? await translateText('Login successful', language, 'en') : 'Login successful';
            const roleName = language !== 'en' && translatedRoles.length > 0
                ? translatedRoles.find(r => r.roleName.toLowerCase() === user.role.toLowerCase())?.translatedName || user.role
                : user.role;
            const desc = language !== 'en'
                ? await translateText('Welcome', language, 'en') + ` ${roleName}!`
                : `Welcome ${roleName}!`;

            toast({
                title,
                description: desc,
            });

            // Route based on role
            routeByRole(user.role);
        } catch (error: any) {
            const title = language !== 'en' ? await translateText('Login failed', language, 'en') : 'Login failed';
            const defaultDesc = 'Invalid username/email or password. Please try again.';
            const desc = error.message
                ? (language !== 'en' ? await translateText(error.message, language, 'en') : error.message)
                : (language !== 'en' ? await translateText(defaultDesc, language, 'en') : defaultDesc);
            toast({
                title,
                description: desc,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async () => {
        if (!username.trim()) {
            const title = language !== 'en' ? await translateText('Username required', language, 'en') : 'Username required';
            const desc = language !== 'en' ? await translateText('Please enter a username', language, 'en') : 'Please enter a username';
            toast({
                title,
                description: desc,
                variant: 'destructive',
            });
            return;
        }

        if (!password.trim()) {
            const title = language !== 'en' ? await translateText('Password required', language, 'en') : 'Password required';
            const desc = language !== 'en' ? await translateText('Please enter a password', language, 'en') : 'Please enter a password';
            toast({
                title,
                description: desc,
                variant: 'destructive',
            });
            return;
        }

        const passwordValidationError = await validatePassword(password);
        if (passwordValidationError) {
            const title = language !== 'en' ? await translateText('Invalid password', language, 'en') : 'Invalid password';
            toast({
                title,
                description: passwordValidationError,
                variant: 'destructive',
            });
            setPasswordError(passwordValidationError);
            return;
        }

        if (usernameError) {
            const title = language !== 'en' ? await translateText('Invalid username', language, 'en') : 'Invalid username';
            toast({
                title,
                description: usernameError,
                variant: 'destructive',
            });
            return;
        }

        if (!fullName.trim()) {
            const title = language !== 'en' ? await translateText('Full name required', language, 'en') : 'Full name required';
            const desc = language !== 'en' ? await translateText('Please enter your full name', language, 'en') : 'Please enter your full name';
            toast({
                title,
                description: desc,
                variant: 'destructive',
            });
            return;
        }

        const trimmedEmail = email.trim();
        if (trimmedEmail) {
            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(trimmedEmail)) {
                const title = language !== 'en' ? await translateText('Invalid email', language, 'en') : 'Invalid email';
                const desc = language !== 'en' ? await translateText('Please enter a valid email address', language, 'en') : 'Please enter a valid email address';
                toast({
                    title,
                    description: desc,
                    variant: 'destructive',
                });
                return;
            }
        }

        setLoading(true);
        try {
            const user = await api.signUp(username, password, fullName, selectedRole, trimmedEmail || undefined);
            setUser({
                userId: user.userId,
                role: user.role as 'manager' | 'cashier' | 'barista' | 'customer',
                email: user.email,
            });

            const title = language !== 'en' ? await translateText('Account created!', language, 'en') : 'Account created!';
            const roleName = language !== 'en' && translatedRoles.length > 0
                ? translatedRoles.find(r => r.roleName.toLowerCase() === user.role.toLowerCase())?.translatedName || user.role
                : user.role;
            const desc = language !== 'en'
                ? await translateText('Welcome', language, 'en') + ` ${roleName}!`
                : `Welcome ${roleName}!`;

            toast({
                title,
                description: desc,
            });

            // Route based on role
            routeByRole(user.role as 'manager' | 'cashier' | 'barista' | 'customer');
        } catch (error: any) {
            const title = language !== 'en' ? await translateText('Sign up failed', language, 'en') : 'Sign up failed';
            const defaultDesc = 'Failed to create account. Please try again.';
            const desc = error.message
                ? (language !== 'en' ? await translateText(error.message, language, 'en') : error.message)
                : (language !== 'en' ? await translateText(defaultDesc, language, 'en') : defaultDesc);
            toast({
                title,
                description: desc,
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

    // Get translated role name for display (always returns a string)
    const getTranslatedRoleName = (roleName: string): string => {
        if (!roleName) return '';
        if (language === 'en') return roleName;
        if (translatedRoles.length === 0) return roleName; // Fallback if translations not ready
        const translated = translatedRoles.find(r => r.roleName === roleName);
        return (translated?.translatedName && translated.translatedName.trim()) || roleName;
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
            <Card className="w-full max-w-md p-8 space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold text-primary">{t('Sharetea')}</h1>
                    <p className="text-xl text-muted-foreground">{t('Sign In or Create Account')}</p>
                </div>

                <Tabs value={isSignUp ? 'signup' : 'login'} onValueChange={(v) => setIsSignUp(v === 'signup')}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="login">{t('Sign In')}</TabsTrigger>
                        <TabsTrigger value="signup">{t('Sign Up')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login" className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="login-identifier">{t('Username or Email')}</Label>
                            <Input
                                id="login-identifier"
                                type="text"
                                placeholder={t('Enter username or email')}
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
                            <Label htmlFor="login-password">{t('Password')}</Label>
                            <Input
                                id="login-password"
                                type="password"
                                placeholder={t('Enter password')}
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
                            {loading ? t('Signing in...') : t('Sign In')}
                        </Button>
                    </TabsContent>

                    <TabsContent value="signup" className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="signup-username">{t('Username')}</Label>
                            <Input
                                id="signup-username"
                                type="text"
                                placeholder={t('Choose a username')}
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
                                <p className="text-sm text-muted-foreground mt-1">{t('Checking availability...')}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="signup-password">{t('Password')}</Label>
                            <Input
                                id="signup-password"
                                type="password"
                                placeholder={t('At least 8 characters, 1 capital, 1 symbol')}
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
                                    {t('Password must be at least 8 characters with 1 capital letter and 1 special symbol')}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="signup-fullname">{t('Full Name')}</Label>
                            <Input
                                id="signup-fullname"
                                type="text"
                                placeholder={t('Enter your full name')}
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="signup-role">{t('Role')}</Label>
                            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as typeof selectedRole)}>
                                <SelectTrigger id="signup-role">
                                    <SelectValue>{getTranslatedRoleName(selectedRole)}</SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {availableRoles.map((role) => {
                                        return (
                                            <SelectItem key={role.roleId} value={role.roleName}>
                                                {getTranslatedRoleName(role.roleName)}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="signup-email">{t('Email (optional)')}</Label>
                            <Input
                                id="signup-email"
                                type="email"
                                placeholder={t('Enter your email (optional)')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                            <p className="text-xs text-muted-foreground">
                                {t('Add an email to allow signing in with it later. You can always sign in with your username.')}
                            </p>
                        </div>

                        <Button
                            onClick={handleSignUp}
                            disabled={loading || !username.trim() || !password.trim() || !fullName.trim() || !!usernameError || !!passwordError}
                            className="w-full touch-target"
                            size="lg"
                        >
                            {loading ? t('Creating account...') : t('Create Account')}
                        </Button>
                    </TabsContent>
                </Tabs>

                <div className="text-center pt-4">
                    <p className="text-sm text-muted-foreground">
                        {t('Just browsing? Visit the')}{' '}
                        <button
                            onClick={() => navigate('/kiosk')}
                            className="text-primary hover:underline font-medium"
                        >
                            {t('self-service kiosk')}
                        </button>
                    </p>
                </div>
            </Card>
        </div>
    );
}
