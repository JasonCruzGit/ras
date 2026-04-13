import { Link, useLocation } from 'react-router-dom'

type PreviewState = {
  originatingOffice: string
  referenceNumber: string
  subject: string
  dateOfDocument: string
  dateTimeReceived: string
  fromText?: string
  toText?: string
  actionRequested?:
    | 'Approval / Signature'
    | 'Comments / Recommendation'
    | 'Request Appropriate Action'
    | 'Reply Directly to writer'
    | 'Rewrite / Redraft'
    | 'Information / Notation'
    | 'Endorsement'
    | 'See me / Call me'
    | 'File'
    | 'Remarks'
  remarksText?: string
}

function CheckBox(props: { checked: boolean }) {
  return (
    <span className="mt-[2px] inline-flex h-3 w-3 items-center justify-center border border-slate-900">
      {props.checked ? <span className="h-1.5 w-1.5 bg-slate-900" /> : null}
    </span>
  )
}

export function ActionSlipPreviewPage() {
  const loc = useLocation()
  const state = (loc.state as PreviewState | null) ?? null

  if (!state) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          Nothing to preview. Go back and click Preview / Print from the new routing slip form.
        </div>
        <Link
          to="/documents/new"
          className="inline-flex rounded-md border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
        >
          Back
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <div>
          <div className="text-xl font-semibold text-slate-900">Preview action slip</div>
          <div className="text-sm text-slate-600">Use Print to save as PDF.</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            onClick={() => window.print()}
            type="button"
          >
            Print / PDF
          </button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[900px] print:max-w-none">
        <div className="rounded-xl border border-slate-200 bg-white p-6 print:rounded-none print:border-0 print:p-0">
          <div className="border border-slate-900">
            <div className="grid grid-cols-[110px_1fr] border-b border-slate-900">
              <div className="flex items-center justify-center gap-2 border-r border-slate-900 p-2">
                <img
                  src="/img/caap.png"
                  alt="CAAP"
                  className="h-10 w-10 object-contain"
                  onError={(e) => {
                    ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                  }}
                />
                <img
                  src="/img/bagong-pilipinas.png"
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

            <div className="grid grid-cols-[1fr_220px] border-b border-slate-900 text-xs">
              <div className="grid grid-cols-[140px_1fr] border-r border-slate-900">
                <div className="border-r border-slate-900 p-2">Originating Office</div>
                <div className="p-2 font-medium">{state.originatingOffice}</div>
              </div>
              <div className="grid grid-cols-[120px_1fr]">
                <div className="border-r border-slate-900 p-2">Reference Number:</div>
                <div className="p-2 font-medium">{state.referenceNumber}</div>
              </div>
            </div>

            <div className="grid grid-cols-[1fr_220px] border-b border-slate-900 text-xs">
              <div className="grid grid-cols-[140px_1fr] border-r border-slate-900">
                <div className="border-r border-slate-900 p-2 font-semibold">Subject:</div>
                <div className="p-2 font-medium">{state.subject}</div>
              </div>
              <div className="grid grid-rows-2">
                <div className="grid grid-cols-[120px_1fr] border-b border-slate-900">
                  <div className="border-r border-slate-900 p-2">Date of Document:</div>
                  <div className="p-2 font-medium">{state.dateOfDocument}</div>
                </div>
                <div className="grid grid-cols-[120px_1fr]">
                  <div className="border-r border-slate-900 p-2">Date &amp; Time Received:</div>
                  <div className="p-2 font-medium">{state.dateTimeReceived}</div>
                </div>
              </div>
            </div>

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
                  {Array.from({ length: 14 }).map((_, i) => (
                    <tr key={i} className="align-top">
                      <td className="h-10 border-r border-slate-900 border-b border-slate-900 p-1">
                        {i === 0 ? new Date().toLocaleString() : ''}
                      </td>
                      <td className="border-r border-slate-900 border-b border-slate-900 p-1">
                        {i === 0 ? (state.fromText ?? '') : ''}
                      </td>
                      <td className="border-r border-slate-900 border-b border-slate-900 p-1">
                        {i === 0 ? (state.toText ?? '') : ''}
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
                                  <CheckBox checked={state.actionRequested === x} />
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
                                  <CheckBox checked={state.actionRequested === x} />
                                  <span className="leading-tight">{x}</span>
                                </div>
                              ))}
                            </div>
                            <div className="col-span-2 mt-2 min-h-10 whitespace-pre-wrap border-t border-slate-900 pt-2">
                              {state.remarksText ?? ''}
                            </div>
                          </div>
                        ) : (
                          <div className="min-h-8" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

