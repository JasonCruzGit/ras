import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { getDocument } from '../api/documents'
import { getTimeline } from '../api/timeline'

function displayPerson(name: string | null, dept: string | null) {
  return name ?? dept ?? '—'
}

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
          <div className="rounded-xl border border-slate-200 bg-white p-6 print:rounded-none print:border-0 print:p-0">
            <div className="border border-slate-900">
              {/* Header */}
              <div className="grid grid-cols-[110px_1fr] border-b border-slate-900">
                <div className="flex items-center justify-center gap-2 border-r border-slate-900 p-2">
                  <img
                    src="/logos/caap.png"
                    alt="CAAP"
                    className="h-10 w-10 object-contain"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                    }}
                  />
                  <img
                    src="/logos/bagong-pilipinas.png"
                    alt="Bagong Pilipinas"
                    className="h-10 w-10 object-contain"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
                <div className="p-2 text-center text-xs">
                  <div>Republic of the Philippines</div>
                  <div className="text-sm font-semibold">CIVIL AVIATION AUTHORITY OF THE PHILIPPINES</div>
                </div>
              </div>

              <div className="border-b border-slate-900 p-2 text-center text-sm font-semibold">
                ROUTING ACTION SLIP
              </div>

              {/* Meta fields */}
              <div className="grid grid-cols-[1fr_220px] border-b border-slate-900 text-xs">
                <div className="grid grid-cols-[140px_1fr] border-r border-slate-900">
                  <div className="border-r border-slate-900 p-2">Originating Office</div>
                  <div className="p-2 font-medium">{doc.data.originating_office}</div>
                </div>
                <div className="grid grid-cols-[120px_1fr]">
                  <div className="border-r border-slate-900 p-2">Reference Number:</div>
                  <div className="p-2 font-medium">{doc.data.reference_number ?? ''}</div>
                </div>
              </div>

              <div className="grid grid-cols-[1fr_220px] border-b border-slate-900 text-xs">
                <div className="grid grid-cols-[140px_1fr] border-r border-slate-900">
                  <div className="border-r border-slate-900 p-2 font-semibold">Subject:</div>
                  <div className="p-2 font-medium">{doc.data.title}</div>
                </div>
                <div className="grid grid-rows-2">
                  <div className="grid grid-cols-[120px_1fr] border-b border-slate-900">
                    <div className="border-r border-slate-900 p-2">Date of Document:</div>
                    <div className="p-2 font-medium">{doc.data.date_of_document ?? ''}</div>
                  </div>
                  <div className="grid grid-cols-[120px_1fr]">
                    <div className="border-r border-slate-900 p-2">Date &amp; Time Received:</div>
                    <div className="p-2 font-medium">
                      {doc.data.date_time_received
                        ? new Date(doc.data.date_time_received).toLocaleString()
                        : ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Routing grid */}
              <div className="text-[11px]">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="text-center font-semibold">
                      <th className="w-[110px] border-r border-slate-900 border-b border-slate-900 p-1">
                        DATE &amp;
                        <br />
                        TIME
                      </th>
                      <th className="w-[180px] border-r border-slate-900 border-b border-slate-900 p-1">
                        FROM
                        <div className="mt-1 border-t border-slate-900 pt-1 text-[10px] font-normal">
                          Name and Position of
                          <br />
                          Official
                        </div>
                      </th>
                      <th className="w-[180px] border-r border-slate-900 border-b border-slate-900 p-1">
                        TO
                        <div className="mt-1 border-t border-slate-900 pt-1 text-[10px] font-normal">
                          Name and Position of
                          <br />
                          Official
                        </div>
                      </th>
                      <th className="border-b border-slate-900 p-1">
                        REMARKS / INSTRUCTION / ACTION REQUESTED
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const routes = timeline.data?.routes ?? []
                      const totalRows = 14
                      const rows = Array.from({ length: totalRows }).map((_, i) => routes[i] ?? null)

                      return rows.map((r, i) => (
                        <tr key={i} className="align-top">
                          <td className="h-10 border-r border-slate-900 border-b border-slate-900 p-1">
                            {r ? new Date(r.assigned_at).toLocaleString() : ''}
                          </td>
                          <td className="border-r border-slate-900 border-b border-slate-900 p-1">
                            {r ? displayPerson(r.from_display_name, r.from_department_name) : ''}
                          </td>
                          <td className="border-r border-slate-900 border-b border-slate-900 p-1">
                            {r ? displayPerson(r.to_display_name, r.to_department_name) : ''}
                          </td>
                          <td className="border-b border-slate-900 p-1">
                            {i === 0 ? (
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  {[
                                    'Approval / Signature',
                                    'Comments / Recommendation',
                                    'Request Appropriate Action',
                                    'Reply Directly to writer',
                                    'Rewrite / Redraft',
                                  ].map((x) => (
                                    <div key={x} className="flex items-start gap-2">
                                      <span className="mt-[2px] inline-block h-3 w-3 border border-slate-900" />
                                      <span className="leading-tight">{x}</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="space-y-1">
                                  {[
                                    'Information / Notation',
                                    'Endorsement',
                                    'See me / Call me',
                                    'File',
                                    'Remarks',
                                  ].map((x) => (
                                    <div key={x} className="flex items-start gap-2">
                                      <span className="mt-[2px] inline-block h-3 w-3 border border-slate-900" />
                                      <span className="leading-tight">{x}</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="col-span-2 mt-2 min-h-8 whitespace-pre-wrap border-t border-slate-900 pt-2">
                                  {r?.initial_instruction ?? ''}
                                </div>
                              </div>
                            ) : (
                              <div className="min-h-8 whitespace-pre-wrap">{r?.initial_instruction ?? ''}</div>
                            )}
                          </td>
                        </tr>
                      ))
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

