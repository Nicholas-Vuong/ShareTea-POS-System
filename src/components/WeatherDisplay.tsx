import { useEffect, useState } from 'react';
import { getWeatherForecast, WeatherForecast } from '@/lib/weather';
import { Droplets, Wind, Eye, Thermometer } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const WeatherDisplay = ({ compact = false }: { compact?: boolean }) => {
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
        console.error('Weather forecast fetch error:', err);
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
          console.error('Weather forecast fetch error:', err);
          setError(err.message);
        });
    }, 600000); // 10 minutes

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className={`${compact ? 'p-6' : 'h-full p-8 rounded-none border-0 border-r-2 border-primary/20'} bg-card/80 backdrop-blur flex items-center justify-center`}>
        <div className="animate-pulse space-y-4">
          <div className="h-16 w-16 rounded bg-muted-foreground/20" />
          <div className="h-6 w-32 rounded bg-muted-foreground/20" />
          <div className="h-4 w-24 rounded bg-muted-foreground/20" />
        </div>
      </Card>
    );
  }

  if (error || !forecast) {
    return (
      <Card className={`${compact ? 'p-6' : 'h-full p-8 rounded-none border-0 border-r-2 border-primary/20'} bg-card/80 backdrop-blur flex items-center justify-center`}>
        <div className="text-muted-foreground">
          {error || 'Weather unavailable'}
        </div>
      </Card>
    );
  }

  const { current } = forecast;

  if (compact) {
    return (
      <Card className="p-4 bg-card/80 backdrop-blur border-2 border-primary/20">
        <div className="flex items-center gap-4">
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
            <div className="text-4xl font-bold">{current.temp}°F</div>
            <div className="text-lg text-muted-foreground capitalize">{current.condition}</div>
            <div className="text-sm text-muted-foreground mt-1">{current.location}</div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full p-8 bg-card/80 backdrop-blur rounded-none border-0 border-r-2 border-primary/20 flex flex-col">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold text-primary">Sharetea</h1>
      </div>
      
      <div className="flex-1 flex flex-col justify-center space-y-8">
        {/* Current Weather */}
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-6">
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
            <div>
              <div className="flex items-baseline gap-3">
                <div className="text-6xl font-bold">{current.temp}°F</div>
                <div className="text-2xl text-muted-foreground">feels like {current.feelsLike}°F</div>
              </div>
              <div className="text-2xl font-semibold capitalize mt-2">{current.condition}</div>
              <div className="text-lg text-muted-foreground mt-1">{current.location}</div>
            </div>
          </div>
        </div>

        {/* Weather Details */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-primary/20">
          <div className="flex items-center gap-3">
            <Droplets className="h-6 w-6 text-primary" />
            <div>
              <div className="text-sm text-muted-foreground">Humidity</div>
              <div className="text-xl font-semibold">{current.humidity}%</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Wind className="h-6 w-6 text-primary" />
            <div>
              <div className="text-sm text-muted-foreground">Wind</div>
              <div className="text-xl font-semibold">{current.windSpeed} mph {current.windDir}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Eye className="h-6 w-6 text-primary" />
            <div>
              <div className="text-sm text-muted-foreground">Visibility</div>
              <div className="text-xl font-semibold">{current.visibility} mi</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Thermometer className="h-6 w-6 text-primary" />
            <div>
              <div className="text-sm text-muted-foreground">Pressure</div>
              <div className="text-xl font-semibold">{current.pressure} in</div>
            </div>
          </div>
        </div>

        {/* 3-Day Forecast */}
        {forecast.forecast.length > 0 && (
          <div className="pt-4 border-t border-primary/20">
            <div className="text-lg font-semibold mb-3">3-Day Forecast</div>
            <div className="grid grid-cols-3 gap-4">
              {forecast.forecast.map((day, index) => {
                const date = new Date(day.date);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                return (
                  <div key={index} className="text-center">
                    <div className="text-sm font-medium mb-2">{dayName}</div>
                    {day.icon && (
                      <img 
                        src={day.icon} 
                        alt={day.condition}
                        className="h-12 w-12 mx-auto mb-2"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="text-lg font-semibold">{day.maxTemp}°</div>
                    <div className="text-sm text-muted-foreground">{day.minTemp}°</div>
                    <div className="text-xs text-muted-foreground mt-1">{day.chanceOfRain}% rain</div>
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

