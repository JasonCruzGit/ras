type RouteItem = {
  id: string
  assigned_at: string
  from_display_name: string | null
  from_department_name: string | null
  to_display_name: string | null
  to_department_name: string | null
  initial_instruction: string | null
}

type DocItem = {
  title: string
  originating_office: string
  reference_number: string | null
  date_of_document: string | null
  date_time_received: string | null
}

function displayPerson(name: string | null, dept: string | null) {
  return name ?? dept ?? '—'
}

export function ActionSlipTemplate(props: {
  doc: DocItem
  routes: RouteItem[]
  className?: string
}) {
  const routes = props.routes ?? []
  const totalRows = 14
  const rows = Array.from({ length: totalRows }).map((_, i) => routes[i] ?? null)

  return (
    <div className={props.className}>
      <div className="border border-slate-900 bg-white">
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
            <div className="p-2 font-medium">{props.doc.originating_office}</div>
          </div>
          <div className="grid grid-cols-[120px_1fr]">
            <div className="border-r border-slate-900 p-2">Reference Number:</div>
            <div className="p-2 font-medium">{props.doc.reference_number ?? ''}</div>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_220px] border-b border-slate-900 text-xs">
          <div className="grid grid-cols-[140px_1fr] border-r border-slate-900">
            <div className="border-r border-slate-900 p-2 font-semibold">Subject:</div>
            <div className="p-2 font-medium">{props.doc.title}</div>
          </div>
          <div className="grid grid-rows-2">
            <div className="grid grid-cols-[120px_1fr] border-b border-slate-900">
              <div className="border-r border-slate-900 p-2">Date of Document:</div>
              <div className="p-2 font-medium">{props.doc.date_of_document ?? ''}</div>
            </div>
            <div className="grid grid-cols-[120px_1fr]">
              <div className="border-r border-slate-900 p-2">Date &amp; Time Received:</div>
              <div className="p-2 font-medium">
                {props.doc.date_time_received
                  ? new Date(props.doc.date_time_received).toLocaleString()
                  : ''}
              </div>
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
              {rows.map((r, i) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

