import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { startSessionRefresh, stopSessionRefresh } from '@/lib/supabase'
import { Loader2, Mail } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export default function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const { user, loading, isApproved, isAdmin } = useAuth()
  const location = useLocation()

  useEffect(() => {
    if (user && isApproved) {
      startSessionRefresh()
    }
    return () => {
      stopSessionRefresh()
    }
  }, [user, isApproved])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-accent animate-spin mx-auto mb-3" />
          <p className="text-sm text-text-muted">Verifying session...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!isApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-2xl mb-6">
            <Mail className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="font-display text-2xl font-medium text-navy mb-3">
            Account Pending Approval
          </h1>
          <p className="text-text-secondary mb-2">
            Your email <strong>{user.email}</strong> has been verified, but your account is not yet approved.
          </p>
          <p className="text-text-secondary">
            Please contact the administrator to get access to your organization's dashboard.
          </p>
          <div className="mt-8 p-4 bg-white rounded-xl border border-navy/10">
            <p className="text-sm text-text-muted">
              Status: <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Pending Approval</span>
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
