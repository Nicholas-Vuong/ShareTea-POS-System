import React from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore.js'
import AccessibilityControls from './AccessibilityControls.jsx'

const navByRole = {
  Manager: [
    { to: '/manager', label: 'Manager Dashboard' },
    { to: '/cashier', label: 'Cashier View' },
    { to: '/customer', label: 'Customer Orders' }
  ],
  Cashier: [
    { to: '/cashier', label: 'Cashier Dashboard' },
    { to: '/customer', label: 'Customer Orders' }
  ],
  Customer: [
    { to: '/customer', label: 'My Orders' },
    { to: '/menu-board', label: 'Menu Board' }
  ]
}

function Navbar () {
  const { user, logout } = useAuthStore()
  const links = user ? navByRole[user.role] ?? [] : []

  return (
    <header className="bg-white shadow">
      <a href="#main" className="skip-link">Skip to main content</a>
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to="/" className="text-xl font-bold text-brand-primary">
            Sharetea SaaS
          </Link>
          <p className="text-sm text-slate-500" aria-live="polite">
            {user ? `Logged in as ${user.name ?? user.email} (${user.role})` : 'Please log in'}
          </p>
        </div>

        <nav aria-label="Primary navigation" className="flex flex-wrap items-center gap-4">
          {links.map((link) => (
            <Link key={link.to} to={link.to} className="rounded px-3 py-2 font-medium text-slate-700 hover:bg-slate-100">
              {link.label}
            </Link>
          ))}
          <Link to="/menu-board" className="rounded px-3 py-2 font-medium text-slate-700 hover:bg-slate-100">
            Menu Board
          </Link>
          {user
            ? (
              <button type="button" onClick={logout} className="rounded bg-brand-primary px-3 py-2 text-white hover:bg-brand-dark">
                Logout
              </button>
              )
            : (
              <Link to="/login" className="rounded bg-brand-primary px-3 py-2 text-white hover:bg-brand-dark">
                Login
              </Link>
              )}
        </nav>
      </div>
      <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
          <AccessibilityControls />
        </div>
      </div>
    </header>
  )
}

export default Navbar
