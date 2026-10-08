import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login, signup } from '../auth'

export default function AuthScreen({ mode = 'login' }) {
  const isSignup = mode === 'signup'
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', username: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const staff = isSignup
        ? await signup(form.name, form.username, form.password)
        : await login(form.username, form.password)
      navigate(`/barber/${staff.id}`)
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
        <div className="brand brand-large auth-brand">
          <span className="brand-mark">SC</span>
          <span>Supreme Cutx</span>
        </div>
        <div className="login-copy">
          <p className="eyebrow">{isSignup ? 'New staff account' : 'Staff sign in'}</p>
          <h1>{isSignup ? <>Join the<br /><em>shop floor.</em></> : <>Welcome<br /><em>back.</em></>}</h1>
          <p>{isSignup ? 'Create your account to start logging completed services.' : 'Sign in with your username to continue to your workspace.'}</p>
        </div>
        <form className="job-form auth-form" onSubmit={handleSubmit}>
          {isSignup && (
            <label>
              Your name
              <input name="name" value={form.name} onChange={updateField} autoComplete="name" required />
            </label>
          )}
          <label>
            Username
            <input name="username" value={form.username} onChange={updateField} autoComplete="username" minLength="3" required />
          </label>
          <label>
            Password
            <input name="password" value={form.password} onChange={updateField} type="password" minLength="8" autoComplete={isSignup ? 'new-password' : 'current-password'} required />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
          </button>
        </form>
        <p className="auth-switch">
          {isSignup ? 'Already have an account?' : 'New to the shop?'}{' '}
          <Link to={isSignup ? '/login' : '/signup'}>{isSignup ? 'Sign in' : 'Create an account'}</Link>
        </p>
        {!isSignup && (
          <Link className="cashier-link" to="/cashier" aria-label="Admin login">
            Admin login →
          </Link>
        )}
      </div>
      <div className="login-art"><span className="art-circle"></span><span className="art-word">{isSignup ? <>CUT<br />TOGETHER.</> : <>CUT<br />CASH<br />CLEAR.</>}</span></div>
    </div>
  )
}
