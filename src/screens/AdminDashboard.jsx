import Layout from '../components/Layout'
import PendingQueue from '../components/PendingQueue'
import DailySummaryTable from '../components/DailySummaryTable'
import ServiceTypeManager from '../components/ServiceTypeManager'
import StaffManager from '../components/StaffManager'
import AdminUserManager from '../components/AdminUserManager'
import JobHistory from '../components/JobHistory'
import AuditLog from '../components/AuditLog'

export default function AdminDashboard({ jobs, users, serviceTypes, onAddServiceType, onRemoveServiceType, onDeleteStaff, onToggleStaff, onResetPassword, onApproveJob, onSaveJobPayment, onVoidJob, onDeleteJob, onLogout }) {
  const pendingJobs = jobs.filter((job) => job.status === 'pending')
  const today = new Date()
  const todaysJobs = jobs.filter((job) => {
    const createdAt = new Date(job.createdAt)
    return createdAt.getFullYear() === today.getFullYear()
      && createdAt.getMonth() === today.getMonth()
      && createdAt.getDate() === today.getDate()
  })
  function exportJobs() {
    const headers = ['id', 'barberId', 'serviceType', 'price', 'status', 'paymentMethod', 'receiptReference', 'createdAt']
    const rows = jobs.map((job) => headers.map((header) => JSON.stringify(job[header] ?? '')).join(','))
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `supreme-cutx-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Layout eyebrow="Front desk" title="Daily overview" subtitle="Confirm payment before approving a job. Approved work rolls into each barber’s earnings." isAdmin onLogout={onLogout}>
      <div className="admin-stats">
        <div className="stat-card"><span>Waiting approval</span><strong>{pendingJobs.length}</strong><small>jobs to review</small></div>
        <div className="stat-card"><span>Approved today</span><strong>{todaysJobs.filter((job) => job.status === 'approved').length}</strong><small>confirmed jobs</small></div>
        <div className="stat-card"><span>Collected today</span><strong>₦{todaysJobs.filter((job) => job.status === 'approved').reduce((total, job) => total + job.price, 0).toLocaleString()}</strong><small>approved earnings</small></div>
      </div>
      <div className="toolbar">
        <button className="button button-secondary" type="button" onClick={exportJobs}>Export job records (CSV)</button>
      </div>
      <div className="content-grid admin-grid">
        <ServiceTypeManager serviceTypes={serviceTypes} onAdd={onAddServiceType} onRemove={onRemoveServiceType} />
        <AdminUserManager />
        <StaffManager staff={users} onDelete={onDeleteStaff} onToggleActive={onToggleStaff} onResetPassword={onResetPassword} />
        <PendingQueue jobs={pendingJobs} users={users} onApproveJob={onApproveJob} onSaveJobPayment={onSaveJobPayment} onVoidJob={onVoidJob} onDeleteJob={onDeleteJob} />
        <DailySummaryTable jobs={jobs} />
        <JobHistory jobs={jobs} users={users} />
        <AuditLog />
      </div>
    </Layout>
  )
}
