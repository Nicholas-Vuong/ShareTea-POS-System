import React, { useEffect, useState } from 'react'
import client from '../api/client.js'
import ErrorBoundary from '../components/ErrorBoundary.jsx'

function ManagerDashboard () {
  const [menu, setMenu] = useState([])
  const [weather, setWeather] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [inventory, setInventory] = useState([])
  const [sales, setSales] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    refreshData()
  }, [])

  const refreshData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [menuRes, weatherRes, recsRes, inventoryRes, salesRes] = await Promise.all([
        client.get('/menu'),
        client.get('/weather'),
        client.get('/api/recommendations'),
        client.get('/inventory'),
        client.get('/reports/sales')
      ])
      setMenu(menuRes.data)
      setWeather(weatherRes.data)
      setRecommendations(recsRes.data.recommendations)
      setInventory(inventoryRes.data)
      setSales(salesRes.data)
    } catch (err) {
      setError('Failed to load manager data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ErrorBoundary onRetry={refreshData}>
      <main id="main" className="mx-auto max-w-6xl px-4 py-6 space-y-8">
        <header className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Manager Dashboard</h1>
            <p className="text-slate-600">Monitor menu items, inventory, sales, and weather insights.</p>
          </div>
          <button type="button" onClick={refreshData} className="rounded border px-3 py-2" disabled={loading}>
            Refresh
          </button>
        </header>

        {error && <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}

        <section aria-labelledby="weather-section" className="grid gap-4 rounded-lg border bg-white p-4 shadow sm:grid-cols-2">
          <div>
            <h2 id="weather-section" className="text-xl font-semibold">Weather</h2>
            {weather
              ? (
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  <li><strong>Location:</strong> {weather.location}</li>
                  <li><strong>Temperature:</strong> {Math.round(weather.temperatureC)}°C</li>
                  <li><strong>Description:</strong> {weather.description}</li>
                  <li><strong>Humidity:</strong> {weather.humidity}%</li>
                </ul>
                )
              : <p>Loading weather…</p>}
          </div>
          <div>
            <h3 className="text-lg font-semibold">AI Recommendations</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {recommendations.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
              {recommendations.length === 0 && <li>No recommendations yet.</li>}
            </ul>
          </div>
        </section>

        <section aria-labelledby="menu-section" className="rounded-lg border bg-white p-4 shadow">
          <h2 id="menu-section" className="text-xl font-semibold">Menu</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border text-left text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">Price</th>
                  <th className="px-4 py-2">Availability</th>
                </tr>
              </thead>
              <tbody>
                {menu.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-2">{item.name}</td>
                    <td className="px-4 py-2">{item.category}</td>
                    <td className="px-4 py-2">${Number(item.price).toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <span className={`rounded px-2 py-1 text-xs ${item.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="inventory-section" className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-white p-4 shadow">
            <h2 id="inventory-section" className="text-xl font-semibold">Inventory Status</h2>
            <ul className="mt-2 space-y-2 text-sm text-slate-700">
              {inventory.map((item) => (
                <li key={item.id} className="flex items-center justify-between rounded border px-3 py-2">
                  <span>{item.name}</span>
                  <span>
                    {item.quantity} {item.unit}
                    {item.needs_restock && (
                      <span className="ml-2 rounded bg-red-100 px-2 py-1 text-xs text-red-700">Restock</span>
                    )}
                  </span>
                </li>
              ))}
              {inventory.length === 0 && <li>No inventory items captured yet.</li>}
            </ul>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow">
            <h2 className="text-xl font-semibold">Sales Overview</h2>
            {sales
              ? (
                <div className="space-y-2 text-sm text-slate-700">
                  <p><strong>Orders:</strong> {sales.summary.order_count}</p>
                  <p><strong>Total Revenue:</strong> ${Number(sales.summary.revenue).toFixed(2)}</p>
                  <p><strong>Paid Revenue:</strong> ${Number(sales.summary.paid_revenue).toFixed(2)}</p>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Top Sellers</p>
                  <ul className="list-disc pl-5">
                    {sales.topItems.map((item) => (
                      <li key={item.name}>{item.name} ({item.total_sold})</li>
                    ))}
                  </ul>
                </div>
                )
              : <p>Loading sales…</p>}
          </div>
        </section>

        <section aria-labelledby="chart-section" className="rounded-lg border border-dashed bg-slate-50 p-6 text-center text-slate-500">
          <h2 id="chart-section" className="text-xl font-semibold text-slate-600">Sales Chart</h2>
          <p className="mt-2">Chart coming soon. Data aggregation is available via API endpoints for integration with BI tools.</p>
        </section>
      </main>
    </ErrorBoundary>
  )
}

export default ManagerDashboard
