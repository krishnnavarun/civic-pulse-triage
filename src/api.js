export async function apiRequest(path, options = {}) {
  const response = await fetch(`/api${path}`, options)
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || 'The server request failed')
  return payload
}

export async function listComplaints() {
  return apiRequest('/complaints')
}

export async function submitComplaint(complaint) {
  return apiRequest('/complaints', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(complaint),
  })
}

export async function updateServerStatus(id, status, token) {
  return apiRequest(`/complaints/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  })
}

export async function authenticate(mode, credentials) {
  return apiRequest(`/auth/${mode}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })
}

export async function requestAIAnalysis(description, category) {
  return apiRequest('/ai/triage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description, category }),
  })
}
