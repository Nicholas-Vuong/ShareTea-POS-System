import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore.js'

function ProtectedRoute ({ roles }) {
  const location = useLocation()
  const { user, token } = useAuthStore()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
