import express from 'express'
import authRouter from './routes/auth.js'

export function createApp() {
  const app = express()

  app.use(express.json({ limit: '10kb' }))
  app.use('/auth', authRouter)

  app.get('/health', (_request, response) => {
    response.json({ ok: true })
  })

  app.use((error, _request, response, _next) => {
    console.error(error)
    response.status(500).json({ error: 'Internal server error' })
  })

  return app
}
