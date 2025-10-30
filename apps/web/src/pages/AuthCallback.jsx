import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import client from '../api/client.js'
import { useAuthStore } from '../stores/authStore.js'

function AuthCallback () {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setAuth, setError } = useAuthStore()

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setError('Missing token from Google OAuth')
      navigate('/login')
      return
    }

    async function verify () {
      try {
        const { data } = await client.get('/auth/verify', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setAuth({ token, user: data })
        navigate(routeForRole(data.role), { replace: true })
      } catch (err) {
        setError('Authentication failed')
        navigate('/login')
      }
    }

    verify()
  }, [navigate, searchParams, setAuth, setError])

  return (
    <main id="main" className="flex min-h-[60vh] items-center justify-center">
      <p className="text-lg font-medium text-slate-600">Finishing sign in…</p>
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

export default AuthCallback
