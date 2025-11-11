import { MenuItem } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAccessibilityStore } from '@/store/accessibilityStore';

interface MenuListProps {
  items: MenuItem[];
  onSelect: (item: MenuItem) => void;
  selectedCategory?: string;
}

const translations = {
  en: {
    addToOrder: 'Add to Order',
  },
  es: {
    addToOrder: 'Agregar al pedido',
  },
};

export const MenuList = ({ items, onSelect, selectedCategory }: MenuListProps) => {
  const { language } = useAccessibilityStore();
  const t = translations[language];

  const filteredItems = selectedCategory
    ? items.filter((item) => item.category === selectedCategory && item.active)
    : items.filter((item) => item.active);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredItems.map((item) => (
        <Card key={item.id} className="p-4 hover:shadow-lg transition-shadow">
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-lg">{item.name}</h3>
              <span className="text-lg font-bold text-primary">${item.price.toFixed(2)}</span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
            <Button
              onClick={() => onSelect(item)}
              className="w-full touch-target"
              size="lg"
            >
              {t.addToOrder}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};
