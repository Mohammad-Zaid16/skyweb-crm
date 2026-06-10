'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Phone, Mail, Globe, Search, Send, CheckCircle, RefreshCw } from 'lucide-react'
import { useLeads } from '@/hooks/useLeads'
import { formatRelativeTime, cn } from '@/lib/utils'

const CHANNEL_CONFIG = {
  whatsapp: { label: 'WhatsApp', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: MessageSquare },
  website:  { label: 'Website',  color: 'text-blue-400',    bg: 'bg-blue-500/10',    icon: Globe },
  email:    { label: 'Email',    color: 'text-purple-400',  bg: 'bg-purple-500/10',  icon: Mail },
  callrail: { label: 'CallRail', color: 'text-orange-400',  bg: 'bg-orange-500/10',  icon: Phone },
}

export default function InboxPage() {
  const { leads } = useLeads()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [channelFilter, setChannelFilter] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [sentMessages, setSentMessages] = useState<Record<string, string[]>>({})

  const conversations = leads.slice(0, 20).map((l) => ({
    ...l,
    channel: l.source === 'callrail' ? 'callrail' : l.source === 'website' ? 'website' : l.source === 'referral' ? 'whatsapp' : l.source === 'whatsapp' ? 'whatsapp' : 'email',
    lastMessage: l.message ?? `Enquiry about ${l.service_type?.replace('_', ' ')} service`,
    unread: l.status === 'NEW' ? 1 : 0,
  }))

  const filtered = channelFilter ? conversations.filter((c) => c.channel === channelFilter) : conversations
  const selected = conversations.find((c) => c.id === selectedId) ?? conversations[0]
  const activeId = selected?.id ?? ''

  const handleSend = async () => {
    if (!message.trim() || !selected) return
    setSending(true)
    const msg = message.trim()
    setMessage('')

    // Add to local sent messages immediately
    setSentMessages(p => ({ ...p, [activeId]: [...(p[activeId] ?? []), msg] }))

    // Send via UltraMsg WhatsApp
    try {
      await fetch('https://api.ultramsg.com/instance180111/messages/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'fx0xyeaxdaana9o7',
          to: selected.phone,
          body: msg,
        })
      })
    } catch (e) {
      console.error('Send message error:', e)
    }
    setSending(false)
  }

  return (
    <div className="h-[calc(100vh-8rem)] max-w-[1400px] flex rounded-xl border border-zinc-800/60 bg-[#0f0f10] overflow-hidden">

      {/* LEFT: Conversation list */}
      <div className="w-72 border-r border-zinc-800/60 flex flex-col shrink-0">
        <div className="p-3 border-b border-zinc-800/60">
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
            <input placeholder="Search conversations..." className="w-full pl-8 pr-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-zinc-600" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setChannelFilter(null)}
              className={cn('px-2.5 py-1 rounded-md text-[10px] font-medium border transition-all', !channelFilter ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-zinc-900 border-zinc-800 text-zinc-600 hover:text-zinc-400')}>
              All
            </button>
            {Object.entries(CHANNEL_CONFIG).map(([k, v]) => (
              <button key={k} onClick={() => setChannelFilter(k === channelFilter ? null : k)}
                className={cn('px-2.5 py-1 rounded-md text-[10px] font-medium border transition-all',
                  channelFilter === k ? `${v.bg} border-current ${v.color}` : 'bg-zinc-900 border-zinc-800 text-zinc-600 hover:text-zinc-400')}>
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/40">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
              <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs">No conversations</p>
            </div>
          ) : filtered.map((conv) => {
            const ch = CHANNEL_CONFIG[conv.channel as keyof typeof CHANNEL_CONFIG] ?? CHANNEL_CONFIG.email
            const ChIcon = ch.icon
            const isSelected = conv.id === (selectedId ?? conversations[0]?.id)
            return (
              <motion.button key={conv.id} onClick={() => setSelectedId(conv.id)}
                className={cn('w-full text-left px-3 py-3 transition-all hover:bg-zinc-900/60', isSelected && 'bg-zinc-900/60 border-l-2 border-l-blue-500')}>
                <div className="flex items-start gap-2.5">
                  <div className="relative shrink-0">
                    <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold', ch.bg, ch.color)}>
                      {conv.name?.charAt(0) ?? '?'}
                    </div>
                    {conv.unread > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-zinc-200 truncate">{conv.name}</span>
                      <span className="text-[10px] text-zinc-600 shrink-0">{formatRelativeTime(conv.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <ChIcon className={cn('w-3 h-3 shrink-0', ch.color)} />
                      <p className="text-[11px] text-zinc-500 truncate">{conv.lastMessage}</p>
                    </div>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* RIGHT: Conversation panel */}
      {selected ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-300">
                {selected.name?.charAt(0) ?? '?'}
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-200">{selected.name}</p>
                <p className="text-xs text-zinc-500">{selected.phone} · {selected.postcode}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href={`/leads/${selected.id}`} className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-medium transition-colors">
                View Lead →
              </a>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Customer initial message */}
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 shrink-0">
                {selected.name?.charAt(0) ?? '?'}
              </div>
              <div className="max-w-sm">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3">
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {selected.message ?? `Hi, I'm interested in getting a quote for ${selected.service_type?.replace('_', ' ')} work. My property is in ${selected.postcode}.`}
                  </p>
                </div>
                <p className="text-[10px] text-zinc-700 mt-1 ml-1">{formatRelativeTime(selected.created_at)}</p>
              </div>
            </div>

            {/* Sent messages */}
            {(sentMessages[activeId] ?? []).map((msg, i) => (
              <div key={i} className="flex items-start gap-3 flex-row-reverse">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">JH</div>
                <div className="max-w-sm">
                  <div className="bg-blue-600/20 border border-blue-600/30 rounded-2xl rounded-tr-sm px-4 py-3">
                    <p className="text-sm text-zinc-200 leading-relaxed">{msg}</p>
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-1 mr-1">
                    <CheckCircle className="w-3 h-3 text-blue-400" />
                    <p className="text-[10px] text-zinc-600">Sent via WhatsApp · just now</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-zinc-800/60">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 focus-within:border-zinc-600 transition-colors">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Reply to ${selected.name?.split(' ')[0]} via WhatsApp...`}
                className="flex-1 bg-transparent text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              />
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={sending || !message.trim()}
                className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 transition-colors flex items-center justify-center">
                {sending ? <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" /> : <Send className="w-3.5 h-3.5 text-white" />}
              </motion.button>
            </div>
            <p className="text-[10px] text-zinc-700 mt-1.5 text-center">Messages sent via WhatsApp to {selected.phone}</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-zinc-700">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Select a conversation</p>
          </div>
        </div>
      )}
    </div>
  )
}
