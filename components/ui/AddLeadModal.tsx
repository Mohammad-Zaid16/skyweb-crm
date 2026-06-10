'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Phone, Mail, MapPin, MessageSquare, Zap, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AddLeadModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

const SERVICE_OPTIONS = ['repair', 'full_replacement', 'flat_roof', 'chimney', 'guttering', 'other']
const URGENCY_OPTIONS = ['emergency', 'high', 'medium', 'low']
const SOURCE_OPTIONS = ['website', 'google', 'referral', 'facebook', 'callrail', 'manual']

export function AddLeadModal({ open, onClose, onSuccess }: AddLeadModalProps) {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', postcode: '',
    message: '', service_type: 'repair', urgency: 'medium',
    source: 'manual', estimated_value: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const submit = async () => {
    if (!form.name.trim()) { setError('Name is required'); return }
    if (!form.phone.trim()) { setError('Phone is required'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('https://skywebbuk.app.n8n.cloud/webhook/skyweb-crm-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'new_lead',
          name: form.name, phone: form.phone, email: form.email,
          postcode: form.postcode, message: form.message,
          service_type: form.service_type, urgency: form.urgency,
          source: form.source,
          estimated_value: form.estimated_value ? parseFloat(form.estimated_value) : 0,
          roofer_id: 'a1000000-0000-0000-0000-000000000001',
        })
      })
      const data = await res.json()
      if (data.success) {
        setForm({ name: '', phone: '', email: '', postcode: '', message: '', service_type: 'repair', urgency: 'medium', source: 'manual', estimated_value: '' })
        onSuccess?.()
        onClose()
        // Reload to show new lead
        setTimeout(() => window.location.reload(), 500)
      } else {
        setError(data.error || 'Failed to add lead')
      }
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-[#0f0f10] shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-zinc-100">Add New Lead</h2>
                  <p className="text-xs text-zinc-500">Lead will be scored and roofer notified</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {error && <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{error}</div>}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                    <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. John Smith"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50 transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Phone *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                    <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="07700000000"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50 transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Postcode</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                    <input value={form.postcode} onChange={e => set('postcode', e.target.value)} placeholder="S1 2AB"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50 transition-colors" />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                    <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="john@example.com" type="email"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50 transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Service Type</label>
                  <select value={form.service_type} onChange={e => set('service_type', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50 transition-colors">
                    {SERVICE_OPTIONS.map(o => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Urgency</label>
                  <select value={form.urgency} onChange={e => set('urgency', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50 transition-colors">
                    {URGENCY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Source</label>
                  <select value={form.source} onChange={e => set('source', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50 transition-colors">
                    {SOURCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Est. Value (£)</label>
                  <input value={form.estimated_value} onChange={e => set('estimated_value', e.target.value)} placeholder="0" type="number" min="0"
                    className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50 transition-colors" />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Message / Notes</label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 w-3.5 h-3.5 text-zinc-600" />
                    <textarea value={form.message} onChange={e => set('message', e.target.value)} rows={3}
                      placeholder="What did the customer say?"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50 transition-colors resize-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-zinc-800 flex gap-3">
              <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 text-sm font-medium hover:bg-zinc-800 transition-colors">
                Cancel
              </button>
              <button onClick={submit} disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2">
                {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Adding...</> : <><Zap className="w-4 h-4" /> Add Lead</>}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
