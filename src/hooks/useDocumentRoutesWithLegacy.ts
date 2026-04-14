import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { DocumentRow } from '../api/documents'
import type { RouteRow } from '../api/timeline'
import { withLegacyRouteFallback } from '../api/legacyRoutes'

/**
 * @param timelineLoaded - pass `timeline.isSuccess` so we do not synthesize a row while routes are still loading.
 */
export function useDocumentRoutesWithLegacy(
  doc: DocumentRow | undefined,
  routes: RouteRow[] | undefined,
  timelineLoaded: boolean,
) {
  const needLegacy = !!doc && timelineLoaded && (routes?.length ?? 0) === 0
  const userIds = useMemo(() => {
    if (!doc || !needLegacy) return [] as string[]
    return [...new Set([doc.created_by, doc.current_holder_user_id ?? doc.created_by])]
  }, [doc, needLegacy])

  const profilesQ = useQuery({
    queryKey: ['doc-route-legacy-profiles', userIds.slice().sort().join(',')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .in('user_id', userIds)
      if (error) throw error
      return data ?? []
    },
    enabled: needLegacy && userIds.length > 0,
  })

  const routesMerged = useMemo(() => {
    if (!timelineLoaded) return routes ?? []
    return withLegacyRouteFallback(routes ?? [], doc, profilesQ.data)
  }, [timelineLoaded, routes, doc, profilesQ.data])

  return { routes: routesMerged, needLegacy }
}
