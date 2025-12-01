/**
 * React hook for fetching nutrition information for menu items
 * Uses React Query for caching and automatic refetching
 * Supports customization options that affect nutrition calculations
 */
import { useQuery } from '@tanstack/react-query';
import { fetchMenuItemNutrition, type CustomizationOptions, type NutritionResponse } from '@/lib/nutrition';

/**
 * Options for the useNutritionInfo hook
 */
interface UseNutritionInfoOptions {
  enabled?: boolean; // Whether the query should run
  customization?: CustomizationOptions; // Customization options that affect nutrition
}

/**
 * Hook to fetch nutrition information for a menu item
 * Automatically caches results and refetches when customization changes
 * 
 * @param menuItemId - ID of the menu item to fetch nutrition for
 * @param options - Optional configuration including customization options
 * @returns React Query result with nutrition data
 */
export function useNutritionInfo(
  menuItemId?: string | number,
  options?: UseNutritionInfoOptions
) {
  // Create a cache key from customization options
  // Sorted toppings ensure same toppings in different order use same cache
  const customizationKey = options?.customization
    ? [
        options.customization.size ?? null,
        options.customization.sugarPercentage ?? null,
        options.customization.iceLevel ?? null,
        options.customization.toppings ? [...options.customization.toppings].sort().join('|') : '',
      ]
    : null;

  return useQuery<NutritionResponse>({
    queryKey: ['nutrition', menuItemId, customizationKey], // Cache key includes customization
    queryFn: async () => {
      if (!menuItemId) {
        throw new Error('menuItemId is required to fetch nutrition info');
      }
      return fetchMenuItemNutrition(String(menuItemId), options?.customization);
    },
    enabled: Boolean(menuItemId) && (options?.enabled ?? true), // Only run if menuItemId provided
    staleTime: 1000 * 60 * 30, // Data considered fresh for 30 minutes
    gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour after last use
  });
}

