import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getDocument } from '../api/documents'
import { getTimeline } from '../api/timeline'
import { useAuth } from '../auth/AuthProvider'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { forwardDocument } from '../api/inbox'
import { listDepartments, listProfiles } from '../api/directory'
import { useEffect, useMemo, useState } from 'react'
import { createHardcopySession } from '../api/hardcopyProof'
import QRCode from 'qrcode'
import { createSignedAttachmentUrl, listAttachments, listHardcopyProofs } from '../api/attachments'
import { supabase } from '../lib/supabase'
import { useDocumentRoutesWithLegacy } from '../hooks/useDocumentRoutesWithLegacy'
import { profileSelectLabel } from '../lib/profileLabel'
import { actionSlipFromCellChained, actionSlipToCell } from '../lib/actionSlipDisplay'

export function DocumentDetailPage() {
  const { id } = useParams()
  const qc = useQueryClient()
  const { user } = useAuth()

  const q = useQuery({
    queryKey: ['documents', id],
    queryFn: () => getDocument(id!),
    enabled: !!id,
  })

  const timeline = useQuery({
    queryKey: ['timeline', id],
    queryFn: () => getTimeline(id!),
    enabled: !!id,
  })

  const { routes: displayRoutes } = useDocumentRoutesWithLegacy(
    q.data,
    timeline.data?.routes,
    timeline.isSuccess,
  )

  const deps = useQuery({ queryKey: ['departments'], queryFn: listDepartments })
  const profiles = useQuery({ queryKey: ['profiles'], queryFn: listProfiles })
  const [forwardToUser, setForwardToUser] = useState<string>('')
  const [forwardToDepartment, setForwardToDepartment] = useState<string>('')
  const [instruction, setInstruction] = useState('')
  const [remarks, setRemarks] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [qrLink, setQrLink] = useState<string | null>(null)
  const [qrError, setQrError] = useState<string | null>(null)

  // Any signed-in user who can open this page may forward (matches open assert_can_act_on_document).
  const canAct = !!(user?.id && q.data)

  const peopleOptions = useMemo(() => {
    const list = profiles.data ?? []
    return list
      .map((p) => ({
        id: p.user_id,
        label: profileSelectLabel(p),
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [profiles.data])

  const forward = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('Missing document id')
      await forwardDocument({
        documentId: id,
        toUserId: forwardToUser || undefined,
        toDepartmentId: forwardToDepartment || undefined,
        instruction: instruction || undefined,
        remarks: remarks || undefined,
      })
    },
    onSuccess: async () => {
      setForwardToUser('')
      setForwardToDepartment('')
      setInstruction('')
      setRemarks('')
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['documents', id] }),
        qc.invalidateQueries({ queryKey: ['documents'] }),
        qc.invalidateQueries({ queryKey: ['timeline', id] }),
        qc.invalidateQueries({ queryKey: ['inbox'] }),
      ])
    },
  })

  const genQr = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('Missing document id')
      const s = await createHardcopySession(id)
      const link = `${window.location.origin}/hardcopy-upload/${s.token}`
      const dataUrl = await QRCode.toDataURL(link, { margin: 1, width: 220 })
      return { link, dataUrl }
    },
    onSuccess: ({ link, dataUrl }) => {
      setQrError(null)
      setQrLink(link)
      setQrDataUrl(dataUrl)
    },
    onError: (e) => setQrError((e as Error).message),
  })

  const proofs = useQuery({
    queryKey: ['hardcopy-proofs', id],
    queryFn: () => listHardcopyProofs(id!),
    enabled: !!id,
  })

  const attachments = useQuery({
    queryKey: ['attachments', id],
    queryFn: () => listAttachments(id!),
    enabled: !!id,
  })

  const proofUrls = useQuery({
    queryKey: ['hardcopy-proofs-urls', id, proofs.data?.map((p) => p.id).join(',') ?? ''],
    queryFn: async () => {
      const items = proofs.data ?? []
      const urls = await Promise.all(
        items.map(async (p) => ({
          id: p.id,
          url: await createSignedAttachmentUrl({ bucket: p.storage_bucket, path: p.storage_path }),
        })),
      )
      return Object.fromEntries(urls.map((u) => [u.id, u.url])) as Record<string, string>
    },
    enabled: !!id && !!proofs.data,
  })

  useEffect(() => {
    if (!id) return
    const ch = supabase
      .channel(`attachments:${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'document_attachments', filter: `document_id=eq.${id}` },
        () => {
          qc.invalidateQueries({ queryKey: ['hardcopy-proofs', id] })
          qc.invalidateQueries({ queryKey: ['attachments', id] })
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [id, qc])

  return (
    <div className="space-y-4">
      {q.isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Loading…
        </div>
      ) : q.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {(q.error as Error).message}
        </div>
      ) : q.data ? (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-xl font-semibold text-slate-900">{q.data.title}</div>
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-600">
                <span className="rounded bg-slate-100 px-2 py-1">status: {q.data.status}</span>
                <span className="rounded bg-slate-100 px-2 py-1">priority: {q.data.priority}</span>
                <span className="rounded bg-slate-100 px-2 py-1">
                  originating: {q.data.originating_office}
                </span>
                <span className="rounded bg-slate-100 px-2 py-1 font-mono">
                  ref: {q.data.reference_number ?? '—'}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                to={`/print/documents/${q.data.id}`}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
              >
                Open preview
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
              <div className="text-sm font-medium text-slate-900">Document info</div>
              <dl className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                <div>
                  <dt className="text-xs text-slate-500">Originating office</dt>
                  <dd className="text-slate-900">{q.data.originating_office}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Reference number</dt>
                  <dd className="font-mono text-xs text-slate-900">{q.data.reference_number ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Date of document</dt>
                  <dd className="text-slate-900">{q.data.date_of_document ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Date & time received</dt>
                  <dd className="text-slate-900">
                    {q.data.date_time_received
                      ? new Date(q.data.date_time_received).toLocaleString()
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Priority</dt>
                  <dd className="text-slate-900">{q.data.priority}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Status</dt>
                  <dd className="text-slate-900">{q.data.status}</dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="text-xs text-slate-500">Description</dt>
                  <dd className="whitespace-pre-wrap text-slate-900">
                    {q.data.description ?? '—'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-medium text-slate-900">Routing action</div>
              {!canAct ? (
                <div className="mt-1 text-sm text-slate-600">
                  You can act when this document is assigned to you.
                </div>
              ) : (
                <form
                  className="mt-3 space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault()
                    forward.mutate()
                  }}
                >
                  <div className="grid grid-cols-1 gap-2">
                    <label>
                      <div className="text-xs font-medium text-slate-700">Forward to user</div>
                      <select
                        className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
                        value={forwardToUser}
                        onChange={(e) => setForwardToUser(e.target.value)}
                      >
                        <option value="">(none)</option>
                        {peopleOptions.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <div className="text-xs font-medium text-slate-700">Or forward to department</div>
                      <select
                        className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
                        value={forwardToDepartment}
                        onChange={(e) => setForwardToDepartment(e.target.value)}
                      >
                        <option value="">(none)</option>
                        {(deps.data ?? []).map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="block">
                    <div className="text-xs font-medium text-slate-700">Instruction</div>
                    <textarea
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      rows={2}
                      value={instruction}
                      onChange={(e) => setInstruction(e.target.value)}
                      placeholder="Remarks / instruction / action requested…"
                    />
                  </label>

                  <label className="block">
                    <div className="text-xs font-medium text-slate-700">Your remarks (optional)</div>
                    <textarea
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      rows={2}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Add your note before forwarding…"
                    />
                  </label>

                  <button
                    className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                    disabled={forward.isPending || (!forwardToUser && !forwardToDepartment)}
                    type="submit"
                  >
                    {forward.isPending ? 'Forwarding…' : 'Forward'}
                  </button>

                  <button
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
                    type="button"
                    disabled={!id || genQr.isPending}
                    onClick={(e) => {
                      e.preventDefault()
                      setQrError(null)
                      genQr.mutate()
                    }}
                  >
                    {genQr.isPending ? 'Generating…' : 'Generate QR (hardcopy proof upload)'}
                  </button>

                  {qrDataUrl ? (
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Scan on phone
                      </div>
                      <img
                        src={qrDataUrl}
                        alt="QR code"
                        className="mt-2 h-[220px] w-[220px] bg-white p-2"
                      />
                      {qrLink ? (
                        <div className="mt-2 break-all text-xs text-slate-600">{qrLink}</div>
                      ) : null}
                    </div>
                  ) : null}

                  {qrError ? (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {qrError}
                    </div>
                  ) : null}

                  {forward.isError ? (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {(forward.error as Error).message}
                    </div>
                  ) : null}
                </form>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-medium text-slate-900">Hardcopy proof uploads</div>
            <div className="mt-1 text-sm text-slate-600">
              Photos from QR upload appear here. Use <span className="font-medium text-slate-800">Open preview</span>{' '}
              to view the full file in a new tab.
            </div>

            {proofs.isLoading ? (
              <div className="mt-3 text-sm text-slate-600">Loading…</div>
            ) : proofs.isError ? (
              <div className="mt-3 text-sm text-red-700">{(proofs.error as Error).message}</div>
            ) : (proofs.data?.length ?? 0) === 0 ? (
              <div className="mt-3 text-sm text-slate-600">No hardcopy proofs yet.</div>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {(proofs.data ?? []).map((p) => {
                  const url = proofUrls.data?.[p.id]
                  return (
                    <div key={p.id} className="flex flex-col" title={p.file_name}>
                      <div className="aspect-square overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                        {url ? (
                          <img
                            src={url}
                            alt={p.file_name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                            Loading…
                          </div>
                        )}
                      </div>
                      <div className="mt-1 truncate text-xs text-slate-600">
                        {new Date(p.created_at).toLocaleString()}
                      </div>
                      <button
                        type="button"
                        disabled={!url}
                        className="mt-2 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => {
                          if (url) window.open(url, '_blank', 'noreferrer')
                        }}
                      >
                        Open preview
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-medium text-slate-900">Files</div>
            <div className="mt-1 text-sm text-slate-600">All attachments for this routing slip.</div>

            {attachments.isLoading ? (
              <div className="mt-3 text-sm text-slate-600">Loading…</div>
            ) : attachments.isError ? (
              <div className="mt-3 text-sm text-red-700">{(attachments.error as Error).message}</div>
            ) : (attachments.data?.length ?? 0) === 0 ? (
              <div className="mt-3 text-sm text-slate-600">No files uploaded.</div>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100 rounded-md border border-slate-200">
                {(attachments.data ?? []).map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm text-slate-900">{a.file_name}</div>
                      <div className="text-xs text-slate-500">
                        {a.kind ?? 'attachment'} • {new Date(a.created_at).toLocaleString()}
                      </div>
                    </div>
                    <button
                      className="shrink-0 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
                      type="button"
                      onClick={async () => {
                        const url = await createSignedAttachmentUrl({
                          bucket: a.storage_bucket,
                          path: a.storage_path,
                        })
                        window.open(url, '_blank', 'noreferrer')
                      }}
                    >
                      Open
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium text-slate-900">Routing history</div>
              <Link
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
                to={`/print/documents/${q.data.id}`}
              >
                Action slip (print)
              </Link>
            </div>
            {timeline.isLoading ? (
              <div className="mt-3 text-sm text-slate-600">Loading timeline…</div>
            ) : timeline.isError ? (
              <div className="mt-3 text-sm text-red-700">{(timeline.error as Error).message}</div>
            ) : (
              <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Routes
                  </div>
                  <ol className="mt-2 space-y-2">
                    {displayRoutes.map((r, idx) => (
                      <li key={r.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                        <div className="text-sm text-slate-900">
                          <span className="font-medium">From:</span>{' '}
                          {actionSlipFromCellChained(displayRoutes, idx, q.data)}{' '}
                          <span className="font-medium">To:</span>{' '}
                          {actionSlipToCell(r, idx, q.data)}
                        </div>
                        <div className="mt-1 text-xs text-slate-600">
                          Assigned: {new Date(r.assigned_at).toLocaleString()}
                          {r.completed_at ? ` • Completed: ${new Date(r.completed_at).toLocaleString()}` : ''}
                          {r.is_current ? ' • Current' : ''}
                        </div>
                        {r.initial_instruction ? (
                          <div className="mt-2 text-sm text-slate-700">{r.initial_instruction}</div>
                        ) : null}
                      </li>
                    ))}
                    {displayRoutes.length === 0 ? (
                      <li className="text-sm text-slate-600">No routing yet.</li>
                    ) : null}
                  </ol>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </div>
                  <ol className="mt-2 space-y-2">
                    {(timeline.data?.actions ?? []).map((a) => (
                      <li key={a.id} className="rounded-md border border-slate-200 bg-white p-3">
                        <div className="text-sm text-slate-900">
                          <span className="font-medium">{a.actor_display_name ?? a.actor_user_id}</span>{' '}
                          <span className="text-slate-600">→</span> {a.action}
                        </div>
                        <div className="mt-1 text-xs text-slate-600">
                          {a.actor_department_name ? `${a.actor_department_name} • ` : ''}
                          {new Date(a.created_at).toLocaleString()}
                        </div>
                        {a.remarks ? (
                          <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                            {a.remarks}
                          </div>
                        ) : null}
                      </li>
                    ))}
                    {(timeline.data?.actions ?? []).length === 0 ? (
                      <li className="text-sm text-slate-600">No actions yet.</li>
                    ) : null}
                  </ol>
                </div>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}

