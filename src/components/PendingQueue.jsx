import { useState } from 'react'
import StatusBadge from './StatusBadge'

export default function PendingQueue({ jobs, users, onApproveJob, onSaveJobPayment, onVoidJob, onDeleteJob }) {
  const [actionError, setActionError] = useState('')
  const [paymentSelections, setPaymentSelections] = useState({})
  const [receiptSelections, setReceiptSelections] = useState({})

  async function runAction(action) {
    setActionError('')
    try {
      await action()
    } catch (error) {
      setActionError(error.message)
    }
  }

  return (
    <section className="card queue-card">
      <div className="section-heading">
        <div>
          <p className="card-kicker">Needs attention</p>
          <h2>Pending approval</h2>
        </div>
        <span className="count-pill count-warning">{jobs.length} waiting</span>
      </div>
      {actionError && <p className="form-error" role="alert">{actionError}</p>}
      <div className="queue-list">
        {jobs.map((job) => {
          const jobId = job.id ?? job._id
          const selectedPayment = paymentSelections[jobId] ?? job.paymentMethod ?? ''
          const selectedReceipt = receiptSelections[jobId] ?? job.receiptReference ?? ''
          const barber = job.staffId?.name
            ? { name: job.staffId.name }
            : users.find((user) => user.id === job.barberId)
          return (
            <div className="queue-row" key={job.id}>
              <div className="queue-main">
                <span className="avatar avatar-small">{barber?.name.slice(0, 1)}</span>
                <div className="job-details">
                  <strong>{barber?.name}</strong>
                  <span>{job.serviceType} · {new Date(job.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                </div>
              </div>
              <div className="queue-actions">
                <strong>₦{job.price.toLocaleString()}</strong>
                <StatusBadge status={job.status} />
                <select
                  value={selectedPayment}
                  onChange={(event) => setPaymentSelections((current) => ({ ...current, [jobId]: event.target.value }))}
                  aria-label={`Payment method for ${job.serviceType}`}
                >
                  <option value="">Payment not specified</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="mobile">Mobile transfer</option>
                  <option value="other">Other</option>
                </select>
                <input
                  value={selectedReceipt}
                  onChange={(event) => setReceiptSelections((current) => ({ ...current, [jobId]: event.target.value }))}
                  placeholder="Receipt reference (optional)"
                  aria-label={`Receipt reference for ${job.serviceType}`}
                  maxLength="100"
                />
                <div className="action-buttons">
                  <button
                    className="button button-secondary"
                    type="button"
                    disabled={!selectedPayment}
                    onClick={() => runAction(() => onSaveJobPayment(jobId, selectedPayment, selectedReceipt.trim()))}
                  >
                    Save payment
                  </button>
                  <button
                    className="button button-approve"
                    type="button"
                    disabled={!selectedPayment}
                    onClick={() => runAction(() => onApproveJob(jobId))}
                  >
                    Approve
                  </button>
                  <button
                    className="button button-void"
                    type="button"
                    onClick={() => {
                      const reason = window.prompt('Why is this job being voided?')
                      if (reason?.trim()) runAction(() => onVoidJob(job.id ?? job._id, reason.trim()))
                    }}
                  >
                    Void
                  </button>
                  <button
                    className="button button-delete"
                    type="button"
                    onClick={() => {
                      if (window.confirm('Remove this job permanently?')) {
                        runAction(() => onDeleteJob(job.id ?? job._id))
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
