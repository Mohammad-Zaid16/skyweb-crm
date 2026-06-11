'use client'

import { use, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Phone, Mail, MapPin, Calendar, FileText,
  CheckCircle, XCircle, Clock, Send, Star, MessageSquare,
  Activity, Flame, Zap, ChevronRight, X, DollarSign, RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { useLead, useLeadEvents } from '@/hooks/useLeads'
import { useFollowups } from '@/hooks/useData'
import { ScoreBadge } from '@/components/ui/ScoreBadge'
import { StatusBadge, UrgencyBadge, SourceBadge } from '@/components/ui/Badges'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCurrency, formatDate, formatRelativeTime, cn } from '@/lib/utils'

const eventIcons: Record<string, { icon: any; color: string }> = {
  LEAD_CREATED:        { icon: Star,          color: 'text-blue-400 bg-blue-500/10' },
  STATUS_CHANGED:      { icon: Activity,       color: 'text-purple-400 bg-purple-500/10' },
  SCORE_UPDATED:       { icon: Zap,            color: 'text-amber-400 bg-amber-500/10' },
  APPOINTMENT_BOOKED:  { icon: Calendar,       color: 'text-cyan-400 bg-cyan-500/10' },
  QUOTE_SENT:          { icon: FileText,       color: 'text-emerald-400 bg-emerald-500/10' },
  QUOTE_ACCEPTED:      { icon: CheckCircle,    color: 'text-emerald-400 bg-emerald-500/10' },
  QUOTE_REJECTED:      { icon: XCircle,        color: 'text-red-400 bg-red-500/10' },
  FOLLOWUP_SENT:       { icon: Send,           color: 'text-blue-400 bg-blue-500/10' },
  LEAD_CONTACTED:      { icon: Phone,          color: 'text-green-400 bg-green-500/10' },
  DECISION_MADE:       { icon: CheckCircle,    color: 'text-purple-400 bg-purple-500/10' },
}

// ─── Book Inspection Modal ────────────────────────────────────────────────────
function BookInspectionModal({ lead, onClose, onSuccess }: { lead: any; onClose: () => void; onSuccess: () => void }) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('09:00')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [appointments, setAppointments] = useState<any[]>([])

  const today = new Date().toISOString().split('T')[0]
  const TIMES = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00']

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(d => {
      setAppointments((d.appointments ?? []).filter((a: any) =>
        a.status !== 'CANCELLED' && a.status !== 'COMPLETED'
      ))
    }).catch(() => {})
  }, [])

  const selectedDateTime = date && time ? new Date(`${date}T${time}:00`) : null
  const clash = selectedDateTime ? appointments.find((a: any) => {
    const diff = Math.abs(new Date(a.scheduled_time).getTime() - selectedDateTime.getTime())
    return diff < 60 * 60 * 1000
  }) : null

  const apptOnDate = date ? appointments.filter((a: any) =>
    new Date(a.scheduled_time).toISOString().split('T')[0] === date
  ) : []

  const busyTimes = TIMES.filter(t => {
    if (!date) return false
    const dt = new Date(`${date}T${t}:00`)
    return appointments.some((a: any) =>
      Math.abs(new Date(a.scheduled_time).getTime() - dt.getTime()) < 60 * 60 * 1000
    )
  })

  const submit = async () => {
    if (!date) { setError('Please select a date'); return }
    if (clash) { setError(`Clash with ${clash.leads?.name ?? 'another booking'}. Pick a different time.`); return }
    setLoading(true); setError('')
    try {
      const scheduledTime = new Date(`${date}T${time}:00`).toISOString()
      await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'appointments', data: { lead_id: lead.id, roofer_id: 'a1000000-0000-0000-0000-000000000001', scheduled_time: scheduledTime, status: 'SCHEDULED' } }) })
      await fetch(`/api/leads/${lead.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'BOOKED' }) })
      await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'lead_events', data: { lead_id: lead.id, event_type: 'APPOINTMENT_BOOKED', payload: { scheduled_time: scheduledTime, notes } } }) })
      const d = new Date(scheduledTime)
      const dateStr = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
      const timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      fetch('https://skywebbuk.app.n8n.cloud/webhook/skyweb-crm-appointment', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: lead.id, lead_name: lead.name, lead_phone: lead.phone, lead_email: lead.email, scheduled_time: scheduledTime, date_formatted: `${dateStr} at ${timeStr}`, notes, roofer_id: 'a1000000-0000-0000-0000-000000000001' })
      }).catch(() => {})
      onSuccess()
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-2xl border border-zinc-700 bg-[#0f0f10] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-zinc-100">Book Inspection</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="mb-4 p-3 rounded-lg bg-zinc-900 border border-zinc-800">
          <p className="text-sm font-medium text-zinc-200">{lead.name}</p>
          <p className="text-xs text-zinc-500 capitalize">{lead.service_type?.replace('_',' ')} · {lead.postcode}</p>
          {!lead.email
            ? <p className="text-xs text-amber-400 mt-1.5">⚠️ No email — confirmation via WhatsApp only</p>
            : <p className="text-xs text-emerald-400 mt-1.5">✓ Will notify: {lead.email} + WhatsApp</p>
          }
        </div>

        {error && <p className="mb-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</p>}

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Inspection Date *</label>
            <input type="date" value={date} min={today} onChange={e => { setDate(e.target.value); setError('') }}
              className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50 transition-colors" />
          </div>

          {date && apptOnDate.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs font-semibold text-amber-400 mb-2">⚠️ Already booked on this date:</p>
              {apptOnDate.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between text-xs text-amber-300/80 py-0.5">
                  <span>{a.leads?.name ?? 'Unknown'}</span>
                  <span>{new Date(a.scheduled_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Time</label>
            <div className="grid grid-cols-5 gap-1.5">
              {TIMES.map(t => {
                const isBusy = busyTimes.includes(t)
                const isSelected = time === t
                return (
                  <button key={t} onClick={() => !isBusy && setTime(t)} disabled={isBusy}
                    className={cn('py-2 rounded-lg text-xs font-medium border transition-all',
                      isBusy ? 'bg-red-500/10 border-red-500/20 text-red-400/50 cursor-not-allowed line-through' :
                      isSelected ? 'bg-blue-600 border-blue-500 text-white' :
                      'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200')}>
                    {t}
                  </button>
                )
              })}
            </div>
            {busyTimes.length > 0 && (
              <p className="text-[10px] text-zinc-600 mt-1.5">🔴 Red = already booked (within 1 hour)</p>
            )}
          </div>

          {clash && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-xs font-semibold text-red-400">⛔ Time clash!</p>
              <p className="text-xs text-red-300/70 mt-0.5">
                {clash.leads?.name ?? 'Another customer'} is booked at {new Date(clash.scheduled_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}. Please pick a different slot.
              </p>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Access notes, gate codes..."
              className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50 transition-colors resize-none" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 text-sm font-medium hover:bg-zinc-800 transition-colors">Cancel</button>
          <button onClick={submit} disabled={loading || !date || !!clash}
            className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-2">
            {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Booking...</> : <><Calendar className="w-4 h-4" /> Confirm Booking</>}
          </button>
        </div>
        <p className="text-xs text-zinc-600 text-center mt-3">Customer will be notified via WhatsApp + Email</p>
      </motion.div>
    </div>
  )
}

// ─── Send Quote Modal ─────────────────────────────────────────────────────────
function SendQuoteModal({ lead, onClose, onSuccess }: { lead: any; onClose: () => void; onSuccess: () => void }) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState(`${lead.service_type?.replace('_',' ') ?? 'Roofing'} work at ${lead.postcode ?? ''}`)
  const [validDays, setValidDays] = useState('30')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { setError('Please enter a valid amount'); return }
    if (!description.trim()) { setError('Please add a description'); return }
    setLoading(true); setError('')
    try {
      // Fire n8n quote webhook — it handles INSERT to quotes, email, WhatsApp
      const res = await fetch('https://skywebbuk.app.n8n.cloud/webhook/skyweb-crm-quote', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'quote_create', lead_id: lead.id, amount: amt, description: description.trim(), valid_days: parseInt(validDays), roofer_id: 'a1000000-0000-0000-0000-000000000001' })
      })
      // Also update lead status to QUOTED
      await fetch(`/api/leads/${lead.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'QUOTED' }) })
      onSuccess()
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-2xl border border-zinc-700 bg-[#0f0f10] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-zinc-100">Send Quote</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="mb-4 p-3 rounded-lg bg-zinc-900 border border-zinc-800">
          <p className="text-sm font-medium text-zinc-200">{lead.name}</p>
          <p className="text-xs text-zinc-500">{lead.email} · {lead.phone}</p>
        </div>

        {error && <p className="mb-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</p>}

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Quote Amount (£) *</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" min="0" step="0.01"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50 transition-colors" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Description *</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Describe the work to be done..."
              className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Valid for</label>
            <select value={validDays} onChange={e => setValidDays(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50 transition-colors">
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
            </select>
          </div>
        </div>

        {amount && parseFloat(amount) > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-sm font-bold text-emerald-400">£{parseFloat(amount).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-emerald-400/70 mt-0.5">Valid for {validDays} days</p>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 text-sm font-medium hover:bg-zinc-800 transition-colors">Cancel</button>
          <button onClick={submit} disabled={loading || !amount || parseFloat(amount) <= 0}
            className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2">
            {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Quote</>}
          </button>
        </div>
        <p className="text-xs text-zinc-600 text-center mt-3">Quote sent via Email + WhatsApp · Follow-ups auto-scheduled</p>
      </motion.div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { lead, loading } = useLead(id)
  const { events, loading: eventsLoading } = useLeadEvents(id)
  const { followups } = useFollowups(id)
  const [updating, setUpdating] = useState(false)
  const [showBookModal, setShowBookModal] = useState(false)
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const updateStatus = async (status: string) => {
    if (!lead) return
    setUpdating(true)
    try {
      await fetch(`/api/leads/${lead.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      window.location.reload()
    } catch (e) { console.error('updateStatus error:', e) }
    setUpdating(false)
  }

  const handleBookingSuccess = () => {
    setShowBookModal(false)
    setSuccessMsg('Inspection booked! Customer notified via WhatsApp & Email.')
    setTimeout(() => { setSuccessMsg(''); window.location.reload() }, 3000)
  }

  const handleQuoteSuccess = () => {
    setShowQuoteModal(false)
    setSuccessMsg('Quote sent! Customer notified via Email & WhatsApp.')
    setTimeout(() => { setSuccessMsg(''); window.location.reload() }, 3000)
  }

  if (loading) return (
    <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr_300px] gap-6">
      {[1,2,3].map((i) => <div key={i} className="rounded-xl border border-zinc-800 bg-[#0f0f10] p-5 space-y-4 h-96"><Skeleton className="w-full h-full" /></div>)}
    </div>
  )

  if (!lead) return (
    <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
      <p className="text-sm">Lead not found</p>
      <Link href="/leads" className="text-blue-400 text-sm mt-2 hover:underline">← Back to leads</Link>
    </div>
  )

  const isHot = (lead.score ?? 0) >= 75

  return (
    <>
      <AnimatePresence>
        {showBookModal && <BookInspectionModal lead={lead} onClose={() => setShowBookModal(false)} onSuccess={handleBookingSuccess} />}
        {showQuoteModal && <SendQuoteModal lead={lead} onClose={() => setShowQuoteModal(false)} onSuccess={handleQuoteSuccess} />}
      </AnimatePresence>

      <div className="space-y-4 max-w-[1400px]">
        <div className="flex items-center gap-3">
          <Link href="/leads" className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Leads
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-700" />
          <span className="text-sm text-zinc-300 font-medium truncate">{lead.name}</span>
          {isHot && <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs shrink-0"><Flame className="w-3 h-3" /> Hot</div>}
        </div>

        {successMsg && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            <CheckCircle className="w-4 h-4 shrink-0" /> {successMsg}
          </motion.div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr_300px] gap-5">

          {/* LEFT */}
          <div className="space-y-4">
            <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="rounded-xl border border-zinc-800/60 bg-[#0f0f10] p-5">
              <div className="flex flex-col items-center text-center mb-4">
                <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold mb-3', isHot ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/20 text-red-300' : 'bg-zinc-800 text-zinc-400')}>
                  {lead.name?.charAt(0) ?? '?'}
                </div>
                <h2 className="text-lg font-bold text-zinc-100">{lead.name}</h2>
                <p className="text-xs text-zinc-500 mt-1 capitalize">{lead.service_type?.replace('_', ' ') ?? 'No service type'}</p>
                <div className="flex items-center gap-2 mt-3"><ScoreBadge score={lead.score} size="lg" /></div>
              </div>
              <div className="space-y-2.5 text-sm">
                {lead.phone && (
                  <a href={`tel:${lead.phone}`} className="flex items-center gap-2.5 text-zinc-400 hover:text-zinc-200 transition-colors group">
                    <Phone className="w-3.5 h-3.5 text-zinc-600 group-hover:text-blue-400 shrink-0" /> {lead.phone}
                  </a>
                )}
                {lead.email && (
                  <a href={`mailto:${lead.email}`} className="flex items-center gap-2.5 text-zinc-400 hover:text-zinc-200 transition-colors group">
                    <Mail className="w-3.5 h-3.5 text-zinc-600 group-hover:text-blue-400 shrink-0" />
                    <span className="truncate">{lead.email}</span>
                  </a>
                )}
                {lead.postcode && (
                  <div className="flex items-center gap-2.5 text-zinc-400">
                    <MapPin className="w-3.5 h-3.5 text-zinc-600 shrink-0" /> {lead.postcode}
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }} className="rounded-xl border border-zinc-800/60 bg-[#0f0f10] p-5 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Lead Details</h3>
              {[
                { label: 'Status', value: <StatusBadge status={lead.status} /> },
                { label: 'Urgency', value: <UrgencyBadge urgency={lead.urgency} /> },
                { label: 'Source', value: <SourceBadge source={lead.source} /> },
                { label: 'Value', value: <span className="text-sm font-bold text-emerald-400">{formatCurrency(lead.estimated_value)}</span> },
                { label: 'Preferred Time', value: <span className="text-xs text-zinc-400 capitalize">{lead.preferred_time ?? '—'}</span> },
                { label: 'Created', value: <span className="text-xs text-zinc-500">{formatDate(lead.created_at)}</span> },
                { label: 'Last Contact', value: <span className="text-xs text-zinc-500">{formatRelativeTime(lead.last_contact_at)}</span> },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <span className="text-xs text-zinc-600 shrink-0">{label}</span>
                  <div className="text-right">{value}</div>
                </div>
              ))}
            </motion.div>

            {lead.message && (
              <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-zinc-800/60 bg-[#0f0f10] p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Customer Message</h3>
                <p className="text-xs text-zinc-400 leading-relaxed italic">"{lead.message}"</p>
              </motion.div>
            )}
          </div>

          {/* CENTER: Timeline */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-zinc-800/60 bg-[#0f0f10] p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-zinc-500" />
                <h3 className="text-sm font-semibold text-zinc-200">Activity Timeline</h3>
              </div>
              <span className="text-xs text-zinc-600">{events.length} events</span>
            </div>
            <div className="relative space-y-0">
              {eventsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-3"><Skeleton className="w-8 h-8 rounded-lg shrink-0" /><div className="flex-1 space-y-1.5"><Skeleton className="w-32 h-3" /><Skeleton className="w-full h-3" /></div></div>
                  ))}
                </div>
              ) : events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
                  <Activity className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">No activity yet</p>
                </div>
              ) : (
                events.map((event, i) => {
                  const cfg = eventIcons[event.event_type] ?? { icon: Activity, color: 'text-zinc-400 bg-zinc-800' }
                  const EventIcon = cfg.icon
                  const payload = event.payload as any
                  return (
                    <motion.div key={event.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="flex gap-3 relative pb-4">
                      {i < events.length - 1 && <div className="absolute left-4 top-8 bottom-0 w-px bg-zinc-800/60" />}
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-zinc-800/60', cfg.color)}>
                        <EventIcon className="w-3.5 h-3.5" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-zinc-300">{event.event_type.replace(/_/g, ' ')}</span>
                          <span className="text-[10px] text-zinc-600">{formatRelativeTime(event.created_at)}</span>
                        </div>
                        {payload && (
                          <div className="mt-1 text-xs text-zinc-500">
                            {payload.from && payload.to && <span className="flex items-center gap-1.5"><span className="text-zinc-600">{String(payload.from)}</span><ChevronRight className="w-3 h-3 text-zinc-700" /><span className="text-zinc-300 font-medium">{String(payload.to)}</span></span>}
                            {payload.amount && <span>£{payload.amount.toLocaleString()}</span>}
                            {payload.scheduled_time && <span>{formatDate(payload.scheduled_time)}</span>}
                            {payload.stage && <span className="capitalize">{payload.stage.replace(/_/g, ' ')}</span>}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
          </motion.div>

          {/* RIGHT: Actions */}
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="space-y-4">
            <div className="rounded-xl border border-zinc-800/60 bg-[#0f0f10] p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">Actions</h3>
              <div className="space-y-2">
                {/* Book Inspection */}
                {lead.status === 'BOOKED' ? (
                  <div className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" /> Inspection Booked ✓
                    <button onClick={() => setShowBookModal(true)} className="ml-auto text-xs opacity-60 hover:opacity-100 transition-opacity">Rebook</button>
                  </div>
                ) : (
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    onClick={() => setShowBookModal(true)}
                    disabled={updating || lead.status === 'WON' || lead.status === 'LOST'}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors">
                    <Calendar className="w-4 h-4" /> Book Inspection
                  </motion.button>
                )}

                {/* Send Quote */}
                {(lead.status === 'QUOTED' || lead.status === 'WON') ? (
                  <div className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" /> Quote Sent ✓
                    <button onClick={() => setShowQuoteModal(true)} className="ml-auto text-xs opacity-60 hover:opacity-100 transition-opacity">Resend</button>
                  </div>
                ) : (
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    onClick={() => setShowQuoteModal(true)}
                    disabled={updating || lead.status === 'LOST'}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors">
                    <FileText className="w-4 h-4" /> Send Quote
                  </motion.button>
                )}

                {/* Mark Contacted — only show if not yet past this stage */}
                {!['CONTACTED','QUOTED','BOOKED','WON','LOST'].includes(lead.status ?? '') && (
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    onClick={() => updateStatus('CONTACTED')} disabled={updating}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors border border-zinc-700">
                    <Phone className="w-4 h-4" /> Mark Contacted
                  </motion.button>
                )}

                {/* Won / Lost */}
                {lead.status === 'WON' ? (
                  <div className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" /> Job Won ✓
                  </div>
                ) : lead.status === 'LOST' ? (
                  <div className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                    <XCircle className="w-4 h-4" /> Job Lost
                    <button onClick={() => updateStatus('NEW')} className="ml-auto text-xs opacity-60 hover:opacity-100 transition-opacity">Reopen</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      onClick={() => updateStatus('WON')} disabled={updating}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-40">
                      <CheckCircle className="w-3.5 h-3.5" /> Won
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      onClick={() => updateStatus('LOST')} disabled={updating}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors disabled:opacity-40">
                      <XCircle className="w-3.5 h-3.5" /> Lost
                    </motion.button>
                  </div>
                )}
              </div>
            </div>

            {/* Score breakdown */}
            <div className="rounded-xl border border-zinc-800/60 bg-[#0f0f10] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Score Breakdown</h3>
                <ScoreBadge score={lead.score} size="md" />
              </div>
              <div className="space-y-2.5">
                {[
                  { label: 'Urgency', max: 30, value: lead.urgency === 'emergency' ? 30 : lead.urgency === 'high' ? 22 : lead.urgency === 'medium' ? 12 : 5 },
                  { label: 'Service', max: 25, value: lead.service_type === 'full_replacement' ? 25 : lead.service_type === 'flat_roof' ? 20 : lead.service_type === 'chimney' ? 15 : lead.service_type === 'repair' ? 10 : 6 },
                  { label: 'Source', max: 20, value: lead.source === 'referral' ? 20 : lead.source === 'callrail' ? 17 : lead.source === 'google' ? 14 : lead.source === 'website' ? 10 : 6 },
                  { label: 'Value', max: 15, value: (lead.estimated_value ?? 0) >= 10000 ? 15 : (lead.estimated_value ?? 0) >= 6000 ? 12 : (lead.estimated_value ?? 0) >= 3000 ? 9 : 6 },
                  { label: 'Recency', max: 10, value: Math.max(0, Math.round(10 * (1 - (Date.now() - new Date(lead.created_at ?? '').getTime()) / (72 * 3600000)))) },
                ].map(({ label, max, value }) => (
                  <div key={label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">{label}</span>
                      <span className="text-zinc-400 tabular-nums">{value}/{max}</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(value / max) * 100}%` }} transition={{ duration: 0.6, delay: 0.2 }} className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Follow-ups */}
            {followups.length > 0 && (
              <div className="rounded-xl border border-zinc-800/60 bg-[#0f0f10] p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Follow-ups</h3>
                <div className="space-y-2">
                  {followups.slice(0, 3).map((fu: any) => (
                    <div key={fu.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
                      <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', fu.status === 'SENT' ? 'bg-emerald-400' : fu.status === 'PENDING' ? 'bg-amber-400 animate-pulse' : 'bg-zinc-600')} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{fu.message}</p>
                        <span className="text-[10px] text-zinc-600 capitalize">{fu.stage?.replace(/_/g, ' ')} · {fu.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  )
}
