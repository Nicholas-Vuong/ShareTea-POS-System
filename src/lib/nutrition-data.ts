import type { MenuItem } from '@/lib/api';

export type DrinkSize = 'Small' | 'Medium' | 'Large';

export interface MacroBreakdown {
  calories: number;
  carbs: number;
  sugar: number;
  fat: number;
  protein: number;
}

export interface IngredientDefinition {
  id: IngredientId;
  label: string;
  unit: 'oz' | 'pump' | 'scoop' | 'tbsp' | 'portion';
  macrosPerUnit: MacroBreakdown;
  allergenNotes?: string[];
  caffeine?: boolean;
}

export type IngredientId =
  | 'black_tea'
  | 'green_tea'
  | 'oolong_tea'
  | 'coffee_concentrate'
  | 'espresso_shot'
  | 'fresh_milk'
  | 'whole_milk'
  | 'non_dairy_creamer'
  | 'half_half'
  | 'coconut_milk'
  | 'coconut_cream'
  | 'condensed_milk'
  | 'cream_foam'
  | 'cheese_foam'
  | 'sea_salt_foam'
  | 'taro_paste'
  | 'hokkaido_powder'
  | 'mango_puree'
  | 'passionfruit_puree'
  | 'strawberry_puree'
  | 'lychee_puree'
  | 'berry_compote'
  | 'peach_puree'
  | 'lemonade_base'
  | 'honey_syrup'
  | 'cane_syrup'
  | 'brown_sugar_syrup'
  | 'wintermelon_syrup'
  | 'matcha_concentrate'
  | 'thai_tea_concentrate'
  | 'coffee_jelly'
  | 'honey_jelly'
  | 'lychee_jelly'
  | 'tapioca_pearls'
  | 'popping_boba'
  | 'mixed_jelly'
  | 'egg_pudding'
  | 'red_bean'
  | 'aloe_vera'
  | 'coconut_jelly'
  | 'ice_cream'
  | 'oreo_crumble'
  | 'ube_halaya'
  | 'halo_halo_mix'
  | 'smoothie_base'
  | 'strawberry_coconut_base'
  | 'mango_ice_blend'
  | 'strawberry_ice_blend'
  | 'peach_ice_blend'
  | 'coconut_water'
  | 'yogurt_base'
  | 'dragonfruit_puree'
  | 'pumpkin_spice_syrup'
  | 'cinnamon_gingerbread_syrup'
  | 'peppermint_syrup'
  | 'chocolate_syrup'
  | 'marshmallow_syrup'
  | 'vanilla_almond_syrup'
  | 'graham_cracker_crumble';

export const INGREDIENTS: Record<IngredientId, IngredientDefinition> = {
  black_tea: {
    id: 'black_tea',
    label: 'Brewed black tea',
    unit: 'oz',
    macrosPerUnit: { calories: 1, carbs: 0.2, sugar: 0, fat: 0, protein: 0 },
    caffeine: true,
  },
  green_tea: {
    id: 'green_tea',
    label: 'Jasmine green tea',
    unit: 'oz',
    macrosPerUnit: { calories: 1, carbs: 0.1, sugar: 0, fat: 0, protein: 0 },
    caffeine: true,
  },
  oolong_tea: {
    id: 'oolong_tea',
    label: 'Roasted oolong tea',
    unit: 'oz',
    macrosPerUnit: { calories: 1, carbs: 0.1, sugar: 0, fat: 0, protein: 0 },
    caffeine: true,
  },
  coffee_concentrate: {
    id: 'coffee_concentrate',
    label: 'Cold brew concentrate',
    unit: 'oz',
    macrosPerUnit: { calories: 5, carbs: 0, sugar: 0, fat: 0, protein: 0 },
    caffeine: true,
  },
  espresso_shot: {
    id: 'espresso_shot',
    label: 'Pulled espresso',
    unit: 'oz',
    macrosPerUnit: { calories: 3, carbs: 0, sugar: 0, fat: 0, protein: 0.3 },
    caffeine: true,
  },
  fresh_milk: {
    id: 'fresh_milk',
    label: '2% fresh milk',
    unit: 'oz',
    macrosPerUnit: { calories: 15, carbs: 1.2, sugar: 1.2, fat: 0.6, protein: 1 },
    allergenNotes: ['dairy'],
  },
  whole_milk: {
    id: 'whole_milk',
    label: 'Whole milk',
    unit: 'oz',
    macrosPerUnit: { calories: 18, carbs: 1.4, sugar: 1.4, fat: 1, protein: 0.9 },
    allergenNotes: ['dairy'],
  },
  non_dairy_creamer: {
    id: 'non_dairy_creamer',
    label: 'Non-dairy creamer',
    unit: 'oz',
    macrosPerUnit: { calories: 45, carbs: 5, sugar: 3.5, fat: 2.5, protein: 0.2 },
    allergenNotes: ['soy'],
  },
  half_half: {
    id: 'half_half',
    label: 'Half & half',
    unit: 'oz',
    macrosPerUnit: { calories: 20, carbs: 1, sugar: 1, fat: 1.7, protein: 0.6 },
    allergenNotes: ['dairy'],
  },
  coconut_milk: {
    id: 'coconut_milk',
    label: 'Coconut milk',
    unit: 'oz',
    macrosPerUnit: { calories: 45, carbs: 4, sugar: 2, fat: 4, protein: 0.4 },
    allergenNotes: ['tree nut'],
  },
  coconut_cream: {
    id: 'coconut_cream',
    label: 'Coconut cream',
    unit: 'oz',
    macrosPerUnit: { calories: 65, carbs: 3, sugar: 3, fat: 6, protein: 0.5 },
    allergenNotes: ['tree nut'],
  },
  condensed_milk: {
    id: 'condensed_milk',
    label: 'Sweetened condensed milk',
    unit: 'oz',
    macrosPerUnit: { calories: 60, carbs: 10, sugar: 10, fat: 1.7, protein: 1.5 },
    allergenNotes: ['dairy'],
  },
  cream_foam: {
    id: 'cream_foam',
    label: 'House cream foam',
    unit: 'oz',
    macrosPerUnit: { calories: 90, carbs: 4, sugar: 4, fat: 7, protein: 2 },
    allergenNotes: ['dairy'],
  },
  cheese_foam: {
    id: 'cheese_foam',
    label: 'Cheese cream cap',
    unit: 'oz',
    macrosPerUnit: { calories: 80, carbs: 3, sugar: 3, fat: 6, protein: 3 },
    allergenNotes: ['dairy'],
  },
  sea_salt_foam: {
    id: 'sea_salt_foam',
    label: 'Sea salt cream',
    unit: 'oz',
    macrosPerUnit: { calories: 70, carbs: 3, sugar: 3, fat: 5, protein: 2 },
    allergenNotes: ['dairy'],
  },
  taro_paste: {
    id: 'taro_paste',
    label: 'Taro paste',
    unit: 'oz',
    macrosPerUnit: { calories: 70, carbs: 13, sugar: 6, fat: 1, protein: 1 },
  },
  hokkaido_powder: {
    id: 'hokkaido_powder',
    label: 'Hokkaido caramel powder',
    unit: 'oz',
    macrosPerUnit: { calories: 65, carbs: 12, sugar: 9, fat: 1.5, protein: 1 },
  },
  mango_puree: {
    id: 'mango_puree',
    label: 'Mango purée',
    unit: 'oz',
    macrosPerUnit: { calories: 18, carbs: 4.5, sugar: 4, fat: 0.1, protein: 0.2 },
  },
  passionfruit_puree: {
    id: 'passionfruit_puree',
    label: 'Passion fruit purée',
    unit: 'oz',
    macrosPerUnit: { calories: 20, carbs: 5, sugar: 4.5, fat: 0.1, protein: 0.2 },
  },
  strawberry_puree: {
    id: 'strawberry_puree',
    label: 'Strawberry purée',
    unit: 'oz',
    macrosPerUnit: { calories: 16, carbs: 4, sugar: 3.5, fat: 0.1, protein: 0.3 },
  },
  lychee_puree: {
    id: 'lychee_puree',
    label: 'Lychee purée',
    unit: 'oz',
    macrosPerUnit: { calories: 18, carbs: 4.5, sugar: 4, fat: 0.1, protein: 0.2 },
  },
  berry_compote: {
    id: 'berry_compote',
    label: 'Mixed berry compote',
    unit: 'oz',
    macrosPerUnit: { calories: 22, carbs: 5.5, sugar: 5, fat: 0.1, protein: 0.2 },
  },
  peach_puree: {
    id: 'peach_puree',
    label: 'Peach purée',
    unit: 'oz',
    macrosPerUnit: { calories: 17, carbs: 4.2, sugar: 4, fat: 0, protein: 0.2 },
  },
  lemonade_base: {
    id: 'lemonade_base',
    label: 'House lemonade base',
    unit: 'oz',
    macrosPerUnit: { calories: 15, carbs: 3.8, sugar: 3.6, fat: 0, protein: 0 },
  },
  honey_syrup: {
    id: 'honey_syrup',
    label: 'Honey syrup (per pump)',
    unit: 'pump',
    macrosPerUnit: { calories: 22, carbs: 5.5, sugar: 5.5, fat: 0, protein: 0 },
  },
  cane_syrup: {
    id: 'cane_syrup',
    label: 'Cane sugar syrup (per pump)',
    unit: 'pump',
    macrosPerUnit: { calories: 25, carbs: 6.5, sugar: 6.5, fat: 0, protein: 0 },
  },
  brown_sugar_syrup: {
    id: 'brown_sugar_syrup',
    label: 'Brown sugar syrup (per pump)',
    unit: 'pump',
    macrosPerUnit: { calories: 30, carbs: 7.5, sugar: 7.5, fat: 0, protein: 0 },
  },
  wintermelon_syrup: {
    id: 'wintermelon_syrup',
    label: 'Wintermelon syrup (per pump)',
    unit: 'pump',
    macrosPerUnit: { calories: 28, carbs: 7, sugar: 7, fat: 0, protein: 0 },
  },
  matcha_concentrate: {
    id: 'matcha_concentrate',
    label: 'Matcha concentrate',
    unit: 'oz',
    macrosPerUnit: { calories: 22, carbs: 4, sugar: 1, fat: 0.3, protein: 1.2 },
    caffeine: true,
  },
  thai_tea_concentrate: {
    id: 'thai_tea_concentrate',
    label: 'Thai tea concentrate',
    unit: 'oz',
    macrosPerUnit: { calories: 40, carbs: 9, sugar: 8, fat: 0.5, protein: 1 },
    caffeine: true,
  },
  coffee_jelly: {
    id: 'coffee_jelly',
    label: 'Coffee jelly',
    unit: 'scoop',
    macrosPerUnit: { calories: 45, carbs: 11, sugar: 10, fat: 0, protein: 1 },
    caffeine: true,
  },
  honey_jelly: {
    id: 'honey_jelly',
    label: 'Honey jelly',
    unit: 'scoop',
    macrosPerUnit: { calories: 80, carbs: 19, sugar: 16, fat: 0, protein: 0 },
  },
  lychee_jelly: {
    id: 'lychee_jelly',
    label: 'Lychee jelly',
    unit: 'scoop',
    macrosPerUnit: { calories: 70, carbs: 17, sugar: 14, fat: 0, protein: 0 },
  },
  tapioca_pearls: {
    id: 'tapioca_pearls',
    label: 'Tapioca pearls',
    unit: 'scoop',
    macrosPerUnit: { calories: 130, carbs: 31, sugar: 14, fat: 0, protein: 0 },
  },
  popping_boba: {
    id: 'popping_boba',
    label: 'Popping boba',
    unit: 'scoop',
    macrosPerUnit: { calories: 90, carbs: 22, sugar: 18, fat: 0, protein: 0 },
  },
  mixed_jelly: {
    id: 'mixed_jelly',
    label: 'Mixed fruit jelly',
    unit: 'scoop',
    macrosPerUnit: { calories: 65, carbs: 16, sugar: 13, fat: 0, protein: 0 },
  },
  egg_pudding: {
    id: 'egg_pudding',
    label: 'Egg pudding',
    unit: 'scoop',
    macrosPerUnit: { calories: 110, carbs: 16, sugar: 14, fat: 3, protein: 3 },
    allergenNotes: ['egg', 'dairy'],
  },
  red_bean: {
    id: 'red_bean',
    label: 'Sweet red bean',
    unit: 'scoop',
    macrosPerUnit: { calories: 100, carbs: 21, sugar: 12, fat: 0.5, protein: 5 },
  },
  aloe_vera: {
    id: 'aloe_vera',
    label: 'Aloe vera cubes',
    unit: 'scoop',
    macrosPerUnit: { calories: 30, carbs: 7, sugar: 5, fat: 0, protein: 0 },
  },
  coconut_jelly: {
    id: 'coconut_jelly',
    label: 'Coconut jelly',
    unit: 'scoop',
    macrosPerUnit: { calories: 80, carbs: 20, sugar: 17, fat: 0, protein: 0 },
  },
  ice_cream: {
    id: 'ice_cream',
    label: 'Vanilla ice cream',
    unit: 'scoop',
    macrosPerUnit: { calories: 140, carbs: 16, sugar: 14, fat: 7, protein: 3 },
    allergenNotes: ['dairy'],
  },
  oreo_crumble: {
    id: 'oreo_crumble',
    label: 'Oreo crumble',
    unit: 'scoop',
    macrosPerUnit: { calories: 60, carbs: 10, sugar: 7, fat: 2.5, protein: 1 },
    allergenNotes: ['gluten'],
  },
  ube_halaya: {
    id: 'ube_halaya',
    label: 'Ube halaya',
    unit: 'oz',
    macrosPerUnit: { calories: 85, carbs: 15, sugar: 10, fat: 2, protein: 1 },
  },
  halo_halo_mix: {
    id: 'halo_halo_mix',
    label: 'Halo-halo mix-ins',
    unit: 'portion',
    macrosPerUnit: { calories: 180, carbs: 35, sugar: 25, fat: 5, protein: 3 },
  },
  smoothie_base: {
    id: 'smoothie_base',
    label: 'Creamy smoothie base',
    unit: 'oz',
    macrosPerUnit: { calories: 35, carbs: 6, sugar: 5, fat: 1, protein: 1 },
    allergenNotes: ['dairy'],
  },
  strawberry_coconut_base: {
    id: 'strawberry_coconut_base',
    label: 'Strawberry coconut base',
    unit: 'oz',
    macrosPerUnit: { calories: 40, carbs: 7, sugar: 6, fat: 1.5, protein: 0.5 },
    allergenNotes: ['tree nut'],
  },
  mango_ice_blend: {
    id: 'mango_ice_blend',
    label: 'Mango ice blend',
    unit: 'oz',
    macrosPerUnit: { calories: 32, carbs: 7.5, sugar: 6.5, fat: 0.2, protein: 0.2 },
  },
  strawberry_ice_blend: {
    id: 'strawberry_ice_blend',
    label: 'Strawberry ice blend',
    unit: 'oz',
    macrosPerUnit: { calories: 30, carbs: 7, sugar: 6, fat: 0.1, protein: 0.2 },
  },
  peach_ice_blend: {
    id: 'peach_ice_blend',
    label: 'Peach ice blend',
    unit: 'oz',
    macrosPerUnit: { calories: 28, carbs: 6.5, sugar: 6, fat: 0, protein: 0.1 },
  },
  coconut_water: {
    id: 'coconut_water',
    label: 'Coconut water',
    unit: 'oz',
    macrosPerUnit: { calories: 5, carbs: 1.2, sugar: 1, fat: 0, protein: 0 },
  },
  yogurt_base: {
    id: 'yogurt_base',
    label: 'Yogurt base',
    unit: 'oz',
    macrosPerUnit: { calories: 30, carbs: 4, sugar: 3.5, fat: 0.5, protein: 1.5 },
    allergenNotes: ['dairy'],
  },
  dragonfruit_puree: {
    id: 'dragonfruit_puree',
    label: 'Dragonfruit purée',
    unit: 'oz',
    macrosPerUnit: { calories: 18, carbs: 4, sugar: 3, fat: 0.2, protein: 0.3 },
  },
  pumpkin_spice_syrup: {
    id: 'pumpkin_spice_syrup',
    label: 'Pumpkin spice syrup (per pump)',
    unit: 'pump',
    macrosPerUnit: { calories: 28, carbs: 7, sugar: 6.5, fat: 0.1, protein: 0 },
  },
  cinnamon_gingerbread_syrup: {
    id: 'cinnamon_gingerbread_syrup',
    label: 'Cinnamon gingerbread syrup (per pump)',
    unit: 'pump',
    macrosPerUnit: { calories: 26, carbs: 6.5, sugar: 6, fat: 0.1, protein: 0 },
  },
  peppermint_syrup: {
    id: 'peppermint_syrup',
    label: 'Peppermint syrup (per pump)',
    unit: 'pump',
    macrosPerUnit: { calories: 24, carbs: 6, sugar: 6, fat: 0, protein: 0 },
  },
  chocolate_syrup: {
    id: 'chocolate_syrup',
    label: 'Chocolate syrup (per pump)',
    unit: 'pump',
    macrosPerUnit: { calories: 35, carbs: 8, sugar: 7, fat: 0.5, protein: 0.5 },
  },
  marshmallow_syrup: {
    id: 'marshmallow_syrup',
    label: 'Marshmallow syrup (per pump)',
    unit: 'pump',
    macrosPerUnit: { calories: 32, carbs: 8, sugar: 7.5, fat: 0, protein: 0 },
  },
  vanilla_almond_syrup: {
    id: 'vanilla_almond_syrup',
    label: 'Vanilla almond syrup (per pump)',
    unit: 'pump',
    macrosPerUnit: { calories: 27, carbs: 6.5, sugar: 6.5, fat: 0.1, protein: 0 },
    allergenNotes: ['tree nut'],
  },
  graham_cracker_crumble: {
    id: 'graham_cracker_crumble',
    label: 'Graham cracker crumble',
    unit: 'scoop',
    macrosPerUnit: { calories: 55, carbs: 9, sugar: 4, fat: 1.5, protein: 1 },
    allergenNotes: ['gluten'],
  },
};

export interface ComponentInput {
  ingredientId: IngredientId;
  quantity: number;
  labelOverride?: string;
  scalesWithSize?: boolean;
}

export interface SweetenerInput extends ComponentInput {
  adjustsWithSugar?: boolean;
}

export interface SizeProfile {
  servingSizeOz: number;
  components: ComponentInput[];
  sweeteners?: SweetenerInput[];
}

export interface ComputedRecipe {
  menuItemId: number;
  name: string;
  category: string;
  description: string;
  notes?: string;
  tags?: string[];
  baseServingOz: number;
  sizeProfiles: Record<DrinkSize, SizeProfile>;
  defaultSugarPercentage: number;
}

interface RecipeConfig {
  menuItemId: number;
  name: string;
  category: string;
  description: string;
  baseServingOz?: number;
  defaultSugarPercentage?: number;
  components: ComponentInput[];
  sweeteners?: SweetenerInput[];
  notes?: string;
  tags?: string[];
}

const SIZE_MULTIPLIERS: Record<DrinkSize, number> = {
  Small: 0.82,
  Medium: 1,
  Large: 1.28,
};

function scaleQuantity(quantity: number, multiplier: number, scalesWithSize = true) {
  return scalesWithSize ? +(quantity * multiplier).toFixed(2) : quantity;
}

function buildSizeProfiles(config: RecipeConfig): Record<DrinkSize, SizeProfile> {
  const baseServing = config.baseServingOz ?? 22;
  const profiles = {} as Record<DrinkSize, SizeProfile>;

  (Object.keys(SIZE_MULTIPLIERS) as DrinkSize[]).forEach((size) => {
    const multiplier = SIZE_MULTIPLIERS[size];
    profiles[size] = {
      servingSizeOz: Math.round(baseServing * multiplier),
      components: config.components.map((component) => ({
        ...component,
        quantity: scaleQuantity(component.quantity, multiplier, component.scalesWithSize !== false),
      })),
      sweeteners: config.sweeteners?.map((sweetener) => ({
        ...sweetener,
        quantity: scaleQuantity(sweetener.quantity, multiplier, sweetener.scalesWithSize !== false),
      })),
    };
  });

  return profiles;
}

const component = (
  ingredientId: IngredientId,
  quantity: number,
  options?: Partial<Pick<ComponentInput, 'labelOverride' | 'scalesWithSize'>>
): ComponentInput => ({
  ingredientId,
  quantity,
  labelOverride: options?.labelOverride,
  scalesWithSize: options?.scalesWithSize,
});

const sweetener = (
  ingredientId: IngredientId,
  quantity: number,
  options?: Partial<Pick<SweetenerInput, 'labelOverride' | 'scalesWithSize' | 'adjustsWithSugar'>>
): SweetenerInput => ({
  ingredientId,
  quantity,
  labelOverride: options?.labelOverride,
  scalesWithSize: options?.scalesWithSize,
  adjustsWithSugar: options?.adjustsWithSugar ?? true,
});

const RECIPE_CONFIGS: RecipeConfig[] = [
  {
    menuItemId: 1,
    name: 'Classic Pearl Milk Tea',
    category: 'Milky Series',
    description: 'Black tea shaken with non-dairy creamer and caramelized tapioca pearls.',
    components: [
      component('black_tea', 12),
      component('non_dairy_creamer', 6),
      component('tapioca_pearls', 1.5),
    ],
    sweeteners: [sweetener('cane_syrup', 4)],
    notes: 'Assumes classic Sharetea medium recipe with 50% ice.',
    tags: ['boba', 'contains soy', 'contains caffeine'],
  },
  {
    menuItemId: 2,
    name: 'Honey Pearl Milk Tea',
    category: 'Milky Series',
    description: 'Classic milk tea sweetened with honey and finished with boba.',
    components: [
      component('black_tea', 12),
      component('non_dairy_creamer', 6),
      component('tapioca_pearls', 1.5),
    ],
    sweeteners: [sweetener('honey_syrup', 4)],
    notes: 'Uses floral honey syrup in place of cane sweetener.',
    tags: ['boba', 'contains soy', 'contains caffeine'],
  },
  {
    menuItemId: 3,
    name: 'Coffee Creama',
    category: 'Milky Series',
    description: 'Cold brew concentrate, milk, and a thick cream cap.',
    components: [
      component('coffee_concentrate', 8),
      component('fresh_milk', 8),
      component('cream_foam', 2, { scalesWithSize: false }),
    ],
    sweeteners: [sweetener('cane_syrup', 3)],
    notes: 'Foam cap quantity stays constant while base scales with size.',
    tags: ['contains dairy', 'contains caffeine'],
  },
  {
    menuItemId: 4,
    name: 'Coffee Milk Tea w/ Coffee Jelly',
    category: 'Milky Series',
    description: 'Black milk tea fortified with coffee concentrate and jelly.',
    components: [
      component('black_tea', 10),
      component('non_dairy_creamer', 5),
      component('coffee_concentrate', 4),
      component('coffee_jelly', 1.2),
    ],
    sweeteners: [sweetener('cane_syrup', 3.5)],
    tags: ['contains caffeine', 'contains soy'],
  },
  {
    menuItemId: 5,
    name: 'Hokkaido Pearl Milk Tea',
    category: 'Milky Series',
    description: 'Caramel Hokkaido-style milk tea with pearls.',
    components: [
      component('black_tea', 10),
      component('whole_milk', 5),
      component('hokkaido_powder', 2),
      component('tapioca_pearls', 1.5),
    ],
    sweeteners: [sweetener('brown_sugar_syrup', 3.2)],
    notes: 'Hokkaido powder provides caramel and malt notes.',
    tags: ['boba', 'contains dairy', 'contains caffeine'],
  },
  {
    menuItemId: 6,
    name: 'Thai Pearl Milk Tea',
    category: 'Milky Series',
    description: 'Spiced Thai tea with condensed milk and boba.',
    components: [
      component('thai_tea_concentrate', 10),
      component('condensed_milk', 3),
      component('half_half', 3),
      component('tapioca_pearls', 1.5),
    ],
    sweeteners: [
      sweetener('brown_sugar_syrup', 1.2, { adjustsWithSugar: false, labelOverride: 'Thai tea syrup' }),
    ],
    notes: 'Thai tea base arrives pre-sweetened, so sugar adjustments only affect additional syrup.',
    tags: ['boba', 'contains dairy', 'contains caffeine'],
  },
  {
    menuItemId: 7,
    name: 'Taro Pearl Milk Tea',
    category: 'Milky Series',
    description: 'Creamy taro with classic pearls.',
    components: [
      component('taro_paste', 4),
      component('non_dairy_creamer', 5),
      component('whole_milk', 4),
      component('tapioca_pearls', 1.5),
    ],
    sweeteners: [sweetener('cane_syrup', 3.2)],
    tags: ['boba', 'contains dairy', 'contains soy'],
  },
  {
    menuItemId: 8,
    name: 'Mango Green Milk Tea',
    category: 'Milky Series',
    description: 'Jasmine green tea with coconut milk, mango purée, and pearls.',
    components: [
      component('green_tea', 10),
      component('coconut_milk', 4),
      component('mango_puree', 3),
      component('tapioca_pearls', 1.2),
    ],
    sweeteners: [sweetener('cane_syrup', 2.5)],
    tags: ['boba', 'contains caffeine', 'contains tree nut'],
  },
  {
    menuItemId: 9,
    name: 'Golden Retriever',
    category: 'Milky Series',
    description: 'Oolong milk tea with brown sugar drizzle, salted cream, and pearls.',
    components: [
      component('oolong_tea', 10),
      component('half_half', 4),
      component('sea_salt_foam', 1.5, { scalesWithSize: false }),
      component('tapioca_pearls', 1.6),
    ],
    sweeteners: [sweetener('brown_sugar_syrup', 3.4)],
    notes: 'Sea-salt foam is fixed per drink while base scales.',
    tags: ['boba', 'contains dairy', 'contains caffeine'],
  },
  {
    menuItemId: 10,
    name: 'Coconut Pearl Milk Tea',
    category: 'Milky Series',
    description: 'Coconut-forward milk tea with boba.',
    components: [
      component('black_tea', 10),
      component('coconut_milk', 4),
      component('coconut_cream', 1),
      component('tapioca_pearls', 1.5),
    ],
    sweeteners: [sweetener('cane_syrup', 2.6)],
    tags: ['boba', 'contains tree nut', 'contains caffeine'],
  },
  {
    menuItemId: 11,
    name: 'Classic Tea',
    category: 'Fresh Brew',
    description: 'Unsweetened brewed tea (customer chooses base tea at ordering).',
    components: [component('black_tea', 18)],
    sweeteners: [sweetener('cane_syrup', 3.2)],
    notes: 'Assumes default black tea; adjust sugar slider for sweetness.',
    tags: ['contains caffeine'],
  },
  {
    menuItemId: 12,
    name: 'Honey Tea',
    category: 'Fresh Brew',
    description: 'Fresh brewed tea sweetened exclusively with honey.',
    components: [component('green_tea', 16)],
    sweeteners: [sweetener('honey_syrup', 3.5)],
    tags: ['contains caffeine'],
  },
  {
    menuItemId: 13,
    name: 'Mango Green Tea',
    category: 'Fruity Beverage',
    description: 'Jasmine green tea shaken with mango purée.',
    components: [
      component('green_tea', 12),
      component('mango_puree', 4),
    ],
    sweeteners: [sweetener('cane_syrup', 2.2)],
    tags: ['contains caffeine'],
  },
  {
    menuItemId: 14,
    name: 'Passion Chess',
    category: 'Fruity Beverage',
    description: 'Passionfruit jasmine tea capped with cheese foam.',
    components: [
      component('green_tea', 10),
      component('passionfruit_puree', 4),
      component('cheese_foam', 1.5, { scalesWithSize: false }),
    ],
    sweeteners: [sweetener('cane_syrup', 1.8)],
    tags: ['contains dairy', 'contains caffeine'],
  },
  {
    menuItemId: 15,
    name: 'Berry Lychee Burst',
    category: 'Fruity Beverage',
    description: 'Berry compote, lychee, and jasmine tea lemonade.',
    components: [
      component('berry_compote', 3),
      component('lychee_puree', 2.5),
      component('green_tea', 8),
      component('lemonade_base', 3),
    ],
    sweeteners: [sweetener('cane_syrup', 1.5)],
    notes: 'Tart lemonade base balances the berries.',
    tags: ['contains caffeine'],
  },
  {
    menuItemId: 16,
    name: 'Peach Tea w/ Honey Jelly',
    category: 'Fruity Beverage',
    description: 'Roasted oolong tea with peach purée and honey jelly add-ins.',
    components: [
      component('oolong_tea', 10),
      component('peach_puree', 3),
      component('honey_jelly', 1.2),
    ],
    sweeteners: [sweetener('honey_syrup', 2.2)],
    tags: ['contains caffeine'],
  },
  {
    menuItemId: 17,
    name: 'Mango & Passion Fruit Tea',
    category: 'Fruity Beverage',
    description: 'Split mango and passionfruit concentrate with jasmine tea.',
    components: [
      component('green_tea', 10),
      component('mango_puree', 2.5),
      component('passionfruit_puree', 2.5),
    ],
    sweeteners: [sweetener('cane_syrup', 2.4)],
    tags: ['contains caffeine'],
  },
  {
    menuItemId: 18,
    name: 'Honey Lemonade',
    category: 'Fruity Beverage',
    description: 'House lemonade shaken with honey syrup.',
    components: [
      component('lemonade_base', 10),
      component('coconut_water', 4),
    ],
    sweeteners: [sweetener('honey_syrup', 3)],
    tags: [],
  },
  {
    menuItemId: 19,
    name: 'Tiger Boba',
    category: 'Non-Caffeinated',
    description: 'Brown sugar boba with fresh milk and cream cap.',
    components: [
      component('fresh_milk', 10),
      component('cream_foam', 1, { scalesWithSize: false }),
      component('tapioca_pearls', 2),
    ],
    sweeteners: [sweetener('brown_sugar_syrup', 4)],
    tags: ['boba', 'contains dairy'],
  },
  {
    menuItemId: 20,
    name: 'Strawberry Coconut',
    category: 'Non-Caffeinated',
    description: 'Coconut milk layered with strawberry purée.',
    components: [
      component('coconut_milk', 8),
      component('strawberry_puree', 3.5),
      component('coconut_cream', 1),
    ],
    sweeteners: [sweetener('cane_syrup', 2)],
    tags: ['contains tree nut'],
  },
  {
    menuItemId: 21,
    name: 'Strawberry Coconut Ice Blended',
    category: 'Non-Caffeinated',
    description: 'Frozen strawberry coconut smoothie.',
    components: [
      component('strawberry_coconut_base', 8),
      component('strawberry_puree', 2.5),
      component('coconut_cream', 1),
    ],
    sweeteners: [sweetener('cane_syrup', 1.8)],
    tags: ['contains tree nut'],
  },
  {
    menuItemId: 22,
    name: 'Halo Halo',
    category: 'Non-Caffeinated',
    description: 'Layered Filipino halo-halo drink with mix-ins.',
    components: [
      component('halo_halo_mix', 1, { scalesWithSize: false }),
      component('ube_halaya', 2),
      component('coconut_milk', 5),
      component('condensed_milk', 2),
      component('red_bean', 1),
      component('coconut_jelly', 1),
    ],
    sweeteners: [sweetener('brown_sugar_syrup', 1.2, { adjustsWithSugar: false })],
    baseServingOz: 20,
    tags: ['contains tree nut', 'contains dairy'],
  },
  {
    menuItemId: 23,
    name: 'Halo Halo Ice Blended',
    category: 'Non-Caffeinated',
    description: 'Frozen halo-halo frappe with ice cream.',
    components: [
      component('halo_halo_mix', 1, { scalesWithSize: false }),
      component('ube_halaya', 2),
      component('smoothie_base', 4),
      component('coconut_milk', 4),
      component('ice_cream', 1, { scalesWithSize: false }),
    ],
    sweeteners: [sweetener('brown_sugar_syrup', 1.2, { adjustsWithSugar: false })],
    tags: ['contains tree nut', 'contains dairy'],
  },
  {
    menuItemId: 24,
    name: 'Wintermelon Lemonade',
    category: 'Non-Caffeinated',
    description: 'Wintermelon syrup balanced with lemonade.',
    components: [
      component('lemonade_base', 8),
      component('coconut_water', 4),
    ],
    sweeteners: [sweetener('wintermelon_syrup', 3.2)],
    tags: [],
  },
  {
    menuItemId: 25,
    name: 'Wintermelon Lemonade Ice Blended',
    category: 'Non-Caffeinated',
    description: 'Frozen wintermelon lemonade.',
    components: [
      component('lemonade_base', 6),
      component('smoothie_base', 4),
    ],
    sweeteners: [sweetener('wintermelon_syrup', 3.4)],
    notes: 'Honey jelly add-on assumed for signature texture.',
    tags: [],
  },
  {
    menuItemId: 26,
    name: 'Wintermelon w/ Fresh Milk',
    category: 'Non-Caffeinated',
    description: 'Creamy wintermelon latte.',
    components: [
      component('fresh_milk', 10),
      component('condensed_milk', 1),
    ],
    sweeteners: [sweetener('wintermelon_syrup', 4)],
    tags: ['contains dairy'],
  },
  {
    menuItemId: 27,
    name: 'Matcha Pearl Milk Tea',
    category: 'New Matcha Series',
    description: 'Matcha latte with pearls.',
    components: [
      component('matcha_concentrate', 3),
      component('fresh_milk', 10),
      component('non_dairy_creamer', 3),
      component('tapioca_pearls', 1.4),
    ],
    sweeteners: [sweetener('honey_syrup', 2.4)],
    tags: ['boba', 'contains dairy', 'contains caffeine'],
  },
  {
    menuItemId: 28,
    name: 'Matcha Fresh Milk',
    category: 'New Matcha Series',
    description: 'Straight matcha latte.',
    components: [
      component('matcha_concentrate', 3),
      component('fresh_milk', 12),
    ],
    sweeteners: [sweetener('cane_syrup', 2)],
    tags: ['contains dairy', 'contains caffeine'],
  },
  {
    menuItemId: 29,
    name: 'Strawberry Matcha Fresh Milk',
    category: 'New Matcha Series',
    description: 'Layered strawberry compote and matcha latte.',
    components: [
      component('matcha_concentrate', 2.5),
      component('fresh_milk', 10),
      component('strawberry_puree', 3),
    ],
    sweeteners: [sweetener('cane_syrup', 1.6)],
    notes: 'Strawberry purée remains constant to keep the ombré effect.',
    tags: ['contains dairy', 'contains caffeine'],
  },
  {
    menuItemId: 30,
    name: 'Mango Matcha Fresh Milk',
    category: 'New Matcha Series',
    description: 'Tropical mango layered with matcha latte.',
    components: [
      component('matcha_concentrate', 2.5),
      component('fresh_milk', 10),
      component('mango_puree', 3),
    ],
    sweeteners: [sweetener('cane_syrup', 1.6)],
    tags: ['contains dairy', 'contains caffeine'],
  },
  {
    menuItemId: 31,
    name: 'Matcha Ice Blended',
    category: 'New Matcha Series',
    description: 'Frozen matcha frappe with condensed milk.',
    components: [
      component('matcha_concentrate', 3),
      component('smoothie_base', 8),
      component('condensed_milk', 1.2),
      component('ice_cream', 1, { scalesWithSize: false }),
    ],
    sweeteners: [sweetener('cane_syrup', 1.8)],
    tags: ['contains dairy', 'contains caffeine'],
  },
  {
    menuItemId: 32,
    name: 'Oreo w/ Pearl',
    category: 'Ice-Blended',
    description: 'Cookies and cream shake with pearls.',
    components: [
      component('smoothie_base', 8),
      component('oreo_crumble', 2.5),
      component('condensed_milk', 1),
      component('tapioca_pearls', 1.2),
    ],
    sweeteners: [sweetener('cane_syrup', 1.8)],
    tags: ['boba', 'contains dairy', 'contains gluten'],
  },
  {
    menuItemId: 33,
    name: 'Taro w/ Pudding',
    category: 'Ice-Blended',
    description: 'Frozen taro shake layered with egg pudding.',
    components: [
      component('taro_paste', 4),
      component('smoothie_base', 8),
      component('egg_pudding', 1.5),
      component('condensed_milk', 1),
    ],
    sweeteners: [sweetener('cane_syrup', 1.5)],
    tags: ['contains dairy', 'contains egg'],
  },
  {
    menuItemId: 34,
    name: 'Thai Tea w/ Pearl',
    category: 'Ice-Blended',
    description: 'Frozen Thai tea frappe with boba.',
    components: [
      component('thai_tea_concentrate', 6),
      component('smoothie_base', 6),
      component('condensed_milk', 2),
      component('tapioca_pearls', 1.5),
    ],
    sweeteners: [sweetener('brown_sugar_syrup', 1.2, { adjustsWithSugar: false })],
    tags: ['boba', 'contains dairy', 'contains caffeine'],
  },
  {
    menuItemId: 35,
    name: 'Coffee w/ Ice Cream',
    category: 'Ice-Blended',
    description: 'Mocha frappe topped with a scoop of ice cream.',
    components: [
      component('coffee_concentrate', 6),
      component('smoothie_base', 8),
      component('ice_cream', 1, { scalesWithSize: false }),
    ],
    sweeteners: [sweetener('cane_syrup', 1.7)],
    tags: ['contains dairy', 'contains caffeine'],
  },
  {
    menuItemId: 36,
    name: 'Mango w/ Ice Cream',
    category: 'Ice-Blended',
    description: 'Mango smoothie crowned with ice cream.',
    components: [
      component('mango_ice_blend', 8),
      component('smoothie_base', 4),
      component('ice_cream', 1, { scalesWithSize: false }),
    ],
    sweeteners: [sweetener('cane_syrup', 1.6)],
    tags: ['contains dairy'],
  },
  {
    menuItemId: 37,
    name: 'Strawberry w/ Lychee Jelly & Ice Cream',
    category: 'Ice-Blended',
    description: 'Strawberry frappe with lychee jelly ribbons and ice cream.',
    components: [
      component('strawberry_ice_blend', 8),
      component('smoothie_base', 4),
      component('lychee_jelly', 1.2),
      component('ice_cream', 1, { scalesWithSize: false }),
    ],
    sweeteners: [sweetener('cane_syrup', 1.4)],
    tags: ['contains dairy'],
  },
  {
    menuItemId: 38,
    name: 'Peach Tea w/ Lychee Jelly',
    category: 'Ice-Blended',
    description: 'Frosty peach jasmine tea with lychee jelly.',
    components: [
      component('peach_ice_blend', 8),
      component('green_tea', 4),
      component('lychee_jelly', 1.5),
    ],
    sweeteners: [sweetener('cane_syrup', 1.6)],
    tags: ['contains caffeine'],
  },
  {
    menuItemId: 39,
    name: 'Lava Flow',
    category: 'Ice-Blended',
    description: 'Layered strawberry and coconut smoothie with tropical swirl.',
    components: [
      component('strawberry_puree', 3),
      component('coconut_milk', 6),
      component('coconut_cream', 1),
      component('mango_puree', 2),
      component('smoothie_base', 4),
    ],
    sweeteners: [sweetener('cane_syrup', 1.7)],
    tags: ['contains tree nut'],
  },
  {
    menuItemId: 40,
    name: 'Pumpkin Spice Latte',
    category: 'Seasonal',
    description: 'Warm espresso blended with pumpkin, cinnamon, nutmeg, and clove spices, topped with steamed milk and whipped cream. A cozy autumn favorite.',
    components: [
      component('espresso_shot', 2),
      component('fresh_milk', 10),
      component('cream_foam', 1.5, { scalesWithSize: false }),
    ],
    sweeteners: [sweetener('pumpkin_spice_syrup', 3.5)],
    notes: 'Cream foam stays constant while base scales with size.',
    tags: ['contains dairy', 'contains caffeine'],
  },
  {
    menuItemId: 41,
    name: 'Cinnamon Gingerbread Tea',
    category: 'Seasonal',
    description: 'Aromatic black tea infused with warm cinnamon and gingerbread spices, perfect for the holiday season. Served hot with a hint of sweetness.',
    components: [
      component('black_tea', 14),
      component('fresh_milk', 4),
    ],
    sweeteners: [sweetener('cinnamon_gingerbread_syrup', 3)],
    tags: ['contains dairy', 'contains caffeine'],
  },
  {
    menuItemId: 42,
    name: 'Peppermint Hot Chocolate',
    category: 'Seasonal',
    description: 'Rich and creamy hot chocolate with refreshing peppermint flavor, topped with whipped cream and crushed candy canes. A winter classic.',
    components: [
      component('fresh_milk', 10),
      component('cream_foam', 1.5, { scalesWithSize: false }),
    ],
    sweeteners: [
      sweetener('chocolate_syrup', 4),
      sweetener('peppermint_syrup', 2.5),
    ],
    notes: 'Chocolate and peppermint syrups are measured in pumps, cream foam stays constant.',
    tags: ['contains dairy'],
  },
  {
    menuItemId: 43,
    name: 'Sugar Cookie Latte',
    category: 'Seasonal',
    description: 'Espresso combined with vanilla and almond flavors reminiscent of freshly baked sugar cookies, finished with steamed milk and a sprinkle of sugar.',
    components: [
      component('espresso_shot', 2),
      component('fresh_milk', 10),
      component('cream_foam', 1, { scalesWithSize: false }),
    ],
    sweeteners: [sweetener('vanilla_almond_syrup', 3.2)],
    tags: ['contains dairy', 'contains caffeine', 'contains tree nut'],
  },
  {
    menuItemId: 44,
    name: 'Smores Blended Smoothie',
    category: 'Seasonal',
    description: 'A decadent frozen blend of chocolate, marshmallow, and graham cracker flavors, topped with whipped cream and chocolate drizzle. Like a campfire treat in a cup.',
    components: [
      component('smoothie_base', 8),
      component('graham_cracker_crumble', 1.5),
      component('cream_foam', 1, { scalesWithSize: false }),
    ],
    sweeteners: [
      sweetener('chocolate_syrup', 3),
      sweetener('marshmallow_syrup', 2),
      sweetener('cane_syrup', 1.5),
    ],
    notes: 'Chocolate and marshmallow syrups are measured in pumps. Cream foam and graham cracker crumble stay constant while base scales.',
    tags: ['contains dairy', 'contains gluten'],
  },
];

const RECIPE_LOOKUP = new Map<number, ComputedRecipe>();

for (const config of RECIPE_CONFIGS) {
  RECIPE_LOOKUP.set(config.menuItemId, {
    menuItemId: config.menuItemId,
    name: config.name,
    category: config.category,
    description: config.description,
    notes: config.notes,
    tags: config.tags,
    baseServingOz: config.baseServingOz ?? 22,
    defaultSugarPercentage: config.defaultSugarPercentage ?? 100,
    sizeProfiles: buildSizeProfiles(config),
  });
}

export function getRecipeByMenuItemId(menuItemId: number): ComputedRecipe | undefined {
  return RECIPE_LOOKUP.get(menuItemId);
}

export function isMenuItemCovered(menuItem: Pick<MenuItem, 'id'> | number): boolean {
  const id = typeof menuItem === 'number' ? menuItem : Number(menuItem.id);
  return RECIPE_LOOKUP.has(id);
}

