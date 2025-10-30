import React, { useEffect, useMemo, useState } from 'react'
import client from '../api/client.js'
import Cart from '../components/Cart.jsx'
import MenuItemCard from '../components/MenuItemCard.jsx'
import { useAccessibility } from '../context/AccessibilityContext.jsx'
import ErrorBoundary from '../components/ErrorBoundary.jsx'

const translations = {
  en: {
    title: 'Order Your Favorite Drinks',
    filter: 'Filter by category',
    submit: 'Place Order',
    notes: 'Order notes',
    cartTitle: 'Cart',
    confirmation: 'Thank you! Your order has been placed.',
    refreshMenu: 'Refresh menu'
  },
  es: {
    title: 'Ordena Tus Bebidas Favoritas',
    filter: 'Filtrar por categoría',
    submit: 'Realizar Pedido',
    notes: 'Notas del pedido',
    cartTitle: 'Carrito',
    confirmation: '¡Gracias! Tu pedido ha sido enviado.',
    refreshMenu: 'Actualizar menú'
  }
}

function CustomerDashboard () {
  const { language } = useAccessibility()
  const t = translations[language] ?? translations.en

  const [menuItems, setMenuItems] = useState([])
  const [cartItems, setCartItems] = useState([])
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [notes, setNotes] = useState('')
  const [confirmation, setConfirmation] = useState(null)

  useEffect(() => {
    fetchMenu()
  }, [])

  useEffect(() => {
    loadGoogleTranslate()
  }, [])

  const categories = useMemo(() => {
    const unique = new Set(menuItems.map((item) => item.category))
    return ['all', ...unique]
  }, [menuItems])

  const filteredMenu = categoryFilter === 'all'
    ? menuItems
    : menuItems.filter((item) => item.category === categoryFilter)

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const handleAddToCart = (item) => {
    setCartItems((prev) => {
      const existing = prev.find((cartItem) => cartItem.id === item.id)
      if (existing) {
        return prev.map((cartItem) => cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem)
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const handleIncrement = (id) => {
    setCartItems((prev) => prev.map((item) => item.id === id ? { ...item, quantity: item.quantity + 1 } : item))
  }

  const handleDecrement = (id) => {
    setCartItems((prev) => prev.flatMap((item) => {
      if (item.id !== id) return item
      if (item.quantity === 1) return []
      return { ...item, quantity: item.quantity - 1 }
    }))
  }

  const handleRemove = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (cartItems.length === 0) {
      setError('Please add at least one drink.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const payload = {
        items: cartItems.map((item) => ({
          menuItemId: item.id,
          quantity: item.quantity
        })),
        notes: notes || undefined
      }
      const { data } = await client.post('/orders', payload)
      setConfirmation(data)
      setCartItems([])
      setNotes('')
    } catch (err) {
      const message = err.response?.data?.error ?? 'Failed to place order'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const fetchMenu = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await client.get('/menu')
      setMenuItems(data)
    } catch {
      setError('Unable to load menu right now.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ErrorBoundary onRetry={fetchMenu}>
      <main id="main" className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold">{t.title}</h1>
          <button type="button" onClick={fetchMenu} className="rounded border px-3 py-2" disabled={loading}>
            {t.refreshMenu}
          </button>
        </div>
        <p className="mt-2 max-w-3xl text-slate-600">
          Customize your order and adjust accessibility options anytime. Use the language dropdown to translate content via Google.
        </p>

        <section className="mt-6 flex flex-col gap-6 lg:flex-row">
          <div className="flex-1 space-y-4">
            <label className="flex items-center gap-3 text-sm">
              {t.filter}
              <select
                className="rounded border px-2 py-1"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All' : category}
                  </option>
                ))}
              </select>
            </label>

            {loading && (
              <div role="status" className="animate-pulse rounded border p-6 text-center">
                Loading menu…
              </div>
            )}

            {error && <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMenu.map((item) => (
                <MenuItemCard key={item.id} item={item} onAdd={handleAddToCart} />
              ))}
            </div>
          </div>

          <div className="w-full max-w-sm space-y-4">
            <Cart
              items={cartItems}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              onRemove={handleRemove}
              total={cartTotal}
            />

            <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border bg-white p-4 shadow">
              <label className="block text-sm">
                {t.notes}
                <textarea
                  className="mt-1 w-full rounded border px-3 py-2"
                  rows="3"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded bg-brand-primary px-4 py-2 font-semibold text-white hover:bg-brand-dark disabled:opacity-70"
              >
                {loading ? 'Submitting…' : t.submit}
              </button>
            </form>

            {confirmation && (
              <div role="status" className="rounded border border-green-200 bg-green-50 p-4 text-green-700">
                <p className="font-semibold">{t.confirmation}</p>
                <p className="text-sm">Order #{confirmation.id} • Status: {confirmation.status}</p>
              </div>
            )}
          </div>
        </section>

        <div id="google_translate_element" className="mt-6" aria-hidden="true" />
      </main>
    </ErrorBoundary>
  )
}

function loadGoogleTranslate () {
  if (document.getElementById('google-translate-script')) return
  const script = document.createElement('script')
  script.id = 'google-translate-script'
  script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
  script.async = true
  window.googleTranslateElementInit = () => {
    // eslint-disable-next-line no-new
    new window.google.translate.TranslateElement(
      { pageLanguage: 'en', includedLanguages: 'en,es' },
      'google_translate_element'
    )
  }
  document.body.appendChild(script)
}

export default CustomerDashboard
