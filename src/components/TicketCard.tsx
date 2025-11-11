import { Order } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TicketCardProps {
  order: Order;
  onStatusChange: (orderId: string, status: 'PREPARING' | 'READY') => void;
}

export const TicketCard = ({ order, onStatusChange }: TicketCardProps) => {
  const statusColors = {
    PLACED: 'bg-yellow-500',
    PREPARING: 'bg-blue-500',
    READY: 'bg-green-500',
    COMPLETED: 'bg-gray-500',
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-2xl font-bold">#{order.orderId.slice(-6)}</h3>
          <p className="text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleTimeString()}
          </p>
        </div>
        <Badge className={statusColors[order.status]}>{order.status}</Badge>
      </div>

      <div className="space-y-2">
        {order.items.map((item, index) => (
          <div key={index} className="border-l-4 border-primary pl-3 py-2">
            <p className="font-semibold text-lg">{item.name}</p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Size: {item.options.size}</p>
              <p>Sugar: {item.options.sugar}%</p>
              <p>Ice: {item.options.ice}</p>
              {item.options.toppings.length > 0 && (
                <p className="font-medium">+ {item.options.toppings.join(', ')}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {order.status === 'PLACED' && (
        <Button
          onClick={() => onStatusChange(order.orderId, 'PREPARING')}
          className="w-full touch-target"
          size="lg"
        >
          Start Preparing
        </Button>
      )}
      {order.status === 'PREPARING' && (
        <Button
          onClick={() => onStatusChange(order.orderId, 'READY')}
          variant="default"
          className="w-full touch-target bg-success hover:bg-success/90"
          size="lg"
        >
          Mark Ready
        </Button>
      )}
    </Card>
  );
};
