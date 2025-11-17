import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order, api } from '@/lib/api';
import { OrderHistory } from '@/components/OrderHistory';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { LogOut, ShoppingBag } from 'lucide-react';

export default function Customer() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchOrders = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const allOrders = await api.getCustomerOrders(user.userId);
      setOrders(allOrders);

      // Get active orders (in progress or recently completed)
      const recentOrders = await api.getOrdersInProgressOrRecent(user.userId, 5);
      setActiveOrders(recentOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast({
        title: 'Failed to load orders',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchOrders();

    // Poll for active orders every 8 seconds
    const interval = setInterval(() => {
      if (user) {
        api.getOrdersInProgressOrRecent(user.userId, 5)
          .then(setActiveOrders)
          .catch((error) => {
            console.error('Failed to fetch active orders:', error);
          });
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [user, navigate, fetchOrders]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleOrderClick = (order: Order) => {
    // Could navigate to order details page in the future
    console.log('Order clicked:', order);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <ShoppingBag className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-primary">My Orders</h1>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => navigate('/kiosk')}>
            Place New Order
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading orders...</p>
          </div>
        ) : (
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">
                Active Orders ({activeOrders.length})
              </TabsTrigger>
              <TabsTrigger value="history">
                Order History ({orders.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-6">
              {activeOrders.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-lg text-muted-foreground">
                    No active orders. Place an order to see it here!
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => navigate('/kiosk')}
                  >
                    Place New Order
                  </Button>
                </Card>
              ) : (
                <OrderHistory
                  orders={activeOrders}
                  onOrderClick={handleOrderClick}
                />
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <OrderHistory
                orders={orders}
                onOrderClick={handleOrderClick}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

