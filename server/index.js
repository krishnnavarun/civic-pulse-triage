import 'dotenv/config'
import crypto from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import multer from 'multer'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {
  initializeStore, listComplaints, createComplaint, updateComplaintStatus,
  createUser, findUserByEmail,
} from './store.js'

const app = express()
const port = Number(process.env.PORT || 4173)
const jwtSecret = process.env.JWT_SECRET || 'development-only-change-this-secret'
const root = path.dirname(fileURLToPath(import.meta.url))
const dist = path.join(root, '..', 'dist')

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || true }))
app.use(express.json({ limit: '8mb' }))
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } })

const departments = {
  Roads: 'Public Works Department',
  Sanitation: 'Water & Sanitation',
  Electricity: 'Electricity Board',
  'Water Supply': 'Water Board',
  Pollution: 'Pollution Control Board',
  'Public Safety': 'Police Department',
  Other: 'Municipal Helpdesk',
}

function triage(description, category) {
  const text = description.toLowerCase()
  const urgent = ['accident', 'danger', 'fire', 'collapse', 'exposed', 'injury', 'overflow', 'flood', 'blocked']
  const severe = ['large', 'deep', 'broken', 'blocked', 'waste', 'smoke', 'pollution']
  const severity = urgent.some((word) => text.includes(word)) ? 'High'
    : severe.some((word) => text.includes(word)) ? 'Medium' : 'Low'
  return { severity, department: departments[category] || departments.Other }
}

function auth(requiredRole) {
  return (req, res, next) => {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
    if (!token) return res.status(401).json({ error: 'Authentication required' })
    try {
      req.user = jwt.verify(token, jwtSecret)
      if (requiredRole && req.user.role !== requiredRole && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Authority access required' })
      }
      return next()
    } catch {
      return res.status(401).json({ error: 'Invalid or expired session' })
    }
  }
}

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'civic-pulse-api' }))

app.post('/api/triage', (req, res) => {
  const { description = '', category = 'Other' } = req.body
  if (!description.trim()) return res.status(400).json({ error: 'Description is required' })
  res.json(triage(description, category))
})

app.post('/api/ai/triage', async (req, res) => {
  const { description = '', category = 'Other' } = req.body
  if (!process.env.OPENAI_API_KEY) return res.json(triage(description, category))
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Analyze civic complaints. Return JSON with severity (Low, Medium, or High), department, and summary.' },
          { role: 'user', content: `Category: ${category}\nComplaint: ${description}` },
        ],
      }),
    })
    if (!response.ok) throw new Error('AI provider unavailable')
    const payload = await response.json()
    const ai = JSON.parse(payload.choices[0].message.content)
    res.json({ severity: ai.severity, department: ai.department || departments[category], summary: ai.summary })
  } catch {
    res.json(triage(description, category))
  }
})

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role = 'citizen', authorityCode } = req.body
  if (!name?.trim() || !email?.trim() || !password) return res.status(400).json({ error: 'Name, email, and password are required' })
  if (password.length < 8) return res.status(400).json({ error: 'Password must contain at least 8 characters' })
  if (role === 'authority' && process.env.AUTHORITY_REGISTRATION_CODE &&
      authorityCode !== process.env.AUTHORITY_REGISTRATION_CODE) {
    return res.status(403).json({ error: 'Valid authority registration code is required' })
  }
  const allowedRole = role === 'authority' ? 'authority' : 'citizen'
  const passwordHash = await bcrypt.hash(password, 12)
  const user = await createUser({ id: crypto.randomUUID(), name: name.trim(), email: email.trim().toLowerCase(), passwordHash, role: allowedRole })
  if (!user) return res.status(409).json({ error: 'An account already exists for this email' })
  const token = jwt.sign({ sub: user.id, name: user.name, email: user.email, role: user.role }, jwtSecret, { expiresIn: '7d' })
  res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })
  const user = await findUserByEmail(email.trim().toLowerCase())
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'Invalid email or password' })
  const token = jwt.sign({ sub: user.id, name: user.name, email: user.email, role: user.role }, jwtSecret, { expiresIn: '7d' })
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
})

app.get('/api/complaints', async (_req, res) => res.json(await listComplaints()))

app.post('/api/complaints', upload.single('evidence'), async (req, res) => {
  const body = req.body
  if (!body.title?.trim() || !body.description?.trim() || !body.location?.trim()) {
    return res.status(400).json({ error: 'Title, description, and location are required' })
  }
  const ai = triage(body.description, body.category)
  const complaints = await listComplaints()
  const numbers = complaints.map((item) => Number(item.id?.replace('CP-', ''))).filter(Number.isFinite)
  const id = `CP-${Math.max(1048, ...numbers) + 1}`
  const evidence = req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : body.imageUrl || null
  const complaint = {
    id,
    title: body.title.trim(),
    description: body.description.trim(),
    location: body.location.trim(),
    category: body.category || 'Other',
    department: ai.department,
    severity: ai.severity,
    status: 'Submitted',
    date: 'Just now',
    imageUrl: evidence,
    latitude: body.latitude ? Number(body.latitude) : null,
    longitude: body.longitude ? Number(body.longitude) : null,
    timeline: [{ status: 'Submitted', date: 'Just now' }],
  }
  await createComplaint(complaint)
  res.status(201).json(complaint)
})

app.patch('/api/complaints/:id/status', auth('authority'), async (req, res) => {
  const allowed = ['Submitted', 'Verified', 'Assigned', 'In Progress', 'Resolved']
  if (!allowed.includes(req.body.status)) return res.status(400).json({ error: 'Invalid status' })
  const complaint = await updateComplaintStatus(req.params.id, req.body.status)
  if (!complaint) return res.status(404).json({ error: 'Complaint not found' })
  res.json(complaint)
})

app.use(express.static(dist))
app.get('*splat', (_req, res) => res.sendFile(path.join(dist, 'index.html')))

await initializeStore()
app.listen(port, '0.0.0.0', () => console.log(`Civic Pulse API listening on port ${port}`))
