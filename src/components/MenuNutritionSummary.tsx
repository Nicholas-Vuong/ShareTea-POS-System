import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNutritionInfo } from '@/hooks/useNutritionInfo';
import { AlertCircle } from 'lucide-react';

interface MenuNutritionSummaryProps {
  menuItemId: string;
  sugarWarningThreshold?: number;
}

const DEFAULT_SUGAR_THRESHOLD = 30;

/**
 * Compact nutrition summary for manager dashboard rows.
 * Helps managers like Maria quickly see calorie + sugar load per drink.
 */
export function MenuNutritionSummary({
  menuItemId,
  sugarWarningThreshold = DEFAULT_SUGAR_THRESHOLD,
}: MenuNutritionSummaryProps) {
  const { data, isLoading, isError, error, refetch } = useNutritionInfo(menuItemId, {
    customization: { size: 'Medium', sugarPercentage: 100 },
  });

  useEffect(() => {
    if (isError && error) {
      console.error('Manager nutrition summary failed:', error);
    }
  }, [isError, error]);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading nutrition summary…</p>;
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <span>Unable to load nutrition data.</span>
        <Button variant="link" className="h-auto p-0 text-primary" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!data || 'nutritionUnavailable' in data) {
    return <p className="text-sm text-muted-foreground">Nutrition info not configured yet.</p>;
  }

  const isHighSugar =
    typeof data.totalSugars === 'number' && data.totalSugars > sugarWarningThreshold;

  return (
    <div className="flex flex-wrap items-center gap-6" aria-live="polite">
      <div>
        <p className="text-xs uppercase text-muted-foreground">Calories / serving</p>
        <p className="text-2xl font-semibold">{data.calories ?? '—'} kcal</p>
      </div>
      <div>
        <p className="text-xs uppercase text-muted-foreground">Total sugar</p>
        <p className="text-2xl font-semibold">{formatUnit(data.totalSugars, 'g')}</p>
      </div>
      {isHighSugar && (
        <Badge variant="destructive" className="text-sm tracking-tight">
          High sugar
        </Badge>
      )}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>
          Assumes {data.size ?? 'Medium'} / {data.sugarPercentage ?? 100}% sugar. Source: {data.sourceLabel}.
        </p>
        <p>{data.disclaimers}</p>
      </div>
    </div>
  );
}

function formatUnit(value: number | null, unit: string) {
  if (value === null || value === undefined) return '—';
  return `${value} ${unit}`;
}

