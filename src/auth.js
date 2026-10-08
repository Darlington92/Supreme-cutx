import { apiBaseUrl } from './config'

const tokenKey = 'token'
const staffKey = 'currentStaff'
const adminTokenKey = 'adminToken'

async function requestAuth(path, body) {
  let response
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('Cannot reach the authentication server. Start the backend and verify MongoDB is connected.')
  }

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.error ?? 'Authentication request failed')
  }

  localStorage.setItem(tokenKey, payload.token)
  localStorage.setItem(staffKey, JSON.stringify(payload.staff))
  return payload.staff
}

export function signup(name, username, password) {
  return requestAuth('/auth/signup', { name, username, password })
}

export function login(username, password) {
  return requestAuth('/auth/login', { username, password })
}

export function logout() {
  localStorage.removeItem(tokenKey)
  localStorage.removeItem(staffKey)
  localStorage.removeItem(adminTokenKey)
}

export function getCurrentBarber() {
  const storedStaff = localStorage.getItem(staffKey)
  if (!storedStaff) return null

  try {
    return JSON.parse(storedStaff)
  } catch {
    logout()
    return null
  }
}

export function getAuthToken() {
  return localStorage.getItem(tokenKey)
}

export function getAdminToken() {
  return localStorage.getItem(adminTokenKey)
}

async function requestAdminAuth(path, username, password) {
  let response
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
  } catch {
    throw new Error('Cannot reach the cashier server. Start the backend and verify MongoDB is connected.')
  }
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error ?? 'Cashier authentication failed')
  localStorage.setItem(adminTokenKey, payload.token)
  return payload.admin
}

export function adminSignup(username, password) {
  return requestAdminAuth('/auth/admin-signup', username, password)
}

export function adminLogin(username, password) {
  return requestAdminAuth('/auth/admin-login', username, password)
}

export async function createAdminUser(username, password) {
  const response = await fetch(`${apiBaseUrl}/auth/admin-users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAdminToken()}`,
    },
    body: JSON.stringify({ username, password }),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error ?? 'Unable to create dashboard user')
  return payload.admin
}

export async function isAdminConfigured() {
  let response
  try {
    response = await fetch(`${apiBaseUrl}/auth/admin-status`)
  } catch {
    throw new Error('Cannot reach the cashier server. Start the backend and verify MongoDB is connected.')
  }
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error ?? 'Unable to check cashier setup')
  return payload.configured === true
}
