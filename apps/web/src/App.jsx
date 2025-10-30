import React from 'react'
import Navbar from './components/Navbar.jsx'
import AppRouter from './router/index.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

function App () {
  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <Navbar />
      <div className="flex-1">
        <ErrorBoundary>
          <AppRouter />
        </ErrorBoundary>
      </div>
      <footer className="bg-white py-4 text-center text-sm text-slate-500">
        Sharetea SaaS MVP &copy; {new Date().getFullYear()}
      </footer>
    </div>
  )
}

export default App
