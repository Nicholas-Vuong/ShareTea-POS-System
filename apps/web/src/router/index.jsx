import React, { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute.jsx'
import LoginPage from '../pages/LoginPage.jsx'
import AuthCallback from '../pages/AuthCallback.jsx'
import CustomerDashboard from '../pages/CustomerDashboard.jsx'
import CashierDashboard from '../pages/CashierDashboard.jsx'
import ManagerDashboard from '../pages/ManagerDashboard.jsx'
import MenuBoard from '../pages/MenuBoard.jsx'
import { useAuthStore } from '../stores/authStore.js'

function AppRouter () {
  const initialize = useAuthStore((state) => state.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/menu-board" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route element={<ProtectedRoute roles={['Manager']} />}>
        <Route path="/manager" element={<ManagerDashboard />} />
      </Route>
      <Route element={<ProtectedRoute roles={['Manager', 'Cashier']} />}>
        <Route path="/cashier" element={<CashierDashboard />} />
      </Route>
      <Route element={<ProtectedRoute roles={['Manager', 'Cashier', 'Customer']} />}>
        <Route path="/customer" element={<CustomerDashboard />} />
      </Route>
      <Route path="/menu-board" element={<MenuBoard />} />
      <Route path="*" element={<Navigate to="/menu-board" replace />} />
    </Routes>
  )
}

export default AppRouter
