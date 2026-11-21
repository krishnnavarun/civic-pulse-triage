export const STORAGE_KEY = 'civic-pulse-complaints'

export function loadComplaints(seedComplaints) {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return seedComplaints
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : seedComplaints
  } catch {
    return seedComplaints
  }
}

export function saveComplaints(complaints) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints))
}

export function createComplaintId(complaints) {
  const existingNumbers = complaints
    .map((complaint) => Number(complaint.id?.replace('CP-', '')))
    .filter(Number.isFinite)
  const next = existingNumbers.length ? Math.max(...existingNumbers) + 1 : 1049
  return `CP-${next}`
}
