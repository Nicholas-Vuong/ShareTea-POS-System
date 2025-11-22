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
  const { toast } = useToast();
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const [editContext, setEditContext] = useState<{ index: number; item: CartItem; returnView: View } | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const pendingNavigation = useRef<(() => void) | null>(null);
  const editingInitialOptions = editContext?.item.options;
  const editingInitialQuantity = editContext?.item.quantity ?? 1;
  const isEditingItem = Boolean(editContext);

  useEffect(() => {
    api.getMenu()
      .then((data) => {
        setMenu(data);
        const cats = Array.from(new Set(data.map((item) => item.category)));
        setCategories(cats);
        setSelectedCategory(cats[0] || '');
      })
      .catch((error) => {
        console.error('Failed to load menu:', error);
        toast({
          title: 'Failed to load menu',
          description: error.message,
          variant: 'destructive',
        });
      });
  }, [toast]);

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

  const handleAddToCart = (item: MenuItem, quantity: number, options: CartItemOptions) => {
    const cartItemPayload = {
      menuItemId: item.id,
      name: item.name,
      quantity,
      options,
      price: item.price,
      subtotal: item.price * quantity,
    };

    if (isEditingItem && editContext) {
      const { index, returnView } = editContext;
      updateItemByIndex(index, cartItemPayload);
      resetCustomizationState(returnView);
      toast({
        title: 'Cart item updated',
        description: `${quantity}x ${item.name}`,
      });
    } else {
      addItem(cartItemPayload);
      resetCustomizationState();
      toast({
        title: 'Added to cart',
        description: `${quantity}x ${item.name}`,
      });
    }
  };

  const handleCartCheckout = () => {
    requestNavigationConfirmation(() => setView('cartReview'));
  };

  const handleProceedToCheckout = () => {
    setView('checkout');
  };

  const handleEditCartItem = (index: number) => {
    const cartItem = items[index];
    if (!cartItem) return;

    const menuItem = menu.find((menuEntry) => menuEntry.id === cartItem.menuItemId);

    if (!menuItem) {
      toast({
        title: 'Unable to edit item',
        description: 'The original drink is no longer available.',
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

  const handleCompleteOrder = async (paymentMethod: string, promoCode: string | null, customerId?: string) => {
    try {
      const cartItems = useCartStore.getState().items;
      const subtotal = getTotal();
      
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
      
      // Prepare receipt data
      const receiptItems = cartItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        options: item.options,
      }));
      
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
          onBack={() => setView('cartReview')}
          onComplete={handleCompleteOrder}
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
          <CartPanel onCheckout={handleCartCheckout} />
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
                    initialOptions={editingInitialOptions}
                    initialQuantity={editingInitialQuantity}
                    mode={isEditingItem ? 'edit' : 'add'}
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
