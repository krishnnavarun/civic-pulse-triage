import { useEffect, useMemo, useState } from 'react'
import { categoryDepartments, triage } from './triage'
import { createComplaintId, loadComplaints, saveComplaints } from './complaints'
import './App.css'

const seedComplaints = [
  {
    id: 'CP-1048',
    title: 'Large pothole near Central School',
    description: 'A deep pothole is blocking one lane and vehicles are slowing down.',
    location: 'MG Road, Bengaluru',
    category: 'Roads',
    department: 'BBMP Roads',
    severity: 'High',
    status: 'In Progress',
    date: 'Today, 9:42 AM',
  },
  {
    id: 'CP-1047',
    title: 'Drainage water overflowing',
    description: 'Waste water from a blocked drain is spreading across the footpath.',
    location: 'Indiranagar 12th Main',
    category: 'Sanitation',
    department: 'Water & Sanitation',
    severity: 'High',
    status: 'Assigned',
    date: 'Today, 8:15 AM',
  },
  {
    id: 'CP-1046',
    title: 'Streetlight not working',
    description: 'The streetlight has been off for three nights.',
    location: 'Koramangala 5th Block',
    category: 'Electricity',
    department: 'BESCOM',
    severity: 'Medium',
    status: 'Verified',
    date: 'Yesterday',
  },
  {
    id: 'CP-1045',
    title: 'Garbage pile behind market',
    description: 'Uncollected garbage is causing an unpleasant smell.',
    location: 'Jayanagar 4th T Block',
    category: 'Sanitation',
    department: 'BBMP Solid Waste',
    severity: 'Medium',
    status: 'Resolved',
    date: 'Yesterday',
  },
]

function StatusIcon({ status }) {
  const icons = { Submitted: '○', Verified: '◉', Assigned: '→', 'In Progress': '◷', Resolved: '✓' }
  return <span className={`status-icon ${status.toLowerCase().replaceAll(' ', '-')}`}>{icons[status] || '○'}</span>
}

function App() {
  const [view, setView] = useState('dashboard')
  const [complaints, setComplaints] = useState(() => loadComplaints(seedComplaints))
  const [filter, setFilter] = useState('All')
  const [submitted, setSubmitted] = useState(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(() => {
    const complaintId = new URLSearchParams(window.location.hash.replace('#', '')).get('complaint')
    if (!complaintId) return null
    return loadComplaints(seedComplaints).find((item) => item.id === complaintId) || null
  })
  const [authority, setAuthority] = useState(false)
  const [language, setLanguage] = useState('EN')
  const [statusMessage, setStatusMessage] = useState('')
  const [form, setForm] = useState({ title: '', description: '', location: '', category: 'Roads', imageName: '' })

  useEffect(() => saveComplaints(complaints), [complaints])

  function submitComplaint(event) {
    event.preventDefault()
    const result = triage(form.description, form.category)
    const complaint = {
      id: createComplaintId(complaints),
      ...form,
      ...result,
      status: 'Submitted',
      date: 'Just now',
      timeline: [
        { status: 'Submitted', date: 'Just now' },
      ],
    }
    setComplaints((items) => [complaint, ...items])
    setSubmitted(complaint)
    setForm({ title: '', description: '', location: '', category: 'Roads', imageName: '' })
    setStatusMessage(`${complaint.id} submitted successfully`)
  }

  function attachPhoto(event) {
    const file = event.target.files?.[0]
    if (!file) {
      setForm((current) => ({ ...current, imageName: '', imageUrl: '' }))
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setStatusMessage('Please choose an image smaller than 2 MB')
      event.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => setForm((current) => ({ ...current, imageName: file.name, imageUrl: reader.result }))
    reader.readAsDataURL(file)
  }

  function openComplaint(item) {
    setSelected(item)
    window.history.replaceState(null, '', `#complaint=${encodeURIComponent(item.id)}`)
  }

  function closeComplaint() {
    setSelected(null)
    window.history.replaceState(null, '', window.location.pathname)
  }

  async function shareComplaint() {
    if (!selected) return
    const url = `${window.location.origin}${window.location.pathname}#complaint=${encodeURIComponent(selected.id)}`
    try {
      if (navigator.share) await navigator.share({ title: selected.title, text: `Track civic complaint ${selected.id}`, url })
      else await navigator.clipboard.writeText(url)
      setStatusMessage('Complaint tracking link copied')
    } catch {
      setStatusMessage('Unable to share this complaint')
    }
  }

  function updateComplaintStatus(id, status) {
    setComplaints((items) => items.map((item) => {
      if (item.id !== id) return item
      const timeline = [...(item.timeline || []), { status, date: 'Just now' }]
        .filter((step, index, steps) => steps.findIndex((candidate) => candidate.status === step.status) === index)
      return { ...item, status, timeline }
    }))
    setSelected((item) => item?.id === id ? { ...item, status, timeline: [
      ...(item.timeline || []),
      { status, date: 'Just now' },
    ].filter((step, index, steps) => steps.findIndex((candidate) => candidate.status === step.status) === index) } : item)
  }

  function captureLocation() {
    if (!navigator.geolocation) {
      setStatusMessage('Location capture is not supported by this browser')
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setForm((current) => ({
        ...current,
        location: `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`,
      })),
      () => setStatusMessage('Location permission was not granted'),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const visible = useMemo(() => complaints.filter((item) => {
    const matchesFilter = filter === 'All' || item.status === filter
    const term = search.trim().toLowerCase()
    const matchesSearch = !term || [item.title, item.description, item.location, item.category, item.id]
      .some((value) => value.toLowerCase().includes(term))
    return matchesFilter && matchesSearch
  }), [complaints, filter, search])
  const resolved = complaints.filter((item) => item.status === 'Resolved').length
  const high = complaints.filter((item) => item.severity === 'High').length

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setView('dashboard')} aria-label="Civic Pulse home">
          <span className="brand-mark"><span /></span>
          <span>Civic Pulse</span>
        </button>
        <nav>
          <button className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>Dashboard</button>
          <button className={view === 'report' ? 'active' : ''} onClick={() => setView('report')}>Report an issue</button>
          <button className={authority ? 'authority-button active' : 'authority-button'} onClick={() => setAuthority((value) => !value)}>{authority ? 'Citizen view' : 'Authority view'}</button>
        </nav>
        <label className="language-select" aria-label="Display language">
          <select value={language} onChange={(event) => setLanguage(event.target.value)}><option>EN</option><option>HI</option><option>KN</option></select>
        </label>
        <button className="avatar" aria-label="User profile">KP</button>
      </header>
      {statusMessage && <div className="status-banner" role="status">{statusMessage}<button onClick={() => setStatusMessage('')} aria-label="Dismiss notification">×</button></div>}

      {view === 'dashboard' ? (
        <main>
          <section className="hero-panel">
            <div>
              <p className="eyebrow">CIVIC INFRASTRUCTURE</p>
              <h1>Track what matters.<br />Improve where you live.</h1>
              <p className="hero-copy">Report local issues, follow their progress, and help authorities respond faster.</p>
              <button className="primary" onClick={() => setView('report')}><span>＋</span> Report an issue</button>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <div className="map-grid" />
              <div className="pulse pulse-one"><span /></div>
              <div className="pulse pulse-two"><span /></div>
              <div className="pulse pulse-three"><span /></div>
            </div>
          </section>

          <section className="stats">
            <article><span className="stat-icon blue">◫</span><div><strong>{complaints.length}</strong><p>Total reports</p></div></article>
            <article><span className="stat-icon amber">!</span><div><strong>{high}</strong><p>High priority</p></div></article>
            <article><span className="stat-icon green">✓</span><div><strong>{resolved}</strong><p>Resolved</p></div></article>
            <article><span className="stat-icon violet">↗</span><div><strong>{complaints.length ? Math.round(resolved / complaints.length * 100) : 0}%</strong><p>Resolution rate</p></div></article>
          </section>

          <section className="complaints-section">
            <div className="section-heading">
              <div><p className="eyebrow">LIVE UPDATES</p><h2>Recent complaints</h2></div>
              <div className="dashboard-tools">
                <input className="search-box" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search complaints" aria-label="Search complaints" />
                <div className="filters">
                  {['All', 'Submitted', 'Assigned', 'In Progress', 'Resolved'].map((item) => (
                    <button key={item} className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)}>{item}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="complaint-list">
              {visible.length === 0 && <div className="empty-state"><strong>No complaints found</strong><p>Try another search or status filter.</p></div>}
              {visible.map((item) => (
                <article className="complaint-card" key={item.id} role="button" tabIndex="0" onClick={() => openComplaint(item)} onKeyDown={(event) => event.key === 'Enter' && openComplaint(item)}>
                  <div className="complaint-main">
                    <div className="complaint-title"><StatusIcon status={item.status} /><div><h3>{item.title}</h3><p>{item.location}</p></div></div>
                    <p className="description">{item.description}</p>
                    <div className="tags"><span className="category">{item.category}</span><span className={`severity ${item.severity.toLowerCase()}`}>{item.severity} priority</span></div>
                  </div>
                  <div className="complaint-meta">
                    <span className={`status ${item.status.toLowerCase().replaceAll(' ', '-')}`}>{item.status}</span>
                    <p><strong>{item.department}</strong></p>
                    <small>{item.date} · {item.id}</small>
                    {authority && (
                      <select className="authority-status" aria-label={`Update status for ${item.id}`} value={item.status} onClick={(event) => event.stopPropagation()} onChange={(event) => updateComplaintStatus(item.id, event.target.value)}>
                        {['Submitted', 'Verified', 'Assigned', 'In Progress', 'Resolved'].map((status) => <option key={status}>{status}</option>)}
                      </select>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </main>
      ) : (
        <main className="report-page">
          <section className="report-heading">
            <p className="eyebrow">NEW COMPLAINT</p>
            <h1>Report a civic issue</h1>
            <p>Provide the details below. AI will summarize and route your complaint.</p>
          </section>
          <div className="report-layout">
            <form className="report-form" onSubmit={submitComplaint}>
              <label>Issue title<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Example: Deep pothole on Main Road" /></label>
              <label>Describe the issue<textarea required rows="5" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe what happened, risks involved, and how long it has been present." /></label>
              <div className="form-row">
                <label>Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{Object.keys(categoryDepartments).map((name) => <option key={name}>{name}</option>)}</select></label>
                <label>Location
                  <span className="location-input">
                    <input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Street, landmark, or area" />
                    <button type="button" onClick={captureLocation} aria-label="Use current location">⌖</button>
                  </span>
                </label>
              </div>
              <label>Photo evidence <span className="optional">(optional)</span><input className="file-input" type="file" accept="image/*" onChange={attachPhoto} /></label>
              {form.imageUrl && <div className="image-preview"><img src={form.imageUrl} alt="Selected complaint evidence" /></div>}
              <button className="primary submit-button" type="submit">Submit complaint <span>→</span></button>
            </form>
            <aside className="triage-card">
              {submitted ? (
                <><span className="success-mark">✓</span><h2>Complaint submitted</h2><p className="triage-id">{submitted.id}</p><div className="triage-result"><p><span>Severity</span><strong className={submitted.severity.toLowerCase()}>{submitted.severity}</strong></p><p><span>Routed to</span><strong>{submitted.department}</strong></p><p><span>Status</span><strong>Submitted</strong></p></div><button className="secondary" onClick={() => setView('dashboard')}>View public dashboard</button></>
              ) : (
                <><span className="ai-mark">✦</span><h2>AI civic triage</h2><p>Your complaint will be checked for urgency and automatically assigned to the relevant authority.</p><ul><li><span>01</span> Category detection</li><li><span>02</span> Severity scoring</li><li><span>03</span> Department routing</li></ul></>
              )}
            </aside>
          </div>
        </main>
      )}
      {selected && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
          <section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="complaint-detail-title">
            <button className="modal-close" onClick={closeComplaint} aria-label="Close complaint details">×</button>
            <p className="eyebrow">{selected.id}</p>
            <h2 id="complaint-detail-title">{selected.title}</h2>
            <p className="modal-location">{selected.location}</p>
            <p className="modal-description">{selected.description}</p>
            {selected.imageUrl && <img className="modal-image" src={selected.imageUrl} alt="Complaint evidence" />}
            <div className="modal-tags"><span className="category">{selected.category}</span><span className={`severity ${selected.severity.toLowerCase()}`}>{selected.severity} priority</span></div>
            <div className="detail-grid">
              <div><span>Department</span><strong>{selected.department}</strong></div>
              <div><span>Current status</span><strong>{selected.status}</strong></div>
            </div>
            <h3>Progress timeline</h3>
            <ol className="timeline">
              {(selected.timeline || [{ status: 'Submitted', date: selected.date }]).map((step) => (
                <li key={step.status}><span>✓</span><div><strong>{step.status}</strong><small>{step.date}</small></div></li>
              ))}
            </ol>
            <button className="secondary share-button" onClick={shareComplaint}>Share tracking link</button>
          </section>
        </div>
      )}
    </div>
  )
}

export default App
