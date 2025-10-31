import { useEffect, useState } from 'react';
import { MenuItem, api } from '@/lib/api';
import { MenuList } from '@/components/MenuList';
import { ItemCustomizer } from '@/components/ItemCustomizer';
import { CartPanel } from '@/components/CartPanel';
import { CartReview } from '@/components/CartReview';
import { Checkout } from '@/components/Checkout';
import { KioskReceipt } from '@/components/KioskReceipt';
import { WeatherTile } from '@/components/WeatherTile';
import { AccessibilityToolbar } from '@/components/AccessibilityToolbar';
import { useCartStore, CartItemOptions } from '@/store/cartStore';
import { useAccessibilityStore } from '@/store/accessibilityStore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Home } from 'lucide-react';

//auto translate for accessibility
const translations = {
  en: {
    welcome: 'Welcome to Sharetea',
    selectCategory: 'Select a category to start your order',
    backToMenu: 'Back to Menu',
    home: 'Home',
    orderConfirmed: 'Order Confirmed!',
    orderNumber: 'Your order number is',
    thankYou: 'Thank you for your order',
    startNewOrder: 'Start New Order',
  },
  es: {
    welcome: 'Bienvenido a Sharetea',
    selectCategory: 'Seleccione una categoría para comenzar su pedido',
    backToMenu: 'Volver al menú',
    home: 'Inicio',
    orderConfirmed: '¡Pedido confirmado!',
    orderNumber: 'Su número de pedido es',
    thankYou: 'Gracias por su pedido',
    startNewOrder: 'Nuevo pedido',
  },
};

type View = 'home' | 'menu' | 'cart' | 'cartReview' | 'checkout' | 'receipt';

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
  const { addItem, clearCart, items, getTotal } = useCartStore();
  const { language } = useAccessibilityStore();
  const { toast } = useToast();
  const t = translations[language];

  useEffect(() => {
    api.getMenu()
      .then((data) => {
        setMenu(data);
        const cats = Array.from(new Set(data.map((item) => item.category)));
        setCategories(cats);
      })
      .catch((error) => {
        console.error('Failed to load menu:', error);
        toast({
          title: language === 'en' ? 'Failed to load menu' : 'Error al cargar el menú',
          description: error.message,
          variant: 'destructive',
        });
      });
  }, [toast, language]);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setView('menu');
  };

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
      title: language === 'en' ? 'Added to cart' : 'Agregado al carrito',
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
        source: 'kiosk',
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
    } catch (error) {
      toast({
        title: language === 'en' ? 'Order failed' : 'Error en el pedido',
        description: language === 'en' ? 'Please try again' : 'Por favor intente de nuevo',
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
        <div className="container mx-auto px-6 py-12 space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold text-primary">{t.welcome}</h1>
            <p className="text-2xl text-muted-foreground">{t.selectCategory}</p>
          </div>

          <WeatherTile />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-8">
            {categories.map((category) => (
              <Card
                key={category}
                className="p-8 hover:shadow-xl transition-all cursor-pointer touch-target"
                onClick={() => handleCategorySelect(category)}
              >
                <h2 className="text-3xl font-bold text-center">{category}</h2>
              </Card>
            ))}
          </div>
        </div>
      )}

      {view === 'menu' && (
        <div className="h-screen flex flex-col">
          <header className="bg-card border-b px-6 py-4 flex gap-4">
            <Button variant="outline" onClick={() => setView('home')} className="touch-target">
              <Home className="h-5 w-5 mr-2" />
              {t.home}
            </Button>
            <Button variant="outline" onClick={() => setView('cartReview')} className="touch-target">
              View Cart ({items.length})
            </Button>
          </header>

          <div className="flex-1 overflow-y-auto p-6">
            {selectedItem ? (
              <div className="space-y-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedItem(null)}
                  className="touch-target"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  {t.backToMenu}
                </Button>
                <ItemCustomizer
                  itemName={selectedItem.name}
                  itemPrice={selectedItem.price}
                  onAddToCart={(quantity, options) =>
                    handleAddToCart(selectedItem, quantity, options)
                  }
                  onCancel={() => setSelectedItem(null)}
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
              {t.backToMenu}
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
    </div>
  );
}
