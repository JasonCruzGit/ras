import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export function RequireRole(props: { role: 'admin'; children: React.ReactNode }) {
  const { profile, loading } = useAuth()
  if (loading) return <div className="p-6 text-sm text-slate-600">Loading…</div>
  if (!profile) return <Navigate to="/dashboard" replace />
  if (profile.role !== props.role) return <Navigate to="/dashboard" replace />
  return <>{props.children}</>
}

