import { useState } from 'react'
import { createAdminUser } from '../auth'

export default function AdminUserManager() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setError('')
    try {
      await createAdminUser(username, password)
      setUsername('')
      setPassword('')
      setMessage('Dashboard user created successfully.')
    } catch (submitError) {
      setError(submitError.message)
    }
  }

  return (
    <section className="card service-manager">
      <div className="section-heading">
        <div>
          <p className="card-kicker">Dashboard access</p>
          <h2>Add admin user</h2>
        </div>
      </div>
      <p className="manager-help">Create a separate username and password for another trusted dashboard user.</p>
      <form className="job-form" onSubmit={handleSubmit}>
        <label>
          Username
          <input value={username} onChange={(event) => setUsername(event.target.value)} minLength="3" required />
        </label>
        <label>
          Temporary password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength="8" required />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        {message && <p className="form-success" role="status">{message}</p>}
        <button className="button button-primary" type="submit">Create dashboard user</button>
      </form>
    </section>
  )
}
