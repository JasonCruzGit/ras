import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type UserRole = 'admin' | 'staff'
export type UserProfile = {
  user_id: string
  display_name: string | null
  role: UserRole
  department_id: string | null
}

type AuthContextValue = {
  session: Session | null
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider(props: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  async function refreshProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id,display_name,role,department_id')
      .eq('user_id', userId)
      .single()
    if (error) throw error
    setProfile(data as UserProfile)
  }

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return
      if (error) {
        // eslint-disable-next-line no-console
        console.error(error)
      }
      const s = data.session ?? null
      setSession(s)
      if (s?.user?.id) {
        refreshProfile(s.user.id).catch(() => setProfile(null))
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, newSession) => {
      setSession(newSession)
      if (newSession?.user?.id) {
        refreshProfile(newSession.user.id).catch(() => setProfile(null))
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      signOut: async () => {
        await supabase.auth.signOut()
      },
    }),
    [session, profile, loading],
  )

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

