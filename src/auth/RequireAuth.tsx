import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthProvider'

function RequireAuthInner(props: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const loc = useLocation()

  if (loading) return <div className="p-6 text-sm text-slate-600">Loading…</div>
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />

  return <>{props.children}</>
}

export function RequireAuth(props: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <RequireAuthInner>{props.children}</RequireAuthInner>
    </AuthProvider>
  )
}

