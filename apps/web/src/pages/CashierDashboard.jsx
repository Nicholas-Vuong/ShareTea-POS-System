import React, { useEffect, useState } from 'react'
import client from '../api/client.js'
import ErrorBoundary from '../components/ErrorBoundary.jsx'

const STATUSES = ['PENDING', 'PREPARING', 'READY', 'PAID', 'COMPLETED', 'CANCELLED']

function CashierDashboard () {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const { data } = await client.get('/orders')
      setOrders(data)
    } catch (err) {
      setError('Unable to load orders')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (orderId, status) => {
    try {
      await client.patch(`/orders/${orderId}/status`, { status })
      fetchOrders()
    } catch {
      setError('Updating order failed')
    }
  }

  return (
    <ErrorBoundary onRetry={fetchOrders}>
      <main id="main" className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Cashier Dashboard</h1>
          <button type="button" onClick={fetchOrders} className="rounded border px-3 py-2" disabled={loading}>
            Refresh
          </button>
        </div>
        <p className="mt-2 text-slate-600">Review recent orders and update payment status.</p>

        {loading && <p className="mt-4">Loading orders…</p>}
        {error && <p role="alert" className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border bg-white">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="px-4 py-2">Order</th>
                <th className="px-4 py-2">Customer</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Updated</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t">
                  <td className="px-4 py-2 font-medium">{order.id}</td>
                  <td className="px-4 py-2">{order.customer_email ?? 'Guest'}</td>
                  <td className="px-4 py-2">{order.status}</td>
                  <td className="px-4 py-2">${Number(order.total).toFixed(2)}</td>
                  <td className="px-4 py-2">{new Date(order.updated_at).toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <label className="flex items-center gap-2 text-sm">
                      Status
                      <select
                        className="rounded border px-2 py-1"
                        value={order.status}
                        onChange={(event) => updateStatus(order.id, event.target.value)}
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </label>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="px-4 py-6 text-center text-slate-500">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </ErrorBoundary>
  )
}

export default CashierDashboard
