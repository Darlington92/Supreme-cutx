import { Link } from 'react-router-dom'

export default function BarberPicker() {
  return (
    <div className="login-shell">
      <div className="login-panel">
        <div className="brand brand-large">
          <span className="brand-mark">SC</span>
          <span>Supreme Cutx</span>
        </div>
        <div className="login-copy">
          <p className="eyebrow">Today&apos;s workspace</p>
          <h1>Who&apos;s<br /><em>on the chair?</em></h1>
          <p>Sign in with your own account to log completed services from your workspace.</p>
        </div>
        <div className="auth-links picker-auth-links">
          <Link className="button button-primary" to="/login">Staff sign in</Link>
          <Link className="text-link" to="/signup">Create a staff account</Link>
        </div>
        <Link className="cashier-link" to="/cashier">Admin login →</Link>
        <p className="demo-note">Shared shop device · Choose your name to begin</p>
      </div>
      <div className="login-art"><span className="art-circle"></span><span className="art-word">CUT<br />CASH<br />CLEAR.</span></div>
    </div>
  )
}
