import { useQuery } from '@tanstack/react-query';
import { fetchMenuItemNutrition, type CustomizationOptions, type NutritionResponse } from '@/lib/nutrition';

interface UseNutritionInfoOptions {
  enabled?: boolean;
  customization?: CustomizationOptions;
}

export function useNutritionInfo(
  menuItemId?: string | number,
  options?: UseNutritionInfoOptions
) {
  const customizationKey = options?.customization
    ? [
        options.customization.size ?? null,
        options.customization.sugarPercentage ?? null,
        options.customization.iceLevel ?? null,
        options.customization.toppings ? [...options.customization.toppings].sort().join('|') : '',
      ]
    : null;

  return useQuery<NutritionResponse>({
    queryKey: ['nutrition', menuItemId, customizationKey],
    queryFn: async () => {
      if (!menuItemId) {
        throw new Error('menuItemId is required to fetch nutrition info');
      }
      return fetchMenuItemNutrition(String(menuItemId), options?.customization);
    },
    enabled: Boolean(menuItemId) && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });
}

