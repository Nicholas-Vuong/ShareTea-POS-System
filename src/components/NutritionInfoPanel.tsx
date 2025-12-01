import { useEffect, useState } from 'react';
import { AlertCircle, Info } from 'lucide-react';
import { useNutritionInfo } from '@/hooks/useNutritionInfo';
import type { CustomizationOptions } from '@/lib/nutrition';

interface NutritionInfoPanelProps {
  menuItemId: string;
  menuItemName: string;
  customization?: CustomizationOptions;
}

/**
 * Nutrition info panel shown on the kiosk/cashier item customizer.
 * This fulfills the Project 3 "team's choice" API requirement by surfacing USDA data
 * inline with the ordering flow so customers can review calories and macros quickly.
 */
export function NutritionInfoPanel({ menuItemId, menuItemName, customization }: NutritionInfoPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { data, isLoading, isError, refetch, error } = useNutritionInfo(menuItemId, {
    enabled: isOpen,
    customization,
  });

  useEffect(() => {
    if (isError && error) {
      console.error('Failed to load nutrition info:', error);
    }
  }, [isError, error]);

  const renderContent = () => {
    if (isLoading) {
      return <p className="text-sm text-muted-foreground">Loading nutrition details…</p>;
    }

    if (isError) {
      return (
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1 space-y-2">
              <p className="text-destructive font-semibold">
                Unable to load nutrition information
              </p>
              <p className="text-muted-foreground text-xs">
                {error?.message?.includes('network') || error?.message?.includes('fetch')
                  ? 'Connection problem. Please check your internet connection.'
                  : error?.message?.includes('404') || error?.message?.includes('Not Found')
                  ? 'Nutrition data is not available for this item.'
                  : 'The nutrition information service is temporarily unavailable.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="w-full rounded-md border border-primary bg-primary/10 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors touch-target"
            aria-label="Retry loading nutrition information"
          >
            Try again
          </button>
        </div>
      );
    }

    if (!data || 'nutritionUnavailable' in data) {
      return (
        <p className="text-sm text-muted-foreground">
          Nutrition information is not available for this drink yet.
        </p>
      );
    }

    const sizeLabel = data.size ?? 'Medium';
    const servingLabel = data.servingSize
      ? `${data.servingSize}${data.servingSizeUnit ?? ''}`
      : 'One serving';

    const metrics = [
      { label: 'Calories', value: data.calories ? `${data.calories} kcal` : '—' },
      { label: 'Total carbs', value: formatUnit(data.totalCarbohydrates, 'g') },
      { label: 'Total sugars', value: formatUnit(data.totalSugars, 'g') },
      { label: 'Total fat', value: formatUnit(data.totalFat, 'g') },
      { label: 'Protein', value: formatUnit(data.protein, 'g') },
    ];

    const ingredients = data.ingredients ?? [];
    const ingredientGroups = [
      { title: 'Base', category: 'base' as const },
      { title: 'Sweeteners & syrups', category: 'sweetener' as const },
      { title: 'Toppings', category: 'topping' as const },
    ]
      .map((group) => ({
        ...group,
        items: ingredients.filter((item) => item.category === group.category),
      }))
      .filter((group) => group.items.length > 0);

    return (
      <div className="space-y-3">
        <p className="sr-only">Nutrition info for {menuItemName}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span>
            <span className="font-semibold text-foreground">{sizeLabel}</span> / {servingLabel}
          </span>
          {typeof data.sugarPercentage === 'number' && (
            <span>
              Sweetness: <span className="font-semibold text-foreground">{data.sugarPercentage}%</span>
            </span>
          )}
          {customization?.toppings?.length ? (
            <span>
              Extras:{' '}
              <span className="font-semibold text-foreground">{customization.toppings.join(', ')}</span>
            </span>
          ) : null}
          <span>Source: {data.sourceLabel}</span>
        </div>
        <dl className="grid grid-cols-2 gap-3" aria-live="polite">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-lg border bg-card/60 p-3"
              role="group"
              aria-label={metric.label}
            >
              <dt className="text-sm text-muted-foreground">{metric.label}</dt>
              <dd className="text-xl font-semibold">{metric.value}</dd>
            </div>
          ))}
        </dl>
        {ingredientGroups.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Ingredients & portions</p>
            <div className="space-y-3">
              {ingredientGroups.map((group) => (
                <div key={group.title}>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{group.title}</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {group.items.map((item) => (
                      <li key={`${item.label}-${item.quantity}`} className="flex justify-between">
                        <span>{item.label}</span>
                        <span className="font-medium text-foreground">{item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
        {data.notes && data.notes.length > 0 && (
          <div className="text-xs text-muted-foreground space-y-1" aria-live="polite">
            {data.notes.map((note) => (
              <p key={note}>• {note}</p>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">{data.disclaimers}</p>
      </div>
    );
  };

  return (
    <section
      aria-labelledby={`nutrition-title-${menuItemId}`}
      className="rounded-xl border bg-muted/40 p-4 space-y-3"
    >
      <button
        type="button"
        className="w-full flex items-center justify-between text-left touch-target"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls={`nutrition-content-${menuItemId}`}
      >
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" aria-hidden="true" />
          <span id={`nutrition-title-${menuItemId}`} className="text-lg font-semibold">
            Nutrition information (approximate)
          </span>
        </div>
        <span className="text-sm font-semibold text-primary">
          {isOpen ? 'Hide details' : 'Show details'}
        </span>
      </button>

      {isOpen && (
        <div id={`nutrition-content-${menuItemId}`} className="border-t pt-3">
          {renderContent()}
        </div>
      )}
    </section>
  );
}

function formatUnit(value: number | null, unit: string) {
  if (value === null || value === undefined) {
    return '—';
  }
  return `${value} ${unit}`;
}

