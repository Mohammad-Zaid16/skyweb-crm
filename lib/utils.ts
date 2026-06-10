import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatRelativeTime(date: string | null | undefined): string {
  if (!date) return '—'
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(date)
}

export function getScoreColor(score: number | null): string {
  if (!score) return 'text-zinc-500'
  if (score >= 75) return 'text-red-400'
  if (score >= 50) return 'text-amber-400'
  if (score >= 25) return 'text-emerald-400'
  return 'text-zinc-500'
}

export function getScoreBg(score: number | null): string {
  if (!score) return 'bg-zinc-800'
  if (score >= 75) return 'bg-red-500/10 border-red-500/30'
  if (score >= 50) return 'bg-amber-500/10 border-amber-500/30'
  if (score >= 25) return 'bg-emerald-500/10 border-emerald-500/30'
  return 'bg-zinc-800 border-zinc-700'
}

export function getStatusColor(status: string | null): string {
  switch (status) {
    case 'NEW': return 'text-blue-400 bg-blue-500/10 border-blue-500/30'
    case 'CONTACTED': return 'text-purple-400 bg-purple-500/10 border-purple-500/30'
    case 'QUOTED': return 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    case 'BOOKED': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
    case 'WON': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    case 'LOST': return 'text-red-400 bg-red-500/10 border-red-500/30'
    default: return 'text-zinc-400 bg-zinc-800 border-zinc-700'
  }
}

export function getUrgencyColor(urgency: string | null): string {
  switch (urgency) {
    case 'emergency': return 'text-red-400 bg-red-500/10 border-red-500/30'
    case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/30'
    case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
    case 'low': return 'text-zinc-400 bg-zinc-800 border-zinc-700'
    default: return 'text-zinc-400 bg-zinc-800 border-zinc-700'
  }
}

export function getSourceIcon(source: string | null): string {
  switch (source) {
    case 'google': return '🔍'
    case 'referral': return '👥'
    case 'website': return '🌐'
    case 'facebook': return '📘'
    case 'callrail': return '📞'
    case 'manual': return '✏️'
    default: return '❓'
  }
}
