import dotenv from 'dotenv'
import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'
import authRoutes from './routes/auth.js'
import jobRoutes from './routes/jobs.js'
import staffRoutes from './routes/staff.js'
import serviceTypeRoutes from './routes/serviceTypes.js'
import reportRoutes from './routes/reports.js'
import AuditLog from './models/AuditLog.js'
import ServiceType from './models/ServiceType.js'
import Staff from './models/Staff.js'
import authMiddleware from './middleware/authMiddleware.js'
import dns from 'dns' 

dns.setServers(["1.1.1.1", "8.8.8.8"])

dotenv.config({ path: new URL('./.env', import.meta.url) })

const port = Number(process.env.PORT || 3000)
const defaultServiceTypes = ['Haircut', 'Haircut + Beard', 'Beard trim', 'Kids cut']

if (!process.env.MONGO_URI) {
  throw new Error('MONGO_URI is required')
}

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required')
}

const app = express()
app.use(cors())
app.use(express.json({ limit: '10kb' }))

app.get('/health', (_request, response) => {
  response.json({ ok: true })
})

app.use('/auth', authRoutes)
app.use('/jobs', authMiddleware, jobRoutes)
app.use('/staff', authMiddleware, staffRoutes)
app.use('/service-types', authMiddleware, serviceTypeRoutes)
app.use('/reports', authMiddleware, reportRoutes)
app.get('/audit-logs', authMiddleware, async (request, response, next) => {
  if (request.authRole !== 'admin') return response.status(403).json({ error: 'Admin access required' })
  try {
    const limit = Math.min(Number(request.query.limit) || 100, 500)
    return response.json({ auditLogs: await AuditLog.find({}).sort({ createdAt: -1 }).limit(limit) })
  } catch (error) { return next(error) }
})

app.use((error, _request, response, _next) => {
  console.error(error)
  response.status(500).json({ error: 'Internal server error' })
})

try {
  await mongoose.connect(process.env.MONGO_URI)
  const staffIndexes = await Staff.collection.listIndexes().toArray()
  for (const index of staffIndexes) {
    if (index.name !== '_id_' && index.key?.phone) {
      await Staff.collection.dropIndex(index.name)
      console.log(`Removed obsolete staff index: ${index.name}`)
    }
  }
  await Promise.all(defaultServiceTypes.map((name) => (
    ServiceType.updateOne({ name }, { $setOnInsert: { name } }, { upsert: true })
  )))
  app.listen(port, () => {
    console.log(`Barber Docket API listening on port ${port}`)
  })
} catch (error) {
  console.error('Unable to connect to MongoDB:', error.message)
  process.exit(1)
}
