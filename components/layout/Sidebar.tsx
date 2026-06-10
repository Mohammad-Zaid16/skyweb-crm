'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, GitBranch, Calendar, MessageSquare,
  FileText, BarChart3, Bell, Settings, ChevronLeft, Zap,
  TrendingUp, Shield
} from 'lucide-react'
import { useCRMStore } from '@/store/crm'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/pipeline', label: 'Pipeline', icon: GitBranch },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/inbox', label: 'Inbox', icon: MessageSquare },
  { href: '/quotes', label: 'Quotes', icon: FileText },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
]

const bottomItems = [
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ onMobileClose, isMobile }: { onMobileClose?: () => void; isMobile?: boolean }) {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar, unreadCount } = useCRMStore()

  // On mobile the drawer is always full width (240px), controlled by parent animation
  // On desktop, width animates based on collapsed state
  const width = isMobile ? 240 : sidebarCollapsed ? 64 : 240

  return (
    <motion.aside
      animate={{ width }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="h-full flex flex-col border-r border-zinc-800/60 bg-[#0d0d0f] overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-zinc-800/60 shrink-0">
        <motion.div
          className="flex items-center gap-3 min-w-0"
          animate={{ opacity: 1 }}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0 glow-blue">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="min-w-0"
              >
                <span className="font-display font-700 text-sm tracking-wide text-white whitespace-nowrap">
                  SkyWeb<span className="text-blue-400"> CRM</span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleSidebar}
              className="ml-auto p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
        {sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="absolute right-2 top-4 p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
          </button>
        )}
      </div>

      {/* Plan badge */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-3 border-b border-zinc-800/60"
          >
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-blue-500/10 border border-blue-500/20">
              <Shield className="w-3 h-3 text-blue-400" />
              <span className="text-xs font-medium text-blue-400">Pro Plan</span>
              <TrendingUp className="w-3 h-3 text-blue-400 ml-auto" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: sidebarCollapsed ? 0 : 2 }}
                className={cn(
                  'flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-all duration-150 cursor-pointer group relative',
                  isActive
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavBg"
                    className="absolute inset-0 rounded-lg bg-blue-500/10"
                    transition={{ duration: 0.2 }}
                  />
                )}
                <Icon
                  className={cn('w-4 h-4 shrink-0 relative z-10', isActive ? 'text-blue-400' : 'text-zinc-500 group-hover:text-zinc-300')}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="relative z-10 font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* Bottom nav */}
      <div className="px-3 py-3 border-t border-zinc-800/60 space-y-0.5">
        {bottomItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          const showBadge = item.href === '/notifications' && unreadCount > 0
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                'flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-all duration-150 cursor-pointer group relative',
                isActive
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              )}>
                <div className="relative shrink-0">
                  <Icon className={cn('w-4 h-4', isActive ? 'text-blue-400' : 'text-zinc-500 group-hover:text-zinc-300')} strokeWidth={isActive ? 2.5 : 2} />
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white animate-pulse-ring">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </Link>
          )
        })}

        {/* User profile */}
        <div className={cn('flex items-center gap-3 px-2.5 py-2 rounded-lg mt-1', !sidebarCollapsed && 'hover:bg-zinc-800/60 cursor-pointer')}>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
            JH
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-w-0"
              >
                <p className="text-xs font-medium text-zinc-200 truncate">James Hartley</p>
                <p className="text-[10px] text-zinc-500 truncate">Peak Roofing Solutions</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  )
}
