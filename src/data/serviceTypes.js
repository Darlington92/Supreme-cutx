export const defaultServiceTypes = [
  'Haircut',
  'Haircut + Beard',
  'Beard trim',
  'Kids cut',
]

export function normalizeServiceTypes(serviceTypes) {
  return Array.isArray(serviceTypes) && serviceTypes.length > 0
    ? serviceTypes
    : defaultServiceTypes
}

export function readServiceTypes() {
  const stored = localStorage.getItem('serviceTypes')
  if (!stored) return defaultServiceTypes

  try {
    const parsed = JSON.parse(stored)
    return normalizeServiceTypes(parsed)
  } catch {
    return defaultServiceTypes
  }
}
