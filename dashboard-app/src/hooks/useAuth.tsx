import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { supabase, type Profile } from '@/lib/supabase'

interface AuthContextType {
  user: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  isAdmin: boolean
  isApproved: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const SESSION_TIMEOUT_MS = 8000

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialSessionResolved, setInitialSessionResolved] = useState(false)

  useEffect(() => {
    let cancelled = false

    const getSession = async () => {
      try {
        const result = await Promise.race([
          supabase.auth.getSession(),
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('AUTH_TIMEOUT')), SESSION_TIMEOUT_MS)
          ),
        ])

        if (result === null) {
          console.warn('Supabase session fetch timed out')
          return
        }

        const { data: { session } } = result as Awaited<ReturnType<typeof supabase.auth.getSession>>
        if (!cancelled && session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          if (!cancelled) setUser(profile)
        }
      } catch (err: any) {
        if (err?.message === 'AUTH_TIMEOUT') {
          console.warn('Supabase auth session fetch timed out after', SESSION_TIMEOUT_MS, 'ms')
        } else {
          console.error('getSession error:', err)
        }
      } finally {
        if (!cancelled) {
          setInitialSessionResolved(true)
          setLoading(false)
        }
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return

      if (event === 'SIGNED_OUT') {
        setUser(null)
        setLoading(false)
        setInitialSessionResolved(true)
        return
      }

      if (event === 'TOKEN_REFRESHED' && session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        if (!cancelled && profile) setUser(profile)
        return
      }

      if (event === 'INITIAL_SESSION' && session?.user && !initialSessionResolved) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        if (!cancelled) setUser(profile)
        if (!cancelled) {
          setInitialSessionResolved(true)
          setLoading(false)
        }
      }

      if (!session && event !== 'INITIAL_SESSION') {
        if (!cancelled) {
          setUser(null)
          setInitialSessionResolved(true)
          setLoading(false)
        }
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error }

    if (data.user) {
      const { data: existing, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle()

      if (!existing || fetchError) {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.user_metadata?.full_name || '',
            status: 'pending',
            role: null,
          } as any)
          .select()
          .maybeSingle()

        if (insertError) {
          console.error('Profile insert error:', insertError)
          return { error: new Error('Account profile missing. Please contact admin.') }
        }
        setUser(newProfile)
      } else {
        setUser(existing)
      }
    }
    return { error: null }
  }, [])

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/dashboard/login` : undefined
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: redirectTo,
      },
    })
    if (error) return { error }

    if (data.user) {
      const { data: existing } = await supabase.from('profiles').select('id').eq('id', data.user.id).single()
      if (!existing) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          email: data.user.email,
          full_name: fullName,
          status: 'pending',
          role: null,
        } as any)
      }
    }
    return { error: null }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        isAdmin: user?.role === 'admin' && user?.status === 'approved',
        isApproved: user?.status === 'approved',
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
