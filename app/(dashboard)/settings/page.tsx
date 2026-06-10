'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings, Bell, Zap, Shield, Building2, Save, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const ROOFER_ID = 'a1000000-0000-0000-0000-000000000001'

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className={cn('relative w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none min-w-[40px]', checked ? 'bg-blue-600' : 'bg-zinc-700')}>
      <motion.div animate={{ x: checked ? 20 : 2 }} transition={{ duration: 0.15 }} className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm" />
    </button>
  )
}

const Section = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
  <div className="rounded-xl border border-zinc-800/60 bg-[#0f0f10] overflow-hidden">
    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-zinc-800/60">
      <Icon className="w-4 h-4 text-zinc-500" />
      <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
    </div>
    <div className="p-5 space-y-4">{children}</div>
  </div>
)

const SettingRow = ({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-4">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-zinc-300">{label}</p>
      {description && <p className="text-xs text-zinc-600 mt-0.5">{description}</p>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
)

export default function SettingsPage() {
  const [settingsState, setSettingsState] = useState({ notify_email: true, notify_whatsapp: true, auto_accept_hot_leads: false, followup_enabled: true })
  const [roofer, setRoofer] = useState({ business_name: '', owner_name: '', email: '', phone: '', plan: 'pro', id: '' })
  const [settingsId, setSettingsId] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(d => {
      if (d.settings) {
        setSettingsState({ notify_email: d.settings.notify_email ?? true, notify_whatsapp: d.settings.notify_whatsapp ?? true, auto_accept_hot_leads: d.settings.auto_accept_hot_leads ?? false, followup_enabled: d.settings.followup_enabled ?? true })
        setSettingsId(d.settings.id)
      }
      if (d.roofer) setRoofer({ business_name: d.roofer.business_name ?? '', owner_name: d.roofer.owner_name ?? '', email: d.roofer.email ?? '', phone: d.roofer.phone ?? '', plan: d.roofer.plan ?? 'pro', id: d.roofer.id })
      setLoading(false)
    }).catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      await Promise.all([
        settingsId ? fetch('/api/data', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table: 'settings', id: settingsId, data: settingsState }) }) : Promise.resolve(),
        roofer.id ? fetch('/api/data', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table: 'roofers', id: roofer.id, data: { business_name: roofer.business_name, owner_name: roofer.owner_name, phone: roofer.phone } }) }) : Promise.resolve(),
      ])
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: any) { setError(e.message) }
    setSaving(false)
  }

  if (loading) return (
    <div className="space-y-5 max-w-2xl">
      {[1,2,3].map(i => <div key={i} className="h-40 rounded-xl border border-zinc-800 bg-zinc-900/50 animate-pulse" />)}
    </div>
  )

  return (
    <div className="space-y-5 max-w-2xl">
      {error && <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

      <Section title="Business Profile" icon={Building2}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: 'business_name', label: 'Business Name', full: true },
            { key: 'owner_name', label: 'Owner Name' },
            { key: 'email', label: 'Email', type: 'email', disabled: true },
            { key: 'phone', label: 'Phone' },
          ].map(({ key, label, full, type, disabled }) => (
            <div key={key} className={full ? 'col-span-1 sm:col-span-2' : ''}>
              <label className="text-xs text-zinc-500 font-medium mb-1.5 block">{label}</label>
              <input type={type ?? 'text'} value={(roofer as any)[key]} disabled={disabled}
                onChange={(e) => setRoofer((p) => ({ ...p, [key]: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <Shield className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs text-blue-400 font-medium capitalize">{roofer.plan} Plan</span>
        </div>
      </Section>

      <Section title="Notifications" icon={Bell}>
        <SettingRow label="Email Notifications" description="Receive lead alerts via email">
          <Toggle checked={settingsState.notify_email} onChange={(v) => setSettingsState((p) => ({ ...p, notify_email: v }))} />
        </SettingRow>
        <SettingRow label="WhatsApp Notifications" description="Get instant WhatsApp alerts for new leads">
          <Toggle checked={settingsState.notify_whatsapp} onChange={(v) => setSettingsState((p) => ({ ...p, notify_whatsapp: v }))} />
        </SettingRow>
      </Section>

      <Section title="Automation" icon={Zap}>
        <SettingRow label="Auto-Accept Hot Leads" description="Automatically accept leads with score ≥ 75">
          <Toggle checked={settingsState.auto_accept_hot_leads} onChange={(v) => setSettingsState((p) => ({ ...p, auto_accept_hot_leads: v }))} />
        </SettingRow>
        <SettingRow label="Follow-up Sequences" description="Enable automated follow-up messages for pending leads">
          <Toggle checked={settingsState.followup_enabled} onChange={(v) => setSettingsState((p) => ({ ...p, followup_enabled: v }))} />
        </SettingRow>
      </Section>

      <Section title="Integrations" icon={Settings}>
        {[
          { name: 'n8n Automation', desc: 'Lead intake, scoring, follow-ups', connected: true },
          { name: 'WhatsApp via UltraMsg', desc: 'Automated WhatsApp alerts', connected: true },
          { name: 'Gmail', desc: 'Email alerts and quotes', connected: true },
        ].map((int) => (
          <div key={int.name} className="flex items-center justify-between py-1 gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-300">{int.name}</p>
              <p className="text-xs text-zinc-600">{int.desc}</p>
            </div>
            <span className={cn('shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border', int.connected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500')}>
              {int.connected ? '✓ Connected' : 'Connect'}
            </span>
          </div>
        ))}
      </Section>

      <div className="flex items-center justify-end gap-3">
        {saved && (
          <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1.5 text-emerald-400 text-sm">
            <CheckCircle className="w-4 h-4" /> Settings saved
          </motion.div>
        )}
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          onClick={save} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium transition-colors">
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </motion.button>
      </div>
    </div>
  )
}
