import StatusBadge from './StatusBadge'

export default function JobList({ jobs, barberName }) {
  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <p className="card-kicker">Today · 11 Sep 2026</p>
          <h2>{barberName}&apos;s jobs</h2>
        </div>
        <span className="count-pill">{jobs.length} jobs</span>
      </div>
      <div className="job-list">
        {jobs.map((job) => (
          <div className="job-row" key={job.id}>
            <div className="job-icon">✦</div>
            <div className="job-details">
              <strong>{job.serviceType}</strong>
              <span>{new Date(job.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
              {job.status === 'approved' && (
                <span>Approved by: {job.approvedBy?.username ?? (typeof job.approvedBy === 'string' ? job.approvedBy : 'Admin record unavailable')}</span>
              )}
            </div>
            <div className="job-amount">
              <strong>₦{job.price.toLocaleString()}</strong>
              <StatusBadge status={job.status} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
