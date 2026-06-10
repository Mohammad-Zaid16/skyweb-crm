'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, User } from 'lucide-react'
import { useAppointments } from '@/hooks/useData'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCurrency, cn } from '@/lib/utils'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function CalendarPage() {
  const { appointments, loading } = useAppointments()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'list'>('month')

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
    .filter((a: any) => new Date(a.scheduled_time) >= today)
    .slice(0, 8)

  return (
    <div className="space-y-5 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-base font-bold text-zinc-200 w-40 text-center">
            {MONTHS[month]} {year}
          </h2>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <button onClick={() => setCurrentDate(new Date())}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors">
          Today
        </button>
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

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">
        {/* Calendar grid */}
        <div className="rounded-xl border border-zinc-800/60 bg-[#0f0f10] overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-zinc-800/60">
            {DAYS.map((d) => (
              <div key={d} className="py-3 text-center text-xs font-semibold text-zinc-600 uppercase tracking-wider">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {cells.map((date, i) => {
              if (!date) return <div key={i} className="min-h-[80px] border-b border-r border-zinc-800/40 bg-zinc-900/20" />
              const isToday = date.toDateString() === today.toDateString()
              const appts = apptByDay[date.toDateString()] ?? []
              const isPast = date < today && !isToday

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.005 }}
                  className={cn(
                    'min-h-[80px] p-2 border-b border-r border-zinc-800/40 cursor-pointer transition-colors',
                    isPast ? 'bg-transparent opacity-50' : 'hover:bg-zinc-900/40',
                    i % 7 === 6 && 'border-r-0'
                  )}
                >
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mb-1 mx-auto',
                    isToday ? 'bg-blue-600 text-white' : 'text-zinc-500'
                  )}>
                    {date.getDate()}
                  </div>
                  {appts.slice(0, 2).map((a: any) => (
                    <div key={a.id} className={cn(
                      'text-[9px] px-1.5 py-0.5 rounded font-medium truncate mb-0.5',
                      a.status === 'CONFIRMED' ? 'bg-emerald-500/20 text-emerald-400' :
                      a.status === 'COMPLETED' ? 'bg-zinc-800 text-zinc-500' :
                      'bg-blue-500/20 text-blue-400'
                    )}>
                      {new Date(a.scheduled_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} · {a.leads?.name?.split(' ')[0]}
                    </div>
                  ))}
                  {appts.length > 2 && <div className="text-[9px] text-zinc-600 text-center">+{appts.length - 2}</div>}
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Upcoming list */}
        <div className="rounded-xl border border-zinc-800/60 bg-[#0f0f10] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-zinc-200">Upcoming</h3>
            <span className="text-xs text-zinc-600">({upcoming.length})</span>
          </div>
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-lg shimmer bg-zinc-800/50" />)
            ) : upcoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-zinc-700">
                <Calendar className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No upcoming appointments</p>
              </div>
            ) : (
              upcoming.map((a: any) => {
                const d = new Date(a.scheduled_time)
                return (
                  <motion.div key={a.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                    className="p-3 rounded-lg border border-zinc-800/60 bg-zinc-900/40 hover:border-zinc-700 transition-all">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 w-10 text-center bg-zinc-800 rounded-lg py-1.5">
                        <div className="text-[10px] text-zinc-500 uppercase">{d.toLocaleDateString('en-GB', { weekday: 'short' })}</div>
                        <div className="text-base font-bold text-zinc-200 leading-tight">{d.getDate()}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-zinc-200 truncate">{a.leads?.name ?? 'Unknown'}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-zinc-600">
                          <Clock className="w-3 h-3" />
                          {d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          {a.leads?.postcode && (
                            <>
                              <span>·</span>
                              <MapPin className="w-3 h-3" />
                              {a.leads.postcode}
                            </>
                          )}
                        </div>
                        <span className={cn('text-[10px] font-medium mt-1 block',
                          a.status === 'CONFIRMED' ? 'text-emerald-400' :
                          a.status === 'SCHEDULED' ? 'text-blue-400' : 'text-zinc-500')}>
                          {a.status}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
