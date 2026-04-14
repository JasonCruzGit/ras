import { z } from 'zod'
import { supabase } from '../lib/supabase'

export const DepartmentRow = z.object({
  id: z.string().uuid(),
  name: z.string(),
})
export type DepartmentRow = z.infer<typeof DepartmentRow>

export async function listDepartments() {
  const { data, error } = await supabase.from('departments').select('id,name').order('name')
  if (error) throw error
  return z.array(DepartmentRow).parse(data)
}

export const ProfileRow = z.object({
  user_id: z.string().uuid(),
  display_name: z.string().nullable(),
  email: z.string().nullable(),
  role: z.enum(['admin', 'staff']),
  department_id: z.string().uuid().nullable(),
})
export type ProfileRow = z.infer<typeof ProfileRow>

export async function listProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id,display_name,email,role,department_id')
    .order('email', { ascending: true, nullsFirst: false })
    .limit(1000)
  if (error) throw error
  return z.array(ProfileRow).parse(data)
}

export async function createDepartment(name: string) {
  const { data, error } = await supabase
    .from('departments')
    .insert({ name })
    .select('id,name')
    .single()
  if (error) throw error
  return DepartmentRow.parse(data)
}

export async function updateProfile(args: {
  user_id: string
  role?: 'admin' | 'staff'
  department_id?: string | null
  display_name?: string | null
  email?: string | null
}) {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      role: args.role,
      department_id: args.department_id,
      display_name: args.display_name,
      ...(args.email !== undefined ? { email: args.email || null } : {}),
    })
    .eq('user_id', args.user_id)
    .select('user_id,display_name,email,role,department_id')
    .single()
  if (error) throw error
  return ProfileRow.parse(data)
}

