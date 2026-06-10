'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import {
  Search, Filter, SortAsc, SortDesc, Download, Trash2,
  ChevronLeft, ChevronRight, Phone, Mail, MapPin, ArrowUpDown, Flame
} from 'lucide-react'
import { useLeads } from '@/hooks/useLeads'
import { ScoreBadge } from '@/components/ui/ScoreBadge'
import { StatusBadge, UrgencyBadge, SourceBadge } from '@/components/ui/Badges'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { useCRMStore } from '@/store/crm'
import { formatCurrency, formatRelativeTime, cn } from '@/lib/utils'
import Link from 'next/link'

const PAGE_SIZE = 10

const STATUS_OPTIONS = ['ALL', 'NEW', 'CONTACTED', 'QUOTED', 'BOOKED', 'WON', 'LOST']
const SOURCE_OPTIONS = ['ALL', 'google', 'referral', 'website', 'facebook', 'callrail', 'manual']
const URGENCY_OPTIONS = ['ALL', 'emergency', 'high', 'medium', 'low']

type SortField = 'score' | 'created_at' | 'estimated_value' | 'name' | 'status'
type SortDir = 'asc' | 'desc'

export default function LeadsPage() {
  const { leads, loading } = useLeads()
  const { selectedLeads, toggleLeadSelection, clearSelection, selectAll } = useCRMStore()
  const searchParams = useSearchParams()

  // Read URL params from dashboard KPI card links
  const urlStatus = searchParams.get('status') ?? ''
  const urlFilter = searchParams.get('filter') ?? ''

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(urlStatus || 'ALL')
  const [sourceFilter, setSourceFilter] = useState('ALL')
  const [urgencyFilter, setUrgencyFilter] = useState('ALL')
  const [sortField, setSortField] = useState<SortField>('score')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const filtered = useMemo(() => {
    let list = [...leads]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((l) =>
        l.name?.toLowerCase().includes(q) ||
        l.phone?.includes(q) ||
        l.postcode?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q)
      )
    }
    // Apply URL filter=hot (score >= 75)
    if (urlFilter === 'hot') list = list.filter((l) => (l.score ?? 0) >= 75)
    if (statusFilter !== 'ALL') list = list.filter((l) => l.status === statusFilter)
    if (sourceFilter !== 'ALL') list = list.filter((l) => l.source === sourceFilter)
    if (urgencyFilter !== 'ALL') list = list.filter((l) => l.urgency === urgencyFilter)

    list.sort((a, b) => {
      const av = a[sortField] ?? 0
      const bv = b[sortField] ?? 0
      const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number)
      return sortDir === 'desc' ? -cmp : cmp
    })

    return list
  }, [leads, search, statusFilter, sourceFilter, urgencyFilter, sortField, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const allSelected = paginated.length > 0 && paginated.every((l) => selectedLeads.includes(l.id))

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('desc') }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-zinc-600" />
    return sortDir === 'desc' ? <SortDesc className="w-3 h-3 text-blue-400" /> : <SortAsc className="w-3 h-3 text-blue-400" />
  }

  return (
    <div className="space-y-4 max-w-[1400px]">
      {/* Header bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="flex-1 min-w-[220px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search leads..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
          />
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all',
            showFilters
              ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
          )}
        >
          <Filter className="w-3.5 h-3.5" />
          Filters
          {(statusFilter !== 'ALL' || sourceFilter !== 'ALL' || urgencyFilter !== 'ALL') && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          )}
        </button>

        <span className="text-sm text-zinc-500">{filtered.length} leads</span>

        {/* Active filter banner from dashboard */}
        {(urlFilter === 'hot' || urlStatus) && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Flame className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs text-blue-400 font-medium">
              {urlFilter === 'hot' ? 'Hot Leads (score ≥ 75)' : `Status: ${urlStatus}`}
            </span>
            <Link href="/leads" className="text-xs text-zinc-500 hover:text-zinc-300 ml-1">✕ Clear</Link>
          </div>
        )}

        {selectedLeads.length > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700">
            <span className="text-xs text-zinc-400">{selectedLeads.length} selected</span>
            <button className="text-red-400 hover:text-red-300 p-0.5"><Trash2 className="w-3.5 h-3.5" /></button>
            <button onClick={clearSelection} className="text-zinc-500 text-xs hover:text-zinc-300">Clear</button>
          </motion.div>
        )}

        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-400 hover:text-zinc-200 transition-colors ml-auto">
          <Download className="w-3.5 h-3.5" /> Export
        </button>
      </div>

      {/* Filters row */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-3"
          >
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-zinc-600 font-medium">Status</span>
              <div className="flex gap-1 flex-wrap">
                {STATUS_OPTIONS.map((s) => (
                  <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
                    className={cn('px-2.5 py-1 rounded-md text-xs font-medium border transition-all',
                      statusFilter === s ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300')}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-zinc-600 font-medium">Source</span>
              <div className="flex gap-1 flex-wrap">
                {SOURCE_OPTIONS.map((s) => (
                  <button key={s} onClick={() => { setSourceFilter(s); setPage(1) }}
                    className={cn('px-2.5 py-1 rounded-md text-xs font-medium border transition-all capitalize',
                      sourceFilter === s ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300')}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-zinc-600 font-medium">Urgency</span>
              <div className="flex gap-1 flex-wrap">
                {URGENCY_OPTIONS.map((s) => (
                  <button key={s} onClick={() => { setUrgencyFilter(s); setPage(1) }}
                    className={cn('px-2.5 py-1 rounded-md text-xs font-medium border transition-all capitalize',
                      urgencyFilter === s ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300')}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800/60 bg-[#0f0f10] overflow-hidden">
        {/* Table head */}
        <div className="grid grid-cols-[2rem_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 border-b border-zinc-800/60 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          <div>
            <input type="checkbox" checked={allSelected}
              onChange={() => allSelected ? clearSelection() : selectAll(paginated.map((l) => l.id))}
              className="rounded border-zinc-700 bg-zinc-800 text-blue-500 focus:ring-0" />
          </div>
          <button onClick={() => toggleSort('name')} className="flex items-center gap-1.5 text-left hover:text-zinc-300 transition-colors">Name <SortIcon field="name" /></button>
          <div>Contact</div>
          <div>Location</div>
          <button onClick={() => toggleSort('score')} className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors">Score <SortIcon field="score" /></button>
          <div>Status / Urgency</div>
          <div>Source</div>
          <button onClick={() => toggleSort('created_at')} className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors">Activity <SortIcon field="created_at" /></button>
        </div>

        {/* Table body */}
        <div className="divide-y divide-zinc-800/40">
          {loading ? (
            <div className="p-4"><TableSkeleton rows={8} /></div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
              <Search className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm font-medium">No leads found</p>
              <p className="text-xs text-zinc-700 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            paginated.map((lead, i) => {
              const isHot = (lead.score ?? 0) >= 75
              const isSelected = selectedLeads.includes(lead.id)
              return (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className={cn(
                    'grid grid-cols-[2rem_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 items-center transition-all cursor-pointer group',
                    isSelected ? 'bg-blue-500/5 border-l-2 border-l-blue-500' : 'hover:bg-zinc-900/50',
                    isHot && !isSelected && 'border-l-2 border-l-red-500/40'
                  )}
                >
                  <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleLeadSelection(lead.id) }}>
                    <input type="checkbox" checked={isSelected} onChange={() => {}} className="rounded border-zinc-700 bg-zinc-800 text-blue-500 focus:ring-0" />
                  </div>

                  <Link href={`/leads/${lead.id}`} className="flex items-center gap-2.5 min-w-0">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                      isHot ? 'bg-red-500/15 text-red-300 border border-red-500/20' : 'bg-zinc-800 text-zinc-400'
                    )}>
                      {lead.name?.charAt(0) ?? '?'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-zinc-200 truncate group-hover:text-white transition-colors">{lead.name ?? '—'}</span>
                        {isHot && <Flame className="w-3 h-3 text-red-400 shrink-0" />}
                      </div>
                      <span className="text-xs text-zinc-600 truncate block">{lead.service_type?.replace('_', ' ') ?? '—'}</span>
                    </div>
                  </Link>

                  <Link href={`/leads/${lead.id}`} className="min-w-0">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <Phone className="w-3 h-3 shrink-0" />
                      <span className="truncate">{lead.phone ?? '—'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-600 mt-0.5">
                      <Mail className="w-3 h-3 shrink-0" />
                      <span className="truncate">{lead.email ?? '—'}</span>
                    </div>
                  </Link>

                  <Link href={`/leads/${lead.id}`} className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span>{lead.postcode ?? '—'}</span>
                  </Link>

                  <Link href={`/leads/${lead.id}`}>
                    <ScoreBadge score={lead.score} showBar />
                  </Link>

                  <Link href={`/leads/${lead.id}`} className="space-y-1">
                    <StatusBadge status={lead.status} />
                    <UrgencyBadge urgency={lead.urgency} />
                  </Link>

                  <Link href={`/leads/${lead.id}`}>
                    <SourceBadge source={lead.source} />
                  </Link>

                  <Link href={`/leads/${lead.id}`} className="text-right">
                    <div className="text-xs font-semibold text-zinc-200">{formatCurrency(lead.estimated_value)}</div>
                    <div className="text-xs text-zinc-600">{formatRelativeTime(lead.last_contact_at ?? lead.created_at)}</div>
                  </Link>
                </motion.div>
              )
            })
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800/60">
          <span className="text-xs text-zinc-500">
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pg = page <= 3 ? i + 1 : page + i - 2
              if (pg > totalPages) return null
              return (
                <button key={pg} onClick={() => setPage(pg)}
                  className={cn('w-7 h-7 rounded-md text-xs font-medium transition-all',
                    pg === page ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800')}>
                  {pg}
                </button>
              )
            })}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
