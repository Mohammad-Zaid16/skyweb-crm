'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import {
  Search, Filter, Phone, MapPin, Flame, Calendar,
  ChevronLeft, ChevronRight, X, SortAsc, SortDesc,
  Users, Clock, CheckCircle, XCircle
} from 'lucide-react'
import { useLeads } from '@/hooks/useLeads'
import { useAppointments } from '@/hooks/useData'
import { ScoreBadge } from '@/components/ui/ScoreBadge'
import { StatusBadge, SourceBadge } from '@/components/ui/Badges'
import { formatRelativeTime, cn } from '@/lib/utils'
import Link from 'next/link'

const PAGE_SIZE = 10
const SOURCE_OPTIONS = ['ALL','google','referral','website','facebook','callrail','whatsapp','manual']
const URGENCY_OPTIONS = ['ALL','emergency','high','medium','low']
type SortField = 'score'|'created_at'|'estimated_value'|'name'|'status'
type SortDir = 'asc'|'desc'

const TABS = [
  { id: 'active',    label: 'Active Leads',  icon: Users,        statuses: ['NEW','CONTACTED','QUOTED'] },
  { id: 'booked',    label: 'Booked',         icon: Calendar,     statuses: ['BOOKED'] },
  { id: 'completed', label: 'Completed',      icon: CheckCircle,  statuses: ['WON','LOST'] },
  { id: 'all',       label: 'All',            icon: Filter,       statuses: [] },
]

const urgencyColor: Record<string, string> = {
  emergency: 'text-red-400', high: 'text-orange-400',
  medium: 'text-amber-400', low: 'text-zinc-500'
}

export default function LeadsPage() {
  const { leads, loading } = useLeads()
  const { appointments } = useAppointments()
  const searchParams = useSearchParams()
  const urlStatus = searchParams.get('status') ?? ''
  const urlFilter = searchParams.get('filter') ?? ''

  // Default tab from URL param
  const defaultTab = urlStatus === 'BOOKED' ? 'booked'
    : urlFilter === 'hot' ? 'all'
    : urlStatus === 'WON' || urlStatus === 'LOST' ? 'completed'
    : 'active'

  const [activeTab, setActiveTab] = useState(defaultTab)
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('ALL')
  const [urgencyFilter, setUrgencyFilter] = useState('ALL')
  const [sortField, setSortField] = useState<SortField>('score')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  // Build appointment lookup by lead_id
  const apptByLead = useMemo(() =>
    appointments.reduce((acc: Record<string, any>, a: any) => {
      if (!acc[a.lead_id] || new Date(a.scheduled_time) > new Date(acc[a.lead_id].scheduled_time)) {
        acc[a.lead_id] = a
      }
      return acc
    }, {}),
  [appointments])

  const tab = TABS.find(t => t.id === activeTab) ?? TABS[0]

  const filtered = useMemo(() => {
    let list = [...leads]

    // Tab filter
    if (tab.statuses.length > 0) {
      list = list.filter(l => tab.statuses.includes(l.status ?? ''))
    }

    // URL hot filter
    if (urlFilter === 'hot') list = list.filter(l => (l.score ?? 0) >= 75)

    // Search
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(l =>
        l.name?.toLowerCase().includes(q) ||
        l.phone?.includes(q) ||
        l.postcode?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q)
      )
    }

    if (sourceFilter !== 'ALL') list = list.filter(l => l.source === sourceFilter)
    if (urgencyFilter !== 'ALL') list = list.filter(l => l.urgency === urgencyFilter)

    list.sort((a, b) => {
      let av: any = (a as any)[sortField] ?? 0
      let bv: any = (b as any)[sortField] ?? 0
      if (sortField === 'name') { av = av.toString().toLowerCase(); bv = bv.toString().toLowerCase() }
      if (sortField === 'created_at') { av = new Date(av).getTime(); bv = new Date(bv).getTime() }
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
    })
    return list
  }, [leads, tab, search, sourceFilter, urgencyFilter, sortField, sortDir, urlFilter])

  const tabCounts = useMemo(() => ({
    active: leads.filter(l => ['NEW','CONTACTED','QUOTED'].includes(l.status ?? '')).length,
    booked: leads.filter(l => l.status === 'BOOKED').length,
    completed: leads.filter(l => ['WON','LOST'].includes(l.status ?? '')).length,
    all: leads.length,
  }), [leads])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
    setPage(1)
  }

  return (
    <div className="space-y-4 max-w-[1400px]">

      {/* ── TABS ── */}
      <div className="flex items-center gap-1 bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-1 w-full overflow-x-auto">
        {TABS.map(t => {
          const count = tabCounts[t.id as keyof typeof tabCounts]
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => { setActiveTab(t.id); setPage(1) }}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center',
                activeTab === t.id ? 'bg-[#0f0f10] text-zinc-100 shadow-sm border border-zinc-800' : 'text-zinc-500 hover:text-zinc-300')}>
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {t.label}
              <span className={cn('px-1.5 py-0.5 rounded-md text-xs font-bold tabular-nums',
                activeTab === t.id ? 'bg-blue-600/20 text-blue-400' : 'bg-zinc-800 text-zinc-600')}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Search + filters ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search name, phone, postcode..."
            className="w-full pl-9 pr-9 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button onClick={() => setShowFilters(v => !v)}
          className={cn('flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all',
            showFilters ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200')}>
          <Filter className="w-3.5 h-3.5" />
          <span className="hidden sm:block">Filters</span>
        </button>
        {urlFilter === 'hot' && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
            <Flame className="w-3 h-3 text-red-400" />
            <span className="text-xs text-red-400">Hot leads only</span>
            <Link href="/leads" className="text-zinc-600 hover:text-zinc-400"><X className="w-3 h-3" /></Link>
          </div>
        )}
        <span className="text-sm text-zinc-600 ml-auto">{filtered.length} leads</span>
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border border-zinc-800/60 bg-[#0f0f10] p-4 space-y-3 overflow-hidden">
            {[
              { label: 'Source', options: SOURCE_OPTIONS, value: sourceFilter, set: (v: string) => { setSourceFilter(v); setPage(1) } },
              { label: 'Urgency', options: URGENCY_OPTIONS, value: urgencyFilter, set: (v: string) => { setUrgencyFilter(v); setPage(1) } },
            ].map(({ label, options, value, set }) => (
              <div key={label} className="flex items-center gap-3 flex-wrap">
                <span className="text-[10px] uppercase tracking-wider text-zinc-600 font-medium w-14 shrink-0">{label}</span>
                <div className="flex gap-1.5 flex-wrap">
                  {options.map(o => (
                    <button key={o} onClick={() => set(o)}
                      className={cn('px-2.5 py-1 rounded-md text-xs font-medium border transition-all capitalize',
                        value === o ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300')}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider text-zinc-600 font-medium w-14 shrink-0">Sort</span>
              <div className="flex gap-1.5 flex-wrap">
                {(['score','created_at','name'] as SortField[]).map(f => (
                  <button key={f} onClick={() => toggleSort(f)}
                    className={cn('flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-all',
                      sortField === f ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300')}>
                    {f.replace('_',' ')} {sortField === f && (sortDir === 'desc' ? <SortDesc className="w-3 h-3" /> : <SortAsc className="w-3 h-3" />)}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MOBILE card layout ── */}
      <div className="md:hidden space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 rounded-xl bg-zinc-900 border border-zinc-800 animate-pulse" />)
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-600 rounded-xl border border-zinc-800 bg-[#0f0f10]">
            <Search className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-sm">No leads found</p>
          </div>
        ) : paginated.map((lead, i) => {
          const isHot = (lead.score ?? 0) >= 75
          const appt = apptByLead[lead.id]
          const isWon = lead.status === 'WON'
          const isLost = lead.status === 'LOST'
          return (
            <motion.div key={lead.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Link href={`/leads/${lead.id}`}
                className={cn('block rounded-xl border bg-[#0f0f10] p-4 active:scale-[0.99] transition-all',
                  isWon ? 'border-emerald-500/30 bg-emerald-500/5' :
                  isLost ? 'border-zinc-800 opacity-70' :
                  isHot ? 'border-red-500/30' : 'border-zinc-800/60')}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                      isWon ? 'bg-emerald-500/15 text-emerald-300' :
                      isHot ? 'bg-red-500/15 text-red-300' : 'bg-zinc-800 text-zinc-400')}>
                      {lead.name?.charAt(0) ?? '?'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-zinc-200 truncate">{lead.name}</span>
                        {isHot && !isWon && <Flame className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                        {isWon && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      </div>
                      <p className="text-xs text-zinc-500 capitalize">{lead.service_type?.replace('_',' ')}</p>
                    </div>
                  </div>
                  <ScoreBadge score={lead.score} size="sm" />
                </div>

                {/* Appointment time for booked leads */}
                {appt && (
                  <div className="flex items-center gap-1.5 mb-2 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="text-xs text-cyan-300 font-medium">
                      {new Date(appt.scheduled_time).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} at {new Date(appt.scheduled_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={cn('ml-auto text-[10px] px-1.5 py-0.5 rounded font-medium',
                      appt.status === 'CONFIRMED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400')}>
                      {appt.status}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={lead.status} />
                  {lead.postcode && <span className="flex items-center gap-1 text-xs text-zinc-600"><MapPin className="w-3 h-3" />{lead.postcode}</span>}
                  {lead.phone && <span className="flex items-center gap-1 text-xs text-zinc-600"><Phone className="w-3 h-3" />{lead.phone}</span>}
                  <span className="text-xs text-zinc-700 ml-auto">{formatRelativeTime(lead.created_at)}</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <SourceBadge source={lead.source} />
                  {lead.urgency && <span className={cn('text-xs font-medium capitalize', urgencyColor[lead.urgency] ?? 'text-zinc-500')}>{lead.urgency}</span>}
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>

      {/* ── DESKTOP table layout ── */}
      <div className="hidden md:block rounded-xl border border-zinc-800/60 bg-[#0f0f10] overflow-hidden">
        <div className="grid gap-4 px-5 py-3 border-b border-zinc-800/60 text-[11px] font-semibold uppercase tracking-wider text-zinc-500"
          style={{ gridTemplateColumns: activeTab === 'booked' ? '1fr 1fr 200px 80px 120px 100px' : '1fr 1fr 80px 100px 120px 100px' }}>
          <button onClick={() => toggleSort('name')} className="flex items-center gap-1 hover:text-zinc-300 transition-colors text-left">
            Lead {sortField === 'name' && (sortDir === 'desc' ? <SortDesc className="w-3 h-3" /> : <SortAsc className="w-3 h-3" />)}
          </button>
          <div>Contact</div>
          {activeTab === 'booked' && <div>Appointment</div>}
          <button onClick={() => toggleSort('score')} className="flex items-center gap-1 hover:text-zinc-300 transition-colors">
            Score {sortField === 'score' && (sortDir === 'desc' ? <SortDesc className="w-3 h-3" /> : <SortAsc className="w-3 h-3" />)}
          </button>
          <div>Status</div>
          <div>Source</div>
          <button onClick={() => toggleSort('created_at')} className="flex items-center gap-1 hover:text-zinc-300 transition-colors">
            Time {sortField === 'created_at' && (sortDir === 'desc' ? <SortDesc className="w-3 h-3" /> : <SortAsc className="w-3 h-3" />)}
          </button>
        </div>

        <div className="divide-y divide-zinc-800/40">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 px-5 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="w-32 h-3 rounded bg-zinc-800 animate-pulse" />
                  <div className="w-20 h-2 rounded bg-zinc-800 animate-pulse" />
                </div>
              </div>
            ))
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
              <Search className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm">No {tab.label.toLowerCase()} found</p>
              {activeTab !== 'all' && (
                <button onClick={() => setActiveTab('all')} className="mt-2 text-xs text-blue-400 hover:text-blue-300">View all leads →</button>
              )}
            </div>
          ) : paginated.map((lead, i) => {
            const isHot = (lead.score ?? 0) >= 75
            const isWon = lead.status === 'WON'
            const isLost = lead.status === 'LOST'
            const appt = apptByLead[lead.id]
            return (
              <motion.div key={lead.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                <Link href={`/leads/${lead.id}`}
                  className={cn('grid gap-4 px-5 py-3.5 items-center hover:bg-zinc-900/50 transition-all',
                    isWon && 'bg-emerald-500/5 hover:bg-emerald-500/10',
                    isLost && 'opacity-60',
                    isHot && !isWon && 'border-l-2 border-l-red-500/40')}
                  style={{ gridTemplateColumns: activeTab === 'booked' ? '1fr 1fr 200px 80px 120px 100px' : '1fr 1fr 80px 100px 120px 100px' }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                      isWon ? 'bg-emerald-500/15 text-emerald-300' :
                      isHot ? 'bg-red-500/15 text-red-300' : 'bg-zinc-800 text-zinc-400')}>
                      {lead.name?.charAt(0) ?? '?'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-zinc-200 truncate">{lead.name}</span>
                        {isHot && !isWon && <Flame className="w-3 h-3 text-red-400 shrink-0" />}
                        {isWon && <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />}
                      </div>
                      <span className="text-xs text-zinc-600 capitalize">{lead.service_type?.replace('_',' ')}</span>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-400 truncate">{lead.phone}</p>
                    {lead.postcode && <p className="text-xs text-zinc-600 flex items-center gap-1"><MapPin className="w-3 h-3" />{lead.postcode}</p>}
                  </div>
                  {activeTab === 'booked' && (
                    <div>
                      {appt ? (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <div>
                            <p className="text-xs text-cyan-300 font-medium">
                              {new Date(appt.scheduled_time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </p>
                            <p className="text-[10px] text-cyan-400/60">
                              {new Date(appt.scheduled_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ) : <span className="text-xs text-zinc-700">—</span>}
                    </div>
                  )}
                  <ScoreBadge score={lead.score} size="sm" />
                  <StatusBadge status={lead.status} />
                  <SourceBadge source={lead.source} />
                  <span className="text-xs text-zinc-600">{formatRelativeTime(lead.created_at)}</span>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-zinc-600">
            Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
              className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p = i + 1
              if (totalPages > 5) {
                if (page <= 3) p = i + 1
                else if (page >= totalPages - 2) p = totalPages - 4 + i
                else p = page - 2 + i
              }
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={cn('w-9 h-9 rounded-lg text-sm font-medium transition-all',
                    page === p ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800')}>
                  {p}
                </button>
              )
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
              className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
