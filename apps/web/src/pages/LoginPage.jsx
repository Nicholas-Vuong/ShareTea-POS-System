import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import client from '../api/client.js'
import { useAuthStore } from '../stores/authStore.js'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5001'

function LoginPage () {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuth, startLoading, setError, loading, error } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      startLoading()
      const { data } = await client.post('/auth/login', { email, password })
      setAuth({ token: data.token, user: data.user })
      const redirect = location.state?.from?.pathname ?? routeForRole(data.user.role)
      navigate(redirect, { replace: true })
    } catch (err) {
      const message = err.response?.data?.error ?? 'Unable to login'
      setError(message)
    }
  }

  return (
    <main id="main" className="mx-auto flex min-h-[80vh] max-w-lg flex-col justify-center gap-6 px-4">
      <section className="rounded-lg border bg-white p-6 shadow">
        <h1 className="text-2xl font-bold text-brand-primary">Welcome to Sharetea SaaS</h1>
        <p className="mt-2 text-sm text-slate-600">Log in with Google or use your email credentials.</p>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded border border-slate-300 px-4 py-2 font-medium hover:bg-slate-50"
        >
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-4">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-xs uppercase tracking-wide text-slate-400">or</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </label>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-brand-primary px-4 py-2 font-semibold text-white hover:bg-brand-dark disabled:opacity-70"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </section>
    </main>
  )
}

function routeForRole (role) {
  switch (role) {
    case 'Manager':
      return '/manager'
    case 'Cashier':
      return '/cashier'
    default:
      return '/customer'
  }
}

export default LoginPage
