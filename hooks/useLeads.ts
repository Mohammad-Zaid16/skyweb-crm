'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useCRMStore } from '@/store/crm'
import type { Lead } from '@/types/database'

const DEMO_ROOFER_ID = 'a1000000-0000-0000-0000-000000000001'

export function useLeads() {
  const { leads, setLeads } = useCRMStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const lastFetchRef = useRef<number>(0)

  const refetch = useCallback(async (silent = false) => {
    // Throttle: don't fetch if last fetch was < 10s ago (unless forced)
    const now = Date.now()
    if (!silent && now - lastFetchRef.current < 10000) return
    lastFetchRef.current = now

    if (!silent) setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/leads')
      if (!res.ok) throw new Error('Failed to fetch leads')
      const data = await res.json()
      setLeads(data ?? [])
    } catch (e: any) {
      console.error('useLeads error:', e)
      setError(e.message)
    }
    if (!silent) setLoading(false)
  }, [setLeads])

  useEffect(() => {
    refetch()

    // Silent background refresh only when tab becomes visible
    // This avoids the annoying 30s reload interruption
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now()
        // Only refresh if it's been > 2 minutes since last fetch
        if (now - lastFetchRef.current > 120000) {
          refetch(true) // silent refresh
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [refetch])

  return { leads, loading, error, refetch }
}

export function useLead(id: string) {
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`/api/leads/${id}`)
        if (res.ok) setLead(await res.json())
      } catch (e) {
        console.error('useLead error:', e)
      }
      setLoading(false)
    }
    run()
  }, [id])

  return { lead, loading }
}

export function useLeadEvents(leadId: string) {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`/api/leads/${leadId}/events`)
        if (res.ok) setEvents(await res.json() ?? [])
      } catch (e) {
        console.error('useLeadEvents error:', e)
      }
      setLoading(false)
    }
    run()
  }, [leadId])

  return { events, loading }
}

export function useLeadStats() {
  const { leads } = useCRMStore()
  return {
    total: leads.length,
    hot: leads.filter((l) => (l.score ?? 0) >= 75).length,
    booked: leads.filter((l) => l.status === 'BOOKED').length,
    won: leads.filter((l) => l.status === 'WON').length,
    lost: leads.filter((l) => l.status === 'LOST').length,
    new: leads.filter((l) => l.status === 'NEW').length,
    pipeline: leads.reduce((sum, l) => sum + (l.estimated_value ?? 0), 0),
    wonRevenue: leads.filter((l) => l.status === 'WON').reduce((sum, l) => sum + (l.estimated_value ?? 0), 0),
    conversionRate: leads.length > 0 ? Math.round((leads.filter((l) => l.status === 'WON').length / leads.length) * 100) : 0,
    byStatus: {
      NEW: leads.filter((l) => l.status === 'NEW'),
      CONTACTED: leads.filter((l) => l.status === 'CONTACTED'),
      QUOTED: leads.filter((l) => l.status === 'QUOTED'),
      BOOKED: leads.filter((l) => l.status === 'BOOKED'),
      WON: leads.filter((l) => l.status === 'WON'),
      LOST: leads.filter((l) => l.status === 'LOST'),
    },
    bySource: leads.reduce((acc, l) => {
      const src = l.source ?? 'unknown'
      acc[src] = (acc[src] ?? 0) + 1
      return acc
    }, {} as Record<string, number>),
    avgScore: leads.length > 0 ? Math.round(leads.reduce((sum, l) => sum + (l.score ?? 0), 0) / leads.length) : 0,
  }
}