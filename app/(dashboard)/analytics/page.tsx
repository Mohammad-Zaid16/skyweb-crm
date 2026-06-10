'use client'

import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'
import { useLeadStats } from '@/hooks/useLeads'
import { useQuotes } from '@/hooks/useData'
import { useLeads } from '@/hooks/useLeads'
import { formatCurrency, cn } from '@/lib/utils'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-zinc-400 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color ?? '#e4e4e7' }}>
          {p.name}: {typeof p.value === 'number' && p.name.toLowerCase().includes('revenue') ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

const monthlyData = [
  { month: 'Jan', revenue: 12400, leads: 8, won: 2, quotes: 5 },
  { month: 'Feb', revenue: 18200, leads: 12, won: 3, quotes: 7 },
  { month: 'Mar', revenue: 15800, leads: 10, won: 2, quotes: 6 },
  { month: 'Apr', revenue: 24600, leads: 16, won: 5, quotes: 10 },
  { month: 'May', revenue: 21200, leads: 14, won: 4, quotes: 9 },
  { month: 'Jun', revenue: 31800, leads: 18, won: 6, quotes: 12 },
]

const sourcePerf = [
  { source: 'Referral', leads: 12, rate: 42, revenue: 48000 },
  { source: 'Google', leads: 28, rate: 28, revenue: 72000 },
  { source: 'CallRail', leads: 8, rate: 38, revenue: 31000 },
  { source: 'Website', leads: 18, rate: 22, revenue: 28000 },
  { source: 'Facebook', leads: 15, rate: 13, revenue: 14000 },
]

const funnelData = [
  { name: 'New Leads', value: 100, fill: '#3b82f6' },
  { name: 'Contacted', value: 72, fill: '#8b5cf6' },
  { name: 'Quoted', value: 45, fill: '#f59e0b' },
  { name: 'Booked', value: 31, fill: '#06b6d4' },
  { name: 'Won', value: 18, fill: '#10b981' },
]

export default function AnalyticsPage() {
  const stats = useLeadStats()
  const { totals } = useQuotes()
  const { leads } = useLeads()

  const sourceColors: Record<string, string> = {
    google: '#3b82f6', referral: '#10b981', website: '#8b5cf6',
    facebook: '#0ea5e9', callrail: '#f97316', manual: '#71717a',
  }

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: formatCurrency(stats.wonRevenue), sub: 'Closed deals', color: 'text-emerald-400' },
          { label: 'Pipeline Value', value: formatCurrency(stats.pipeline), sub: 'All active leads', color: 'text-blue-400' },
          { label: 'Quote Win Rate', value: `${totals.acceptanceRate}%`, sub: 'Quotes accepted', color: 'text-amber-400' },
          { label: 'Lead Conversion', value: `${stats.conversionRate}%`, sub: 'Lead to close', color: 'text-purple-400' },
        ].map((item, i) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-zinc-800/60 bg-[#0f0f10] p-5">
            <p className="text-xs text-zinc-500 font-medium mb-2">{item.label}</p>
            <p className={cn('text-2xl font-bold', item.color)}>{item.value}</p>
            <p className="text-xs text-zinc-600 mt-1">{item.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenue growth + conversion funnel */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="xl:col-span-2 rounded-xl border border-zinc-800/60 bg-[#0f0f10] p-5">
          <h3 className="text-sm font-semibold text-zinc-200 mb-1">Revenue Growth</h3>
          <p className="text-xs text-zinc-500 mb-4">Monthly revenue vs leads</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" />
              <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `£${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2} fill="url(#revGrad2)" />
              <Line type="monotone" dataKey="leads" name="Leads" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-xl border border-zinc-800/60 bg-[#0f0f10] p-5">
          <h3 className="text-sm font-semibold text-zinc-200 mb-1">Conversion Funnel</h3>
          <p className="text-xs text-zinc-500 mb-4">Lead stage progression</p>
          <div className="space-y-2.5">
            {funnelData.map((item, i) => (
              <div key={item.name}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-zinc-400">{item.name}</span>
                  <span className="font-semibold text-zinc-300 tabular-nums">{item.value}%</span>
                </div>
                <div className="h-6 bg-zinc-800 rounded-md overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                    className="h-full rounded-md flex items-center px-2"
                    style={{ backgroundColor: item.fill + '40', borderLeft: `3px solid ${item.fill}` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Source performance + monthly bar */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-xl border border-zinc-800/60 bg-[#0f0f10] p-5">
          <h3 className="text-sm font-semibold text-zinc-200 mb-1">Source Performance</h3>
          <p className="text-xs text-zinc-500 mb-4">Leads, conversion rate & revenue by channel</p>
          <div className="space-y-3">
            {sourcePerf.map((s) => (
              <div key={s.source} className="flex items-center gap-3">
                <div className="w-16 text-xs font-medium text-zinc-400 shrink-0">{s.source}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(s.rate / 50) * 100}%` }}
                        transition={{ duration: 0.7, delay: 0.4 }}
                        className="h-full rounded-full bg-blue-500/60"
                      />
                    </div>
                    <span className="text-xs text-zinc-500 w-8 text-right">{s.rate}%</span>
                  </div>
                </div>
                <div className="w-16 text-xs font-semibold text-emerald-400 text-right shrink-0">{formatCurrency(s.revenue)}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="rounded-xl border border-zinc-800/60 bg-[#0f0f10] p-5">
          <h3 className="text-sm font-semibold text-zinc-200 mb-1">Monthly Lead Volume</h3>
          <p className="text-xs text-zinc-500 mb-4">New leads vs closed deals</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" />
              <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="leads" name="Leads" fill="#3b82f620" radius={[4, 4, 0, 0]} stroke="#3b82f6" strokeWidth={1} />
              <Bar dataKey="won" name="Won" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  )
}
