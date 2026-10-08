import { useEffect, useState } from 'react'
import { getAuditLogs } from '../api'

function formatAction(log) {
  return `${log.actorRole} ${log.action} ${log.entity}`
}

export default function AuditLog() {
  const [logs, setLogs] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    getAuditLogs()
      .then(({ auditLogs }) => setLogs(auditLogs))
      .catch((loadError) => setError(loadError.message))
  }, [])

  return (
    <section className="card audit-card">
      <div className="section-heading">
        <div>
          <p className="card-kicker">Accountability</p>
          <h2>Recent activity</h2>
        </div>
        <span className="count-pill">{logs.length} shown</span>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {!error && logs.length === 0 && <p className="empty-state">No activity has been recorded yet.</p>}
      <div className="audit-list">
        {logs.map((log) => (
          <div className="audit-row" key={log._id}>
            <div>
              <strong>{formatAction(log)}</strong>
              <span>{new Date(log.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
            <small>{log.actorId} {log.details?.voidReason ? `· ${log.details.voidReason}` : ''}</small>
          </div>
        ))}
      </div>
    </section>
  )
}
