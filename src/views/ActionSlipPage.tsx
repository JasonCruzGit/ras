import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { getDocument } from '../api/documents'
import { getTimeline } from '../api/timeline'
import { ActionSlipTemplate } from '../ui/ActionSlipTemplate'

export function ActionSlipPage() {
  const { id } = useParams()
  const doc = useQuery({
    queryKey: ['documents', id],
    queryFn: () => getDocument(id!),
    enabled: !!id,
  })
  const timeline = useQuery({
    queryKey: ['timeline', id],
    queryFn: () => getTimeline(id!),
    enabled: !!id,
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <div>
          <div className="text-xl font-semibold text-slate-900">Action slip</div>
          <div className="text-sm text-slate-600">Printable view (use browser “Print to PDF”).</div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/documents/${id}`}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
          >
            Back
          </Link>
          <button
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            onClick={() => window.print()}
            type="button"
          >
            Print / PDF
          </button>
        </div>
      </div>

      {doc.isLoading || timeline.isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Loading…
        </div>
      ) : doc.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {(doc.error as Error).message}
        </div>
      ) : timeline.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {(timeline.error as Error).message}
        </div>
      ) : doc.data ? (
        <div className="mx-auto w-full max-w-[900px] print:max-w-none">
          <ActionSlipTemplate doc={doc.data} routes={timeline.data?.routes ?? []} />
        </div>
      ) : null}
    </div>
  )
}

