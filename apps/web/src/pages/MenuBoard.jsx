import React, { useEffect, useState } from 'react'
import client from '../api/client.js'

function MenuBoard () {
  const [menu, setMenu] = useState([])
  const [weather, setWeather] = useState(null)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000)
    const clock = setInterval(() => setNow(new Date()), 1000)
    return () => {
      clearInterval(interval)
      clearInterval(clock)
    }
  }, [])

  const fetchData = async () => {
    try {
      const [menuRes, weatherRes] = await Promise.all([
        client.get('/menu'),
        client.get('/weather')
      ])
      setMenu(menuRes.data)
      setWeather(weatherRes.data)
    } catch (err) {
      // Fail silently on the board
    }
  }

  const byCategory = menu.reduce((acc, item) => {
    acc[item.category] = acc[item.category] ?? []
    acc[item.category].push(item)
    return acc
  }, {})

  return (
    <main id="main" className="min-h-screen bg-brand-dark text-white">
      <header className="flex flex-wrap items-center justify-between gap-4 bg-black/30 px-8 py-6">
        <div>
          <h1 className="text-4xl font-bold tracking-wide">Sharetea Menu</h1>
          <p className="text-lg text-brand-secondary">Freshly brewed every day</p>
        </div>
        <div className="text-right">
          <time dateTime={now.toISOString()} className="text-3xl font-bold" aria-label={`Current time: ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}>
            {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </time>
          <time dateTime={now.toISOString()} className="text-lg" aria-label={`Current date: ${now.toLocaleDateString()}`}>
            {now.toLocaleDateString()}
          </time>
          {weather && (
            <p className="mt-2 text-sm text-slate-200" aria-label={`Weather in ${weather.location}: ${Math.round(weather.temperatureC)} degrees Celsius, ${weather.description}`}>
              {weather.location}: {Math.round(weather.temperatureC)}°C • {weather.description}
            </p>
          )}
        </div>
      </header>

      <div className="grid gap-10 px-8 py-10 lg:grid-cols-2">
        {Object.entries(byCategory).map(([category, items]) => (
          <section key={category} aria-labelledby={`category-${category}`}>
            <h2 id={`category-${category}`} className="text-3xl font-semibold text-brand-secondary">{category}</h2>
            <ul className="mt-4 space-y-3" aria-label={`${category} menu items`}>
              {items.map((item) => (
                <li key={item.id} className="flex items-baseline justify-between border-b border-white/10 pb-2 text-2xl">
                  <span>{item.name}</span>
                  <span aria-label={`Price: ${Number(item.price).toFixed(2)} dollars`}>${Number(item.price).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  )
}

export default MenuBoard
