import { useEffect, useMemo, useState } from 'react'
import { categoryDepartments, triage } from './triage'
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
  const [complaints, setComplaints] = useState(() => {
    const saved = localStorage.getItem('civic-pulse-complaints')
    return saved ? JSON.parse(saved) : seedComplaints
  })
  const [filter, setFilter] = useState('All')
  const [submitted, setSubmitted] = useState(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', location: '', category: 'Roads', imageName: '' })

  useEffect(() => localStorage.setItem('civic-pulse-complaints', JSON.stringify(complaints)), [complaints])

  function submitComplaint(event) {
    event.preventDefault()
    const result = triage(form.description, form.category)
    const complaint = {
      id: `CP-${1050 + complaints.length}`,
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
        </nav>
        <button className="avatar" aria-label="User profile">KP</button>
      </header>

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
                <article className="complaint-card" key={item.id} role="button" tabIndex="0" onClick={() => setSelected(item)} onKeyDown={(event) => event.key === 'Enter' && setSelected(item)}>
                  <div className="complaint-main">
                    <div className="complaint-title"><StatusIcon status={item.status} /><div><h3>{item.title}</h3><p>{item.location}</p></div></div>
                    <p className="description">{item.description}</p>
                    <div className="tags"><span className="category">{item.category}</span><span className={`severity ${item.severity.toLowerCase()}`}>{item.severity} priority</span></div>
                  </div>
                  <div className="complaint-meta">
                    <span className={`status ${item.status.toLowerCase().replaceAll(' ', '-')}`}>{item.status}</span>
                    <p><strong>{item.department}</strong></p>
                    <small>{item.date} · {item.id}</small>
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
                <label>Location<input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Street, landmark, or area" /></label>
              </div>
              <label>Photo evidence <span className="optional">(optional)</span><input className="file-input" type="file" accept="image/*" onChange={(event) => setForm({ ...form, imageName: event.target.files?.[0]?.name || '' })} /></label>
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
            <button className="modal-close" onClick={() => setSelected(null)} aria-label="Close complaint details">×</button>
            <p className="eyebrow">{selected.id}</p>
            <h2 id="complaint-detail-title">{selected.title}</h2>
            <p className="modal-location">{selected.location}</p>
            <p className="modal-description">{selected.description}</p>
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
          </section>
        </div>
      )}
    </div>
  )
}

export default App
