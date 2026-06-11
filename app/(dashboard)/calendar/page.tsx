'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, Calendar, Clock, MapPin,
  Phone, CheckCircle, XCircle, AlertCircle, RefreshCw, X, User
} from 'lucide-react'
import { useAppointments } from '@/hooks/useData'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  SCHEDULED:  { label: 'Scheduled',  color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',     dot: 'bg-blue-400' },
  CONFIRMED:  { label: 'Confirmed',  color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400' },
  COMPLETED:  { label: 'Completed',  color: 'bg-zinc-800 text-zinc-400 border-zinc-700',             dot: 'bg-zinc-400' },
  CANCELLED:  { label: 'Cancelled',  color: 'bg-red-500/20 text-red-400 border-red-500/30',         dot: 'bg-red-400' },
  NO_SHOW:    { label: 'No Show',    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',   dot: 'bg-amber-400' },
}

function AppointmentDetailModal({ appt, onClose, onStatusChange }: { appt: any; onClose: () => void; onStatusChange: (id: string, status: string) => Promise<void> }) {
  const [updating, setUpdating] = useState(false)
  const d = new Date(appt.scheduled_time)
  const cfg = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.SCHEDULED

  const changeStatus = async (status: string) => {
    setUpdating(true)
    await onStatusChange(appt.id, status)
    setUpdating(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-[#0f0f10] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-zinc-100">Appointment Details</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lead info */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 mb-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-sm font-semibold text-zinc-200">{appt.leads?.name ?? 'Unknown'}</span>
          </div>
          {appt.leads?.phone && (
            <a href={`tel:${appt.leads.phone}`} className="flex items-center gap-2 text-xs text-zinc-400 hover:text-blue-400 transition-colors">
              <Phone className="w-3.5 h-3.5 text-zinc-600" />{appt.leads.phone}
            </a>
          )}
          {appt.leads?.postcode && (
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <MapPin className="w-3.5 h-3.5 text-zinc-600" />{appt.leads.postcode}
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Clock className="w-3.5 h-3.5 text-zinc-600" />
            {d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} at {d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </div>
          {appt.leads?.service_type && (
            <p className="text-xs text-zinc-500 capitalize">{appt.leads.service_type.replace('_', ' ')}</p>
          )}
        </div>

        {/* Current status */}
        <div className="flex items-center gap-2 mb-4">
          <span className={cn('px-2.5 py-1 rounded-lg text-xs font-medium border', cfg.color)}>{cfg.label}</span>
        </div>

        {/* Actions based on status */}
        {appt.status !== 'COMPLETED' && appt.status !== 'CANCELLED' && (
          <div className="space-y-2">
            {appt.status === 'SCHEDULED' && (
              <button onClick={() => changeStatus('CONFIRMED')} disabled={updating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors disabled:opacity-50">
                <CheckCircle className="w-4 h-4" /> Confirm Appointment
              </button>
            )}
            <button onClick={() => changeStatus('COMPLETED')} disabled={updating}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors disabled:opacity-50">
              <CheckCircle className="w-4 h-4" /> Mark Completed
            </button>
            <button onClick={() => changeStatus('NO_SHOW')} disabled={updating}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-600/80 hover:bg-amber-500 text-white text-sm font-medium transition-colors disabled:opacity-50">
              <AlertCircle className="w-4 h-4" /> Mark No Show
            </button>
            <button onClick={() => changeStatus('CANCELLED')} disabled={updating}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-red-900/40 text-red-400 text-sm font-medium transition-colors border border-zinc-700 disabled:opacity-50">
              <XCircle className="w-4 h-4" /> Cancel Appointment
            </button>
          </div>
        )}

        {appt.leads?.id && (
          <Link href={`/leads/${appt.lead_id}`} onClick={onClose}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 text-zinc-500 hover:text-zinc-300 text-xs font-medium transition-colors">
            View Lead →
          </Link>
        )}
      </motion.div>
    </div>
  )
}

export default function CalendarPage() {
  const { appointments, loading, refetch } = useAppointments()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'list'>('month')
  const [selected, setSelected] = useState<any>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()

  const apptByDay = appointments.reduce((acc: Record<string, any[]>, a: any) => {
    const d = new Date(a.scheduled_time).toDateString()
    acc[d] = acc[d] ? [...acc[d], a] : [a]
    return acc
  }, {})

  const cells = Array.from({ length: Math.ceil((firstDay + daysInMonth) / 7) * 7 }, (_, i) => {
    const dayNum = i - firstDay + 1
    if (dayNum < 1 || dayNum > daysInMonth) return null
    return new Date(year, month, dayNum)
  })

  const upcoming = appointments
    .filter((a: any) => new Date(a.scheduled_time) >= today && a.status !== 'CANCELLED')
    .sort((a: any, b: any) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime())

  const handleStatusChange = async (id: string, status: string) => {
    await fetch('/api/data', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'appointments', id, data: { status } })
    })
    await refetch()
  }

  // Week view helpers
  const weekStart = new Date(currentDate)
  weekStart.setDate(currentDate.getDate() - currentDate.getDay())
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })
  const HOURS = Array.from({ length: 11 }, (_, i) => i + 7) // 7am-5pm

  return (
    <>
      <AnimatePresence>
        {selected && (
          <AppointmentDetailModal
            appt={selected}
            onClose={() => setSelected(null)}
            onStatusChange={handleStatusChange}
          />
        )}
      </AnimatePresence>

      <div className="space-y-5 max-w-[1400px]">
        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button onClick={() => {
              if (view === 'week') { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d) }
              else setCurrentDate(new Date(year, month - 1, 1))
            }} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-base font-bold text-zinc-200 w-44 text-center">
              {view === 'week'
                ? `${weekDays[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${weekDays[6].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                : `${MONTHS[month]} ${year}`}
            </h2>
            <button onClick={() => {
              if (view === 'week') { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d) }
              else setCurrentDate(new Date(year, month + 1, 1))
            }} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors">
            Today
          </button>

          {/* Status legend */}
          <div className="hidden md:flex items-center gap-3 ml-2">
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <div key={k} className="flex items-center gap-1.5">
                <div className={cn('w-2 h-2 rounded-full', v.dot)} />
                <span className="text-xs text-zinc-600">{v.label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1 ml-auto bg-zinc-900 border border-zinc-800 rounded-lg p-1">
            {(['month', 'week', 'list'] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={cn('px-3 py-1 rounded-md text-xs font-medium capitalize transition-all',
                  view === v ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-300')}>
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-5">

          {/* MONTH VIEW */}
          {view === 'month' && (
            <div className="rounded-xl border border-zinc-800/60 bg-[#0f0f10] overflow-hidden">
              <div className="grid grid-cols-7 border-b border-zinc-800/60">
                {DAYS.map((d) => (
                  <div key={d} className="py-3 text-center text-xs font-semibold text-zinc-600 uppercase tracking-wider">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {cells.map((date, i) => {
                  if (!date) return <div key={i} className="min-h-[90px] border-b border-r border-zinc-800/40 bg-zinc-900/10" />
                  const isToday = date.toDateString() === today.toDateString()
                  const appts = apptByDay[date.toDateString()] ?? []
                  const isPast = date < today && !isToday
                  return (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.004 }}
                      className={cn('min-h-[90px] p-1.5 border-b border-r border-zinc-800/40 transition-colors',
                        isPast ? 'opacity-40' : 'hover:bg-zinc-900/30 cursor-pointer',
                        i % 7 === 6 && 'border-r-0')}>
                      <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mb-1 mx-auto',
                        isToday ? 'bg-blue-600 text-white' : 'text-zinc-500')}>
                        {date.getDate()}
                      </div>
                      {appts.slice(0, 3).map((a: any) => {
                        const cfg = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.SCHEDULED
                        return (
                          <button key={a.id} onClick={() => setSelected(a)}
                            className={cn('w-full text-left text-[9px] px-1.5 py-0.5 rounded font-medium truncate mb-0.5 border transition-all hover:opacity-80', cfg.color)}>
                            {new Date(a.scheduled_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} · {a.leads?.name?.split(' ')[0] ?? '?'}
                          </button>
                        )
                      })}
                      {appts.length > 3 && <div className="text-[9px] text-zinc-600 text-center">+{appts.length - 3}</div>}
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {/* WEEK VIEW */}
          {view === 'week' && (
            <div className="rounded-xl border border-zinc-800/60 bg-[#0f0f10] overflow-hidden overflow-x-auto">
              <div className="grid min-w-[600px]" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
                {/* Header row */}
                <div className="border-b border-zinc-800/60 py-3" />
                {weekDays.map((d, i) => {
                  const isToday = d.toDateString() === today.toDateString()
                  const dayAppts = apptByDay[d.toDateString()] ?? []
                  return (
                    <div key={i} className={cn('border-b border-l border-zinc-800/60 py-2 px-1 text-center', isToday && 'bg-blue-600/5')}>
                      <div className="text-[10px] text-zinc-600 uppercase">{DAYS[d.getDay()]}</div>
                      <div className={cn('text-sm font-bold mx-auto w-7 h-7 rounded-full flex items-center justify-center',
                        isToday ? 'bg-blue-600 text-white' : 'text-zinc-300')}>
                        {d.getDate()}
                      </div>
                      {dayAppts.length > 0 && (
                        <div className="text-[9px] text-blue-400 font-medium">{dayAppts.length} appt{dayAppts.length > 1 ? 's' : ''}</div>
                      )}
                    </div>
                  )
                })}

                {/* Hour rows */}
                {HOURS.map((hour) => (
                  <>
                    <div key={`h-${hour}`} className="border-b border-zinc-800/40 py-2 px-2 text-[10px] text-zinc-700 text-right">
                      {hour}:00
                    </div>
                    {weekDays.map((d, di) => {
                      const dayAppts = (apptByDay[d.toDateString()] ?? []).filter((a: any) => new Date(a.scheduled_time).getHours() === hour)
                      return (
                        <div key={`${hour}-${di}`} className="border-b border-l border-zinc-800/40 min-h-[48px] p-0.5">
                          {dayAppts.map((a: any) => {
                            const cfg = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.SCHEDULED
                            return (
                              <button key={a.id} onClick={() => setSelected(a)}
                                className={cn('w-full text-left text-[9px] px-1.5 py-1 rounded border font-medium truncate hover:opacity-80 transition-all', cfg.color)}>
                                {a.leads?.name?.split(' ')[0] ?? '?'}
                              </button>
                            )
                          })}
                        </div>
                      )
                    })}
                  </>
                ))}
              </div>
            </div>
          )}

          {/* LIST VIEW */}
          {view === 'list' && (
            <div className="rounded-xl border border-zinc-800/60 bg-[#0f0f10] overflow-hidden">
              {loading ? (
                <div className="p-5 space-y-3">
                  {[1,2,3,4].map(i => <div key={i} className="h-16 rounded-lg bg-zinc-800/50 animate-pulse" />)}
                </div>
              ) : appointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-zinc-700">
                  <Calendar className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">No appointments yet</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/60">
                  {appointments
                    .sort((a: any, b: any) => new Date(b.scheduled_time).getTime() - new Date(a.scheduled_time).getTime())
                    .map((a: any) => {
                      const d = new Date(a.scheduled_time)
                      const cfg = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.SCHEDULED
                      const isPast = d < today
                      return (
                        <button key={a.id} onClick={() => setSelected(a)}
                          className={cn('w-full text-left px-5 py-4 hover:bg-zinc-900/40 transition-colors', isPast && a.status !== 'COMPLETED' && 'opacity-60')}>
                          <div className="flex items-center gap-4">
                            <div className="shrink-0 w-12 text-center">
                              <div className="text-[10px] text-zinc-600 uppercase">{d.toLocaleDateString('en-GB', { weekday: 'short' })}</div>
                              <div className="text-lg font-bold text-zinc-200 leading-tight">{d.getDate()}</div>
                              <div className="text-[10px] text-zinc-600">{MONTHS[d.getMonth()].slice(0,3)}</div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-zinc-200">{a.leads?.name ?? 'Unknown'}</p>
                              <div className="flex items-center gap-3 mt-0.5 text-xs text-zinc-500">
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                                {a.leads?.postcode && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{a.leads.postcode}</span>}
                                {a.leads?.service_type && <span className="capitalize">{a.leads.service_type.replace('_',' ')}</span>}
                              </div>
                            </div>
                            <span className={cn('shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium border', cfg.color)}>{cfg.label}</span>
                          </div>
                        </button>
                      )
                    })}
                </div>
              )}
            </div>
          )}

          {/* RIGHT: Upcoming sidebar */}
          <div className="space-y-4">
            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'This Week', value: appointments.filter((a: any) => { const d = new Date(a.scheduled_time); const wk = new Date(today); wk.setDate(today.getDate() - today.getDay()); const we = new Date(wk); we.setDate(wk.getDate() + 7); return d >= wk && d < we }).length, color: 'text-blue-400' },
                { label: 'Upcoming', value: upcoming.length, color: 'text-cyan-400' },
                { label: 'Completed', value: appointments.filter((a: any) => a.status === 'COMPLETED').length, color: 'text-emerald-400' },
                { label: 'Cancelled', value: appointments.filter((a: any) => a.status === 'CANCELLED' || a.status === 'NO_SHOW').length, color: 'text-red-400' },
              ].map(s => (
                <div key={s.label} className="rounded-xl border border-zinc-800/60 bg-[#0f0f10] p-3 text-center">
                  <div className={cn('text-xl font-bold', s.color)}>{s.value}</div>
                  <div className="text-[10px] text-zinc-600 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Upcoming list */}
            <div className="rounded-xl border border-zinc-800/60 bg-[#0f0f10] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <h3 className="text-xs font-semibold text-zinc-200">Next Appointments</h3>
              </div>
              <div className="space-y-2">
                {loading ? (
                  [1,2,3].map(i => <div key={i} className="h-14 rounded-lg bg-zinc-800/50 animate-pulse" />)
                ) : upcoming.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-zinc-700">
                    <Calendar className="w-7 h-7 mb-2 opacity-30" />
                    <p className="text-xs">No upcoming appointments</p>
                  </div>
                ) : upcoming.slice(0, 6).map((a: any) => {
                  const d = new Date(a.scheduled_time)
                  const cfg = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.SCHEDULED
                  const isToday = d.toDateString() === today.toDateString()
                  const isTomorrow = d.toDateString() === new Date(today.getTime() + 86400000).toDateString()
                  const dayLabel = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
                  return (
                    <button key={a.id} onClick={() => setSelected(a)}
                      className="w-full text-left p-3 rounded-lg border border-zinc-800/60 bg-zinc-900/40 hover:border-zinc-700 transition-all">
                      <div className="flex items-start gap-2.5">
                        <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', cfg.dot)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-zinc-200 truncate">{a.leads?.name ?? 'Unknown'}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">{dayLabel} · {d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                          {a.leads?.postcode && <p className="text-[10px] text-zinc-600">{a.leads.postcode} · {a.leads.service_type?.replace('_',' ')}</p>}
                        </div>
                        <span className={cn('shrink-0 px-1.5 py-0.5 rounded text-[9px] font-medium border', cfg.color)}>{cfg.label}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
