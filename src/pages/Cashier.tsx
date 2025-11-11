import { useEffect, useState } from 'react';
import { MenuItem, api } from '@/lib/api';
import { MenuList } from '@/components/MenuList';
import { ItemCustomizer } from '@/components/ItemCustomizer';
import { CartPanel } from '@/components/CartPanel';
import { CartReview } from '@/components/CartReview';
import { Checkout } from '@/components/Checkout';
import { CashierReceipt } from '@/components/CashierReceipt';
import { useCartStore, CartItemOptions } from '@/store/cartStore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const { addItem, clearCart, items, getTotal } = useCartStore();
  const { toast } = useToast();
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

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

  const handleAddToCart = (item: MenuItem, quantity: number, options: CartItemOptions) => {
    addItem({
      menuItemId: item.id,
      name: item.name,
      quantity,
      options,
      price: item.price,
      subtotal: item.price * quantity,
    });
    setSelectedItem(null);
    toast({
      title: 'Added to cart',
      description: `${quantity}x ${item.name}`,
    });
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
    } catch (error) {
      toast({
        title: 'Order failed',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleNewOrder = () => {
    setView('menu');
    setOrderData(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredMenu = menu.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
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
        />
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
        <Checkout
          onBack={() => setView('cartReview')}
          onComplete={handleCompleteOrder}
        />
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
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
          <div className="mb-6 space-y-4">
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

          {selectedItem ? (
            <ItemCustomizer
              itemName={selectedItem.name}
              itemPrice={selectedItem.price}
              onAddToCart={(quantity, options) =>
                handleAddToCart(selectedItem, quantity, options)
              }
              onCancel={() => setSelectedItem(null)}
            />
          ) : (
            <MenuList
              items={filteredMenu}
              onSelect={setSelectedItem}
              selectedCategory={selectedCategory}
            />
          )}
        </div>

        <div className="w-96 border-l p-6 bg-muted/30">
          <CartPanel onCheckout={handleCartCheckout} />
        </div>
      </div>
    </div>
  );
}
