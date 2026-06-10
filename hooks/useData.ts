'use client'

import { useEffect, useState, useCallback } from 'react'
import { useCRMStore } from '@/store/crm'

const ROOFER_ID = 'a1000000-0000-0000-0000-000000000001'

// All data goes through server-side API route — bypasses Supabase allowlist
async function fetchAllData() {
  const res = await fetch('/api/data')
  if (!res.ok) throw new Error('Failed to fetch data')
  return res.json()
}

async function patchData(table: string, id: string, data: Record<string, any>) {
  const res = await fetch('/api/data', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table, id, data }),
  })
  if (!res.ok) throw new Error('Failed to update')
  return res.json()
}

async function postData(table: string, data: Record<string, any>) {
  const res = await fetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table, data }),
  })
  if (!res.ok) throw new Error('Failed to create')
  return res.json()
}

export function useAppointments() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    try {
      const d = await fetchAllData()
      setAppointments(d.appointments ?? [])
    } catch (e) { console.error('useAppointments:', e) }
    setLoading(false)
  }, [])

  useEffect(() => { refetch() }, [refetch])
  return { appointments, loading, refetch }
}

export function useQuotes() {
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    try {
      const d = await fetchAllData()
      setQuotes(d.quotes ?? [])
    } catch (e) { console.error('useQuotes:', e) }
    setLoading(false)
  }, [])

  useEffect(() => { refetch() }, [refetch])

  const totals = {
    total: quotes.reduce((s, q) => s + (q.amount ?? 0), 0),
    accepted: quotes.filter((q) => q.status === 'ACCEPTED').reduce((s, q) => s + (q.amount ?? 0), 0),
    pending: quotes.filter((q) => ['SENT', 'VIEWED'].includes(q.status)).reduce((s, q) => s + (q.amount ?? 0), 0),
    acceptanceRate: quotes.length > 0
      ? Math.round((quotes.filter((q) => q.status === 'ACCEPTED').length / quotes.length) * 100)
      : 0,
  }

  const updateQuoteStatus = async (id: string, status: string) => {
    await patchData('quotes', id, { status })
    await refetch()
    // Fire n8n webhook non-blocking
    fetch('https://skywebbuk.app.n8n.cloud/webhook/skyweb-crm-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'quote_status', quote_id: id, new_status: status }),
    }).catch(() => {})
  }

  return { quotes, loading, totals, refetch, updateQuoteStatus }
}

export function useNotifications() {
  const { notifications, setNotifications, markNotificationRead, addNotification } = useCRMStore()
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    try {
      const d = await fetchAllData()
      setNotifications(d.notifications ?? [])
    } catch (e) { console.error('useNotifications:', e) }
    setLoading(false)
  }, [setNotifications])

  useEffect(() => { refetch() }, [refetch])

  const markRead = async (id: string) => {
    markNotificationRead(id)
    patchData('notifications', id, { status: 'READ' }).catch(() => {})
  }

  const markAllRead = async () => {
    const unread = notifications.filter((n) => n.status === 'SENT')
    await Promise.all(unread.map((n) => markRead(n.id)))
  }

  return { notifications, loading, markRead, markAllRead, refetch }
}

export function useFollowups(leadId?: string) {
  const [followups, setFollowups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    try {
      const d = await fetchAllData()
      const all = d.followups ?? []
      setFollowups(leadId ? all.filter((f: any) => f.lead_id === leadId) : all)
    } catch (e) { console.error('useFollowups:', e) }
    setLoading(false)
  }, [leadId])

  useEffect(() => { refetch() }, [refetch])
  return { followups, loading, refetch }
}

export function useRooferSettings() {
  const [roofer, setRoofer] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const refetch = useCallback(async () => {
    try {
      const d = await fetchAllData()
      setRoofer(d.roofer)
      setSettings(d.settings)
    } catch (e) { console.error('useRooferSettings:', e) }
    setLoading(false)
  }, [])

  useEffect(() => { refetch() }, [refetch])

  const saveSettings = async (settingsData: any, rooferData: any) => {
    setSaving(true)
    try {
      if (settings?.id) await patchData('settings', settings.id, settingsData)
      if (roofer?.id) await patchData('roofers', roofer.id, rooferData)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) { console.error('saveSettings:', e) }
    setSaving(false)
  }

  return { roofer, settings, loading, saving, saved, saveSettings }
}

export { patchData, postData }
