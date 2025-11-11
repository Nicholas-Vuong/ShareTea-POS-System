import { useEffect, useState } from 'react';
import { Order, api } from '@/lib/api';
import { TicketCard } from '@/components/TicketCard';
import { useToast } from '@/hooks/use-toast';

export default function Kitchen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const { toast } = useToast();

  const fetchOrders = async () => {
    try {
      const data = await api.getKitchenQueue();
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (orderId: string, status: 'PREPARING' | 'READY') => {
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

  const ordersByStatus = {
    PLACED: orders.filter((o) => o.status === 'PLACED'),
    PREPARING: orders.filter((o) => o.status === 'PREPARING'),
    READY: orders.filter((o) => o.status === 'READY'),
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      <header className="bg-card border-b px-6 py-4">
        <h1 className="text-3xl font-bold text-primary">Kitchen Display</h1>
      </header>

      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-3 gap-6 p-6">
          {(['PLACED', 'PREPARING', 'READY'] as const).map((status) => (
            <div key={status} className="flex flex-col">
              <div className="bg-card rounded-t-lg px-4 py-3 border-b">
                <h2 className="text-xl font-bold">
                  {status} ({ordersByStatus[status].length})
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-muted/30 rounded-b-lg">
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
      </div>
    </div>
  );
}
