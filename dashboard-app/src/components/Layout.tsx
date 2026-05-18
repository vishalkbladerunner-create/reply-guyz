import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useClient } from '@/hooks/useClient'
import { LogOut, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const platformNavItems = [
  { path: '/platform/twitter', label: '𝕏 Twitter Analytics', platforms: ['twitter'] },
  { path: '/platform/instagram', label: '📸 Instagram Analytics', platforms: ['instagram'] },
  { path: '/platform/telegram', label: '✈️ Telegram Analytics', platforms: ['telegram'] },
]

const reportNavItems = [
  { path: '/weekly-report', label: '📝 Weekly Report', platforms: ['twitter', 'instagram', 'telegram'] },
  { path: '/reports', label: '📄 Custom Reports', platforms: ['twitter', 'instagram', 'telegram'] },
]

const operationNavItems = [
  { path: '/booster-tracker', label: '🚀 Booster Tracker', platforms: ['twitter', 'instagram', 'telegram'] },
  { path: '/engagement-orders', label: '🛒 Engagement Orders', platforms: ['twitter', 'instagram', 'telegram'] },
]

const adminNavItems = [
  { path: '/upload', label: '📤 Upload Data', platforms: [] as string[] },
  { path: '/users', label: '👥 User Management', platforms: [] as string[] },
  { path: '/clients', label: '🏢 Manage Clients', platforms: [] as string[] },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut, isAdmin } = useAuth()
  const { selectedClientId, clients, setSelectedClientId } = useClient()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const selectedClient = clients.find((c) => c.id === selectedClientId)
  const activePlatforms = selectedClient?.active_platforms || ['twitter']

  const filterByPlatforms = (items: typeof platformNavItems) =>
    items.filter((item) => item.platforms.length === 0 || item.platforms.some((p) => activePlatforms.includes(p)))

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-navy flex flex-col fixed h-full z-50">
        <div className="p-6 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-xl font-medium text-white">ReplyGuyz</span>
          </Link>
          <p className="text-xs text-white/40 mt-1">Analytics Dashboard</p>
        </div>

        {isAdmin && (
          <div className="px-4 py-3 border-b border-white/10">
            <label className="text-xs text-white/40 mb-1.5 block">Select Client</label>
            <select
              value={selectedClientId || ''}
              onChange={(e) => setSelectedClientId(e.target.value || null)}
              className="w-full bg-white/10 text-white text-sm rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:border-blue-accent"
            >
              <option value="" className="bg-navy text-white">— Choose client —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id} className="bg-navy text-white">{c.name}</option>
              ))}
            </select>
          </div>
        )}

        <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
          <NavLink to="/" label="📊 Overview" isActive={isActive('/')} />

          <NavSection label="PLATFORMS" />
          {filterByPlatforms(platformNavItems).map((item) => (
            <NavLink key={item.path} to={item.path} label={item.label} isActive={isActive(item.path)} />
          ))}

          <NavSection label="REPORTS" />
          {filterByPlatforms(reportNavItems).map((item) => (
            <NavLink key={item.path} to={item.path} label={item.label} isActive={isActive(item.path)} />
          ))}

          <NavSection label="OPERATIONS" />
          {filterByPlatforms(operationNavItems).map((item) => (
            <NavLink key={item.path} to={item.path} label={item.label} isActive={isActive(item.path)} />
          ))}

          {isAdmin && (
            <>
              <NavSection label="ADMIN" />
              {adminNavItems.map((item) => (
                <NavLink key={item.path} to={item.path} label={item.label} isActive={isActive(item.path)} />
              ))}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-blue-accent/20 flex items-center justify-center">
              <span className="text-sm font-medium text-blue-accent">
                {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.full_name || user?.email}
              </p>
              <p className="text-xs text-white/40 capitalize">
                {user?.status === 'approved' ? user?.role : user?.status}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-4 py-2 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

function NavLink({ to, label, isActive }: { to: string; label: string; isActive: boolean }) {
  return (
    <Link
      to={to}
      className={cn('sidebar-link', isActive && 'active')}
    >
      <span>{label}</span>
      {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
    </Link>
  )
}

function NavSection({ label }: { label: string }) {
  return (
    <p className="px-4 pt-5 pb-1.5 text-[10px] font-semibold text-white/25 uppercase tracking-widest">
      {label}
    </p>
  )
}
