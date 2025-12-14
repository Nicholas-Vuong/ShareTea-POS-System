/**
 * Pricing configuration for menu item customizations
 * All prices are in USD
 */

/**
 * Size pricing modifiers
 * Small: -$0.50, Medium: base price, Large: +$0.75
 */
export const SIZE_PRICING = {
  Small: -0.50,
  Medium: 0.00,
  Large: 0.75,
} as const;

/**
 * Sugar level pricing
 * Extra sugar levels (120%, 150%) have additional cost
 */
export const SUGAR_PRICING = {
  0: 0.00,
  25: 0.00,
  50: 0.00,
  75: 0.00,
  100: 0.00,
  120: 0.25,  // Extra sugar +$0.25
  150: 0.50,  // Extra extra sugar +$0.50
} as const;

/**
 * Topping pricing
 * Each topping adds to the base price
 */
export const TOPPING_PRICING: Record<string, number> = {
  'Tapioca Pearls': 0.75,
  'Popping Boba': 0.75,
  'Jelly': 0.65,
  'Pudding': 0.85,
  'Red Bean': 0.75,
  'Aloe Vera': 0.65,
};

/**
 * Calculate total price for a customized item
 * @param basePrice - Base price of the menu item
 * @param size - Size selection
 * @param sugar - Sugar percentage
 * @param toppings - Array of topping names
 * @returns Total price including all modifiers
 */
export function calculateItemPrice(
  basePrice: number,
  size: 'Small' | 'Medium' | 'Large',
  sugar: number,
  toppings: string[]
): number {
  let total = basePrice;
  
  // Add size modifier
  total += SIZE_PRICING[size] || 0;
  
  // Add sugar modifier
  total += SUGAR_PRICING[sugar as keyof typeof SUGAR_PRICING] || 0;
  
  // Add topping costs
  toppings.forEach(topping => {
    total += TOPPING_PRICING[topping] || 0;
  });
  
  return Math.max(0, total); // Ensure price is never negative
}

/**
 * Get formatted price string with modifier
 * @param modifier - Price modifier (can be negative)
 * @returns Formatted string like "+$0.75" or "-$0.50"
 */
export function formatPriceModifier(modifier: number): string {
  if (modifier === 0) return '';
  const sign = modifier > 0 ? '+' : '';
  return `${sign}$${modifier.toFixed(2)}`;
}

/**
 * Get formatted price string
 * @param price - Price value
 * @returns Formatted string like "$5.25"
 */
export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}



