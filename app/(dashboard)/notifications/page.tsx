'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Flame, Calendar, CheckCircle, Clock, AlertCircle,
  Zap, Check, Trash2, BellOff
} from 'lucide-react'
import { useNotifications } from '@/hooks/useData'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatRelativeTime, cn } from '@/lib/utils'

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
  NEW_LEAD:             { icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  HOT_LEAD:             { icon: Flame, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  APPOINTMENT_REMINDER: { icon: Calendar, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  QUOTE_ACCEPTED:       { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  FOLLOWUP_DUE:         { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  SYSTEM_ALERT:         { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
}

export default function NotificationsPage() {
  const { notifications, loading, markRead } = useNotifications()

  const unread = notifications.filter((n) => n.status === 'SENT')
  const read = notifications.filter((n) => n.status === 'READ')

  const markAllRead = async () => {
    await Promise.all(unread.map((n) => markRead(n.id)))
  }

  if (loading) return (
    <div className="max-w-2xl space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-zinc-800 bg-[#0f0f10]">
          <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2"><Skeleton className="w-48 h-4" /><Skeleton className="w-full h-3" /><Skeleton className="w-24 h-3" /></div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-zinc-400" />
          <span className="text-sm font-semibold text-zinc-200">{notifications.length} total</span>
          {unread.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
              {unread.length} unread
            </span>
          )}
        </div>
        {unread.length > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            <Check className="w-3.5 h-3.5" /> Mark all read
          </button>
        )}
      </div>

      {/* Unread */}
      {unread.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-2 px-1">Unread</p>
          <div className="space-y-2">
            <AnimatePresence>
              {unread.map((n, i) => {
                const cfg = typeConfig[n.type ?? ''] ?? typeConfig.SYSTEM_ALERT
                const Icon = cfg.icon
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-start gap-3 p-4 rounded-xl border border-zinc-700/60 bg-zinc-900/60 hover:border-zinc-600 transition-all group"
                  >
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center border shrink-0', cfg.bg)}>
                      <Icon className={cn('w-4 h-4', cfg.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-200">{n.title}</p>
                      <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{n.message}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-zinc-600">{formatRelativeTime(n.created_at)}</span>
                        <span className="text-[10px] capitalize text-zinc-700">{n.type?.toLowerCase().replace(/_/g, ' ')}</span>
                        <a href="/leads" className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors">View leads →</a>
                      </div>
                    </div>
                    <button
                      onClick={() => markRead(n.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-all"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Read */}
      {read.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2 px-1">Earlier</p>
          <div className="space-y-2 opacity-60">
            {read.map((n, i) => {
              const cfg = typeConfig[n.type ?? ''] ?? typeConfig.SYSTEM_ALERT
              const Icon = cfg.icon
              return (
                <motion.div key={n.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="flex items-start gap-3 p-4 rounded-xl border border-zinc-800/40 bg-zinc-900/30">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center border border-zinc-800 bg-zinc-900 shrink-0">
                    <Icon className="w-4 h-4 text-zinc-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-400">{n.title}</p>
                    <p className="text-xs text-zinc-600 mt-0.5 leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-zinc-700 mt-1 block">{formatRelativeTime(n.created_at)}</span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-700">
          <BellOff className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm font-medium">No notifications</p>
          <p className="text-xs text-zinc-800 mt-1">You're all caught up</p>
        </div>
      )}
    </div>
  )
}
