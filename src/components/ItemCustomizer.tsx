/**
 * Item Customizer Component
 * 
 * Allows users to customize menu items before adding to cart
 * Features:
 * - Size selection (Small, Medium, Large)
 * - Sugar level selection (0%, 25%, 50%, 75%, 100%)
 * - Ice level selection (No Ice, Less Ice, Normal, Extra Ice)
 * - Topping selection (multiple toppings can be selected)
 * - Quantity adjustment
 * - Real-time nutrition information based on customizations
 * - Multi-language support with automatic translation
 * - Edit mode for updating existing cart items
 */
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Minus, Plus } from 'lucide-react';
import { CartItemOptions } from '@/store/cartStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useAccessibilityStore } from '@/store/accessibilityStore';
import { translateText, translateMultiple } from '@/lib/translate';
import { NutritionInfoPanel } from '@/components/NutritionInfoPanel';
import type { CustomizationOptions } from '@/lib/nutrition';
import { calculateItemPrice, SIZE_PRICING, SUGAR_PRICING, TOPPING_PRICING, formatPriceModifier } from '@/lib/pricing';

/**
 * Props for ItemCustomizer component
 */
interface ItemCustomizerProps {
    menuItemId: string;
    itemName: string;
    itemPrice: number;
    temperatureOptions?: ('Hot' | 'Cold')[];
    onAddToCart: (quantity: number, options: CartItemOptions) => void;
    onCancel: () => void;
    initialOptions?: CartItemOptions;
    initialQuantity?: number;
    mode?: 'add' | 'edit';
}

const toppingsList = [
    'Tapioca Pearls',
    'Popping Boba',
    'Jelly',
    'Pudding',
    'Red Bean',
    'Aloe Vera',
];

const translations = {
    en: {
        size: 'Size',
        small: 'Small',
        medium: 'Medium',
        large: 'Large',
        sugarLevel: 'Sugar Level',
        iceLevel: 'Ice Level',
        temperature: 'Temperature',
        noIce: 'No Ice',
        lessIce: 'Less Ice',
        normal: 'Normal',
        extraIce: 'Extra Ice',
        toppings: 'Toppings',
        quantity: 'Quantity',
        addToCart: 'Add to Cart',
        cancel: 'Cancel',
        updateItem: 'Save Changes',
    },
    es: {
        size: 'Tamaño',
        small: 'Pequeño',
        medium: 'Mediano',
        large: 'Grande',
        sugarLevel: 'Nivel de azúcar',
        iceLevel: 'Nivel de hielo',
        temperature: 'Temperatura',
        noIce: 'Sin hielo',
        lessIce: 'Poco hielo',
        normal: 'Normal',
        extraIce: 'Hielo extra',
        toppings: 'Complementos',
        quantity: 'Cantidad',
        addToCart: 'Agregar al carrito',
        cancel: 'Cancelar',
        updateItem: 'Actualizar artículo',
    },
};

export const ItemCustomizer = ({
    menuItemId,
    itemName,
    itemPrice,
    temperatureOptions = ['Hot', 'Cold'],
    onAddToCart,
    onCancel,
    initialOptions,
    initialQuantity,
    mode = 'add',
    translatedOptions,
}: ItemCustomizerProps) => {
    const t = useTranslation(translations);
    const { language } = useAccessibilityStore();
    const [translatedItemName, setTranslatedItemName] = useState(itemName);
    const [translatedToppings, setTranslatedToppings] = useState<Map<string, string>>(new Map());
    const isEditMode = mode === 'edit';

    // Determine default temperature based on available options
    const defaultTemperature = temperatureOptions.includes('Cold') ? 'Cold' : temperatureOptions[0] || 'Cold';

    // State for customization options
    const [size, setSize] = useState<'Small' | 'Medium' | 'Large'>(initialOptions?.size ?? 'Small');
    const [sugar, setSugar] = useState(initialOptions?.sugar ?? 100);
    const [ice, setIce] = useState<'No Ice' | 'Less Ice' | 'Normal' | 'Extra Ice'>(initialOptions?.ice ?? 'Normal');
    const [temperature, setTemperature] = useState<'Hot' | 'Cold'>(initialOptions?.temperature ?? defaultTemperature);
    const [toppings, setToppings] = useState<string[]>(
        () => (initialOptions?.toppings ? [...initialOptions.toppings] : [])
    );
    const [quantity, setQuantity] = useState(initialQuantity ?? 1);

    /**
     * Memoized customization options for nutrition calculation
     * Recalculates when any customization changes
     */
    const nutritionCustomization = useMemo<CustomizationOptions>(
        () => ({
            size,
            sugarPercentage: sugar,
            iceLevel: ice,
            toppings,
        }),
        [size, sugar, ice, toppings]
    );

    // Translate item name when language or item name changes
    useEffect(() => {
        let cancelled = false;

        const translateName = async () => {
            if (language === 'en') {
                setTranslatedItemName(itemName);
                return;
            }

            try {
                const translated = await translateText(itemName, language, 'en');
                if (!cancelled) {
                    setTranslatedItemName(translated);
                }
            } catch (error) {
                console.error('Error translating item name:', error);
                if (!cancelled) {
                    setTranslatedItemName(itemName);
                }
            }
        };

        translateName();

        return () => {
            cancelled = true;
        };
    }, [itemName, language]);

    // Translate toppings list when language changes
    useEffect(() => {
        let cancelled = false;

        const translateToppingsList = async () => {
            if (language === 'en') {
                setTranslatedToppings(new Map());
                return;
            }

            try {
                // Translate all toppings in batch
                const translatedToppingNames = await translateMultiple(toppingsList, language, 'en');

                if (cancelled) return;

                // Create map of original -> translated topping names
                const toppingMap = new Map<string, string>();
                toppingsList.forEach((topping, index) => {
                    toppingMap.set(topping, translatedToppingNames[index] || topping);
                });

                if (!cancelled) {
                    setTranslatedToppings(toppingMap);
                }
            } catch (error) {
                console.error('Error translating toppings:', error);
                if (!cancelled) {
                    setTranslatedToppings(new Map()); // Fallback to empty map
                }
            }
        };

        translateToppingsList();

        return () => {
            cancelled = true;
        };
    }, [language]);

    // Reset customization options when initialOptions or menuItemId changes
    // This handles switching between different items or entering edit mode
    useEffect(() => {
        if (initialOptions) {
            // Use provided initial options (edit mode)
            setSize(initialOptions.size);
            setSugar(initialOptions.sugar);
            setIce(initialOptions.ice);
            setTemperature(initialOptions.temperature ?? defaultTemperature);
            setToppings(initialOptions.toppings ? [...initialOptions.toppings] : []);
        } else {
            // Reset to defaults (add mode)
            setSize('Small');
            setSugar(100);
            setIce('Normal');
            setTemperature(defaultTemperature);
            setToppings([]);
        }
    }, [initialOptions, menuItemId, defaultTemperature]);

    // Reset quantity when initialQuantity or menuItemId changes
    useEffect(() => {
        setQuantity(initialQuantity ?? 1);
    }, [initialQuantity, menuItemId]);

    /**
     * Toggles a topping on/off
     * If topping is already selected, removes it; otherwise adds it
     * @param topping - Name of the topping to toggle
     */
    const handleToppingToggle = (topping: string) => {
        setToppings((prev) =>
            prev.includes(topping)
                ? prev.filter((t) => t !== topping) // Remove if already selected
                : [...prev, topping] // Add if not selected
        );
    };

    /**
     * Calculate current item price with all modifiers
     */
    const currentPrice = useMemo(() => {
        return calculateItemPrice(itemPrice, size, sugar, toppings);
    }, [itemPrice, size, sugar, toppings]);

    /**
     * Handles adding/updating item in cart
     * Passes current customization options and quantity to parent component
     */
    const handleAddToCart = () => {
        onAddToCart(quantity, { size, sugar, ice, temperature, toppings });
    };

    return (
        <div className="w-full max-w-6xl mx-auto">
            <div className="mb-4">
                <h2 className="text-2xl font-bold mb-2">{translatedItemName}</h2>
                <div className="flex items-baseline gap-3">
                    <p className="text-sm text-muted-foreground line-through">${itemPrice.toFixed(2)}</p>
                    <p className="text-2xl text-primary font-bold">${currentPrice.toFixed(2)}</p>
                    {currentPrice !== itemPrice && (
                        <p className="text-sm text-green-600 font-medium">
                            {formatPriceModifier(currentPrice - itemPrice)}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex gap-6">
                {/* Left side: Customizations */}
                <Card className="flex-1 p-6">
                    <div className="space-y-6">
                        <div>
                            <Label className="text-lg font-semibold mb-3 block">{t.size}</Label>
                            <RadioGroup value={size} onValueChange={(v) => setSize(v as typeof size)}>
                                <div className="flex gap-3">
                                    {(['Small', 'Medium', 'Large'] as const).map((s) => {
                                        const displaySize = translatedOptions?.sizes.get(s) || t[s.toLowerCase() as 'small' | 'medium' | 'large'];
                                        const priceModifier = SIZE_PRICING[s];
                                        return (
                                            <div key={s} className="flex items-center space-x-2 flex-1">
                                                <RadioGroupItem value={s} id={`size-${s}`} className="touch-target" />
                                                <Label htmlFor={`size-${s}`} className="cursor-pointer flex-1 text-center py-2">
                                                    <div>{displaySize}</div>
                                                    {priceModifier !== 0 && (
                                                        <div className="text-xs text-muted-foreground font-normal">
                                                            {formatPriceModifier(priceModifier)}
                                                        </div>
                                                    )}
                                                </Label>
                                            </div>
                                        );
                                    })}
                                </div>
                            </RadioGroup>
                        </div>

                        <div>
                            <Label className="text-lg font-semibold mb-3 block">{t.sugarLevel}: {sugar}%</Label>
                            <div className="flex gap-2 flex-wrap">
                                {[0, 25, 50, 75, 100, 120, 150].map((level) => {
                                    const priceModifier = SUGAR_PRICING[level as keyof typeof SUGAR_PRICING] || 0;
                                    return (
                                        <Button
                                            key={level}
                                            variant={sugar === level ? 'default' : 'outline'}
                                            onClick={() => setSugar(level)}
                                            className="flex-1 min-w-[80px] touch-target flex flex-col items-center"
                                        >
                                            <span>{level}%</span>
                                            {priceModifier > 0 && (
                                                <span className="text-xs opacity-80">
                                                    {formatPriceModifier(priceModifier)}
                                                </span>
                                            )}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>

                        {temperatureOptions.length > 0 && (
                            <div>
                                <Label className="text-lg font-semibold mb-3 block">{t.temperature || 'Temperature'}</Label>
                                <RadioGroup value={temperature} onValueChange={(v) => setTemperature(v as 'Hot' | 'Cold')}>
                                    <div className="flex gap-3">
                                        {temperatureOptions.map((temp) => (
                                            <div key={temp} className="flex items-center space-x-2 flex-1">
                                                <RadioGroupItem value={temp} id={`temp-${temp}`} className="touch-target" />
                                                <Label htmlFor={`temp-${temp}`} className="cursor-pointer flex-1 text-center py-2">
                                                    {temp}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </RadioGroup>
                            </div>
                        )}

                        <div>
                            <Label className="text-lg font-semibold mb-3 block">{t.iceLevel}</Label>
                            <RadioGroup value={ice} onValueChange={(v) => setIce(v as typeof ice)}>
                                <div className="grid grid-cols-2 gap-3">
                                    {(['No Ice', 'Less Ice', 'Normal', 'Extra Ice'] as const).map((i) => {
                                        const translationKey = i === 'No Ice' ? 'noIce' :
                                            i === 'Less Ice' ? 'lessIce' :
                                                i === 'Normal' ? 'normal' :
                                                    'extraIce';
                                        const displayIce = translatedOptions?.ice.get(i) || t[translationKey];
                                        return (
                                            <div key={i} className="flex items-center space-x-2">
                                                <RadioGroupItem value={i} id={`ice-${i}`} className="touch-target" />
                                                <Label htmlFor={`ice-${i}`} className="cursor-pointer">
                                                    {displayIce}
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
                                {toppingsList.map((topping) => {
                                    const displayTopping = translatedOptions?.toppings.get(topping) || translatedToppings.get(topping) || topping;
                                    const toppingPrice = TOPPING_PRICING[topping] || 0;
                                    return (
                                        <div key={topping} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`topping-${topping}`}
                                                checked={toppings.includes(topping)}
                                                onCheckedChange={() => handleToppingToggle(topping)}
                                                className="touch-target"
                                            />
                                            <Label htmlFor={`topping-${topping}`} className="cursor-pointer flex-1">
                                                <div className="flex items-center justify-between">
                                                    <span>{displayTopping}</span>
                                                    <span className="text-xs text-primary font-medium ml-2">
                                                        +${toppingPrice.toFixed(2)}
                                                    </span>
                                                </div>
                                            </Label>
                                        </div>
                                    );
                                })}
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
                                {isEditMode ? t.updateItem : t.addToCart}
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Right side: Nutrition info */}
                <div className="w-80 flex-shrink-0">
                    <NutritionInfoPanel menuItemId={menuItemId} menuItemName={itemName} customization={nutritionCustomization} />
                </div>
            </div>
        </div>
    );
};
