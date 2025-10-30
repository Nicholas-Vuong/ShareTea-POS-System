const OPENWEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather'

export async function getWeatherByCity (city = 'College Station,US') {
  const apiKey = process.env.OPENWEATHER_API_KEY
  if (!apiKey) {
    console.warn('[weather] OPENWEATHER_API_KEY not set, returning fallback data')
    return {
      location: city,
      temperatureC: 24,
      description: 'Partly cloudy',
      humidity: 60
    }
  }

  const url = new URL(OPENWEATHER_URL)
  url.searchParams.set('q', city)
  url.searchParams.set('appid', apiKey)
  url.searchParams.set('units', 'metric')

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch weather: ${response.status}`)
  }

  const data = await response.json()
  return {
    location: `${data.name}, ${data.sys.country}`,
    temperatureC: data.main.temp,
    description: data.weather?.[0]?.description ?? 'Unknown',
    humidity: data.main.humidity
  }
}
