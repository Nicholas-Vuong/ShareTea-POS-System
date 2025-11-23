import { supabase } from './supabase';
import { api } from './api';
import {
  INGREDIENTS,
  getRecipeByMenuItemId,
  type DrinkSize,
  type IngredientId,
  type MacroBreakdown,
} from './nutrition-data';

export interface IngredientDetail {
  label: string;
  quantity: string;
  category: 'base' | 'sweetener' | 'topping';
}

export interface MenuItemNutritionPayload {
  menuItemId: number;
  menuItemName: string;
  servingSize: number | null;
  servingSizeUnit: string | null;
  calories: number | null;
  totalCarbohydrates: number | null;
  totalSugars: number | null;
  totalFat: number | null;
  protein: number | null;
  sourceLabel: string;
  disclaimers: string;
  usdaFdcId?: number;
  usdaDescription?: string;
  assumedRecipe?: boolean;
  size?: DrinkSize;
  sugarPercentage?: number;
  iceLevel?: CustomizationOptions['iceLevel'];
  ingredients?: IngredientDetail[];
  tags?: string[];
  notes?: string[];
}

export interface NutritionUnavailablePayload {
  menuItemId: number | string;
  menuItemName?: string;
  nutritionUnavailable: true;
  reason?: string;
}

export type NutritionResponse = MenuItemNutritionPayload | NutritionUnavailablePayload;

export interface CustomizationOptions {
  size?: DrinkSize;
  sugarPercentage?: number;
  toppings?: string[];
  iceLevel?: 'No Ice' | 'Less Ice' | 'Normal' | 'Extra Ice';
}

const TOPPING_INGREDIENT_MAP: Record<string, IngredientId> = {
  'Tapioca Pearls': 'tapioca_pearls',
  'Popping Boba': 'popping_boba',
  Jelly: 'mixed_jelly',
  Pudding: 'egg_pudding',
  'Red Bean': 'red_bean',
  'Aloe Vera': 'aloe_vera',
};

const ZERO_MACROS: MacroBreakdown = {
  calories: 0,
  carbs: 0,
  sugar: 0,
  fat: 0,
  protein: 0,
};

function addMacros(current: MacroBreakdown, delta: MacroBreakdown): MacroBreakdown {
  return {
    calories: current.calories + delta.calories,
    carbs: current.carbs + delta.carbs,
    sugar: current.sugar + delta.sugar,
    fat: current.fat + delta.fat,
    protein: current.protein + delta.protein,
  };
}

function multiplyIngredientMacros(ingredientId: IngredientId, quantity: number): MacroBreakdown {
  const ingredient = INGREDIENTS[ingredientId];
  return {
    calories: ingredient.macrosPerUnit.calories * quantity,
    carbs: ingredient.macrosPerUnit.carbs * quantity,
    sugar: ingredient.macrosPerUnit.sugar * quantity,
    fat: ingredient.macrosPerUnit.fat * quantity,
    protein: ingredient.macrosPerUnit.protein * quantity,
  };
}

function formatAmount(quantity: number): string {
  const rounded = Math.round(quantity * 10) / 10;
  if (Math.abs(rounded - Math.round(rounded)) < 0.01) {
    return String(Math.round(rounded));
  }
  return rounded.toFixed(1);
}

function formatQuantity(quantity: number, ingredientId: IngredientId): string {
  const unit = INGREDIENTS[ingredientId].unit;
  switch (unit) {
    case 'oz':
      return `${formatAmount(quantity)} oz`;
    case 'pump':
      return `${formatAmount(quantity)} pump${quantity === 1 ? '' : 's'}`;
    case 'scoop':
      return `${formatAmount(quantity)} scoop${quantity === 1 ? '' : 's'}`;
    case 'portion':
      return quantity === 1 ? '1 portion' : `${formatAmount(quantity)} portions`;
    case 'tbsp':
      return `${formatAmount(quantity)} tbsp`;
    default:
      return formatAmount(quantity);
  }
}

function roundValue(value: number): number {
  return Math.round(value * 10) / 10;
}

const DRINK_SIZES: DrinkSize[] = ['Small', 'Medium', 'Large'];
const DEFAULT_TOPPING_QUANTITY = 1;

function normalizeSize(size?: DrinkSize | string | null): DrinkSize {
  if (!size) return 'Medium';
  const match = DRINK_SIZES.find((s) => s === size);
  return match ?? 'Medium';
}

function clampSugarPercentage(value?: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 100;
  }
  return Math.min(150, Math.max(0, Math.round(value)));
}

function buildAssumedNutrition(
  menuItemId: number,
  menuItemName: string,
  customization?: CustomizationOptions
): MenuItemNutritionPayload | null {
  const recipe = getRecipeByMenuItemId(menuItemId);
  if (!recipe) {
    return null;
  }

  const size = normalizeSize(customization?.size);
  const sugarPercentage =
    customization?.sugarPercentage !== undefined
      ? clampSugarPercentage(customization.sugarPercentage)
      : recipe.defaultSugarPercentage;
  const iceLevel = customization?.iceLevel ?? 'Normal';
  const toppings = customization?.toppings ?? [];
  const profile = recipe.sizeProfiles[size];

  if (!profile) {
    return null;
  }

  let totals = { ...ZERO_MACROS };
  const ingredients: IngredientDetail[] = [];

  profile.components.forEach((componentPortion) => {
    const macros = multiplyIngredientMacros(componentPortion.ingredientId, componentPortion.quantity);
    totals = addMacros(totals, macros);
    ingredients.push({
      label: componentPortion.labelOverride ?? INGREDIENTS[componentPortion.ingredientId].label,
      quantity: formatQuantity(componentPortion.quantity, componentPortion.ingredientId),
      category: 'base',
    });
  });

  profile.sweeteners?.forEach((sweetenerPortion) => {
    const baseQuantity = sweetenerPortion.quantity;
    const quantity =
      sweetenerPortion.adjustsWithSugar === false
        ? baseQuantity
        : (baseQuantity * sugarPercentage) / 100;

    if (quantity <= 0) {
      return;
    }

    const macros = multiplyIngredientMacros(sweetenerPortion.ingredientId, quantity);
    totals = addMacros(totals, macros);
    ingredients.push({
      label: sweetenerPortion.labelOverride ?? INGREDIENTS[sweetenerPortion.ingredientId].label,
      quantity: formatQuantity(quantity, sweetenerPortion.ingredientId),
      category: 'sweetener',
    });
  });

  const extraToppings: IngredientId[] = [];
  toppings.forEach((toppingName) => {
    const ingredientId = TOPPING_INGREDIENT_MAP[toppingName];
    if (ingredientId) {
      extraToppings.push(ingredientId);
      const macros = multiplyIngredientMacros(ingredientId, DEFAULT_TOPPING_QUANTITY);
      totals = addMacros(totals, macros);
      ingredients.push({
        label: INGREDIENTS[ingredientId].label,
        quantity: formatQuantity(DEFAULT_TOPPING_QUANTITY, ingredientId),
        category: 'topping',
      });
    }
  });

  const toppingSummary = extraToppings.length
    ? `${extraToppings.length} added topping${extraToppings.length > 1 ? 's' : ''}`
    : 'no extra toppings';

  const notes: string[] = [];
  if (recipe.notes) {
    notes.push(recipe.notes);
  }
  if (sugarPercentage !== recipe.defaultSugarPercentage) {
    notes.push(`Sweetener scaled from house standard (${recipe.defaultSugarPercentage}% → ${sugarPercentage}%).`);
  }
  if (iceLevel && iceLevel !== 'Normal') {
    notes.push(`Ice preference (${iceLevel}) may slightly change dilution but not base nutrition.`);
  }
  if (extraToppings.length) {
    notes.push(`Includes ${toppingSummary}.`);
  }

  const disclaimers = [
    `Values calculated from Sharetea recipe assumptions for a ${size.toLowerCase()} (${profile.servingSizeOz} oz) at ${sugarPercentage}% sweetness and ${toppingSummary}.`,
    'Actual nutrition can vary ±10% based on steep time, ice melt, and barista pour.',
  ].join(' ');

  return {
    menuItemId,
    menuItemName,
    servingSize: profile.servingSizeOz,
    servingSizeUnit: 'oz',
    calories: roundValue(totals.calories),
    totalCarbohydrates: roundValue(totals.carbs),
    totalSugars: roundValue(totals.sugar),
    totalFat: roundValue(totals.fat),
    protein: roundValue(totals.protein),
    sourceLabel: 'Sharetea recipe assumptions',
    disclaimers,
    assumedRecipe: true,
    size,
    sugarPercentage,
    iceLevel,
    ingredients,
    tags: recipe.tags,
    notes: notes.length ? notes : undefined,
  };
}

// USDA Food Data Central API configuration
const USDA_API_KEY = import.meta.env.VITE_FOODDATA_API_KEY;
const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

// Map USDA nutrient IDs to our nutrition fields
const NUTRIENT_MAP = {
  calories: 1008,      // Energy (kcal)
  carbs: 1005,         // Carbohydrate, by difference
  sugars: 2000,        // Sugars, total including NLEA
  fat: 1004,           // Total lipid (fat)
  protein: 1003,       // Protein
} as const;

interface USDANutrient {
  nutrientId: number;
  nutrientName: string;
  value: number;
  unitName: string;
}

interface USDAFood {
  fdcId: number;
  description: string;
  foodNutrients?: USDANutrient[];
}

interface USDASearchResult {
  foods?: Array<{
    fdcId: number;
    description: string;
  }>;
}

/**
 * Validates that the USDA API key is configured
 */
function validateApiKey(): void {
  if (!USDA_API_KEY) {
    throw new Error(
      'USDA Food Data Central API key is not configured. Please set VITE_FOODDATA_API_KEY in your environment variables.'
    );
  }
}

/**
 * Searches the USDA Food Data Central API for a food item by name
 * @param query - Food name to search for
 * @returns FDC ID if found, null otherwise
 */
async function searchUSDAFood(query: string): Promise<number | null> {
  validateApiKey();

  try {
    const url = `${USDA_BASE_URL}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=1`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('USDA API rate limit exceeded. Please try again later.');
      }
      throw new Error(`USDA API search failed: ${response.status} ${response.statusText}`);
    }

    const data: USDASearchResult = await response.json();
    
    if (data.foods && data.foods.length > 0) {
      return data.foods[0].fdcId;
    }

    return null;
  } catch (error: any) {
    if (error.message.includes('rate limit')) {
      throw error;
    }
    console.error('USDA search error:', error);
    throw new Error(`Failed to search USDA database: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Fetches detailed nutrition information for a specific FDC ID
 * @param fdcId - Food Data Central ID
 * @returns USDA food data with nutrition information
 */
async function getUSDAFoodDetails(fdcId: number): Promise<USDAFood> {
  validateApiKey();

  try {
    const url = `${USDA_BASE_URL}/food/${fdcId}?api_key=${USDA_API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('USDA API rate limit exceeded. Please try again later.');
      }
      if (response.status === 404) {
        throw new Error(`Food with FDC ID ${fdcId} not found in USDA database`);
      }
      throw new Error(`USDA API request failed: ${response.status} ${response.statusText}`);
    }

    const data: USDAFood = await response.json();
    return data;
  } catch (error: any) {
    if (error.message.includes('rate limit') || error.message.includes('not found')) {
      throw error;
    }
    console.error('USDA food details error:', error);
    throw new Error(`Failed to fetch USDA food details: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Extracts a specific nutrient value from USDA food data
 * @param food - USDA food data
 * @param nutrientId - USDA nutrient ID to extract
 * @returns Nutrient value or null if not found
 */
function extractNutrient(food: USDAFood, nutrientId: number): number | null {
  if (!food.foodNutrients || food.foodNutrients.length === 0) {
    return null;
  }

  const nutrient = food.foodNutrients.find((n) => n.nutrientId === nutrientId);
  return nutrient?.value ?? null;
}

/**
 * Fetches nutrition information for a menu item using assumed recipes first,
 * falling back to the USDA Food Data Central API when necessary.
 */
export async function fetchMenuItemNutrition(
  menuItemId: string,
  customization?: CustomizationOptions
): Promise<NutritionResponse> {
  try {
    const parsedId = parseInt(menuItemId, 10);

    // Get menu item from Supabase (including usda_fdc_id if it exists)
    const { data: menuItem, error: menuError } = await supabase
      .from('menu_items')
      .select('menu_item_id, name, usda_fdc_id')
      .eq('menu_item_id', parseInt(menuItemId))
      .single();

    if (menuError || !menuItem) {
      return {
        menuItemId,
        nutritionUnavailable: true,
        reason: 'Menu item not found',
      };
    }

    // First attempt to use our in-house recipe assumptions
    const assumedNutrition = buildAssumedNutrition(menuItem.menu_item_id, menuItem.name, customization);
    if (assumedNutrition) {
      return assumedNutrition;
    }

    // If we reach this point we need to pull data from USDA
    if (!USDA_API_KEY) {
      return {
        menuItemId: parsedId,
        menuItemName: menuItem.name,
        nutritionUnavailable: true,
        reason:
          'No local recipe assumptions available and USDA API key not configured. Please set VITE_FOODDATA_API_KEY in environment variables.',
      };
    }

    // Try to get or find USDA FDC ID
    let fdcId = menuItem.usda_fdc_id;

    // If no FDC ID stored, search USDA API by menu item name
    if (!fdcId) {
      try {
        fdcId = await searchUSDAFood(menuItem.name);
        
        if (!fdcId) {
          return {
            menuItemId: parseInt(menuItemId),
            menuItemName: menuItem.name,
            nutritionUnavailable: true,
            reason: 'No matching food found in USDA database. Try searching with a more specific name.',
          };
        }

        // Store the FDC ID in database for future use
        try {
          await api.updateMenuItemFdcId(menuItemId, fdcId);
        } catch (updateError) {
          // Log but don't fail - we can still use the FDC ID for this request
          console.warn('Failed to save USDA FDC ID to database:', updateError);
        }
      } catch (searchError: any) {
        return {
          menuItemId: parseInt(menuItemId),
          menuItemName: menuItem.name,
          nutritionUnavailable: true,
          reason: searchError.message || 'Failed to search USDA database',
        };
      }
    }

    // Fetch detailed nutrition data from USDA
    let foodData: USDAFood;
    try {
      foodData = await getUSDAFoodDetails(fdcId);
    } catch (detailsError: any) {
      // If FDC ID is invalid, clear it from database and return unavailable
      if (detailsError.message.includes('not found')) {
        try {
          await api.updateMenuItemFdcId(menuItemId, null);
        } catch {
          // Ignore update errors
        }
      }
      return {
        menuItemId: parseInt(menuItemId),
        menuItemName: menuItem.name,
        nutritionUnavailable: true,
        reason: detailsError.message || 'Failed to fetch nutrition details from USDA',
      };
    }

    // Transform USDA data to match our interface
    const response: MenuItemNutritionPayload = {
      menuItemId: parseInt(menuItemId),
      menuItemName: menuItem.name,
      usdaFdcId: fdcId,
      usdaDescription: foodData.description,
      servingSize: 100, // USDA provides nutrition per 100g/ml
      servingSizeUnit: 'g',
      calories: extractNutrient(foodData, NUTRIENT_MAP.calories),
      totalCarbohydrates: extractNutrient(foodData, NUTRIENT_MAP.carbs),
      totalSugars: extractNutrient(foodData, NUTRIENT_MAP.sugars),
      totalFat: extractNutrient(foodData, NUTRIENT_MAP.fat),
      protein: extractNutrient(foodData, NUTRIENT_MAP.protein),
      sourceLabel: 'USDA FoodData Central',
      disclaimers: 'Nutrition values are per 100g/ml. Actual serving sizes may vary. Values are estimates and may not match store-specific recipes.',
    };

    return response;
  } catch (error: any) {
    console.error('Nutrition fetch error:', error);
    return {
      menuItemId,
      nutritionUnavailable: true,
      reason: error.message || 'An unexpected error occurred while fetching nutrition information',
    };
  }
}
