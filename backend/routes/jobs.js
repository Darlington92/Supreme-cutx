import { Router } from 'express'
import mongoose from 'mongoose'
import Job from '../models/Job.js'
import Staff from '../models/Staff.js'
import AuditLog from '../models/AuditLog.js'

const router = Router()

function requireAdmin(request, response, next) {
  if (request.authRole !== 'admin') return response.status(403).json({ error: 'Admin access required' })
  return next()
}

router.post('/', async (request, response, next) => {
  try {
    if (request.authRole !== 'staff' && request.authRole !== 'admin') return response.status(403).json({ error: 'Staff access required' })
    const serviceType = typeof request.body?.serviceType === 'string' ? request.body.serviceType.trim() : ''
    const price = Number(request.body?.price)
    const staffId = request.authRole === 'admin' ? request.body?.staffId : request.staffId
    if (!serviceType || !Number.isFinite(price) || price <= 0) {
      return response.status(400).json({ error: 'Service type and a positive price are required' })
    }
    if (!staffId || !(await Staff.exists({ _id: staffId, active: true }))) {
      return response.status(400).json({ error: 'A valid active barber is required' })
    }
    const paymentMethod = request.body?.paymentMethod
    const receiptReference = typeof request.body?.receiptReference === 'string' ? request.body.receiptReference.trim() : null
    if (paymentMethod && !['cash', 'card', 'mobile', 'other'].includes(paymentMethod)) {
      return response.status(400).json({ error: 'Invalid payment method' })
    }
    const job = await Job.create({ staffId, serviceType, price, paymentMethod: paymentMethod || null, receiptReference })
    await AuditLog.create({ action: 'create', entity: 'job', entityId: job._id, actorId: request.staffId, actorRole: request.authRole })
    return response.status(201).json({ job: await job.populate('staffId', 'name') })
  } catch (error) {
    return next(error)
  }
})

router.get('/', async (request, response, next) => {
  try {
    const filter = request.authRole === 'admin'
      ? (request.query.status ? { status: request.query.status, deletedAt: null } : { deletedAt: null })
      : { staffId: request.staffId, deletedAt: null }
    const jobs = await Job.find(filter)
      .sort({ createdAt: -1 })
      .populate('staffId', 'name')
      .populate('approvedBy', 'username')
    return response.json({ jobs })
  } catch (error) {
    return next(error)
  }
})

router.patch('/:id/approve', requireAdmin, async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ error: 'Invalid job id' })
    const existingJob = await Job.findOne({ _id: request.params.id, status: 'pending', deletedAt: null })
    if (!existingJob) return response.status(404).json({ error: 'Pending job not found' })
    if (!existingJob.paymentMethod) return response.status(400).json({ error: 'Select a payment method before approving this job' })
    const job = await Job.findOneAndUpdate(
      { _id: request.params.id, status: 'pending', deletedAt: null },
      { $set: { status: 'approved', approvedAt: new Date(), approvedBy: request.staffId } },
      { new: true },
    ).populate('staffId', 'name').populate('approvedBy', 'username')
    await AuditLog.create({ action: 'approve', entity: 'job', entityId: job._id, actorId: request.staffId, actorRole: request.authRole })
    return response.json({ job })
  } catch (error) {
    return next(error)
  }
})

router.patch('/:id/payment', requireAdmin, async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ error: 'Invalid job id' })
    const paymentMethod = request.body?.paymentMethod
    const receiptReference = typeof request.body?.receiptReference === 'string' ? request.body.receiptReference.trim() : null
    if (!['cash', 'card', 'mobile', 'other'].includes(paymentMethod)) {
      return response.status(400).json({ error: 'A valid payment method is required' })
    }
    const job = await Job.findOneAndUpdate(
      { _id: request.params.id, status: 'pending', deletedAt: null },
      { $set: { paymentMethod, receiptReference } },
      { new: true },
    ).populate('staffId', 'name')
    if (!job) return response.status(404).json({ error: 'Pending job not found' })
    await AuditLog.create({ action: 'update-payment', entity: 'job', entityId: job._id, actorId: request.staffId, actorRole: request.authRole, details: { paymentMethod, receiptReference } })
    return response.json({ job })
  } catch (error) {
    return next(error)
  }
})

router.patch('/:id/void', requireAdmin, async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ error: 'Invalid job id' })
    const voidReason = typeof request.body?.reason === 'string' ? request.body.reason.trim() : ''
    if (!voidReason) return response.status(400).json({ error: 'A void reason is required' })
    const job = await Job.findOneAndUpdate(
      { _id: request.params.id, status: 'pending', deletedAt: null },
      { $set: { status: 'voided', voidReason } },
      { new: true },
    ).populate('staffId', 'name')
    if (!job) return response.status(404).json({ error: 'Pending job not found' })
    await AuditLog.create({ action: 'void', entity: 'job', entityId: job._id, actorId: request.staffId, actorRole: request.authRole, details: { voidReason } })
    return response.json({ job })
  } catch (error) {
    return next(error)
  }
})

router.delete('/:id', requireAdmin, async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) return response.status(400).json({ error: 'Invalid job id' })
    const deleted = await Job.findOneAndUpdate({ _id: request.params.id, deletedAt: null }, { $set: { deletedAt: new Date(), deletedBy: request.staffId } }, { new: true })
    if (!deleted) return response.status(404).json({ error: 'Job not found' })
    await AuditLog.create({ action: 'delete', entity: 'job', entityId: deleted._id, actorId: request.staffId, actorRole: request.authRole })
    return response.json({ deleted: true, id: request.params.id })
  } catch (error) {
    return next(error)
  }
})

export default router
