export default function DailySummaryTable({ jobs }) {
  const today = new Date()
  const isToday = (job) => {
    const createdAt = new Date(job.createdAt)
    return createdAt.getFullYear() === today.getFullYear()
      && createdAt.getMonth() === today.getMonth()
      && createdAt.getDate() === today.getDate()
  }
  const barberSummaries = Array.from(
    jobs.reduce((summaryByStaff, job) => {
      if (!isToday(job)) return summaryByStaff
      const staffId = job.staffId?._id?.toString() ?? job.staffId?.toString() ?? job.barberId?.toString()
      if (!staffId) return summaryByStaff

      const existing = summaryByStaff.get(staffId) ?? {
        id: staffId,
        name: job.staffId?.name ?? job.barberName ?? 'Barber',
        approvedJobs: [],
      }
      if (job.status === 'approved') existing.approvedJobs.push(job)
      summaryByStaff.set(staffId, existing)
      return summaryByStaff
    }, new Map()).values(),
  )

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <p className="card-kicker">Approved earnings</p>
          <h2>Daily summary</h2>
        </div>
        <span className="date-label">{today.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}</span>
      </div>
      <div className="summary-table">
        <div className="summary-row summary-header"><span>Barber</span><span>Jobs</span><span>Earnings</span></div>
        {barberSummaries.map((barber) => {
          const earnings = barber.approvedJobs.reduce((total, job) => total + job.price, 0)
          return (
            <div className="summary-row" key={barber.id}>
              <span className="barber-name"><span className="avatar avatar-small">{barber.name.slice(0, 1)}</span>{barber.name}</span>
              <span>{barber.approvedJobs.length}</span>
              <strong>₦{earnings.toLocaleString()}</strong>
            </div>
          )
        })}
      </div>
    </section>
  )
}
