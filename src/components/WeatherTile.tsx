import { useEffect, useState } from 'react';
import { getWeatherForecast, WeatherForecast } from '@/lib/weather';
import { Droplets, Wind, Eye, Sun } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface WeatherTileProps {
  compact?: boolean;
}

export const WeatherTile = ({ compact = false }: WeatherTileProps) => {
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getWeatherForecast('College Station, Texas', 1)
      .then((data) => {
        setForecast(data);
        setError(null);
      })
      .catch((err) => {
        console.error('Weather fetch error:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));

    // Refresh weather every 10 minutes
    const interval = setInterval(() => {
      getWeatherForecast('College Station, Texas', 1)
        .then((data) => {
          setForecast(data);
          setError(null);
        })
        .catch((err) => {
          console.error('Weather fetch error:', err);
          setError(err.message);
        });
    }, 600000); // 10 minutes

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className={`${compact ? 'p-3' : 'p-6'} bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20`}>
        <div className="animate-pulse space-y-2">
          <div className={`${compact ? 'h-8 w-8' : 'h-16 w-16'} rounded bg-muted-foreground/20`} />
          <div className={`${compact ? 'h-4 w-24' : 'h-6 w-32'} rounded bg-muted-foreground/20`} />
        </div>
      </Card>
    );
  }

  if (error || !forecast) {
    return (
      <Card className={`${compact ? 'p-3' : 'p-6'} bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 opacity-60`}>
        <div className="text-sm text-muted-foreground text-center">
          {error ? (
            <span className="text-xs">Weather data unavailable</span>
          ) : (
            <span className="text-xs">Weather unavailable</span>
          )}
        </div>
      </Card>
    );
  }

  const { current } = forecast;

  if (compact) {
    return (
      <Card className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
        <div className="flex items-start gap-4">
          {current.icon && (
            <img 
              src={current.icon} 
              alt={current.condition}
              className="h-12 w-12 flex-shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-primary">{current.temp}°F</div>
              <div className="text-sm text-muted-foreground">Feels {current.feelsLike}°F</div>
            </div>
            <div className="text-sm font-medium capitalize mt-1 text-primary/80">{current.condition}</div>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Droplets className="h-3 w-3" />
                <span>{current.humidity}%</span>
              </div>
              <div className="flex items-center gap-1">
                <Wind className="h-3 w-3" />
                <span>{current.windSpeed} mph</span>
              </div>
              <div className="flex items-center gap-1">
                <Sun className="h-3 w-3" />
                <span>UV {current.uv}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 flex flex-col max-w-sm">
      <div className="space-y-6 flex-1">
        {/* Header */}
        <div className="text-center border-b border-primary/20 pb-4">
          <h2 className="text-2xl font-bold text-primary">Today's Weather</h2>
          <p className="text-sm text-muted-foreground mt-1">{current.location}</p>
        </div>

        {/* Main Weather Info */}
        <div className="flex flex-col items-center gap-4 py-4">
          {current.icon && (
            <img 
              src={current.icon} 
              alt={current.condition}
              className="h-24 w-24"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div className="text-center">
            <div className="text-6xl font-bold text-primary">{current.temp}°F</div>
            <div className="text-lg text-muted-foreground mt-2">Feels like {current.feelsLike}°F</div>
            <div className="text-xl font-semibold capitalize mt-3 text-primary/80">{current.condition}</div>
          </div>
        </div>

        {/* Weather Details Grid */}
        <div className="grid grid-cols-2 gap-4 py-4 border-y border-primary/20">
          <div className="flex flex-col items-center gap-2 p-3 bg-background/50 rounded-lg">
            <Droplets className="h-6 w-6 text-primary" />
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Humidity</div>
              <div className="text-lg font-semibold">{current.humidity}%</div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 bg-background/50 rounded-lg">
            <Wind className="h-6 w-6 text-primary" />
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Wind</div>
              <div className="text-lg font-semibold">{current.windSpeed} mph</div>
              <div className="text-xs text-muted-foreground">{current.windDir}</div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 bg-background/50 rounded-lg">
            <Eye className="h-6 w-6 text-primary" />
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Visibility</div>
              <div className="text-lg font-semibold">{current.visibility} mi</div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 bg-background/50 rounded-lg">
            <Sun className="h-6 w-6 text-primary" />
            <div className="text-center">
              <div className="text-xs text-muted-foreground">UV Index</div>
              <div className="text-lg font-semibold">{current.uv}</div>
            </div>
          </div>
        </div>

      </div>
    </Card>
  );
};
