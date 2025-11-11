const WEATHERAPI_KEY = import.meta.env.VITE_WEATHERAPI_KEY || import.meta.env.VITE_OPENWEATHER_API_KEY;

export interface WeatherData {
  temp: number;
  tempF: number;
  tempC: number;
  description: string;
  condition: string;
  conditionCode: number;
  icon: string;
  location: string;
  humidity: number;
  windSpeed: number;
  windDir: string;
  feelsLike: number;
  uv: number;
  visibility: number;
  pressure: number;
}

export interface ForecastDay {
  date: string;
  maxTemp: number;
  minTemp: number;
  condition: string;
  conditionCode: number;
  icon: string;
  chanceOfRain: number;
}

export interface WeatherForecast {
  current: WeatherData;
  forecast: ForecastDay[];
}

/**
 * Get current weather data from WeatherAPI.com
 * @param location - Location query (city name, zip code, lat,lon, or "auto:ip" for IP-based location)
 */
export async function getWeather(location: string = 'College Station, Texas'): Promise<WeatherData> {
  if (!WEATHERAPI_KEY) {
    throw new Error('WeatherAPI key is not configured. Please set VITE_WEATHERAPI_KEY in your environment variables.');
  }

  const url = `https://api.weatherapi.com/v1/current.json?key=${WEATHERAPI_KEY}&q=${location}&aqi=no`;
  
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Failed to fetch weather' } }));
    throw new Error(error.error?.message || 'Failed to fetch weather');
  }
  
  const data = await response.json();
  
  return {
    temp: Math.round(data.current.temp_f),
    tempF: Math.round(data.current.temp_f),
    tempC: Math.round(data.current.temp_c),
    description: data.current.condition.text,
    condition: data.current.condition.text,
    conditionCode: data.current.condition.code,
    icon: `https:${data.current.condition.icon}`,
    location: `${data.location.name}, ${data.location.region}`,
    humidity: data.current.humidity,
    windSpeed: Math.round(data.current.wind_mph),
    windDir: data.current.wind_dir,
    feelsLike: Math.round(data.current.feelslike_f),
    uv: data.current.uv,
    visibility: Math.round(data.current.vis_miles),
    pressure: Math.round(data.current.pressure_in),
  };
}

/**
 * Get weather forecast from WeatherAPI.com
 * @param location - Location query (city name, zip code, lat,lon, or "auto:ip" for IP-based location)
 * @param days - Number of forecast days (1-14)
 */
export async function getWeatherForecast(location: string = 'College Station, Texas', days: number = 3): Promise<WeatherForecast> {
  if (!WEATHERAPI_KEY) {
    throw new Error('WeatherAPI key is not configured. Please set VITE_WEATHERAPI_KEY in your environment variables.');
  }

  const url = `https://api.weatherapi.com/v1/forecast.json?key=${WEATHERAPI_KEY}&q=${location}&days=${days}&aqi=no&alerts=no`;
  
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Failed to fetch weather forecast' } }));
    throw new Error(error.error?.message || 'Failed to fetch weather forecast');
  }
  
  const data = await response.json();
  
  const current: WeatherData = {
    temp: Math.round(data.current.temp_f),
    tempF: Math.round(data.current.temp_f),
    tempC: Math.round(data.current.temp_c),
    description: data.current.condition.text,
    condition: data.current.condition.text,
    conditionCode: data.current.condition.code,
    icon: `https:${data.current.condition.icon}`,
    location: `${data.location.name}, ${data.location.region}`,
    humidity: data.current.humidity,
    windSpeed: Math.round(data.current.wind_mph),
    windDir: data.current.wind_dir,
    feelsLike: Math.round(data.current.feelslike_f),
    uv: data.current.uv,
    visibility: Math.round(data.current.vis_miles),
    pressure: Math.round(data.current.pressure_in),
  };

  const forecast: ForecastDay[] = data.forecast.forecastday.map((day: any) => ({
    date: day.date,
    maxTemp: Math.round(day.day.maxtemp_f),
    minTemp: Math.round(day.day.mintemp_f),
    condition: day.day.condition.text,
    conditionCode: day.day.condition.code,
    icon: `https:${day.day.condition.icon}`,
    chanceOfRain: day.day.daily_chance_of_rain,
  }));

  return {
    current,
    forecast,
  };
}
