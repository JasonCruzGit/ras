import type { ProfileRow } from '../api/directory'

/** Prefer login email for dropdowns; never show raw UUID as the visible label. */
export function profileSelectLabel(p: ProfileRow): string {
  const email = p.email?.trim()
  const admin = p.role === 'admin' ? ' (admin)' : ''
  if (email) return `${email}${admin}`

  const name = p.display_name?.trim()
  if (name) return `${name} (no email — set in Admin → Users)${admin}`

  return `Account …${p.user_id.slice(0, 8)}${admin}`
}
