'use client'

import { motion } from 'framer-motion'
import { FileText, TrendingUp, Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react'
import { useQuotes } from '@/hooks/useData'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCurrency, formatDate, cn } from '@/lib/utils'

const STATUS_CONFIG: Record<string, { color: string; icon: any }> = {
  DRAFT:    { color: 'text-zinc-400 bg-zinc-800 border-zinc-700', icon: FileText },
  SENT:     { color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', icon: Clock },
  VIEWED:   { color: 'text-purple-400 bg-purple-500/10 border-purple-500/30', icon: TrendingUp },
  ACCEPTED: { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', icon: CheckCircle },
  REJECTED: { color: 'text-red-400 bg-red-500/10 border-red-500/30', icon: XCircle },
  EXPIRED:  { color: 'text-zinc-500 bg-zinc-900 border-zinc-800', icon: Clock },
}

export default function QuotesPage() {
  const { quotes, loading, totals } = useQuotes()

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Quoted', value: formatCurrency(totals.total), icon: DollarSign, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Accepted', value: formatCurrency(totals.accepted), icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Pending', value: formatCurrency(totals.pending), icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Win Rate', value: `${totals.acceptanceRate}%`, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-zinc-800/60 bg-[#0f0f10] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{card.label}</span>
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', card.bg)}>
                <card.icon className={cn('w-3.5 h-3.5', card.color)} />
              </div>
            </div>
            <span className="text-xl font-bold text-zinc-100">{card.value}</span>
          </motion.div>
        ))}
      </div>

      {/* Quotes table */}
      <div className="rounded-xl border border-zinc-800/60 bg-[#0f0f10] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/60">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-200">All Quotes</h3>
            <span className="text-xs text-zinc-600">({quotes.length})</span>
          </div>
        </div>

        <div className="divide-y divide-zinc-800/40">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <Skeleton className="w-32 h-4" />
                <Skeleton className="flex-1 h-4" />
                <Skeleton className="w-20 h-6 rounded-md" />
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-20 h-4" />
              </div>
            ))
          ) : quotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
              <FileText className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm">No quotes yet</p>
            </div>
          ) : (
            quotes.map((quote, i) => {
              const cfg = STATUS_CONFIG[quote.status ?? 'SENT'] ?? STATUS_CONFIG.SENT
              const StatusIcon = cfg.icon
              return (
                <motion.div key={quote.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="grid grid-cols-[1fr_1.5fr_auto_auto_auto] gap-4 items-center px-5 py-4 hover:bg-zinc-900/40 transition-colors cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">{formatCurrency(quote.amount)}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">Quote #{quote.id.slice(-6).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-300 font-medium">{(quote as any).leads?.name ?? '—'}</p>
                    <p className="text-xs text-zinc-600 capitalize mt-0.5">{(quote as any).leads?.service_type?.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 line-clamp-1 max-w-xs">{quote.description ?? '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">{formatDate(quote.sent_at)}</p>
                  </div>
                  <div>
                    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border', cfg.color)}>
                      <StatusIcon className="w-3 h-3" />
                      {quote.status}
                    </span>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
