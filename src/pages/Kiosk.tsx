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
import { ArrowLeft, Home, LogOut, History } from 'lucide-react';
import { translateText, translateMultiple } from '@/lib/translate';
import { useAuthStore } from '@/store/authStore';
import { OrderHistory } from '@/components/OrderHistory';

// Base English translations
const baseTranslations = {
    welcome: 'Welcome to Sharetea',
    selectCategory: 'Select a category to start your order',
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
    cancelItem: 'Cancel Item',
    keepEditing: 'Keep Editing',
    updatedCartItem: 'Cart item updated',
    editUnavailable: 'Unable to edit item',
    editUnavailableDescription: 'The original drink is no longer available.',
    pastOrders: 'Past Orders',
    loadingOrders: 'Loading orders...',
    noOrdersFound: 'No orders found',
};

type View = 'home' | 'menu' | 'cart' | 'cartReview' | 'checkout' | 'receipt' | 'pastOrders';

export default function Kiosk() {
    const [menu, setMenu] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
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
    const [isTranslating, setIsTranslating] = useState(false);
    const [editContext, setEditContext] = useState<{ index: number; item: CartItem; returnView: View } | null>(null);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
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

    useEffect(() => {
        api.getMenu()
            .then((data) => {
                setMenu(data);
                const cats = Array.from(new Set(data.map((item) => item.category)));
                setCategories(cats);
            })
            .catch(async (error) => {
                console.error('Failed to load menu:', error);
                const title = language !== 'en'
                    ? await translateText('Failed to load menu', language, 'en')
                    : 'Failed to load menu';
                toast({
                    title,
                    description: error.message,
                    variant: 'destructive',
                });
            });
    }, [toast, language]);

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

        const cartItemPayload = {
            menuItemId: item.id,
            name: displayName,
            quantity,
            options,
            price: item.price,
            subtotal: item.price * quantity,
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
                    <header className="bg-card border-b px-6 py-4 flex gap-4 justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setView('pastOrders')}
                            className="touch-target"
                        >
                            <History className="h-4 w-4 mr-2" />
                            {t('pastOrders')}
                        </Button>
                        <Button variant="outline" onClick={handleLogout} className="touch-target">
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </header>

                    <div className="container mx-auto px-6 py-12 space-y-8 flex-1">
                        <div className="text-center space-y-4">
                            <h1 className="text-5xl font-bold text-primary">{t('welcome')}</h1>
                            <p className="text-2xl text-muted-foreground">{t('selectCategory')}</p>
                        </div>

                        {activeOrder ? (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2">
                                    <WeatherTile />
                                </div>

                                <Card className="p-6 bg-primary/5 border-primary/20">
                                    <div className="space-y-3">
                                        <h2 className="text-xl font-bold">Current Order Status</h2>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-muted-foreground">Order #</span>
                                                <span className="text-2xl font-bold">#{activeOrder.orderId.slice(-6)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-muted-foreground">Status</span>
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
                                            className="w-full mt-4"
                                            onClick={() => navigate('/customer')}
                                        >
                                            View Order History
                                        </Button>
                                    </div>
                                </Card>
                            </div>
                        ) : (
                            <WeatherTile />
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-8">
                            {categories.map((category) => {
                                const translatedCategory = translatedCategories.get(category) || category;
                                return (
                                    <Card
                                        key={category}
                                        className="p-8 hover:shadow-xl transition-all cursor-pointer touch-target"
                                        onClick={() => handleCategorySelect(category)}
                                    >
                                        <h2 className="text-3xl font-bold text-center">{translatedCategory}</h2>
                                    </Card>
                                );
                            })}
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
                            <Button variant="outline" onClick={handleLogout} className="touch-target">
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </Button>
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto p-6">
                        {selectedItem ? (
                            <div className="space-y-4">
                                <Button variant="outline" onClick={handleExitCustomizer} className="touch-target">
                                    <ArrowLeft className="h-5 w-5 mr-2" />
                                    {t('backToMenu')}
                                </Button>
                                <ItemCustomizer
                                    menuItemId={selectedItem.id}
                                    itemName={selectedItem.name}
                                    itemPrice={selectedItem.price}
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
                        <Button variant="outline" onClick={handleLogout} className="touch-target">
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </header>

                    <div className="flex-1 overflow-y-auto">
                        <div className="container mx-auto px-6 py-8 max-w-4xl">
                            <div className="mb-6">
                                <h1 className="text-3xl font-bold text-primary">{t('pastOrders')}</h1>
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
