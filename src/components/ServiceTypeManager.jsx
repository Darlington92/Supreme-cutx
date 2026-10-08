import { useState } from 'react'

export default function ServiceTypeManager({ serviceTypes, onAdd, onRemove }) {
  const [newServiceType, setNewServiceType] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    const serviceType = newServiceType.trim()
    if (!serviceType) return
    if (serviceTypes.some((item) => (typeof item === 'string' ? item : item.name).toLowerCase() === serviceType.toLowerCase())) {
      setError('That service type already exists')
      return
    }
    await onAdd(serviceType)
    setNewServiceType('')
    setError('')
  }

  return (
    <section className="card service-manager">
      <div className="section-heading">
        <div>
          <p className="card-kicker">Shop setup</p>
          <h2>Service types</h2>
        </div>
        <span className="step-number">01</span>
      </div>
      <p className="manager-help">Add or remove the services that barbers can select when logging a job.</p>
      <form className="service-add-form" onSubmit={handleSubmit}>
        <input
          value={newServiceType}
          onChange={(event) => setNewServiceType(event.target.value)}
          placeholder="e.g. Hair coloring"
          maxLength="60"
          aria-label="New service type"
        />
        <button className="button button-primary" type="submit">Add</button>
      </form>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="service-type-list">
        {serviceTypes.map((serviceType) => (
          <div className="service-type-item" key={typeof serviceType === 'string' ? serviceType : serviceType.id ?? serviceType._id}>
            <span>{typeof serviceType === 'string' ? serviceType : serviceType.name}</span>
            <button className="service-remove" type="button" onClick={() => onRemove(serviceType)} aria-label={`Remove ${typeof serviceType === 'string' ? serviceType : serviceType.name}`}>
              Remove
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
