import { Link, useNavigate } from 'react-router-dom'
import { logout } from '../auth'

export default function Layout({ eyebrow, title, subtitle, children, userName, role, isAdmin, onLogout }) {
  const navigate = useNavigate()
  function handleLogout() {
    if (onLogout) onLogout()
    else logout()
    navigate('/login')
  }
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/" aria-label="Supreme Cutx home">
          <span className="brand-mark">SC</span>
          <span>Supreme Cutx</span>
        </Link>
        {userName && <div className="user-chip">
          <span className="avatar">{userName.slice(0, 1)}</span>
          <span className="user-chip-copy">
            <strong>{userName}</strong>
            <small>{role}</small>
          </span>
          <button className="logout-button" type="button" onClick={handleLogout}>Log out</button>
        </div>}
        {isAdmin && <button className="logout-button" type="button" onClick={handleLogout}>Log out</button>}
      </header>
      <main className="page-content">
        <div className="page-heading">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>
        {children}
      </main>
    </div>
  )
}
