'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Bell, Plus, Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useCRMStore } from '@/store/crm'

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard':     { title: 'Dashboard',     subtitle: 'Business overview & KPIs' },
  '/leads':         { title: 'Leads',          subtitle: 'Manage your lead pipeline' },
  '/pipeline':      { title: 'Pipeline',       subtitle: 'Kanban deal stages' },
  '/calendar':      { title: 'Calendar',       subtitle: 'Appointments & scheduling' },
  '/inbox':         { title: 'Inbox',          subtitle: 'Unified communications' },
  '/quotes':        { title: 'Quotes',         subtitle: 'Proposals & estimates' },
  '/analytics':     { title: 'Analytics',      subtitle: 'Performance insights' },
  '/notifications': { title: 'Notifications',  subtitle: 'Activity & alerts' },
  '/settings':      { title: 'Settings',       subtitle: 'Account configuration' },
}

export default function TopBar({ onMobileMenuClick }: { onMobileMenuClick?: () => void }) {
  const pathname = usePathname()
  const { unreadCount } = useCRMStore()
  const [currentTime, setCurrentTime] = useState('')

  const page = pageTitles[pathname] ?? pageTitles['/dashboard']

  useEffect(() => {
    const update = () => setCurrentTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <header className="h-14 md:h-16 flex items-center px-4 md:px-6 border-b border-zinc-800/60 bg-[#0d0d0f]/80 backdrop-blur-xl shrink-0 gap-3">
      {/* Mobile menu button */}
      <button onClick={onMobileMenuClick} className="lg:hidden p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div key={pathname} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.15 }}>
            <h1 className="text-sm md:text-base font-semibold text-zinc-100 leading-none truncate">{page.title}</h1>
            <p className="text-xs text-zinc-500 mt-0.5 hidden sm:block">{page.subtitle}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Search */}
      <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 transition-all text-xs">
        <Search className="w-3.5 h-3.5" />
        <span className="hidden md:block">Search leads...</span>
      </button>

      {/* Live time — desktop only */}
      <div className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs text-zinc-500 font-mono">{currentTime}</span>
      </div>

      {/* Add Lead */}
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors min-h-[36px]">
        <Plus className="w-3.5 h-3.5" />
        <span className="hidden sm:block">Add Lead</span>
      </motion.button>

      {/* Notifications */}
      <Link href="/notifications">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="relative p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </motion.button>
      </Link>
    </header>
  )
}
