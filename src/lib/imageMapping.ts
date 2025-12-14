/**
 * Image mapping utility for menu items
 * Maps menu item names to their corresponding image paths
 * Images are stored in public/images/ directory
 */

/**
 * Maps menu item names to image file paths
 * Handles variations in naming (case-insensitive, spaces, etc.)
 */
export function getMenuItemImage(itemName: string, category?: string): string | null {
  // Normalize the item name for matching (lowercase, remove special chars)
  const normalizedName = itemName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .trim();

  // Category-based mapping
  const categoryMap: Record<string, Record<string, string>> = {
    'Fresh Brew': {
      'classic_tea': '/images/Fresh Brew/classic_tea.png',
      'honey_tea': '/images/Fresh Brew/honey_tea.png',
    },
    'Fruity Beverage': {
      'berry_lychee_burst': '/images/Fruity Beverage/berry_lychee_burst.png',
      'honey_lemonade': '/images/Fruity Beverage/honey_lemonade.png',
      'mango_green_tea': '/images/Fruity Beverage/mango_green_tea.png',
      'mango_passion_fruit_tea': '/images/Fruity Beverage/mango_passion_fruit_tea.png',
      'passion_chess': '/images/Fruity Beverage/passion_chess.png',
      'peach_tea': '/images/Fruity Beverage/peach_tea.png',
    },
    'Iced Blended': {
      'lava_flow': '/images/Iced Blended/lava_flow.png',
      'mango_ice_blended': '/images/Iced Blended/mango_ice_blended.png',
      'oreo_ice_blended': '/images/Iced Blended/oreo_ice_blended.png',
      'peach_tea_ice_blended': '/images/Iced Blended/peach_tea_ice_blended.png',
      'strawberry_ice_blended': '/images/Iced Blended/strawberry_ice_blended.png',
      'thai_tea_ice_blended': '/images/Iced Blended/thai_tea_ice_blended.png',
      'taro_ice_blended': '/images/Iced Blended/taro_ice_blended.png',
      'coffee_ice_blended': '/images/Iced Blended/coffee_ice_blended.png',
    },
    'Milky Series': {
      'classic_pearl_milk_tea': '/images/Milky Series/classic_pearl_milk_tea.png',
      'coconut_pearl_milk_tea': '/images/Milky Series/coconut_pearl_milk_tea.png',
      'coffee_creama': '/images/Milky Series/coffee_creama.png',
      'coffee_milk_tea': '/images/Milky Series/coffee_milk_tea.png',
      'golden_retriever': '/images/Milky Series/golden_retriever.png',
      'hokkaido_pearl_milk_tea': '/images/Milky Series/hokkaido_pearl_milk_tea.png',
      'honey_pearl_milk_tea': '/images/Milky Series/honey_pearl_milk_tea.png',
      'mango_green_milk_tea': '/images/Milky Series/mango_green_milk_tea.png',
      'taro_pearl_milk_tea': '/images/Milky Series/taro_pearl_milk_tea.png',
      'thai_pearl_milk_tea': '/images/Milky Series/thai_pearl_milk_tea.png',
    },
    'New Matcha Series': {
      'mango_matcha_fresh_milk': '/images/New Matcha Series/mango_matcha_fresh_milk.png',
      'matcha_fresh_milk': '/images/New Matcha Series/matcha_fresh_milk.png',
      'matcha_ice_blended': '/images/New Matcha Series/matcha_ice_blended.png',
      'matcha_pearl_milk_tea': '/images/New Matcha Series/matcha_pearl_milk_tea.png',
      'strawberry_matcha_fresh_milk': '/images/New Matcha Series/strawberry_matcha_fresh_milk.png',
    },
    'Non Caffeinated': {
      'halo_halo_ice_blended': '/images/Non Caffeinated/halo_halo_ice_blended.png',
      'halo_halo': '/images/Non Caffeinated/halo_halo.png',
      'strawberry_coconut_ice_blended': '/images/Non Caffeinated/strawberry_coconut_ice_blended.png',
      'strawberry_coconut': '/images/Non Caffeinated/strawberry_coconut.png',
      'tiger_boba': '/images/Non Caffeinated/tiger_boba.png',
      'wintermelon_fresh_milk': '/images/Non Caffeinated/wintermelon_fresh_milk.png',
      'wintermelon_lemonade_ice_blended': '/images/Non Caffeinated/wintermelon_lemonade_ice_blended.png',
      'wintermelon_lemonade': '/images/Non Caffeinated/wintermelon_lemonade.png',
    },
  };

  // If category is provided, search within that category first
  if (category && categoryMap[category]) {
    const categoryImages = categoryMap[category];
    
    // Try exact match first
    if (categoryImages[normalizedName]) {
      return categoryImages[normalizedName];
    }
    
    // Try partial matches (contains)
    for (const [key, path] of Object.entries(categoryImages)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return path;
      }
    }
  }

  // Search across all categories
  for (const [cat, images] of Object.entries(categoryMap)) {
    // Try exact match
    if (images[normalizedName]) {
      return images[normalizedName];
    }
    
    // Try partial matches
    for (const [key, path] of Object.entries(images)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return path;
      }
    }
  }

  // Return null if no match found
  return null;
}

