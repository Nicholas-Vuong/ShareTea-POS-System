import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MenuItem, api, Order } from '@/lib/api';
import { MenuList } from '@/components/MenuList';
import { ItemCustomizer } from '@/components/ItemCustomizer';
import { CartPanel } from '@/components/CartPanel';
import { CartReview } from '@/components/CartReview';
import { Checkout } from '@/components/Checkout';
import { KioskReceipt } from '@/components/KioskReceipt';
import { WeatherTile } from '@/components/WeatherTile';
import { AccessibilityToolbar } from '@/components/AccessibilityToolbar';
import { useCartStore, CartItemOptions, CartItem } from '@/store/cartStore';
import { useAccessibilityStore } from '@/store/accessibilityStore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Home, LogOut, History, ShoppingCart } from 'lucide-react';
import { translateText, translateMultiple } from '@/lib/translate';
import { useAuthStore } from '@/store/authStore';
import { OrderHistory } from '@/components/OrderHistory';
import { calculateItemPrice } from '@/lib/pricing';
import { getMenuItemImage } from '@/lib/imageMapping';

// Base English translations
const baseTranslations = {
    welcome: 'Welcome to Sharetea',
    selectCategory: 'Select a category to start your order',
    suggestedTitle: 'Suggested for you',
    suggestedSubtitle: 'Popular picks and unique favorites',
    viewItem: 'Customize this drink',
    backToMenu: 'Back to Menu',
    home: 'Home',
    orderConfirmed: 'Order Confirmed!',
    orderNumber: 'Your order number is',
    thankYou: 'Thank you for your order',
    startNewOrder: 'Start New Order',
    failedToLoadMenu: 'Failed to load menu',
    addedToCart: 'Added to cart',
    orderFailed: 'Order failed',
    pleaseTryAgain: 'Please try again',
    viewCart: 'View Cart',
    cancelItemTitle: 'Cancel current drink?',
    cancelItemDescription: 'This will discard your current customizations.',
    cancelItem: 'Cancel Edits',
    keepEditing: 'Keep Editing',
    updatedCartItem: 'Cart item updated',
    editUnavailable: 'Unable to edit item',
    editUnavailableDescription: 'The original drink is no longer available.',
    pastOrders: 'Past Orders',
    loadingOrders: 'Loading orders...',
    noOrdersFound: 'No orders found',
    signInRequired: 'Sign In Required',
    signInToViewOrders: 'Please sign in to view your past orders. Create an account to access order history and other features.',
    createAccount: 'Create Account',
};

type View = 'home' | 'menu' | 'cart' | 'cartReview' | 'checkout' | 'receipt' | 'pastOrders';

export default function Kiosk() {
    const [menu, setMenu] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [suggestedItems, setSuggestedItems] = useState<MenuItem[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [view, setView] = useState<View>('home');
    const [orderNumber, setOrderNumber] = useState('');
    const [orderData, setOrderData] = useState<{
        orderId: string;
        items: Array<{ name: string; quantity: number; subtotal: number }>;
        total: number;
    } | null>(null);
    const { addItem, clearCart, items, getTotal, updateItemByIndex } = useCartStore();
    const { language } = useAccessibilityStore();
    const { toast } = useToast();
    const [translatedTexts, setTranslatedTexts] = useState<Record<string, string>>({});
    const [translatedCategories, setTranslatedCategories] = useState<Map<string, string>>(new Map());
    const [translatedSuggestedItems, setTranslatedSuggestedItems] = useState<Map<string, { name: string; description: string }>>(new Map());
    const [isTranslating, setIsTranslating] = useState(false);
    const [editContext, setEditContext] = useState<{ index: number; item: CartItem; returnView: View } | null>(null);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
    const pendingNavigation = useRef<(() => void) | null>(null);
    const editingInitialOptions = editContext?.item.options;
    const editingInitialQuantity = editContext?.item.quantity ?? 1;
    const isEditingItem = Boolean(editContext);
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const [activeOrder, setActiveOrder] = useState<Order | null>(null);
    const [pastOrders, setPastOrders] = useState<Order[]>([]);
    const [loadingPastOrders, setLoadingPastOrders] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Translate all text when language changes
    useEffect(() => {
        let cancelled = false;

        const translateAllText = async () => {
            if (language === 'en') {
                setTranslatedTexts({});
                return;
            }

            setIsTranslating(true);
            try {
                const textsToTranslate = Object.values(baseTranslations);
                const translatedValues = await translateMultiple(textsToTranslate, language, 'en');

                if (cancelled) return;

                const translated: Record<string, string> = {};
                Object.keys(baseTranslations).forEach((key, index) => {
                    translated[key] = translatedValues[index] || baseTranslations[key as keyof typeof baseTranslations];
                });

                if (!cancelled) {
                    setTranslatedTexts(translated);
                }
            } catch (error) {
                console.error('Translation error:', error);
                if (!cancelled) {
                    setTranslatedTexts({});
                }
            } finally {
                if (!cancelled) {
                    setIsTranslating(false);
                }
            }
        };

        translateAllText();

        return () => {
            cancelled = true;
        };
    }, [language]);

    // Helper function to get translated text
    const t = (key: keyof typeof baseTranslations): string => {
        if (language === 'en') return baseTranslations[key];
        return translatedTexts[key] || baseTranslations[key];
    };

    // Translate categories when they change
    useEffect(() => {
        let cancelled = false;

        const translateCategories = async () => {
            if (language === 'en' || categories.length === 0) {
                setTranslatedCategories(new Map());
                return;
            }

            try {
                const translatedCategoryNames = await translateMultiple(categories, language, 'en');

                if (cancelled) return;

                const categoryMap = new Map<string, string>();
                categories.forEach((category, index) => {
                    categoryMap.set(category, translatedCategoryNames[index] || category);
                });

                if (!cancelled) {
                    setTranslatedCategories(categoryMap);
                }
            } catch (error) {
                console.error('Error translating categories:', error);
                if (!cancelled) {
                    setTranslatedCategories(new Map());
                }
            }
        };

        translateCategories();

        return () => {
            cancelled = true;
        };
    }, [categories, language]);

    const loadMenu = async () => {
        try {
            const data = await api.getMenu();
            setMenu(data);
            const cats = Array.from(new Set(data.map((item) => item.category)));
            setCategories(cats);
        } catch (error: any) {
            console.error('Failed to load menu:', error);
            const title = language !== 'en'
                ? await translateText('Failed to load menu', language, 'en')
                : 'Failed to load menu';
            toast({
                title,
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    useEffect(() => {
        loadMenu();
        
        // Refresh menu every 30 seconds to reflect changes from manager
        const interval = setInterval(loadMenu, 30000);
        
        // Also refresh when window regains focus
        const handleFocus = () => {
            loadMenu();
        };
        window.addEventListener('focus', handleFocus);
        
        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
        };
    }, [toast, language]);

    // Build suggested items (top sellers if available, otherwise featured fallbacks)
    useEffect(() => {
        if (menu.length === 0) return;
        let cancelled = false;

        const buildSuggestions = async () => {
            setLoadingSuggestions(true);
            try {
                const activeItems = menu.filter((item) => item.active);
                if (activeItems.length === 0) {
                    if (!cancelled) setSuggestedItems([]);
                    return;
                }

                let suggestions: MenuItem[] = [];

                try {
                    const salesData = await api.getSalesData(30);
                    const topNames = (salesData.topItems || []).slice(0, 6).map((t) => t.name.toLowerCase());
                    const matched = activeItems.filter(
                        (item) => topNames.includes(item.name.toLowerCase())
                    );
                    suggestions = matched.slice(0, 4);
                } catch (error) {
                    console.warn('Falling back to static suggestions:', error);
                }

                // Fill remaining slots with highest-priced unique items for variety
                if (suggestions.length < 4) {
                    const usedIds = new Set(suggestions.map((s) => s.id));
                    const byPriceDesc = [...activeItems]
                        .filter((item) => !usedIds.has(item.id))
                        .sort((a, b) => b.price - a.price);
                    suggestions = [...suggestions, ...byPriceDesc.slice(0, 4 - suggestions.length)];
                }

                // Final fallback: first few active items
                if (suggestions.length < 3) {
                    const remaining = activeItems.filter((i) => !suggestions.find((s) => s.id === i.id));
                    suggestions = [...suggestions, ...remaining.slice(0, 3 - suggestions.length)];
                }

                if (!cancelled) {
                    setSuggestedItems(suggestions.slice(0, 4));
                }
            } finally {
                if (!cancelled) {
                    setLoadingSuggestions(false);
                }
            }
        };

        buildSuggestions();
        return () => {
            cancelled = true;
        };
    }, [menu]);

    // Translate suggested items when they change or language changes
    useEffect(() => {
        let cancelled = false;

        const translateSuggestedItems = async () => {
            if (language === 'en' || suggestedItems.length === 0) {
                setTranslatedSuggestedItems(new Map());
                return;
            }

            try {
                const names = suggestedItems.map(item => item.name);
                const descriptions = suggestedItems.map(item => item.description || '');

                const translatedNames = await translateMultiple(names, language, 'en');
                const translatedDescriptions = await translateMultiple(descriptions, language, 'en');

                if (cancelled) return;

                const translatedMap = new Map<string, { name: string; description: string }>();
                suggestedItems.forEach((item, index) => {
                    translatedMap.set(item.id, {
                        name: translatedNames[index] || item.name,
                        description: translatedDescriptions[index] || item.description || '',
                    });
                });

                if (!cancelled) {
                    setTranslatedSuggestedItems(translatedMap);
                }
            } catch (error) {
                console.error('Error translating suggested items:', error);
                if (!cancelled) {
                    setTranslatedSuggestedItems(new Map());
                }
            }
        };

        translateSuggestedItems();

        return () => {
            cancelled = true;
        };
    }, [suggestedItems, language]);

    // Fetch active order status when on home screen and user is logged in
    useEffect(() => {
        if (view !== 'home' || !user || user.role !== 'customer') {
            setActiveOrder(null);
            return;
        }

        const fetchActiveOrder = async () => {
            try {
                const orders = await api.getOrdersInProgressOrRecent(user.userId, 5);
                if (orders.length > 0) {
                    // Get the most recent active order
                    // Note: estimatedPrepTime is not calculated here as it requires menu items
                    // We'll calculate it if needed, but for now just show the order
                    setActiveOrder(orders[0]);
                } else {
                    setActiveOrder(null);
                }
            } catch (error) {
                console.error('Failed to fetch active order:', error);
            }
        };

        fetchActiveOrder();
        const interval = setInterval(fetchActiveOrder, 12000); // Poll every 12 seconds
        return () => clearInterval(interval);
    }, [view, user]);

    // Fetch past orders when view changes to pastOrders
    useEffect(() => {
        if (view !== 'pastOrders' || !user || user.role !== 'customer') {
            return;
        }

        const fetchPastOrders = async () => {
            try {
                setLoadingPastOrders(true);
                // Validate userId before making the API call
                if (!user.userId || isNaN(parseInt(user.userId))) {
                    console.error('Invalid user ID:', user.userId);
                    throw new Error('Invalid user ID');
                }

                console.log('Fetching orders for user:', user.userId);
                const orders = await api.getCustomerOrders(user.userId);
                console.log('Received orders:', orders);

                // Ensure we always set an array, even if empty
                setPastOrders(Array.isArray(orders) ? orders : []);
            } catch (error: any) {
                console.error('Failed to fetch past orders - Full error:', error);
                console.error('Error message:', error?.message);
                console.error('Error stack:', error?.stack);

                const errorMessage = error?.message || 'Failed to load orders';
                const displayMessage = errorMessage.length > 100
                    ? 'Please try again later'
                    : errorMessage;

                toast({
                    title: 'Failed to load orders',
                    description: displayMessage,
                    variant: 'destructive',
                });

                // Set empty array on error so UI doesn't break
                setPastOrders([]);
            } finally {
                setLoadingPastOrders(false);
            }
        };

        fetchPastOrders();
    }, [view, user, toast]);

    const handleCategorySelect = (category: string) => {
        setSelectedCategory(category);
        setView('menu');
    };

    const handleSuggestedSelect = (item: MenuItem) => {
        setSelectedCategory(item.category);
        setSelectedItem(item);
        setView('menu');
    };

    const resetCustomizationState = (nextView?: View) => {
        setSelectedItem(null);
        setEditContext(null);
        if (nextView) {
            setView(nextView);
        }
    };

    const requestNavigationConfirmation = (action: () => void) => {
        if (selectedItem) {
            pendingNavigation.current = action;
            setIsCancelDialogOpen(true);
            return;
        }
        action();
    };

    const handleDialogOpenChange = (open: boolean) => {
        if (!open) {
            handleKeepEditing();
        } else {
            setIsCancelDialogOpen(true);
        }
    };

    const handleKeepEditing = () => {
        setIsCancelDialogOpen(false);
        pendingNavigation.current = null;
    };

    const handleConfirmCancel = () => {
        resetCustomizationState();
        setIsCancelDialogOpen(false);
        const action = pendingNavigation.current;
        pendingNavigation.current = null;
        action?.();
    };

    const handleExitCustomizer = () => {
        const destination = editContext?.returnView ?? 'menu';
        requestNavigationConfirmation(() => {
            setView(destination);
        });
    };

    const handleAddToCart = async (item: MenuItem, quantity: number, options: CartItemOptions) => {
        let displayName = item.name;
        if (language !== 'en') {
            try {
                displayName = await translateText(item.name, language, 'en');
            } catch (error) {
                console.error('Error translating item name:', error);
            }
        }

        // Calculate price with customization modifiers
        const itemPrice = calculateItemPrice(item.price, options.size, options.sugar, options.toppings);

        const cartItemPayload = {
            menuItemId: item.id,
            name: displayName,
            quantity,
            options,
            price: itemPrice,
            subtotal: itemPrice * quantity,
        };

        const toastTitle = isEditingItem ? t('updatedCartItem') : t('addedToCart');

        if (editContext) {
            const { index, returnView } = editContext;
            updateItemByIndex(index, cartItemPayload);
            resetCustomizationState(returnView);
        } else {
            addItem(cartItemPayload);
            resetCustomizationState();
        }

        toast({
            title: toastTitle,
            description: `${quantity}x ${displayName}`,
        });
    };

    const handleEditCartItem = (index: number) => {
        const cartItem = items[index];
        if (!cartItem) return;

        const menuItem = menu.find((menuEntry) => menuEntry.id === cartItem.menuItemId);

        if (!menuItem) {
            toast({
                title: t('editUnavailable'),
                description: t('editUnavailableDescription'),
                variant: 'destructive',
            });
            return;
        }

        setSelectedCategory(menuItem.category);
        setSelectedItem(menuItem);
        setEditContext({
            index,
            item: cartItem,
            returnView: 'cartReview',
        });
        setView('menu');
    };

    const handleCartCheckout = () => {
        setView('cartReview');
    };

    const handleProceedToCheckout = () => {
        setView('checkout');
    };

    const handleCompleteOrder = async (paymentMethod: string, promoCode: string | null) => {
        // Prevent duplicate submissions
        if (isSubmittingOrder) {
            return;
        }

        setIsSubmittingOrder(true);
        try {
            const cartItems = useCartStore.getState().items;
            const subtotal = getTotal();
            const user = useAuthStore.getState().user;

            // Calculate discount if promo code provided
            let discount = 0;
            if (promoCode) {
                const promoDiscounts: Record<string, number> = {
                    'SAVE10': 0.10,
                    'SAVE20': 0.20,
                    'WELCOME': 0.15,
                };
                const discountPercent = promoDiscounts[promoCode.toUpperCase()] || 0;
                discount = subtotal * discountPercent;
            }

            const order = await api.createOrder({
                source: 'kiosk',
                items: cartItems.map((item) => ({
                    menuItemId: item.menuItemId,
                    quantity: item.quantity,
                    options: item.options,
                })),
                paymentMethod,
                promoCode,
                discount,
                customerId: user?.role === 'customer' ? user.userId : undefined,
            });

            // Prepare receipt data
            const receiptItems = cartItems.map((item) => ({
                name: item.name,
                quantity: item.quantity,
                subtotal: item.subtotal,
            }));

            const tax = (subtotal - discount) * 0.0825;
            const total = subtotal - discount + tax;

            setOrderData({
                orderId: order.orderId,
                items: receiptItems,
                total,
            });
            setOrderNumber(order.orderId.slice(-6));
            setView('receipt');
            clearCart();
        } catch (error: any) {
            console.error('Order creation error:', error);
            toast({
                title: t('orderFailed'),
                description: error?.message || t('pleaseTryAgain'),
                variant: 'destructive',
            });
        } finally {
            setIsSubmittingOrder(false);
        }
    };

    const handleStartNewOrder = () => {
        setView('home');
        setSelectedCategory('');
        setSelectedItem(null);
        setOrderNumber('');
        setOrderData(null);
    };

    return (
        <div className="min-h-screen bg-background">
            <AccessibilityToolbar />

            {view === 'home' && (
                <div className="min-h-screen flex flex-col">
                    <header className="bg-card border-b px-6 py-4 flex gap-4 justify-between items-center">
                        <div className="flex gap-4">
                            {items.length > 0 && (
                                <Button
                                    variant="outline"
                                    onClick={() => setView('cartReview')}
                                    className="touch-target"
                                >
                                    <ShoppingCart className="h-4 w-4 mr-2" />
                                    {t('viewCart')} ({items.length})
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-4">
                            {user && user.role === 'customer' && (
                                <Button
                                    variant="outline"
                                    onClick={() => setView('pastOrders')}
                                    className="touch-target"
                                >
                                    <History className="h-4 w-4 mr-2" />
                                    {t('pastOrders')}
                                </Button>
                            )}
                            {user ? (
                                <Button variant="outline" onClick={handleLogout} className="touch-target">
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Logout
                                </Button>
                            ) : (
                                <Button variant="outline" onClick={() => navigate('/login')} className="touch-target">
                                    Sign In
                                </Button>
                            )}
                        </div>
                    </header>

                    <div className="container mx-auto px-6 py-12 flex-1 w-full max-w-full">
                        <div className="flex items-center justify-center gap-8 mb-12">
                            {/* Weather widget inline with welcome text */}
                            <div className="flex-shrink-0">
                                <WeatherTile compact={true} />
                            </div>
                            <div className="text-center space-y-4 flex-1">
                                <h1 className="text-5xl font-bold text-primary section-heading">{t('welcome')}</h1>
                                <p className="text-2xl text-muted-foreground section-heading">{t('selectCategory')}</p>
                            </div>
                        </div>

                        {/* Active Order Bar - shown above categories when order exists */}
                        {activeOrder && (
                            <Card className="mb-8 p-4 bg-primary/10 border-primary/30">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <span className="text-sm text-muted-foreground">Order #</span>
                                            <span className="text-2xl font-bold ml-2">#{activeOrder.orderId.slice(-6)}</span>
                                        </div>
                                        <div className="h-8 w-px bg-border" />
                                        <div>
                                            <span className="text-sm text-muted-foreground">Status: </span>
                                            <Badge className={
                                                activeOrder.status === 'PLACED' ? 'bg-yellow-500' :
                                                    activeOrder.status === 'PREPARING' ? 'bg-blue-500' :
                                                        activeOrder.status === 'READY' ? 'bg-green-500' :
                                                            'bg-gray-500'
                                            }>
                                                {activeOrder.status}
                                            </Badge>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => navigate('/customer')}
                                    >
                                        View Order History
                                    </Button>
                                </div>
                            </Card>
                        )}

                        <div className="flex flex-col lg:flex-row gap-8 items-start main-content-layout">
                            {/* Left side: Categories */}
                            <div className="flex-1 space-y-6 min-w-0 order-1 categories-section">
                                <div className="category-grid">
                                    {categories.map((category) => {
                                        const translatedCategory = translatedCategories.get(category) || category;
                                        return (
                                            <Card
                                                key={category}
                                                className="p-10 hover:shadow-xl transition-all cursor-pointer touch-target flex items-center justify-center min-h-[140px]"
                                                onClick={() => handleCategorySelect(category)}
                                            >
                                                <h2 className="text-2xl font-bold text-center leading-tight category-heading">{translatedCategory}</h2>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Right side: Suggested items */}
                            <div className="w-full lg:w-auto flex-shrink-0 order-2 suggested-items-section">
                                    <Card className="p-6 space-y-4 shadow-sm h-full">
                                    <div>
                                        <h2 className="text-xl font-bold section-heading">{t('suggestedTitle')}</h2>
                                        <p className="text-sm text-muted-foreground mt-1">{t('suggestedSubtitle')}</p>
                                    </div>

                                    {loadingSuggestions && (
                                        <p className="text-sm text-muted-foreground">Loading suggestions...</p>
                                    )}

                                    {!loadingSuggestions && suggestedItems.length === 0 && (
                                        <p className="text-sm text-muted-foreground">Suggestions will appear here soon.</p>
                                    )}

                                    {!loadingSuggestions && suggestedItems.length > 0 && (
                                        <div className="space-y-3">
                                            {suggestedItems.map((item) => {
                                                const translated = translatedSuggestedItems.get(item.id);
                                                const displayName = translated?.name || item.name;
                                                const displayDescription = translated?.description || item.description || 'Customer favorite';
                                                const imagePath = getMenuItemImage(item.name, item.category);
                                                return (
                                                    <Card
                                                        key={item.id}
                                                        className="p-4 border-muted/60 hover:border-primary transition-colors cursor-pointer"
                                                        onClick={() => setSelectedItem(item)}
                                                    >
                                                        <div className="flex gap-3 items-stretch">
                                                            {/* Image on the left - fills height */}
                                                            {imagePath && (
                                                                <div className="w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted flex items-center justify-center self-stretch">
                                                                    <img 
                                                                        src={imagePath} 
                                                                        alt={displayName}
                                                                        className="w-full h-full object-cover min-h-[100px]"
                                                                        onError={(e) => {
                                                                            // Hide image on error
                                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                                        }}
                                                                    />
                                                                </div>
                                                            )}
                                                            {/* Text content on the right */}
                                                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                                <div>
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <div className="min-w-0 flex-1">
                                                                            <h3 className="text-sm font-semibold line-clamp-1 break-words">{displayName}</h3>
                                                                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1 break-words">
                                                                                {displayDescription}
                                                                            </p>
                                                                        </div>
                                                                        <span className="text-sm font-bold text-primary flex-shrink-0">
                                                                            ${item.price.toFixed(2)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                {/* Button centered at bottom */}
                                                                <div className="pt-2 flex justify-center">
                                                                    <Button
                                                                        variant="secondary"
                                                                        size="sm"
                                                                        className="w-full touch-target text-xs"
                                                                        onClick={() => handleSuggestedSelect(item)}
                                                                    >
                                                                        {t('viewItem')}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    )}
                                    </Card>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {view === 'menu' && (
                <div className="h-screen flex flex-col">
                    <header className="bg-card border-b px-6 py-4 flex gap-4 justify-between">
                        <div className="flex gap-4">
                            <Button
                                variant="outline"
                                onClick={() =>
                                    requestNavigationConfirmation(() => {
                                        setView('home');
                                        setSelectedCategory('');
                                    })
                                }
                                className="touch-target"
                            >
                                <Home className="h-5 w-5 mr-2" />
                                {t('home')}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => requestNavigationConfirmation(() => setView('cartReview'))}
                                className="touch-target"
                            >
                                {t('viewCart')} ({items.length})
                            </Button>
                        </div>
                        <div className="flex gap-4">
                            {user && user.role === 'customer' && (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        if (!selectedItem) {
                                            setView('pastOrders');
                                        } else {
                                            requestNavigationConfirmation(() => setView('pastOrders'));
                                        }
                                    }}
                                    className="touch-target"
                                >
                                    <History className="h-4 w-4 mr-2" />
                                    {t('pastOrders')}
                                </Button>
                            )}
                            {user ? (
                                <Button variant="outline" onClick={handleLogout} className="touch-target">
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Logout
                                </Button>
                            ) : (
                                <Button variant="outline" onClick={() => navigate('/login')} className="touch-target">
                                    Sign In
                                </Button>
                            )}
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto p-6 w-full">
                        {selectedItem ? (
                            <div className="space-y-4 w-full max-w-full">
                                <Button variant="outline" onClick={handleExitCustomizer} className="touch-target">
                                    <ArrowLeft className="h-5 w-5 mr-2" />
                                    {t('backToMenu')}
                                </Button>
                                <ItemCustomizer
                                    menuItemId={selectedItem.id}
                                    itemName={selectedItem.name}
                                    itemPrice={selectedItem.price}
                                    temperatureOptions={selectedItem.temperatureOptions}
                                    category={selectedItem.category}
                                    initialOptions={editingInitialOptions}
                                    initialQuantity={editingInitialQuantity}
                                    mode={isEditingItem ? 'edit' : 'add'}
                                    onAddToCart={(quantity, options) =>
                                        handleAddToCart(selectedItem, quantity, options)
                                    }
                                    onCancel={handleExitCustomizer}
                                />
                            </div>
                        ) : (
                            <MenuList
                                items={menu}
                                onSelect={setSelectedItem}
                                selectedCategory={selectedCategory}
                            />
                        )}
                    </div>
                </div>
            )}

            {view === 'cart' && (
                <div className="h-screen flex flex-col">
                    <header className="bg-card border-b px-6 py-4">
                        <Button variant="outline" onClick={() => setView('menu')} className="touch-target">
                            <ArrowLeft className="h-5 w-5 mr-2" />
                            {t('backToMenu')}
                        </Button>
                    </header>
                    <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full">
                        <CartPanel onCheckout={handleCartCheckout} />
                    </div>
                </div>
            )}

            {view === 'cartReview' && (
                <CartReview
                    onBack={() => setView('menu')}
                    onProceed={handleProceedToCheckout}
                    onEditItem={handleEditCartItem}
                />
            )}

            {view === 'checkout' && (
                <Checkout
                    onBack={() => setView('cartReview')}
                    onComplete={handleCompleteOrder}
                    isSubmitting={isSubmittingOrder}
                />
            )}

            {view === 'receipt' && orderData && (
                <KioskReceipt
                    orderId={orderData.orderId}
                    items={orderData.items}
                    total={orderData.total}
                    onNewOrder={handleStartNewOrder}
                />
            )}

            {view === 'pastOrders' && (
                <div className="h-screen flex flex-col">
                    <header className="bg-card border-b px-6 py-4 flex gap-4 justify-between">
                        <div className="flex gap-4">
                            <Button
                                variant="outline"
                                onClick={() => setView('home')}
                                className="touch-target"
                            >
                                <Home className="h-5 w-5 mr-2" />
                                {t('home')}
                            </Button>
                        </div>
                        {user ? (
                            <Button variant="outline" onClick={handleLogout} className="touch-target">
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </Button>
                        ) : (
                            <Button variant="outline" onClick={() => navigate('/login')} className="touch-target">
                                Sign In
                            </Button>
                        )}
                    </header>

                    <div className="flex-1 overflow-y-auto w-full">
                        <div className="container mx-auto px-6 py-8 w-full max-w-full">
                            {!user || user.role !== 'customer' ? (
                                <div className="text-center py-12 space-y-4">
                                    <h1 className="text-3xl font-bold text-primary break-words">{t('signInRequired')}</h1>
                                    <p className="text-muted-foreground max-w-full mx-auto break-words px-4">
                                        {t('signInToViewOrders')}
                                    </p>
                                    <Button
                                        onClick={() => navigate('/login')}
                                        className="touch-target"
                                        size="lg"
                                    >
                                        {t('createAccount')}
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-6">
                                        <h1 className="text-3xl font-bold text-primary break-words">{t('pastOrders')}</h1>
                                    </div>

                                    {loadingPastOrders ? (
                                        <div className="text-center py-12">
                                            <p className="text-muted-foreground">{t('loadingOrders')}</p>
                                        </div>
                                    ) : (
                                        <OrderHistory
                                            orders={pastOrders}
                                            onOrderClick={(order) => {
                                                // Could show order details in the future
                                                console.log('Order clicked:', order);
                                            }}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <AlertDialog open={isCancelDialogOpen} onOpenChange={handleDialogOpenChange}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('cancelItemTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>{t('cancelItemDescription')}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleKeepEditing}>
                            {t('keepEditing')}
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmCancel}>
                            {t('cancelItem')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
