import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { adminSignup, isAdminConfigured } from '../auth'

export default function AdminGate({ unlockAdmin }) {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isConfigured, setIsConfigured] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    isAdminConfigured()
      .then(setIsConfigured)
      .catch((setupError) => setError(setupError.message))
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      if (!isConfigured) {
        await adminSignup(username, password)
        // Setup returns a token, but loading the dashboard also needs the
        // shared admin state populated by the normal unlock flow.
        await unlockAdmin(username, password)
      } else {
        await unlockAdmin(username, password)
      }
      navigate('/admin', { replace: true })
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-shell">
      <div className="login-panel">
        <Link className="back-link" to="/">← Back to barber picker</Link>
        <div className="brand brand-large gate-brand">
          <span className="brand-mark">SC</span>
          <span>Supreme Cutx</span>
        </div>
        <div className="login-copy">
          <p className="eyebrow">{isConfigured ? 'Admin login' : 'Initial admin setup'}</p>
          <h1>{isConfigured ? <>Confirm the<br /><em>day&apos;s takings.</em></> : <>Set up the<br /><em>admin account.</em></>}</h1>
          <p>{isConfigured ? 'Enter your admin credentials to review and approve paid jobs.' : 'Create the first admin account. Additional admin users can be added from the dashboard.'}</p>
        </div>
        <form className="job-form gate-form" onSubmit={handleSubmit}>
          <label>
            Admin username
            <input type="text" placeholder="Enter username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" autoFocus required minLength="3" disabled={isConfigured === null} />
          </label>
          <label>
            {isConfigured ? 'Admin password' : 'Create admin password'}
            <input type="password" placeholder={isConfigured ? 'Enter password' : 'At least 8 characters'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required minLength="8" disabled={isConfigured === null} />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary" type="submit" disabled={isSubmitting || isConfigured === null}>{isSubmitting ? 'Please wait…' : isConfigured ? 'Sign in to dashboard' : 'Create admin account'}</button>
        </form>
        <p className="demo-note">Admin passwords are securely hashed on the server</p>
      </div>
      <div className="login-art"><span className="art-circle"></span><span className="art-word">CHECK<br />THEN<br />CLEAR.</span></div>
    </div>
  )
}
