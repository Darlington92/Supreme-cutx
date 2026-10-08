import { useMemo, useState } from 'react'
import StatusBadge from './StatusBadge'

function getBarberName(job, users) {
  return job.staffId?.name ?? users.find((user) => user.id === job.barberId)?.name ?? 'Unknown barber'
}

export default function JobHistory({ jobs, users }) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase()
    return jobs.filter((job) => {
      const barberName = getBarberName(job, users)
      const matchesStatus = statusFilter === 'all' || job.status === statusFilter
      const matchesSearch = !query
        || barberName.toLowerCase().includes(query)
        || job.serviceType.toLowerCase().includes(query)
        || job.receiptReference?.toLowerCase().includes(query)
      return matchesStatus && matchesSearch
    })
  }, [jobs, search, statusFilter, users])

  return (
    <section className="card history-card">
      <div className="section-heading">
        <div>
          <p className="card-kicker">All recorded work</p>
          <h2>Job history</h2>
        </div>
        <span className="count-pill">{filteredJobs.length} shown</span>
      </div>
      <div className="history-filters">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search barber, service or receipt" aria-label="Search job history" />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter job history by status">
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="voided">Voided</option>
        </select>
      </div>
      {filteredJobs.length === 0 ? (
        <p className="empty-state">No jobs match this history filter.</p>
      ) : (
        <div className="history-list">
          {filteredJobs.map((job) => (
            <div className="history-row" key={job.id ?? job._id}>
              <div className="job-details">
                <strong>{getBarberName(job, users)} · {job.serviceType}</strong>
                <span>{new Date(job.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                {job.receiptReference && <span>Receipt: {job.receiptReference}</span>}
                {job.status === 'approved' && (
                  <span>Approved by: {job.approvedBy?.username ?? (typeof job.approvedBy === 'string' ? job.approvedBy : 'Admin record unavailable')}</span>
                )}
              </div>
              <div className="history-meta">
                <strong>₦{Number(job.price).toLocaleString()}</strong>
                <StatusBadge status={job.status} />
                {job.paymentMethod && <small>{job.paymentMethod}</small>}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
