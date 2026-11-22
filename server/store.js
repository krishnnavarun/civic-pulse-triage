import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const root = path.dirname(fileURLToPath(import.meta.url))
const dataFile = process.env.DATA_FILE || path.join(root, '..', 'data', 'complaints.json')

const seedComplaints = [
  { id: 'CP-1048', title: 'Large pothole near Central School', description: 'A deep pothole is blocking one lane and vehicles are slowing down.', location: 'MG Road, Bengaluru', category: 'Roads', department: 'Public Works Department', severity: 'High', status: 'In Progress', date: 'Today, 9:42 AM', timeline: [{ status: 'Submitted', date: 'Today, 8:55 AM' }, { status: 'In Progress', date: 'Today, 9:42 AM' }] },
  { id: 'CP-1047', title: 'Drainage water overflowing', description: 'Waste water from a blocked drain is spreading across the footpath.', location: 'Indiranagar 12th Main', category: 'Sanitation', department: 'Water & Sanitation', severity: 'High', status: 'Assigned', date: 'Today, 8:15 AM', timeline: [{ status: 'Submitted', date: 'Today, 7:30 AM' }, { status: 'Assigned', date: 'Today, 8:15 AM' }] },
  { id: 'CP-1046', title: 'Streetlight not working', description: 'The streetlight has been off for three nights.', location: 'Koramangala 5th Block', category: 'Electricity', department: 'Electricity Board', severity: 'Medium', status: 'Verified', date: 'Yesterday', timeline: [{ status: 'Submitted', date: 'Yesterday' }, { status: 'Verified', date: 'Yesterday' }] },
  { id: 'CP-1045', title: 'Garbage pile behind market', description: 'Uncollected garbage is causing an unpleasant smell.', location: 'Jayanagar 4th T Block', category: 'Sanitation', department: 'BBMP Solid Waste', severity: 'Medium', status: 'Resolved', date: 'Yesterday', timeline: [{ status: 'Submitted', date: 'Yesterday' }, { status: 'Resolved', date: 'Yesterday' }] },
]

async function ensureFile() {
  await fs.mkdir(path.dirname(dataFile), { recursive: true })
  try {
    await fs.access(dataFile)
  } catch {
    await fs.writeFile(dataFile, JSON.stringify({ complaints: seedComplaints, users: [] }, null, 2))
  }
}

async function readFileStore() {
  await ensureFile()
  return JSON.parse(await fs.readFile(dataFile, 'utf8'))
}

async function writeFileStore(store) {
  await ensureFile()
  await fs.writeFile(dataFile, JSON.stringify(store, null, 2))
}

let pool
if (process.env.DATABASE_URL) {
  pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
  })
}

export async function initializeStore() {
  if (!pool) {
    await ensureFile()
    return
  }
  await pool.query(`CREATE TABLE IF NOT EXISTS complaints (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL,
    location TEXT NOT NULL, category TEXT NOT NULL, department TEXT NOT NULL,
    severity TEXT NOT NULL, status TEXT NOT NULL, date TEXT NOT NULL,
    image_url TEXT, latitude DOUBLE PRECISION, longitude DOUBLE PRECISION,
    timeline JSONB NOT NULL DEFAULT '[]', created_at TIMESTAMPTZ DEFAULT NOW()
  )`)
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'citizen', created_at TIMESTAMPTZ DEFAULT NOW()
  )`)
  const result = await pool.query('SELECT COUNT(*)::int AS count FROM complaints')
  if (result.rows[0].count === 0) {
    for (const complaint of seedComplaints) {
      await pool.query(`INSERT INTO complaints (id,title,description,location,category,department,severity,status,date,timeline)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [complaint.id, complaint.title, complaint.description, complaint.location, complaint.category,
        complaint.department, complaint.severity, complaint.status, complaint.date, JSON.stringify(complaint.timeline)])
    }
  }
}

export async function listComplaints() {
  if (pool) {
    const result = await pool.query('SELECT * FROM complaints ORDER BY created_at DESC')
    return result.rows.map((row) => ({ ...row, imageUrl: row.image_url, timeline: row.timeline }))
  }
  return (await readFileStore()).complaints
}

export async function createComplaint(complaint) {
  if (pool) {
    await pool.query(`INSERT INTO complaints
      (id,title,description,location,category,department,severity,status,date,image_url,latitude,longitude,timeline)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [complaint.id, complaint.title, complaint.description, complaint.location, complaint.category,
      complaint.department, complaint.severity, complaint.status, complaint.date,
      complaint.imageUrl || null, complaint.latitude || null, complaint.longitude || null,
      JSON.stringify(complaint.timeline || [])])
    return complaint
  }
  const store = await readFileStore()
  store.complaints.unshift(complaint)
  await writeFileStore(store)
  return complaint
}

export async function updateComplaintStatus(id, status) {
  if (pool) {
    const result = await pool.query('SELECT timeline FROM complaints WHERE id=$1', [id])
    if (!result.rows.length) return null
    const timeline = Array.isArray(result.rows[0].timeline) ? result.rows[0].timeline : []
    timeline.push({ status, date: new Date().toISOString() })
    const updated = await pool.query(`UPDATE complaints SET status=$1,timeline=$2 WHERE id=$3
      RETURNING *`, [status, JSON.stringify(timeline), id])
    return updated.rows[0]
  }
  const store = await readFileStore()
  const complaint = store.complaints.find((item) => item.id === id)
  if (!complaint) return null
  complaint.status = status
  complaint.timeline = [...(complaint.timeline || []), { status, date: 'Just now' }]
  await writeFileStore(store)
  return complaint
}

export async function createUser(user) {
  if (pool) {
    await pool.query('INSERT INTO users (id,name,email,password_hash,role) VALUES ($1,$2,$3,$4,$5)',
      [user.id, user.name, user.email, user.passwordHash, user.role])
    return user
  }
  const store = await readFileStore()
  if (store.users.find((item) => item.email === user.email)) return null
  store.users.push(user)
  await writeFileStore(store)
  return user
}

export async function findUserByEmail(email) {
  if (pool) {
    const result = await pool.query('SELECT * FROM users WHERE email=$1', [email])
    const row = result.rows[0]
    return row ? { id: row.id, name: row.name, email: row.email, passwordHash: row.password_hash, role: row.role } : null
  }
  const store = await readFileStore()
  return store.users.find((item) => item.email === email) || null
}
