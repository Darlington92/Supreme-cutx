import { useEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { jobs as initialJobs } from './data/mockJobs'
import { defaultServiceTypes, normalizeServiceTypes, readServiceTypes } from './data/serviceTypes'
import BarberPicker from './screens/BarberPicker'
import BarberView from './screens/BarberView'
import AdminDashboard from './screens/AdminDashboard'
import AdminGate from './screens/AdminGate'
import AuthScreen from './screens/AuthScreen'
import { adminLogin, getAdminToken, logout } from './auth'
import { approveJob as approveJobRequest, createJob, createServiceType, deleteJob, deleteServiceType, deleteStaff, getAdminJobs, getServiceTypes, getStaff, resetStaffPassword, setStaffActive, updateJobPayment, voidJob as voidJobRequest } from './api'
import { queueOfflineJob, readOfflineJobs, removeOfflineJob } from './offlineQueue'

function normalizeJob(job) {
  const staffId = job.staffId?._id ?? job.staffId
  return { ...job, id: job._id ?? job.id, barberId: staffId?.toString() }
}

export default function App() {
  const [jobs, setJobs] = useState(initialJobs)
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(() => Boolean(getAdminToken()))
  const [staff, setStaff] = useState([])
  const [serviceTypes, setServiceTypes] = useState(() => readServiceTypes())
  const recentJobSubmissionRef = useRef(new Map())

  useEffect(() => {
    async function syncOfflineJobs() {
      for (const queuedJob of readOfflineJobs()) {
        try {
          const { clientId, ...payload } = queuedJob
          const { job } = await createJob(payload)
          setJobs((currentJobs) => [...currentJobs.filter((item) => item.id !== clientId), normalizeJob(job)])
          removeOfflineJob(clientId)
        } catch {
          break
        }
      }
    }

    window.addEventListener('online', syncOfflineJobs)
    syncOfflineJobs()
    return () => window.removeEventListener('online', syncOfflineJobs)
  }, [])

  useEffect(() => {
    const adminToken = getAdminToken()
    if (!adminToken) return

    async function refreshAdminData() {
      try {
        const [{ jobs: storedJobs }, { staff: storedStaff }, { serviceTypes: storedServiceTypes }] = await Promise.all([
          getAdminJobs(),
          getStaff(),
          getServiceTypes(),
        ])
        setJobs(storedJobs.map(normalizeJob))
        setStaff(storedStaff.map((member) => ({ ...member, id: member._id })))
        setServiceTypes(normalizeServiceTypes(storedServiceTypes.map((item) => ({ ...item, id: item._id }))))
        setIsAdminUnlocked(true)
      } catch {
        localStorage.removeItem('adminToken')
        setIsAdminUnlocked(false)
      }
    }

    refreshAdminData()
    const refreshInterval = window.setInterval(refreshAdminData, 10000)
    window.addEventListener('focus', refreshAdminData)
    return () => {
      window.clearInterval(refreshInterval)
      window.removeEventListener('focus', refreshAdminData)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    getServiceTypes(false, token)
      .then(({ serviceTypes: storedServiceTypes }) => {
        setServiceTypes(normalizeServiceTypes(storedServiceTypes.map((item) => ({ ...item, id: item._id }))))
      })
      .catch(() => {})
  }, [])

  function updateServiceTypes(nextServiceTypes) {
    const next = nextServiceTypes.length > 0 ? nextServiceTypes : defaultServiceTypes
    setServiceTypes(next)
    localStorage.setItem('serviceTypes', JSON.stringify(next))
  }

  async function addJob({ barberId, serviceType, price, paymentMethod, receiptReference, isAdmin = false }) {
    const normalizedReceipt = String(receiptReference ?? '').trim()
    const dedupeKey = JSON.stringify([barberId ?? '', serviceType, Number(price), paymentMethod ?? '', normalizedReceipt])
    const lastSubmissionAt = recentJobSubmissionRef.current.get(dedupeKey)
    const now = Date.now()

    if (lastSubmissionAt && now - lastSubmissionAt < 2000) {
      return
    }

    recentJobSubmissionRef.current.set(dedupeKey, now)
    window.setTimeout(() => recentJobSubmissionRef.current.delete(dedupeKey), 2500)

    const payload = { serviceType, price, paymentMethod, receiptReference: normalizedReceipt, ...(isAdmin ? { staffId: barberId } : {}) }
    try {
      const { job } = await createJob(payload, isAdmin ? getAdminToken() : undefined)
      setJobs((currentJobs) => [...currentJobs, normalizeJob({ ...job, staffId: job.staffId ?? barberId })])
    } catch (error) {
      if (isAdmin || !error.message.startsWith('Cannot reach')) throw error
      const offlineJob = {
        ...payload,
        barberId,
        clientId: `offline-${Date.now()}`,
        id: `offline-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'pending',
        approvedBy: null,
        approvedAt: null,
      }
      queueOfflineJob(offlineJob)
      setJobs((currentJobs) => [...currentJobs, offlineJob])
    }
  }

  async function removeJob(jobId) {
    await deleteJob(jobId)
    setJobs((currentJobs) => currentJobs.filter((job) => job.id !== jobId && job._id !== jobId))
  }

  async function approveJob(jobId) {
    const { job } = await approveJobRequest(jobId)
    setJobs((currentJobs) => currentJobs.map((item) => item.id === jobId ? normalizeJob(job) : item))
  }

  async function saveJobPayment(jobId, paymentMethod, receiptReference) {
    const { job } = await updateJobPayment(jobId, paymentMethod, receiptReference)
    setJobs((currentJobs) => currentJobs.map((item) => item.id === jobId ? normalizeJob(job) : item))
  }

  async function voidJob(jobId, reason) {
    const { job } = await voidJobRequest(jobId, reason)
    setJobs((currentJobs) => currentJobs.map((item) => item.id === jobId ? normalizeJob(job) : item))
  }

  async function removeStaff(member) {
    if (!window.confirm(`Permanently delete ${member.name}'s account? Existing job history will remain.`)) return
    await deleteStaff(member.id)
    setStaff((currentStaff) => currentStaff.filter((item) => item.id !== member.id))
  }

  async function toggleStaff(member) {
    const { staff: updated } = await setStaffActive(member.id, member.active === false)
    setStaff((current) => current.map((item) => item.id === member.id ? { ...item, ...updated, id: updated._id ?? member.id } : item))
  }

  async function resetPassword(member) {
    const password = window.prompt(`Enter a new password for ${member.name} (at least 8 characters):`)
    if (!password) return
    await resetStaffPassword(member.id, password)
    window.alert('Password reset successfully.')
  }

  async function addServiceType(name) {
    const { serviceType } = await createServiceType(name)
    setServiceTypes((current) => {
      const next = [...current, { ...serviceType, id: serviceType._id }]
      localStorage.setItem('serviceTypes', JSON.stringify(next))
      return next
    })
  }

  async function removeServiceType(serviceType) {
    if (typeof serviceType === 'string') {
      setServiceTypes((current) => current.filter((item) => item !== serviceType))
      return
    }
    await deleteServiceType(serviceType.id ?? serviceType._id)
    setServiceTypes((current) => {
      const next = normalizeServiceTypes(current.filter((item) => (item.id ?? item._id) !== (serviceType.id ?? serviceType._id)))
      localStorage.setItem('serviceTypes', JSON.stringify(next))
      return next
    })
  }

  async function unlockAdmin(username, password) {
    await adminLogin(username, password)
    setIsAdminUnlocked(true)
    const { jobs: storedJobs } = await getAdminJobs()
    setJobs(storedJobs.map(normalizeJob))
    const { staff: storedStaff } = await getStaff()
    setStaff(storedStaff.map((member) => ({ ...member, id: member._id })))
    const { serviceTypes: storedServiceTypes } = await getServiceTypes()
    setServiceTypes(normalizeServiceTypes(storedServiceTypes.map((item) => ({ ...item, id: item._id }))))
  }

  return (
    <Routes>
      <Route path="/" element={<BarberPicker />} />
      <Route path="/login" element={<AuthScreen mode="login" />} />
      <Route path="/signup" element={<AuthScreen mode="signup" />} />
      <Route path="/barber/:barberId" element={<BarberView jobs={jobs} setJobs={setJobs} addJob={addJob} serviceTypes={serviceTypes} />} />
      <Route path="/cashier" element={<AdminGate unlockAdmin={unlockAdmin} />} />
      <Route path="/admin" element={isAdminUnlocked
        ? <AdminDashboard jobs={jobs} users={staff} serviceTypes={serviceTypes} onAddServiceType={addServiceType} onRemoveServiceType={removeServiceType} onDeleteStaff={removeStaff} onToggleStaff={toggleStaff} onResetPassword={resetPassword} onApproveJob={approveJob} onSaveJobPayment={saveJobPayment} onVoidJob={voidJob} onDeleteJob={removeJob} onLogout={() => { logout(); setIsAdminUnlocked(false) }} />
        : <Navigate to="/cashier" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
