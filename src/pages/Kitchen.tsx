import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order, api, MenuItem } from '@/lib/api';
import { TicketCard } from '@/components/TicketCard';
import { CollapsibleOrderCard } from '@/components/CollapsibleOrderCard';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { sortOrdersByPriority } from '@/lib/orderPriority';

export default function Kitchen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<Map<string, MenuItem>>(new Map());
  const { toast } = useToast();
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const fetchMenuItems = async () => {
    try {
      const items = await api.getMenu();
      const menuMap = new Map<string, MenuItem>();
      items.forEach((item) => {
        menuMap.set(item.id, item);
      });
      setMenuItems(menuMap);
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
    }
  };

  const fetchOrders = useCallback(async () => {
    try {
      const data = await api.getKitchenQueueWithCompleted();
      // Sort orders by priority if we have menu items
      if (menuItems.size > 0) {
        const sortedOrders = sortOrdersByPriority(data, menuItems);
        setOrders(sortedOrders);
      } else {
        setOrders(data);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  }, [menuItems]);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  useEffect(() => {
    if (menuItems.size > 0) {
      fetchOrders();
      const interval = setInterval(fetchOrders, 5000);
      return () => clearInterval(interval);
    }
  }, [menuItems, fetchOrders]);

  const handleStatusChange = async (orderId: string, status: 'PREPARING' | 'READY' | 'COMPLETED') => {
    try {
      await api.updateOrderStatus(orderId, status);
      await fetchOrders();
      toast({
        title: 'Order updated',
        description: `Order moved to ${status}`,
      });
    } catch (error) {
      toast({
        title: 'Update failed',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Orders are already sorted by priority, so we just filter by status
  // Each status group maintains priority order
  // Completed orders are sorted by recency (most recent first) and limited
  const ordersByStatus = {
    PLACED: orders.filter((o) => o.status === 'PLACED'),
    PREPARING: orders.filter((o) => o.status === 'PREPARING'),
    READY: orders.filter((o) => o.status === 'READY'),
    COMPLETED: orders
      .filter((o) => o.status === 'COMPLETED')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20), // Limit to last 20 completed orders in main view
  };

  // All completed orders for Past Orders tab (sorted by recency, most recent first)
  const allCompletedOrders = orders
    .filter((o) => o.status === 'COMPLETED')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="h-screen bg-background flex flex-col">
      <header className="bg-card border-b px-6 py-4 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-primary">Kitchen Display</h1>
        <Button variant="outline" onClick={handleLogout} className="touch-target">
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col">
        <Tabs defaultValue="active" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-4">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="active">Active Orders</TabsTrigger>
              <TabsTrigger value="past">Past Orders</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="active" className="flex-1 overflow-hidden mt-0">
            <div className="h-full grid grid-cols-3 gap-6 p-6 overflow-hidden">
              {(['PLACED', 'PREPARING', 'READY'] as const).map((status) => (
                <div key={status} className="flex flex-col min-h-0">
                  <div className="bg-card rounded-t-lg px-4 py-3 border-b flex-shrink-0">
                    <h2 className="text-xl font-bold">
                      {status} ({ordersByStatus[status].length})
                    </h2>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto space-y-4 p-4 bg-muted/30 rounded-b-lg">
                    {ordersByStatus[status].map((order) => (
                      <TicketCard
                        key={order.orderId}
                        order={order}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="past" className="flex-1 overflow-hidden mt-0">
            <div className="h-full p-6 overflow-y-auto">
              <div className="mb-4">
                <h2 className="text-2xl font-bold">Completed Orders ({allCompletedOrders.length})</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Click on an order to view details and re-open if needed
                </p>
              </div>
              <div className="space-y-3">
                {allCompletedOrders.map((order) => (
                  <CollapsibleOrderCard
                    key={order.orderId}
                    order={order}
                    onStatusChange={handleStatusChange}
                  />
                ))}
                {allCompletedOrders.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No completed orders found
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
