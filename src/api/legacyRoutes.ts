import type { DocumentRow } from './documents'
import type { RouteRow } from './timeline'

/** Placeholder id for a synthetic first row when a legacy document has no `document_routes` rows. */
export const LEGACY_SYNTHETIC_ROUTE_ID = '00000000-0000-0000-0000-000000000001'

/**
 * Older documents may have no routing rows. Show one row from document metadata + profiles
 * so print preview and detail page are not blank before/without DB backfill.
 */
export function withLegacyRouteFallback(
  routes: RouteRow[],
  doc: DocumentRow | undefined,
  profiles: { user_id: string; display_name: string | null; email: string | null }[] | undefined,
): RouteRow[] {
  if (routes.length > 0 || !doc) return routes

  const label = (uid: string | null | undefined) => {
    if (!uid || !profiles?.length) return null
    const p = profiles.find((x) => x.user_id === uid)
    return p?.display_name?.trim() || p?.email?.trim() || null
  }
  const toUid = doc.current_holder_user_id ?? doc.created_by
  const row: RouteRow = {
    id: LEGACY_SYNTHETIC_ROUTE_ID,
    document_id: doc.id,
    from_user_id: doc.created_by,
    from_department_id: null,
    to_user_id: toUid,
    to_department_id: null,
    from_text: null,
    to_text: null,
    action_requested: null,
    assigned_at: doc.date_time_received ?? doc.created_at,
    completed_at: null,
    is_current: true,
    initial_instruction: doc.description,
    from_display_name: label(doc.created_by),
    to_display_name: label(toUid),
    from_department_name: null,
    to_department_name: null,
  }
  return [row]
}
