'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList
} from 'recharts'
import { useLeads } from '@/hooks/useLeads'
import { useQuotes } from '@/hooks/useData'
import { useAppointments } from '@/hooks/useData'
import { formatCurrency, cn } from '@/lib/utils'
import { TrendingUp, Users, DollarSign, Calendar, FileText, Target } from 'lucide-react'

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']

const Tooltip_ = ({ active, payload, label }: any) => {
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

export default function AnalyticsPage() {
  const { leads, loading: leadsLoading } = useLeads()
  const { quotes } = useQuotes()
  const { appointments } = useAppointments()

  // Build monthly data from real leads
  const monthlyData = useMemo(() => {
    const months: Record<string, { month: string; leads: number; won: number; revenue: number; quotes: number }> = {}
    const now = new Date()
    // Build last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      months[key] = {
        month: d.toLocaleDateString('en-GB', { month: 'short' }),
        leads: 0, won: 0, revenue: 0, quotes: 0
      }
    }
    leads.forEach((l) => {
      const d = new Date(l.created_at ?? '')
      const key = `${d.getFullYear()}-${d.getMonth()}`
      if (months[key]) {
        months[key].leads++
        if (l.status === 'WON') {
          months[key].won++
          months[key].revenue += l.estimated_value ?? 0
        }
      }
    })
    quotes.forEach((q) => {
      const d = new Date(q.sent_at ?? '')
      const key = `${d.getFullYear()}-${d.getMonth()}`
      if (months[key]) months[key].quotes++
    })
    return Object.values(months)
  }, [leads, quotes])

  // Source breakdown from real data
  const sourceData = useMemo(() => {
    const counts: Record<string, { leads: number; won: number; revenue: number }> = {}
    leads.forEach((l) => {
      const src = l.source ?? 'unknown'
      if (!counts[src]) counts[src] = { leads: 0, won: 0, revenue: 0 }
      counts[src].leads++
      if (l.status === 'WON') { counts[src].won++; counts[src].revenue += l.estimated_value ?? 0 }
    })
    return Object.entries(counts).map(([source, d]) => ({
      source: source.charAt(0).toUpperCase() + source.slice(1),
      leads: d.leads,
      rate: d.leads > 0 ? Math.round((d.won / d.leads) * 100) : 0,
      revenue: d.revenue,
    })).sort((a, b) => b.leads - a.leads)
  }, [leads])

  // Funnel from real data
  const funnelData = useMemo(() => [
    { name: 'Total Leads', value: leads.length, fill: '#3b82f6' },
    { name: 'Contacted', value: leads.filter(l => ['CONTACTED','QUOTED','BOOKED','WON'].includes(l.status ?? '')).length, fill: '#8b5cf6' },
    { name: 'Quoted', value: leads.filter(l => ['QUOTED','BOOKED','WON'].includes(l.status ?? '')).length, fill: '#f59e0b' },
    { name: 'Booked', value: leads.filter(l => ['BOOKED','WON'].includes(l.status ?? '')).length, fill: '#06b6d4' },
    { name: 'Won', value: leads.filter(l => l.status === 'WON').length, fill: '#10b981' },
  ], [leads])

  // Score distribution
  const scoreData = useMemo(() => [
    { range: '0-25', count: leads.filter(l => (l.score ?? 0) <= 25).length },
    { range: '26-50', count: leads.filter(l => (l.score ?? 0) > 25 && (l.score ?? 0) <= 50).length },
    { range: '51-75', count: leads.filter(l => (l.score ?? 0) > 50 && (l.score ?? 0) <= 75).length },
    { range: '76-100', count: leads.filter(l => (l.score ?? 0) > 75).length },
  ], [leads])

  const totalRevenue = leads.filter(l => l.status === 'WON').reduce((s, l) => s + (l.estimated_value ?? 0), 0)
  const convRate = leads.length > 0 ? Math.round((leads.filter(l => l.status === 'WON').length / leads.length) * 100) : 0
  const avgScore = leads.length > 0 ? Math.round(leads.reduce((s, l) => s + (l.score ?? 0), 0) / leads.length) : 0
  const quoteAcceptRate = quotes.length > 0 ? Math.round((quotes.filter(q => q.status === 'ACCEPTED').length / quotes.length) * 100) : 0

  const kpis = [
    { label: 'Total Leads', value: leads.length, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Won Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Conversion Rate', value: `${convRate}%`, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Avg Lead Score', value: avgScore, icon: Target, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Quote Acceptance', value: `${quoteAcceptRate}%`, icon: FileText, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Appointments', value: appointments.length, icon: Calendar, color: 'text-red-400', bg: 'bg-red-500/10' },
  ]

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-zinc-800/60 bg-[#0f0f10] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-medium">{k.label}</span>
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', k.bg)}>
                <k.icon className={cn('w-3.5 h-3.5', k.color)} />
              </div>
            </div>
            <p className="text-xl font-bold text-zinc-100">{k.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenue + Leads chart */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="rounded-xl border border-zinc-800/60 bg-[#0f0f10] p-5">
          <h3 className="text-sm font-semibold text-zinc-200 mb-1">Monthly Revenue</h3>
          <p className="text-xs text-zinc-600 mb-4">Won job value over last 6 months</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `£${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<Tooltip_ />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" fill="url(#rev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-zinc-800/60 bg-[#0f0f10] p-5">
          <h3 className="text-sm font-semibold text-zinc-200 mb-1">Leads vs Won</h3>
          <p className="text-xs text-zinc-600 mb-4">Monthly lead intake and wins</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tooltip_ />} />
              <Bar dataKey="leads" name="Leads" fill="#3b82f6" opacity={0.7} radius={[3,3,0,0]} />
              <Bar dataKey="won" name="Won" fill="#10b981" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Funnel + Source + Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Funnel */}
        <div className="rounded-xl border border-zinc-800/60 bg-[#0f0f10] p-5">
          <h3 className="text-sm font-semibold text-zinc-200 mb-4">Lead Funnel</h3>
          <div className="space-y-2">
            {funnelData.map((f, i) => (
              <div key={f.name}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-zinc-400">{f.name}</span>
                  <span className="text-zinc-300 font-semibold">{f.value}</span>
                </div>
                <div className="h-6 bg-zinc-900 rounded-lg overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${funnelData[0].value > 0 ? (f.value / funnelData[0].value) * 100 : 0}%` }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                    className="h-full rounded-lg" style={{ backgroundColor: f.fill }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Source breakdown */}
        <div className="rounded-xl border border-zinc-800/60 bg-[#0f0f10] p-5">
          <h3 className="text-sm font-semibold text-zinc-200 mb-4">Lead Sources</h3>
          {sourceData.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-zinc-700 text-xs">No data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={sourceData} dataKey="leads" nameKey="source" cx="50%" cy="50%" outerRadius={55} strokeWidth={0}>
                    {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<Tooltip_ />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {sourceData.slice(0, 4).map((s, i) => (
                  <div key={s.source} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-zinc-400">{s.source}</span>
                    </div>
                    <span className="text-zinc-300 font-medium">{s.leads} leads · {s.rate}% won</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Score distribution */}
        <div className="rounded-xl border border-zinc-800/60 bg-[#0f0f10] p-5">
          <h3 className="text-sm font-semibold text-zinc-200 mb-4">Score Distribution</h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={scoreData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="range" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tooltip_ />} />
              <Bar dataKey="count" name="Leads" radius={[3,3,0,0]}>
                {scoreData.map((_, i) => <Cell key={i} fill={['#ef4444','#f59e0b','#3b82f6','#10b981'][i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-center">
              <p className="text-xs text-zinc-500">Avg Score</p>
              <p className="text-base font-bold text-zinc-200">{avgScore}</p>
            </div>
            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-center">
              <p className="text-xs text-zinc-500">Hot Leads</p>
              <p className="text-base font-bold text-red-400">{leads.filter(l => (l.score ?? 0) >= 75).length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
