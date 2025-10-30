import React from 'react'

class ErrorBoundary extends React.Component {
  constructor (props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError () {
    return { hasError: true }
  }

  componentDidCatch (error, info) {
    console.error('ErrorBoundary caught an error', error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false })
    if (this.props.onRetry) {
      this.props.onRetry()
    }
  }

  render () {
    if (this.state.hasError) {
      return (
        <div role="alert" className="rounded border border-red-200 bg-red-50 p-4">
          <h2 className="text-lg font-semibold text-red-700">Something went wrong.</h2>
          <p className="text-sm text-red-600">Try refreshing the page or contact support if the issue persists.</p>
          <button type="button" onClick={this.handleRetry} className="mt-3 rounded bg-brand-primary px-3 py-2 text-white">
            Retry
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
