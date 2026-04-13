import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { getDocument } from '../api/documents'
import { getTimeline } from '../api/timeline'

export function ActionSlipPage() {
  const { id } = useParams()
  const doc = useQuery({ queryKey: ['documents', id], queryFn: () => getDocument(id!), enabled: !!id })
  const timeline = useQuery({ queryKey: ['timeline', id], queryFn: () => getTimeline(id!), enabled: !!id })

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
        <div className="rounded-xl border border-slate-200 bg-white p-6 print:border-0 print:p-0">
          <div className="text-center text-lg font-semibold text-slate-900">ROUTING ACTION SLIP</div>

          <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Originating Office
              </div>
              <div className="mt-1 font-medium text-slate-900">{doc.data.originating_office}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Reference Number
              </div>
              <div className="mt-1 font-mono text-slate-900">{doc.data.reference_number ?? '—'}</div>
            </div>
            <div className="md:col-span-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subject</div>
              <div className="mt-1 font-medium text-slate-900">{doc.data.title}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Date of Document
              </div>
              <div className="mt-1 text-slate-900">{doc.data.date_of_document ?? '—'}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Date &amp; Time Received
              </div>
              <div className="mt-1 text-slate-900">
                {doc.data.date_time_received ? new Date(doc.data.date_time_received).toLocaleString() : '—'}
              </div>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 print:border-slate-400">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-700 print:bg-white">
                <tr>
                  <th className="px-3 py-2">DATE &amp; TIME</th>
                  <th className="px-3 py-2">FROM</th>
                  <th className="px-3 py-2">TO</th>
                  <th className="px-3 py-2">REMARKS / INSTRUCTION / ACTION REQUESTED</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                {(timeline.data?.routes ?? []).map((r) => (
                  <tr key={r.id}>
                    <td className="px-3 py-2 align-top text-xs">
                      {new Date(r.assigned_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="text-sm">
                        {r.from_display_name ?? r.from_department_name ?? '—'}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="text-sm">{r.to_display_name ?? r.to_department_name ?? '—'}</div>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="whitespace-pre-wrap text-sm text-slate-900">
                        {r.initial_instruction ?? ''}
                      </div>
                    </td>
                  </tr>
                ))}
                {(timeline.data?.routes ?? []).length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-sm text-slate-600" colSpan={4}>
                      No routing yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="mt-6 text-xs text-slate-500">
            Generated: {new Date().toLocaleString()}
          </div>
        </div>
      ) : null}
    </div>
  )
}

