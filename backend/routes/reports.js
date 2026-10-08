import { Router } from 'express'
import Job from '../models/Job.js'

const router = Router()
router.get('/daily', async (request, response, next) => {
  if (request.authRole !== 'admin') return response.status(403).json({ error: 'Admin access required' })
  try {
    const datePattern = /^\d{4}-\d{2}-\d{2}$/
    const start = request.query.from || request.query.date
    const end = request.query.to || request.query.date || start
    if (!datePattern.test(start || '') || !datePattern.test(end || '')) return response.status(400).json({ error: 'from and to must be YYYY-MM-DD dates' })
    const from = new Date(`${start}T00:00:00.000Z`)
    const until = new Date(`${end}T00:00:00.000Z`)
    until.setUTCDate(until.getUTCDate() + 1)
    if (until <= from) return response.status(400).json({ error: 'to must not precede from' })
    const [summary] = await Job.aggregate([
      { $match: { status: 'approved', deletedAt: null, createdAt: { $gte: from, $lt: until } } },
      { $group: { _id: null, total: { $sum: 1 }, revenue: { $sum: '$price' }, byPaymentMethod: { $push: '$paymentMethod' } } },
      { $project: { _id: 0, total: 1, revenue: 1, byPaymentMethod: 1 } },
    ])
    const paymentMethods = (summary?.byPaymentMethod || []).reduce((result, method) => { const key = method || 'unspecified'; result[key] = (result[key] || 0) + 1; return result }, {})
    return response.json({ from: start, to: end, total: summary?.total || 0, revenue: summary?.revenue || 0, paymentMethods })
  } catch (error) { return next(error) }
})
export default router
