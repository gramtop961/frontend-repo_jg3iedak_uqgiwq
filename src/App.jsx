import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Send, Mail, Settings, Rocket } from 'lucide-react'
import Spline from '@splinetool/react-spline'

const apiBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function Hero() {
  return (
    <div className="relative h-[60vh] w-full overflow-hidden rounded-b-3xl bg-white">
      <Spline scene="https://prod.spline.design/LU2mWMPbF3Qi1Qxh/scene.splinecode" style={{ width: '100%', height: '100%' }} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" />
      <div className="absolute inset-0 flex items-end justify-center pb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-cyan-600">AI Job Application Automator</h1>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">Discover roles via Google, apply on company sites, and send thoughtful follow‑ups — all from one simple dashboard.</p>
        </motion.div>
      </div>
    </div>
  )
}

function ProfileSetup({ onSaved }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', resume_text: '', titles: '', locations: '', remote: true })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const save = async () => {
    setLoading(true)
    setMessage('')
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        resume_text: form.resume_text || undefined,
        titles: form.titles ? form.titles.split(',').map((s) => s.trim()).filter(Boolean) : [],
        locations: form.locations ? form.locations.split(',').map((s) => s.trim()).filter(Boolean) : [],
        remote: !!form.remote,
        include_keywords: [],
        exclude_keywords: [],
      }
      const res = await fetch(`${apiBase}/api/profile`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error('Failed to save profile')
      setMessage('Saved!')
      onSaved?.(payload.email)
    } catch (e) {
      setMessage('Error saving profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center gap-2 mb-4"><Settings className="w-5 h-5 text-violet-600"/><h2 className="font-semibold text-lg">One-time Setup</h2></div>
      <div className="grid md:grid-cols-2 gap-4">
        <input className="input" placeholder="Full name" name="name" value={form.name} onChange={handleChange} />
        <input className="input" placeholder="Email" name="email" value={form.email} onChange={handleChange} />
        <input className="input" placeholder="Phone (optional)" name="phone" value={form.phone} onChange={handleChange} />
        <input className="input" placeholder="Preferred titles (comma‑separated)" name="titles" value={form.titles} onChange={handleChange} />
        <input className="input" placeholder="Locations (comma‑separated)" name="locations" value={form.locations} onChange={handleChange} />
        <label className="flex items-center gap-2 text-sm text-gray-600"><input type="checkbox" name="remote" checked={form.remote} onChange={handleChange} />Remote only</label>
        <textarea className="input md:col-span-2 min-h-[120px]" placeholder="Paste your resume text (for AI tailoring)" name="resume_text" value={form.resume_text} onChange={handleChange} />
      </div>
      <div className="mt-4 flex gap-3">
        <button onClick={save} disabled={loading} className="btn-primary">{loading ? 'Saving…' : 'Save Profile'}</button>
        {message && <span className="text-sm text-gray-600">{message}</span>}
      </div>
    </div>
  )
}

function SearchJobs({ email, onPick }) {
  const [q, setQ] = useState('"careers" "apply" "remote" software engineer site:company.com')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const search = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/api/search?q=${encodeURIComponent(q)}`)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setResults(data)
    } catch (e) {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center gap-2 mb-4"><Search className="w-5 h-5 text-cyan-600"/><h2 className="font-semibold text-lg">Google Job Discovery</h2></div>
      <div className="flex gap-2">
        <input className="input flex-1" value={q} onChange={(e)=>setQ(e.target.value)} placeholder='use Google operators e.g. "careers" site:company.com "apply now"' />
        <button onClick={search} className="btn-primary"><Rocket className="w-4 h-4 mr-1"/>Search</button>
      </div>
      <div className="mt-4 space-y-3">
        {loading && <div className="text-sm text-gray-500">Searching…</div>}
        {!loading && results.map((r, idx)=> (
          <div key={idx} className="border rounded-lg p-4 hover:bg-gray-50 transition">
            <div className="font-medium text-gray-900">{r.title}</div>
            {r.snippet && <div className="text-sm text-gray-600 mt-1">{r.snippet}</div>}
            <a href={r.url} target="_blank" rel="noreferrer" className="text-sm text-cyan-700 underline break-all">{r.url}</a>
            <div className="mt-3">
              <button onClick={()=>onPick(r)} className="btn-secondary">Queue Application</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Applications({ email }) {
  const [list, setList] = useState([])
  const refresh = async () => {
    const res = await fetch(`${apiBase}/api/applications${email ? `?email=${encodeURIComponent(email)}` : ''}`)
    if (res.ok) setList(await res.json())
  }
  useEffect(()=>{ refresh() }, [email])

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center gap-2 mb-4"><Mail className="w-5 h-5 text-violet-600"/><h2 className="font-semibold text-lg">Applications & Follow‑ups</h2></div>
      <div className="space-y-3">
        {list.map((a, i)=> (
          <div key={i} className="border rounded-lg p-4">
            <div className="font-medium">{a.job_title} {a.company ? `· ${a.company}` : ''}</div>
            <a href={a.job_url} target="_blank" rel="noreferrer" className="text-sm text-cyan-700 underline break-all">{a.job_url}</a>
            <div className="text-sm text-gray-600 mt-1">Status: {a.status}</div>
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-gray-700">Cover letter</summary>
              <pre className="whitespace-pre-wrap text-sm text-gray-800 bg-gray-50 p-2 rounded">{a.cover_letter}</pre>
            </details>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <button onClick={refresh} className="btn-secondary">Refresh</button>
      </div>
    </div>
  )
}

function App() {
  const [email, setEmail] = useState('')
  const [picked, setPicked] = useState(null)

  const queueApply = async (job) => {
    if (!email) return alert('Save your profile first')
    const payload = { job_title: job.title, company: job.company, job_url: job.url, applicant_email: email }
    const res = await fetch(`${apiBase}/api/applications`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (res.ok) {
      setPicked(null)
      alert('Application queued and cover letter generated!')
    } else {
      alert('Failed to create application')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Hero />
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        <ProfileSetup onSaved={(em)=>setEmail(em)} />
        <SearchJobs email={email} onPick={(job)=>{ setPicked(job); queueApply(job) }} />
        <Applications email={email} />
      </div>
      <style>{`
        .input { @apply w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200; }
        .btn-primary { @apply inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600 px-4 py-2 text-white text-sm font-medium shadow hover:from-violet-700 hover:to-cyan-700 transition; }
        .btn-secondary { @apply inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50; }
      `}</style>
    </div>
  )
}

export default App
