const statusLabels = {
  pending: 'Pending',
  approved: 'Approved',
  voided: 'Voided',
}

export default function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}>{statusLabels[status]}</span>
}
