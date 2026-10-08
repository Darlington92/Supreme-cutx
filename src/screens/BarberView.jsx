import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import JobForm from '../components/JobForm'
import JobList from '../components/JobList'
import { getCurrentBarber } from '../auth'
import { getJobs } from '../api'

function normalizeJob(job) {
  const staffId = job.staffId?._id ?? job.staffId
  return { ...job, id: job._id ?? job.id, barberId: staffId?.toString() }
}

export default function BarberView({ jobs, setJobs, addJob, serviceTypes }) {
  const { barberId } = useParams()
  const currentBarber = getCurrentBarber()
  const [loadError, setLoadError] = useState('')
  const [currentTime, setCurrentTime] = useState(() => Date.now())

  useEffect(() => {
    if (!currentBarber || currentBarber.id !== barberId) return
    getJobs()
      .then(({ jobs: storedJobs }) => {
        setJobs(storedJobs.map(normalizeJob))
      })
      .catch((error) => setLoadError(error.message))
  }, [barberId, currentBarber, setJobs])

  useEffect(() => {
    const refreshTime = window.setInterval(() => setCurrentTime(Date.now()), 60000)
    return () => window.clearInterval(refreshTime)
  }, [])

  if (!currentBarber || currentBarber.id !== barberId) {
    return <Navigate to="/login" replace />
  }

  const barber = currentBarber

  const dayAgo = currentTime - 24 * 60 * 60 * 1000
  const barberJobs = jobs.filter((job) => {
    const createdAt = Date.parse(job.createdAt ?? '')
    return job.barberId === barber.id && Number.isFinite(createdAt) && createdAt >= dayAgo
  })
  return (
    <Layout eyebrow="Barber workspace" title={`Good morning, ${barber.name}.`} subtitle="Log each service as soon as it’s complete. The front desk will confirm payment." userName={barber.name} role="Barber">
      <Link className="text-link" to="/">← Switch barber</Link>
      {loadError && <p className="form-error" role="alert">{loadError}</p>}
      <div className="content-grid barber-grid">
        <JobForm serviceTypes={serviceTypes} onAddJob={(job) => addJob({ ...job, barberId: barber.id })} />
        <JobList jobs={barberJobs} barberName={barber.name} />
      </div>
    </Layout>
  )
}
