export function notFoundHandler (req, res, next) {
  res.status(404).json({ error: 'Not Found' })
}

export function errorHandler (err, req, res, next) {
  console.error('[error]', err)
  const status = err.status ?? 500
  const message = err.message ?? 'Unexpected server error'
  res.status(status).json({ error: message })
}
