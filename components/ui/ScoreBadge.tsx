'use client'

import { motion } from 'framer-motion'
import { cn, getScoreColor, getScoreBg } from '@/lib/utils'

interface ScoreBadgeProps {
  score: number | null
  size?: 'sm' | 'md' | 'lg'
  showBar?: boolean
}

export function ScoreBadge({ score, size = 'md', showBar = false }: ScoreBadgeProps) {
  const s = score ?? 0
  const label = s >= 75 ? 'HOT' : s >= 50 ? 'WARM' : s >= 25 ? 'COOL' : 'COLD'

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-2.5 py-1',
  }

  return (
    <div className="flex items-center gap-2">
      <span className={cn(
        'inline-flex items-center gap-1 rounded-md border font-bold tabular-nums',
        sizeClasses[size],
        getScoreBg(score),
        getScoreColor(score),
      )}>
        {s >= 75 && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse-ring inline-block" />}
        {s}
      </span>
      {size === 'lg' && (
        <span className={cn('text-xs font-semibold', getScoreColor(score))}>{label}</span>
      )}
      {showBar && (
        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden min-w-[48px]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${s}%` }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className={cn(
              'h-full rounded-full',
              s >= 75 ? 'bg-red-500' : s >= 50 ? 'bg-amber-500' : s >= 25 ? 'bg-emerald-500' : 'bg-zinc-600'
            )}
          />
        </div>
      )}
    </div>
  )
}
