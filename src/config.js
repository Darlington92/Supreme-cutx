function getDefaultApiUrl() {
  const { hostname, protocol } = window.location
  const apiHost = hostname === 'localhost' || hostname === '127.0.0.1'
    ? 'localhost'
    : hostname
  return `${protocol}//${apiHost}:3000`
}

export const apiBaseUrl = import.meta.env.VITE_API_URL ?? getDefaultApiUrl()
