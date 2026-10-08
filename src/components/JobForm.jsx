import { useEffect, useRef, useState } from 'react'

export default function JobForm({ onAddJob, users = [], serviceTypes, isAdmin = false }) {
  const [barberId, setBarberId] = useState(users[0]?.id ?? '')
  const serviceName = (item) => typeof item === 'string' ? item : item?.name
  const [serviceType, setServiceType] = useState('')
  const [price, setPrice] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [receiptReference, setReceiptReference] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const recentSubmissionsRef = useRef(new Map())

  useEffect(() => {
    const firstService = serviceName(serviceTypes?.[0])
    if (firstService && serviceType && !serviceTypes.some((item) => serviceName(item) === serviceType)) {
      setServiceType(firstService)
    }
  }, [serviceTypes, serviceType])

  async function handleSubmit(event) {
    event.preventDefault()

    const numericPrice = Number(price)
    if (!serviceType || !Number.isFinite(numericPrice) || numericPrice <= 0) return

    const dedupeKey = JSON.stringify([barberId, serviceType, numericPrice, paymentMethod, receiptReference.trim()])
    const lastSubmissionAt = recentSubmissionsRef.current.get(dedupeKey)
    const now = Date.now()

    if (lastSubmissionAt && now - lastSubmissionAt < 2000) {
      return
    }

    recentSubmissionsRef.current.set(dedupeKey, now)
    window.setTimeout(() => recentSubmissionsRef.current.delete(dedupeKey), 2500)

    setIsSaving(true)
    setServiceType('')
    setPrice('')
    setPaymentMethod('')
    setReceiptReference('')

    try {
      await onAddJob({ serviceType, price: numericPrice, paymentMethod, receiptReference: receiptReference.trim(), barberId })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="card form-card">
      <div className="section-heading">
        <div>
          <p className="card-kicker">New docket</p>
          <h2>Log a service</h2>
        </div>
        <span className="step-number">01</span>
      </div>
      <form className="job-form" onSubmit={handleSubmit}>
        {isAdmin && <label>
          Barber
          <select value={barberId} onChange={(event) => setBarberId(event.target.value)} required>
            {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
          </select>
        </label>}
        <label>
          Service type
          <select value={serviceType} onChange={(event) => setServiceType(event.target.value)} required>
            <option value="" disabled>Select a service</option>
            {(serviceTypes ?? ['Haircut']).map((item) => <option key={serviceName(item)} value={serviceName(item)}>{serviceName(item)}</option>)}
          </select>
        </label>
        <label>
          Price
          <div className="input-with-prefix">
            <span>₦</span>
            <input type="number" value={price} onChange={(event) => setPrice(event.target.value)} min="1" step="1" required />
          </div>
        </label>
        <label>
          Payment method
          <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
            <option value="">Not specified yet</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="mobile">Mobile transfer</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label>
          Receipt reference <span className="optional-label">(optional)</span>
          <input value={receiptReference} onChange={(event) => setReceiptReference(event.target.value)} maxLength="100" placeholder="Receipt or transfer reference" />
        </label>
        <button className="button button-primary" type="submit" disabled={isSaving || !serviceType || !price}>
          {isSaving ? 'Saving…' : 'Add job'}
        </button>
      </form>
    </section>
  )
}
