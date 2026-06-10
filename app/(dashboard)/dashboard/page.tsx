'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Flame, Calendar, FileText, TrendingUp,
  DollarSign, Activity, Clock, ArrowRight, Zap
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts'
import { useLeads, useLeadStats } from '@/hooks/useLeads'
import { useAppointments } from '@/hooks/useData'
import { KPICard } from '@/components/ui/KPICard'
import { ScoreBadge } from '@/components/ui/ScoreBadge'
import { StatusBadge, SourceBadge } from '@/components/ui/Badges'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

const revenueData = [
  { month: 'Jan', revenue: 12400, leads: 8 },
  { month: 'Feb', revenue: 18200, leads: 12 },
  { month: 'Mar', revenue: 15800, leads: 10 },
  { month: 'Apr', revenue: 24600, leads: 16 },
  { month: 'May', revenue: 21200, leads: 14 },
  { month: 'Jun', revenue: 31800, leads: 18 },
]

const sourceColors: Record<string, string> = {
  google: '#3b82f6',
  referral: '#10b981',
  website: '#8b5cf6',
  facebook: '#0ea5e9',
  callrail: '#f97316',
  manual: '#71717a',
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-zinc-400 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name === 'revenue' ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { leads, loading } = useLeads()
  const stats = useLeadStats()
  const { appointments } = useAppointments()

  const hotLeads = leads.filter((l) => (l.score ?? 0) >= 75).slice(0, 5)
  const recentLeads = leads.slice(0, 5)
  const upcoming = appointments.filter((a: any) => new Date(a.scheduled_time) > new Date()).slice(0, 4)

  const sourceData = Object.entries(stats.bySource).map(([name, value]) => ({ name, value }))

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {loading ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />) : (
          <>
            <KPICard title="Total Leads" value={stats.total} icon={Users} iconColor="text-blue-400" iconBg="bg-blue-500/10" trend={12} trendLabel="vs last month" delay={0} href="/leads" />
            <KPICard title="Hot Leads" value={stats.hot} icon={Flame} iconColor="text-red-400" iconBg="bg-red-500/10" trend={8} trendLabel="this week" delay={50} highlight href="/leads?filter=hot" />
            <KPICard title="Booked" value={stats.booked} icon={Calendar} iconColor="text-cyan-400" iconBg="bg-cyan-500/10" delay={100} href="/leads?status=BOOKED" />
            <KPICard title="Quotes Sent" value={4} icon={FileText} iconColor="text-amber-400" iconBg="bg-amber-500/10" delay={150} href="/quotes" />
            <KPICard title="Conversion" value={stats.conversionRate} suffix="%" icon={TrendingUp} iconColor="text-emerald-400" iconBg="bg-emerald-500/10" trend={3} delay={200} href="/analytics" />
            <KPICard title="Pipeline" value={stats.pipeline} prefix="£" icon={DollarSign} iconColor="text-purple-400" iconBg="bg-purple-500/10" delay={250} href="/pipeline" />
          </>
        )}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="xl:col-span-2 rounded-xl border border-zinc-800/60 bg-[#0f0f10] p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-zinc-200">Revenue Pipeline</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Monthly performance trend</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-emerald-400">{formatCurrency(stats.wonRevenue)}</span>
              <span className="text-xs text-zinc-500">won</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" />
              <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `£${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Lead source breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl border border-zinc-800/60 bg-[#0f0f10] p-5"
        >
          <h3 className="text-sm font-semibold text-zinc-200 mb-1">Lead Sources</h3>
          <p className="text-xs text-zinc-500 mb-4">Acquisition breakdown</p>
          {sourceData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={sourceData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                    {sourceData.map((entry, i) => (
                      <Cell key={i} fill={sourceColors[entry.name] ?? '#71717a'} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {sourceData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sourceColors[item.name] ?? '#71717a' }} />
                      <span className="text-zinc-400 capitalize">{item.name}</span>
                    </div>
                    <span className="font-semibold text-zinc-200 tabular-nums">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-zinc-600 text-sm">No data yet</div>
          )}
        </motion.div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Hot leads feed */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="xl:col-span-2 rounded-xl border border-zinc-800/60 bg-[#0f0f10] p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-semibold text-zinc-200">Hot Leads</h3>
              {stats.hot > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                  {stats.hot} active
                </span>
              )}
            </div>
            <a href="/leads" className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </a>
          </div>
          <div className="space-y-2">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 rounded-lg shimmer bg-zinc-800/50" />
              ))
            ) : hotLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-zinc-600">
                <Flame className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No hot leads right now</p>
              </div>
            ) : hotLeads.map((lead, i) => (
              <motion.a
                key={lead.id}
                href={`/leads/${lead.id}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-800/60 border border-zinc-800/60 hover:border-zinc-700 transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/20 flex items-center justify-center text-xs font-bold text-red-300 shrink-0">
                  {lead.name?.charAt(0) ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-200 truncate">{lead.name}</span>
                    <span className="text-xs text-zinc-500">{lead.postcode}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-zinc-500 capitalize">{lead.service_type?.replace('_', ' ')}</span>
                    <span className="text-zinc-700">·</span>
                    <span className="text-xs text-zinc-500">{formatRelativeTime(lead.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <ScoreBadge score={lead.score} />
                  <StatusBadge status={lead.status} />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Upcoming appointments */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="rounded-xl border border-zinc-800/60 bg-[#0f0f10] p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-zinc-200">Upcoming</h3>
            </div>
            <a href="/calendar" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              Calendar →
            </a>
          </div>
          <div className="space-y-2">
            {upcoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-zinc-600">
                <Calendar className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No upcoming appointments</p>
              </div>
            ) : upcoming.map((appt: any, i: number) => {
              const d = new Date(appt.scheduled_time)
              return (
                <div key={appt.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
                  <div className="shrink-0 w-10 text-center">
                    <div className="text-xs text-zinc-500">{d.toLocaleDateString('en-GB', { weekday: 'short' })}</div>
                    <div className="text-lg font-bold text-zinc-200 leading-none">{d.getDate()}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-zinc-200 truncate">
                      {(appt as any).leads?.name ?? 'Unknown'}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} · {(appt as any).leads?.postcode}
                    </p>
                    <span className={cn(
                      'text-[10px] font-medium',
                      appt.status === 'CONFIRMED' ? 'text-emerald-400' : appt.status === 'SCHEDULED' ? 'text-blue-400' : 'text-zinc-500'
                    )}>
                      {appt.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
