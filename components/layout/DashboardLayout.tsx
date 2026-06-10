'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCRMStore } from '@/store/crm'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useCRMStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Wait for client hydration before rendering layout
  // This prevents Zustand store mismatch between SSR and client
  useEffect(() => { setMounted(true) }, [])

  const sidebarW = sidebarCollapsed ? '64px' : '240px'

  if (!mounted) {
    // Render a safe skeleton during SSR / hydration
    return (
      <div className="h-screen w-screen bg-[#0a0a0b] flex">
        <div className="w-[240px] h-full bg-[#0d0d0f] border-r border-zinc-800/60 shrink-0" />
        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-16 border-b border-zinc-800/60 bg-[#0d0d0f]/80" />
          <div className="flex-1" />
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0a0a0b]">

      {/* ── DESKTOP: CSS Grid — sidebar in flow, content never behind it ── */}
      <div
        className="hidden lg:grid h-full w-full"
        style={{
          gridTemplateColumns: `${sidebarW} 1fr`,
          gridTemplateRows: '100%',
          transition: 'grid-template-columns 0.25s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Col 1: Sidebar */}
        <div className="h-full overflow-hidden">
          <Sidebar onMobileClose={() => setMobileOpen(false)} />
        </div>

        {/* Col 2: Main — min-w-0 stops charts/tables from blowing out */}
        <div className="flex flex-col min-w-0 overflow-hidden">
          <TopBar onMobileMenuClick={() => setMobileOpen(true)} />
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="p-6 min-w-0 w-full">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* ── MOBILE: full-width, sidebar is fixed overlay ── */}
      <div className="lg:hidden flex flex-col h-full w-full">

        {/* Backdrop */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              key="mob-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
          )}
        </AnimatePresence>

        {/* Slide-out drawer */}
        <motion.div
          initial={false}
          animate={{ x: mobileOpen ? 0 : '-100%' }}
          transition={{ type: 'tween', duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-y-0 left-0 z-50"
        >
          <Sidebar onMobileClose={() => setMobileOpen(false)} isMobile />
        </motion.div>

        <TopBar onMobileMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-4 min-w-0 w-full">
            {children}
          </div>
        </main>
      </div>

    </div>
  )
}
