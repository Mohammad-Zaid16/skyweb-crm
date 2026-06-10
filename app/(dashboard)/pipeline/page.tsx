'use client'

import { useState, useMemo, useOptimistic } from 'react'
import { motion } from 'framer-motion'
import { Flame, DollarSign, Users, RefreshCw } from 'lucide-react'
import { useLeads } from '@/hooks/useLeads'
import { ScoreBadge } from '@/components/ui/ScoreBadge'
import { SourceBadge } from '@/components/ui/Badges'
import { formatCurrency, formatRelativeTime, cn } from '@/lib/utils'
import Link from 'next/link'

const STAGES = [
  { id: 'NEW',       label: 'New',       color: 'border-t-blue-500',    dot: 'bg-blue-500' },
  { id: 'CONTACTED', label: 'Contacted', color: 'border-t-purple-500',  dot: 'bg-purple-500' },
  { id: 'QUOTED',    label: 'Quoted',    color: 'border-t-amber-500',   dot: 'bg-amber-500' },
  { id: 'BOOKED',    label: 'Booked',    color: 'border-t-cyan-500',    dot: 'bg-cyan-500' },
  { id: 'WON',       label: 'Won',       color: 'border-t-emerald-500', dot: 'bg-emerald-500' },
  { id: 'LOST',      label: 'Lost',      color: 'border-t-red-500',     dot: 'bg-red-500' },
]

export default function PipelinePage() {
  const { leads, loading, refetch } = useLeads()
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [localStatuses, setLocalStatuses] = useState<Record<string, string>>({})
  const [updating, setUpdating] = useState(false)

  // Merge local optimistic statuses with server data
  const mergedLeads = useMemo(() =>
    leads.map(l => localStatuses[l.id] ? { ...l, status: localStatuses[l.id] as any } : l),
    [leads, localStatuses]
  )

  const byStage = useMemo(() =>
    STAGES.reduce((acc, s) => {
      acc[s.id] = mergedLeads.filter((l) => l.status === s.id)
      return acc
    }, {} as Record<string, typeof mergedLeads>),
    [mergedLeads]
  )

  const stageValue = (id: string) => byStage[id]?.reduce((s, l) => s + (l.estimated_value ?? 0), 0) ?? 0
  const totalPipeline = mergedLeads.reduce((s, l) => s + (l.estimated_value ?? 0), 0)

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId)
    setDragging(leadId)
  }

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault()
    const leadId = e.dataTransfer.getData('leadId')
    if (!leadId || localStatuses[leadId] === status) {
      setDragging(null); setDragOver(null); return
    }
    // Optimistic update
    setLocalStatuses(p => ({ ...p, [leadId]: status }))
    setDragging(null); setDragOver(null)
    setUpdating(true)
    try {
      await fetch('/api/leads/' + leadId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      // Clear local override after server confirms
      setLocalStatuses(p => { const n = { ...p }; delete n[leadId]; return n })
    } catch (err) {
      console.error('Pipeline update failed:', err)
      // Revert optimistic on failure
      setLocalStatuses(p => { const n = { ...p }; delete n[leadId]; return n })
    }
    setUpdating(false)
  }

  return (
    <div className="space-y-4 max-w-[1600px]">
      {/* Summary bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800">
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-sm font-semibold text-zinc-200">{formatCurrency(totalPipeline)}</span>
          <span className="text-xs text-zinc-500">pipeline</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800">
          <Users className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-sm font-semibold text-zinc-200">{mergedLeads.length}</span>
          <span className="text-xs text-zinc-500">leads</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800">
          <Flame className="w-3.5 h-3.5 text-red-400" />
          <span className="text-sm font-semibold text-zinc-200">{mergedLeads.filter((l) => (l.score ?? 0) >= 75).length}</span>
          <span className="text-xs text-zinc-500">hot</span>
        </div>
        {updating && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <RefreshCw className="w-3 h-3 animate-spin" /> Saving...
          </div>
        )}
        <p className="text-xs text-zinc-600 ml-auto hidden md:block">Drag cards to update status</p>
      </div>

      {/* Mobile: show list view on small screens */}
      <div className="md:hidden space-y-4">
        {STAGES.map(stage => {
          const stageLeads = byStage[stage.id] ?? []
          if (stageLeads.length === 0) return null
          return (
            <div key={stage.id} className="rounded-xl border border-zinc-800/60 bg-[#0f0f10] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800/60">
                <div className={cn('w-2 h-2 rounded-full', stage.dot)} />
                <span className="text-sm font-semibold text-zinc-300">{stage.label}</span>
                <span className="text-xs text-zinc-600 ml-auto">{stageLeads.length} leads</span>
              </div>
              <div className="divide-y divide-zinc-800/60">
                {stageLeads.map(lead => (
                  <Link key={lead.id} href={`/leads/${lead.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-900/50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 shrink-0">
                      {lead.name?.charAt(0) ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">{lead.name}</p>
                      <p className="text-xs text-zinc-500 capitalize">{lead.service_type?.replace('_',' ')}</p>
                    </div>
                    <ScoreBadge score={lead.score} size="sm" />
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop: Kanban board */}
      <div className="hidden md:grid grid-cols-3 xl:grid-cols-6 gap-4 min-h-[600px]">
        {STAGES.map((stage) => {
          const stageLeads = byStage[stage.id] ?? []
          const isOver = dragOver === stage.id

          return (
            <div
              key={stage.id}
              onDragOver={(e) => { e.preventDefault(); setDragOver(stage.id) }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => handleDrop(e, stage.id)}
              className={cn(
                'rounded-xl border border-t-2 bg-[#0f0f10] p-3 flex flex-col gap-3 min-h-[400px] transition-all duration-200',
                stage.color,
                isOver ? 'bg-zinc-900 border-zinc-700 scale-[1.01]' : 'border-zinc-800/60'
              )}
            >
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className={cn('w-2 h-2 rounded-full', stage.dot)} />
                  <span className="text-xs font-semibold text-zinc-300">{stage.label}</span>
                </div>
                <span className="text-xs text-zinc-600 font-medium tabular-nums">{stageLeads.length}</span>
              </div>

              {stageValue(stage.id) > 0 && (
                <div className="px-1">
                  <span className="text-[11px] font-semibold text-emerald-400/80">{formatCurrency(stageValue(stage.id))}</span>
                </div>
              )}

              <div className="flex-1 space-y-2">
                {loading ? (
                  Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-20 rounded-lg animate-pulse bg-zinc-800/50" />)
                ) : stageLeads.length === 0 ? (
                  <div className={cn('flex items-center justify-center h-20 rounded-lg border-2 border-dashed transition-all', isOver ? 'border-zinc-500 bg-zinc-800/30' : 'border-zinc-800/60')}>
                    <span className="text-xs text-zinc-700">Drop here</span>
                  </div>
                ) : (
                  stageLeads.map((lead, i) => {
                    const isHot = (lead.score ?? 0) >= 75
                    const isDragging = dragging === lead.id
                    return (
                      <motion.div
                        key={lead.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        draggable
                        onDragStart={(e) => handleDragStart(e as any, lead.id)}
                        onDragEnd={() => setDragging(null)}
                        className={cn(
                          'rounded-lg border bg-zinc-900 p-3 cursor-grab active:cursor-grabbing transition-all select-none',
                          isDragging ? 'opacity-40 scale-95' : 'hover:border-zinc-600 hover:-translate-y-0.5',
                          isHot ? 'border-red-500/30' : 'border-zinc-800'
                        )}
                      >
                        <Link href={`/leads/${lead.id}`} onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-xs font-semibold text-zinc-200 leading-tight line-clamp-1">{lead.name}</span>
                            {isHot && <Flame className="w-3 h-3 text-red-400 shrink-0" />}
                          </div>
                          <p className="text-[10px] text-zinc-600 capitalize mb-2">{lead.service_type?.replace('_', ' ')}</p>
                          <div className="flex items-center justify-between">
                            <ScoreBadge score={lead.score} size="sm" />
                            <span className="text-[10px] text-zinc-500">{formatRelativeTime(lead.created_at)}</span>
                          </div>
                          {lead.estimated_value ? (
                            <div className="mt-2 pt-2 border-t border-zinc-800 flex items-center justify-between">
                              <SourceBadge source={lead.source} />
                              <span className="text-xs font-semibold text-emerald-400">{formatCurrency(lead.estimated_value)}</span>
                            </div>
                          ) : null}
                        </Link>
                      </motion.div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
