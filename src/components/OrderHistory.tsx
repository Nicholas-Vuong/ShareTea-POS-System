import { Order } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface OrderHistoryProps {
  orders: Order[];
  onOrderClick?: (order: Order) => void;
}

export const OrderHistory = ({ orders, onOrderClick }: OrderHistoryProps) => {
  const statusColors = {
    PLACED: 'bg-yellow-500',
    PREPARING: 'bg-blue-500',
    READY: 'bg-green-500',
    COMPLETED: 'bg-gray-500',
  };

  const statusLabels = {
    PLACED: 'Placed',
    PREPARING: 'Preparing',
    READY: 'Ready',
    COMPLETED: 'Completed',
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No orders found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card
          key={order.orderId}
          className={`p-4 ${onOrderClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
          onClick={() => onOrderClick?.(order)}
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-xl font-bold">Order #{order.orderId.slice(-6)}</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <Badge className={statusColors[order.status]}>
              {statusLabels[order.status]}
            </Badge>
          </div>

          <Separator className="my-3" />

          <div className="space-y-2">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium">
                    {item.quantity}x {item.name}
                  </p>
                  <div className="text-sm text-muted-foreground mt-1">
                    <span>Size: {item.options.size}</span>
                    {item.options.toppings && item.options.toppings.length > 0 && (
                      <span className="ml-2">
                        + {item.options.toppings.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
};

