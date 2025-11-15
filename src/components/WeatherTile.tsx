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
    getWeatherForecast('College Station, Texas', 3)
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
      getWeatherForecast('College Station, Texas', 3)
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
      <Card className={`${compact ? 'p-3' : 'p-6'} bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20`}>
        <div className="text-sm text-muted-foreground">
          {error || 'Weather unavailable'}
        </div>
      </Card>
    );
  }

  const { current } = forecast;

  if (compact) {
    return (
      <Card className="p-3 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
        <div className="flex items-center gap-3">
          {current.icon && (
            <img 
              src={current.icon} 
              alt={current.condition}
              className="h-10 w-10"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div>
            <div className="text-xl font-bold">{current.temp}°F</div>
            <div className="text-xs text-muted-foreground capitalize">{current.condition}</div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
      <div className="space-y-4">
        {/* Main Weather Info */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            {current.icon && (
              <img 
                src={current.icon} 
                alt={current.condition}
                className="h-16 w-16"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-bold">{current.temp}°F</div>
                <div className="text-sm text-muted-foreground">feels like {current.feelsLike}°F</div>
              </div>
              <div className="text-lg font-semibold capitalize mt-1">{current.condition}</div>
              <div className="text-sm text-muted-foreground mt-1">{current.location}</div>
            </div>
          </div>
        </div>

        {/* Weather Details Grid */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-primary/20">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-primary" />
            <div>
              <div className="text-xs text-muted-foreground">Humidity</div>
              <div className="text-sm font-semibold">{current.humidity}%</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-primary" />
            <div>
              <div className="text-xs text-muted-foreground">Wind</div>
              <div className="text-sm font-semibold">{current.windSpeed} mph {current.windDir}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <div>
              <div className="text-xs text-muted-foreground">Visibility</div>
              <div className="text-sm font-semibold">{current.visibility} mi</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-primary" />
            <div>
              <div className="text-xs text-muted-foreground">UV Index</div>
              <div className="text-sm font-semibold">{current.uv}</div>
            </div>
          </div>
        </div>

        {/* 3-Day Forecast */}
        {forecast.forecast.length > 0 && (
          <div className="pt-3 border-t border-primary/20">
            <div className="text-sm font-semibold mb-2">3-Day Forecast</div>
            <div className="grid grid-cols-3 gap-2">
              {forecast.forecast.map((day, index) => {
                const date = new Date(day.date);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                return (
                  <div key={index} className="text-center">
                    <div className="text-xs font-medium mb-1">{dayName}</div>
                    {day.icon && (
                      <img 
                        src={day.icon} 
                        alt={day.condition}
                        className="h-8 w-8 mx-auto mb-1"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="text-sm font-semibold">{day.maxTemp}°</div>
                    <div className="text-xs text-muted-foreground">{day.minTemp}°</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{day.chanceOfRain}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
