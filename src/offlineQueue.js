const queueKey = 'offlineJobQueue'

export function readOfflineJobs() {
  try {
    return JSON.parse(localStorage.getItem(queueKey) ?? '[]')
  } catch {
    return []
  }
}

export function queueOfflineJob(job) {
  const queued = [...readOfflineJobs(), job]
  localStorage.setItem(queueKey, JSON.stringify(queued))
  return job
}

export function removeOfflineJob(clientId) {
  localStorage.setItem(queueKey, JSON.stringify(readOfflineJobs().filter((job) => job.clientId !== clientId)))
}
