import { z } from 'zod'
import { supabase } from '../lib/supabase'

export const RouteRow = z.object({
  id: z.string().uuid(),
  document_id: z.string().uuid(),
  from_user_id: z.string().uuid().nullable(),
  from_department_id: z.string().uuid().nullable(),
  to_user_id: z.string().uuid().nullable(),
  to_department_id: z.string().uuid().nullable(),
  assigned_at: z.string(),
  completed_at: z.string().nullable(),
  is_current: z.boolean(),
  initial_instruction: z.string().nullable(),
  from_display_name: z.string().nullable(),
  to_display_name: z.string().nullable(),
  from_department_name: z.string().nullable(),
  to_department_name: z.string().nullable(),
})
export type RouteRow = z.infer<typeof RouteRow>

export const ActionRow = z.object({
  id: z.string().uuid(),
  document_id: z.string().uuid(),
  route_id: z.string().uuid().nullable(),
  actor_user_id: z.string().uuid(),
  actor_display_name: z.string().nullable(),
  actor_department_name: z.string().nullable(),
  action: z.string(),
  remarks: z.string().nullable(),
  created_at: z.string(),
})
export type ActionRow = z.infer<typeof ActionRow>

export async function getTimeline(documentId: string) {
  const [routesRes, actionsRes] = await Promise.all([
    supabase
      .from('v_document_routes')
      .select('*')
      .eq('document_id', documentId)
      .order('assigned_at', { ascending: true }),
    supabase
      .from('v_document_actions')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: true }),
  ])

  if (routesRes.error) throw routesRes.error
  if (actionsRes.error) throw actionsRes.error

  return {
    routes: z.array(RouteRow).parse(routesRes.data ?? []),
    actions: z.array(ActionRow).parse(actionsRes.data ?? []),
  }
}

