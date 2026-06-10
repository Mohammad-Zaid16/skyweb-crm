'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface KPICardProps {
  title: string
  value: number | string
  prefix?: string
  suffix?: string
  trend?: number
  trendLabel?: string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  loading?: boolean
  highlight?: boolean
  delay?: number
  href?: string
}

function useCountUp(target: number, duration = 1200, delay = 0) {
  const [count, setCount] = useState(0)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = performance.now()
      const animate = (now: number) => {
        const elapsed = now - start
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setCount(Math.round(eased * target))
        if (progress < 1) frameRef.current = requestAnimationFrame(animate)
      }
      frameRef.current = requestAnimationFrame(animate)
    }, delay)
    return () => {
      clearTimeout(timeout)
      cancelAnimationFrame(frameRef.current)
    }
  }, [target, duration, delay])

  return count
}

export function KPICard({
  title, value, prefix = '', suffix = '', trend, trendLabel,
  icon: Icon, iconColor = 'text-blue-400', iconBg = 'bg-blue-500/10',
  loading = false, highlight = false, delay = 0, href,
}: KPICardProps) {
  const numericValue = typeof value === 'number' ? value : 0
  const displayCount = useCountUp(numericValue, 1200, delay)

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-[#0f0f10] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="w-24 h-3 rounded shimmer bg-zinc-800" />
          <div className="w-8 h-8 rounded-lg shimmer bg-zinc-800" />
        </div>
        <div className="w-20 h-7 rounded shimmer bg-zinc-800 mb-2" />
        <div className="w-16 h-3 rounded shimmer bg-zinc-800" />
      </div>
    )
  }

  const TrendIcon = trend === undefined ? Minus : trend > 0 ? TrendingUp : TrendingDown
  const trendColor = trend === undefined ? 'text-zinc-500' : trend > 0 ? 'text-emerald-400' : 'text-red-400'

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay / 1000 }}
      className={cn(
        'rounded-xl border bg-[#0f0f10] p-5 relative overflow-hidden',
        href ? 'cursor-pointer hover:border-zinc-600 hover:-translate-y-0.5 transition-all duration-200' : 'cursor-default',
        highlight ? 'border-blue-500/30 glow-blue' : 'border-zinc-800/60 hover:border-zinc-700'
      )}
    >
      {highlight && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
      )}
      {href && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/0 hover:from-white/[0.02] pointer-events-none transition-all" />
      )}

      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{title}</span>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', iconBg)}>
          <Icon className={cn('w-4 h-4', iconColor)} strokeWidth={2} />
        </div>
      </div>

      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-zinc-100 tabular-nums leading-none">
          {prefix}{typeof value === 'number' ? displayCount.toLocaleString() : value}{suffix}
        </span>
      </div>

      {(trend !== undefined || trendLabel) && (
        <div className={cn('flex items-center gap-1 mt-2', trendColor)}>
          <TrendIcon className="w-3 h-3" />
          <span className="text-xs font-medium">
            {trend !== undefined && `${trend > 0 ? '+' : ''}${trend}%`}
            {trendLabel && <span className="text-zinc-500 ml-1">{trendLabel}</span>}
          </span>
        </div>
      )}

      {href && (
        <div className="mt-3 text-xs text-zinc-600 group-hover:text-zinc-400 transition-colors">
          View all →
        </div>
      )}
    </motion.div>
  )

  if (href) {
    return <Link href={href} className="block group">{content}</Link>
  }

  return content
}
