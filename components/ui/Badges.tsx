import { cn, getStatusColor, getUrgencyColor } from '@/lib/utils'

export function StatusBadge({ status }: { status: string | null }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border',
      getStatusColor(status)
    )}>
      {status ?? '—'}
    </span>
  )
}

export function UrgencyBadge({ urgency }: { urgency: string | null }) {
  const label = urgency === 'emergency' ? '🔴 Emergency'
    : urgency === 'high' ? '🟠 High'
    : urgency === 'medium' ? '🟡 Medium'
    : urgency === 'low' ? '⚪ Low'
    : '—'

  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border',
      getUrgencyColor(urgency)
    )}>
      {urgency === 'emergency' && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}
      {urgency ? urgency.charAt(0).toUpperCase() + urgency.slice(1) : '—'}
    </span>
  )
}

export function SourceBadge({ source }: { source: string | null }) {
  const icons: Record<string, string> = {
    google: 'G', referral: 'R', website: 'W', facebook: 'F', callrail: 'C', manual: 'M',
  }
  const colors: Record<string, string> = {
    google: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    referral: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    website: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    facebook: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
    callrail: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
    manual: 'bg-zinc-800 border-zinc-700 text-zinc-400',
  }

  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border capitalize',
      source ? colors[source] : 'bg-zinc-800 border-zinc-700 text-zinc-400'
    )}>
      {source ? icons[source] && <span className="font-bold text-[10px]">{icons[source]}</span> : null}
      {source ?? '—'}
    </span>
  )
}
