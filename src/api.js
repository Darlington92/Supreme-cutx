import { apiBaseUrl } from './config'

import { getAdminToken, getAuthToken } from './auth'

export async function apiRequest(path, options = {}) {
  const token = options.token ?? getAuthToken()
  const headers = new Headers(options.headers)

  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response
  try {
    response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers })
  } catch {
    throw new Error('Cannot reach the API. Start the backend and verify MongoDB is connected.')
  }

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error ?? 'API request failed')
  return payload
}

export function getJobs() {
  return apiRequest('/jobs')
}

export function getAdminJobs() {
  return apiRequest('/jobs', { token: getAdminToken() })
}

export function getStaff(includeDisabled = false) {
  return apiRequest(`/staff${includeDisabled ? '?includeDisabled=true' : ''}`, { token: getAdminToken() })
}

export function deleteStaff(staffId) {
  return apiRequest(`/staff/${staffId}`, { method: 'DELETE', token: getAdminToken() })
}

export function setStaffActive(staffId, active) {
  return apiRequest(`/staff/${staffId}/${active ? 'reactivate' : 'disable'}`, { method: 'PATCH', token: getAdminToken() })
}

export function resetStaffPassword(staffId, password) {
  return apiRequest(`/staff/${staffId}/reset-password`, { method: 'POST', token: getAdminToken(), body: JSON.stringify({ password }) })
}

export function createJob(job, token) {
  return apiRequest('/jobs', { method: 'POST', token, body: JSON.stringify(job) })
}

export function approveJob(jobId) {
  return apiRequest(`/jobs/${jobId}/approve`, { method: 'PATCH', token: getAdminToken() })
}

export function updateJobPayment(jobId, paymentMethod, receiptReference) {
  return apiRequest(`/jobs/${jobId}/payment`, {
    method: 'PATCH',
    token: getAdminToken(),
    body: JSON.stringify({ paymentMethod, receiptReference }),
  })
}

export function voidJob(jobId, reason) {
  return apiRequest(`/jobs/${jobId}/void`, {
    method: 'PATCH',
    token: getAdminToken(),
    body: JSON.stringify({ reason }),
  })
}

export function deleteJob(jobId) {
  return apiRequest(`/jobs/${jobId}`, { method: 'DELETE', token: getAdminToken() })
}

export function getServiceTypes(includeDeleted = false, token) {
  return apiRequest(`/service-types${includeDeleted ? '?includeDeleted=true' : ''}`, { token })
}

export function createServiceType(name) {
  return apiRequest('/service-types', {
    method: 'POST',
    token: getAdminToken(),
    body: JSON.stringify({ name }),
  })
}

export function deleteServiceType(serviceTypeId) {
  return apiRequest(`/service-types/${serviceTypeId}`, { method: 'DELETE', token: getAdminToken() })
}

export function getDailyReport(date) {
  return apiRequest(`/reports/daily?date=${encodeURIComponent(date)}`, { token: getAdminToken() })
}

export function getAuditLogs(limit = 100) {
  return apiRequest(`/audit-logs?limit=${encodeURIComponent(limit)}`, { token: getAdminToken() })
}
