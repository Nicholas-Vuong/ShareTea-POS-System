import { useEffect, useRef, useState } from 'react';
import { MenuItem, api } from '@/lib/api';
import { MenuList } from '@/components/MenuList';
import { ItemCustomizer } from '@/components/ItemCustomizer';
import { CartPanel } from '@/components/CartPanel';
import { CartReview } from '@/components/CartReview';
import { CashierCheckout } from '@/components/CashierCheckout';
import { CashierReceipt } from '@/components/CashierReceipt';
import { useCartStore, CartItemOptions, CartItem } from '@/store/cartStore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Search, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { calculateItemPrice } from '@/lib/pricing';

/**
 * Cashier POS Page
 * 
 * Main interface for cashiers to take orders
 * Features:
 * - Menu browsing with category filtering and search
 * - Item customization (size, sugar, ice, toppings)
 * - Shopping cart management
 * - Order checkout with payment method and promo codes
 * - Customer creation/selection
 * - Order receipt display
 * - Navigation confirmation dialogs to prevent accidental data loss
 */
type View = 'menu' | 'cartReview' | 'checkout' | 'receipt';

export default function Cashier() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<View>('menu');
  const [orderData, setOrderData] = useState<{
    orderId: string;
    orderDate: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      subtotal: number;
      options: {
        size: string;
        sugar: number;
        ice: string;
        toppings: string[];
      };
    }>;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    paymentMethod: string;
    promoCode: string | null;
  } | null>(null);
  const { addItem, clearCart, items, getTotal, updateItemByIndex } = useCartStore();
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const { toast } = useToast();
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const [editContext, setEditContext] = useState<{ index: number; item: CartItem; returnView: View } | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const pendingNavigation = useRef<(() => void) | null>(null);
  const previousViewRef = useRef<View>('menu'); // Track previous view for navigation
  const editingInitialOptions = editContext?.item.options;
  const editingInitialQuantity = editContext?.item.quantity ?? 1;
  const isEditingItem = Boolean(editContext);

  const loadMenu = async () => {
    try {
      const data = await api.getMenu();
      setMenu(data);
      const cats = Array.from(new Set(data.map((item) => item.category)));
      setCategories(cats);
      if (!selectedCategory && cats.length > 0) {
        setSelectedCategory(cats[0]);
      }
    } catch (error: any) {
      console.error('Failed to load menu:', error);
      toast({
        title: 'Failed to load menu',
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
  }, [toast]);

  /**
   * Resets the item customization state
   * Clears selected item and edit context, optionally navigates to a new view
   * @param nextView - Optional view to navigate to after reset
   */
  const resetCustomizationState = (nextView?: View) => {
    setSelectedItem(null);
    setEditContext(null);
    if (nextView) {
      setView(nextView);
    }
  };

  /**
   * Requests confirmation before navigating away from item customization
   * Shows a dialog if an item is being customized to prevent accidental data loss
   * @param action - Action to perform after confirmation (or immediately if no item selected)
   */
  const requestNavigationConfirmation = (action: () => void) => {
    if (selectedItem) {
      // Store the action and show confirmation dialog
      pendingNavigation.current = action;
      setIsCancelDialogOpen(true);
      return;
    }
    // No item selected, proceed immediately
    action();
  };

  const handleKeepEditing = () => {
    setIsCancelDialogOpen(false);
    pendingNavigation.current = null;
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      handleKeepEditing();
    } else {
      setIsCancelDialogOpen(true);
    }
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

  /**
   * Handles adding or updating items in the cart
   * Supports both adding new items and editing existing items
   * @param item - Menu item to add/update
   * @param quantity - Quantity of the item
   * @param options - Customization options (size, sugar, ice, toppings)
   */
  const handleAddToCart = (item: MenuItem, quantity: number, options: CartItemOptions) => {
    // Calculate price with customization modifiers
    const itemPrice = calculateItemPrice(item.price, options.size, options.sugar, options.toppings);
    
    const cartItemPayload = {
      menuItemId: item.id,
      name: item.name,
      quantity,
      options,
      price: itemPrice,
      subtotal: itemPrice * quantity,
    };

    if (isEditingItem && editContext) {
      // Update existing cart item
      const { index, returnView } = editContext;
      updateItemByIndex(index, cartItemPayload);
      resetCustomizationState(returnView);
      toast({
        title: 'Cart item updated',
        description: `${quantity}x ${item.name}`,
      });
    } else {
      // Add new item to cart
      addItem(cartItemPayload);
      resetCustomizationState();
      toast({
        title: 'Added to cart',
        description: `${quantity}x ${item.name}`,
      });
    }
  };

  const handleCartCheckout = () => {
    previousViewRef.current = view; // Remember we're coming from menu
    requestNavigationConfirmation(() => setView('cartReview'));
  };

  const handleProceedToCheckout = () => {
    previousViewRef.current = view; // Remember we're coming from cartReview
    setView('checkout');
  };

  /**
   * Handles editing a cart item
   * Opens the item customizer with the item's current options pre-filled
   * @param index - Index of the cart item to edit
   */
  const handleEditCartItem = (index: number) => {
    const cartItem = items[index];
    if (!cartItem) return;

    // Find the menu item to ensure it still exists
    const menuItem = menu.find((menuEntry) => menuEntry.id === cartItem.menuItemId);

    if (!menuItem) {
      toast({
        title: 'Unable to edit item',
        description: 'The original drink is no longer available.',
        variant: 'destructive',
      });
      return;
    }

    // Determine return view: if on cartReview but came from checkout, return to checkout
    // Otherwise return to current view
    let returnView: View = view;
    if (view === 'cartReview' && previousViewRef.current === 'checkout') {
      returnView = 'checkout';
    }

    // Set up edit context with current item data
    setSelectedCategory(menuItem.category);
    setSelectedItem(menuItem);
    setEditContext({
      index,
      item: cartItem,
      returnView: returnView,
    });
    previousViewRef.current = view; // Remember where we're editing from
    setView('menu'); // Switch to menu view to show customizer
  };

  /**
   * Completes an order by creating it in the database
   * Handles promo code validation, discount calculation, tax, and receipt generation
   * @param paymentMethod - Payment method used (cash, card, etc.)
   * @param promoCode - Optional promo code for discount
   * @param customerId - Optional customer ID if customer account exists
   */
  const handleCompleteOrder = async (paymentMethod: string, promoCode: string | null, customerId?: string) => {
    // Prevent duplicate submissions
    if (isSubmittingOrder) {
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const cartItems = useCartStore.getState().items;
      const subtotal = getTotal();
      
      // Calculate discount if promo code provided
      // Hardcoded promo codes: SAVE10 (10%), SAVE20 (20%), WELCOME (15%)
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
      
      // Create order in database
      const order = await api.createOrder({
        source: 'cashier',
        items: cartItems.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          options: item.options,
        })),
        paymentMethod,
        promoCode,
        discount,
        customerId: customerId,
      });
      
      // Prepare receipt data for display
      const receiptItems = cartItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        options: item.options,
      }));
      
      // Calculate tax (8.25%) and final total
      const tax = (subtotal - discount) * 0.0825;
      const total = subtotal - discount + tax;
      
      setOrderData({
        orderId: order.orderId,
        orderDate: order.createdAt,
        items: receiptItems,
        subtotal,
        discount,
        tax,
        total,
        paymentMethod,
        promoCode,
      });
      
      setView('receipt');
      clearCart();
      
      toast({
        title: 'Order placed!',
        description: `Order #${order.orderId.slice(-6)} has been sent to the kitchen.`,
      });
    } catch (error: any) {
      console.error('Order creation error:', error);
      toast({
        title: 'Order failed',
        description: error?.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleNewOrder = () => {
    resetCustomizationState();
    setView('menu');
    setOrderData(null);
  };

  const handleLogout = () => {
    requestNavigationConfirmation(() => {
      logout();
      navigate('/login');
    });
  };

  const filteredMenu = menu.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const cancelDialog = (
    <AlertDialog open={isCancelDialogOpen} onOpenChange={handleDialogOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel current drink?</AlertDialogTitle>
          <AlertDialogDescription>
            This will discard your current customizations.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleKeepEditing}>Keep Editing</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmCancel}>Cancel Item</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (view === 'cartReview') {
    return (
      <div className="h-screen flex flex-col bg-background">
        <header className="border-b bg-card px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Sharetea POS</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </header>
        <CartReview
          onBack={() => setView('menu')}
          onProceed={handleProceedToCheckout}
          onEditItem={handleEditCartItem}
        />
        {cancelDialog}
      </div>
    );
  }

  if (view === 'checkout') {
    return (
      <div className="h-screen flex flex-col bg-background">
        <header className="border-b bg-card px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Sharetea POS</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </header>
        <CashierCheckout
          onBack={() => {
            previousViewRef.current = view; // Remember we're coming from checkout
            setView('cartReview');
          }}
          onComplete={handleCompleteOrder}
          isSubmitting={isSubmittingOrder}
        />
        {cancelDialog}
      </div>
    );
  }

  if (view === 'receipt' && orderData) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <header className="border-b bg-card px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Sharetea POS</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </header>
        <CashierReceipt
          orderId={orderData.orderId}
          orderDate={orderData.orderDate}
          items={orderData.items}
          subtotal={orderData.subtotal}
          discount={orderData.discount}
          tax={orderData.tax}
          total={orderData.total}
          paymentMethod={orderData.paymentMethod}
          promoCode={orderData.promoCode}
          onNewOrder={handleNewOrder}
        />
        {cancelDialog}
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b bg-card px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">Sharetea POS</h1>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-96 border-r p-6 bg-muted/30 flex-shrink-0 overflow-y-auto">
          <CartPanel onCheckout={handleCartCheckout} onEditItem={handleEditCartItem} />
        </div>

        <div className="flex-1 flex flex-col p-6 min-w-0 overflow-hidden">
          <div className="mb-6 space-y-4 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search menu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="w-full justify-start overflow-x-auto">
                {categories.map((category) => (
                  <TabsTrigger key={category} value={category}>
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            {selectedItem ? (
              <div className="h-full overflow-y-auto">
                <div className="min-h-full">
                    <ItemCustomizer
                        menuItemId={selectedItem.id}
                        itemName={selectedItem.name}
                        itemPrice={selectedItem.price}
                        temperatureOptions={selectedItem.temperatureOptions}
                        category={selectedItem.category}
                        initialOptions={editingInitialOptions}
                        initialQuantity={editingInitialQuantity}
                        mode={isEditingItem ? 'edit' : 'add'}
                        showNutritionInfo={false}
                        showImage={false}
                        onAddToCart={(quantity, options) =>
                            handleAddToCart(selectedItem, quantity, options)
                        }
                        onCancel={handleExitCustomizer}
                    />
                </div>
              </div>
            ) : (
              <div className="h-full overflow-y-auto">
                <MenuList
                  items={filteredMenu}
                  onSelect={setSelectedItem}
                  selectedCategory={search ? undefined : selectedCategory}
                  showImages={false}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      {cancelDialog}
    </div>
  );
}
