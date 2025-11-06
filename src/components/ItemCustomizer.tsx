import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Minus, Plus } from 'lucide-react';
import { CartItemOptions } from '@/store/cartStore';
import { useAccessibilityStore } from '@/store/accessibilityStore';

interface ItemCustomizerProps {
  itemName: string;
  itemPrice: number;
  onAddToCart: (quantity: number, options: CartItemOptions) => void;
  onCancel: () => void;
}

const toppingsList = [
  'Tapioca Pearls',
  'Popping Boba',
  'Jelly',
  'Pudding',
  'Red Bean',
  'Aloe Vera',
];

// Translation strings for English and Spanish
const translations = {
  en: {
    size: 'Size',
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
    sugarLevel: 'Sugar Level',
    iceLevel: 'Ice Level',
    noIce: 'No Ice',
    lessIce: 'Less Ice',
    normal: 'Normal',
    extraIce: 'Extra Ice',
    toppings: 'Toppings',
    quantity: 'Quantity',
    addToCart: 'Add to Cart',
    cancel: 'Cancel',
  },
  es: {
    size: 'Tamaño',
    small: 'Pequeño',
    medium: 'Mediano',
    large: 'Grande',
    sugarLevel: 'Nivel de azúcar',
    iceLevel: 'Nivel de hielo',
    noIce: 'Sin hielo',
    lessIce: 'Poco hielo',
    normal: 'Normal',
    extraIce: 'Hielo extra',
    toppings: 'Complementos',
    quantity: 'Cantidad',
    addToCart: 'Agregar al carrito',
    cancel: 'Cancelar',
  },
};

/**
 * ItemCustomizer component - allows users to customize drink orders
 * Handles size, sugar level, ice level, toppings, and quantity selection
 */
export const ItemCustomizer = ({ itemName, itemPrice, onAddToCart, onCancel }: ItemCustomizerProps) => {
  const { language } = useAccessibilityStore();
  const t = translations[language];

  const [size, setSize] = useState<'Small' | 'Medium' | 'Large'>('Small');
  const [sugar, setSugar] = useState(100);
  const [ice, setIce] = useState<'No Ice' | 'Less Ice' | 'Normal' | 'Extra Ice'>('Normal');
  const [toppings, setToppings] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  // Toggle topping selection - add if not present, remove if already selected
  const handleToppingToggle = (topping: string) => {
    setToppings((prev) =>
      prev.includes(topping)
        ? prev.filter((t) => t !== topping)
        : [...prev, topping]
    );
  };

  const handleAddToCart = () => {
    onAddToCart(quantity, { size, sugar, ice, toppings });
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">{itemName}</h2>
      <p className="text-xl text-primary font-semibold mb-6">${itemPrice.toFixed(2)}</p>

      <div className="space-y-6">
        <div>
          <Label className="text-lg font-semibold mb-3 block">{t.size}</Label>
          <RadioGroup value={size} onValueChange={(v) => setSize(v as typeof size)}>
            <div className="flex gap-3">
              {(['Small', 'Medium', 'Large'] as const).map((s) => (
                <div key={s} className="flex items-center space-x-2 flex-1">
                  <RadioGroupItem value={s} id={`size-${s}`} className="touch-target" />
                  <Label htmlFor={`size-${s}`} className="cursor-pointer flex-1 text-center py-2">
                    {t[s.toLowerCase() as 'small' | 'medium' | 'large']}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label className="text-lg font-semibold mb-3 block">{t.sugarLevel}: {sugar}%</Label>
          <div className="flex gap-2">
            {[0, 25, 50, 75, 100].map((level) => (
              <Button
                key={level}
                variant={sugar === level ? 'default' : 'outline'}
                onClick={() => setSugar(level)}
                className="flex-1 touch-target"
              >
                {level}%
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-lg font-semibold mb-3 block">{t.iceLevel}</Label>
          <RadioGroup value={ice} onValueChange={(v) => setIce(v as typeof ice)}>
            <div className="grid grid-cols-2 gap-3">
              {(['No Ice', 'Less Ice', 'Normal', 'Extra Ice'] as const).map((i) => {
                const translationKey = i === 'No Ice' ? 'noIce' : 
                                      i === 'Less Ice' ? 'lessIce' : 
                                      i === 'Normal' ? 'normal' : 
                                      'extraIce';
                return (
                  <div key={i} className="flex items-center space-x-2">
                    <RadioGroupItem value={i} id={`ice-${i}`} className="touch-target" />
                    <Label htmlFor={`ice-${i}`} className="cursor-pointer">
                      {t[translationKey]}
                    </Label>
                  </div>
                );
              })}
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label className="text-lg font-semibold mb-3 block">{t.toppings}</Label>
          <div className="grid grid-cols-2 gap-3">
            {toppingsList.map((topping) => (
              <div key={topping} className="flex items-center space-x-2">
                <Checkbox
                  id={`topping-${topping}`}
                  checked={toppings.includes(topping)}
                  onCheckedChange={() => handleToppingToggle(topping)}
                  className="touch-target"
                />
                <Label htmlFor={`topping-${topping}`} className="cursor-pointer">
                  {topping}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-lg font-semibold mb-3 block">{t.quantity}</Label>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="touch-target"
            >
              <Minus className="h-5 w-5" />
            </Button>
            <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity(quantity + 1)}
              className="touch-target"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onCancel} className="flex-1 touch-target" size="lg">
            {t.cancel}
          </Button>
          <Button onClick={handleAddToCart} className="flex-1 touch-target" size="lg">
            {t.addToCart}
          </Button>
        </div>
      </div>
    </Card>
  );
};

