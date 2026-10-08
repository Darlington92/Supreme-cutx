export default function StaffManager({ staff, onDelete, onToggleActive, onResetPassword }) {
  return (
    <section className="card service-manager">
      <div className="section-heading">
        <div>
          <p className="card-kicker">Team access</p>
          <h2>Barber accounts</h2>
        </div>
        <span className="count-pill">{staff.length} active</span>
      </div>
      <p className="manager-help">Deleting an account is permanent. Existing job and earnings records are kept.</p>
      <div className="service-type-list">
        {staff.map((member) => (
          <div className="service-type-item" key={member.id}>
            <span><strong>{member.name}</strong><small className="staff-username">@{member.username}</small></span>
            <span className="staff-actions">
              <button className="service-remove" type="button" onClick={() => onToggleActive(member)}>{member.active === false ? 'Reactivate' : 'Disable'}</button>
              <button className="service-remove" type="button" onClick={() => onResetPassword(member)}>Reset password</button>
              <button className="service-remove" type="button" onClick={() => onDelete(member)}>Delete account</button>
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
