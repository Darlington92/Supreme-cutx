import { Link } from 'react-router-dom'
import { users } from '../data/mockUsers'

export default function LoginScreen() {
  return (
    <div className="login-shell">
      <div className="login-panel">
        <div className="brand brand-large"><span className="brand-mark">SC</span><span>Supreme Cutx</span></div>
        <div className="login-copy">
          <p className="eyebrow">Welcome back</p>
          <h1>Keep every cut<br /><em>on the record.</em></h1>
          <p>Select a profile to preview the barber or front desk experience.</p>
        </div>
        <div className="profile-list">
          {users.map((user) => (
            <Link className="profile-option" to={user.role === 'admin' ? '/admin' : '/barber'} key={user.id}>
              <span className="avatar">{user.name.slice(0, 1)}</span>
              <span><strong>{user.name}</strong><small>{user.role === 'admin' ? 'Cashier / Admin' : 'Barber'}</small></span>
              <span className="arrow">→</span>
            </Link>
          ))}
        </div>
        <p className="demo-note">Demo mode · No password required</p>
      </div>
      <div className="login-art"><span className="art-circle"></span><span className="art-word">CUT<br />CASH<br />CLEAR.</span></div>
    </div>
  )
}
