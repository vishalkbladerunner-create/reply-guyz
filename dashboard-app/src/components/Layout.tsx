import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useClient } from '@/hooks/useClient'
import {
  LayoutDashboard,
  BarChart3,
  FileText,
  Upload,
  ShoppingCart,
  LogOut,
  ChevronRight,
  Users,
  Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const allNavItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard, platforms: ['twitter', 'instagram', 'telegram'] },
  { path: '/platform/twitter', label: 'Twitter Analytics', icon: BarChart3, platforms: ['twitter'] },
  { path: '/platform/instagram', label: 'Instagram Analytics', icon: BarChart3, platforms: ['instagram'] },
  { path: '/platform/telegram', label: 'Telegram Analytics', icon: BarChart3, platforms: ['telegram'] },
  { path: '/engagement-orders', label: 'Engagement Orders', icon: ShoppingCart, platforms: ['twitter', 'instagram', 'telegram'] },
  { path: '/reports', label: 'Reports', icon: FileText, platforms: ['twitter', 'instagram', 'telegram'] },
]

const adminNavItems = [
  { path: '/upload', label: 'Upload Data', icon: Upload },
  { path: '/users', label: 'User Management', icon: Users },
  { path: '/clients', label: 'Manage Clients', icon: Building2 },
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

  const filteredNavItems = allNavItems.filter((item) =>
    item.platforms.some((p) => activePlatforms.includes(p))
  )

  const navItemsToShow = isAdmin ? [...filteredNavItems, ...adminNavItems] : filteredNavItems

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-navy flex flex-col fixed h-full z-50">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-xl font-medium text-white">ReplyGuyz</span>
          </Link>
          <p className="text-xs text-white/40 mt-1">Analytics Dashboard</p>
        </div>

        {/* Client Selector (Admin only) */}
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

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItemsToShow.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'sidebar-link',
                  isActive && 'active'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
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

      {/* Main content */}
      <main className="flex-1 ml-64">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
