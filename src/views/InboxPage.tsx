import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { approveDocument, forwardDocument, listAssignedToMe, rejectDocument } from '../api/inbox'
import { useState } from 'react'
import { listDepartments, listProfiles } from '../api/directory'

export function InboxPage() {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['inbox'], queryFn: listAssignedToMe })
  const assigned = q.data ?? []
  const [remarksById, setRemarksById] = useState<Record<string, string>>({})
  const [instructionById, setInstructionById] = useState<Record<string, string>>({})
  const [toUserById, setToUserById] = useState<Record<string, string>>({})
  const [toDeptById, setToDeptById] = useState<Record<string, string>>({})

  const deps = useQuery({ queryKey: ['departments'], queryFn: listDepartments })
  const profiles = useQuery({ queryKey: ['profiles'], queryFn: listProfiles })

  const approve = useMutation({
    mutationFn: async (id: string) => approveDocument(id, remarksById[id]),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['inbox'] }),
        qc.invalidateQueries({ queryKey: ['documents'] }),
      ])
    },
  })

  const reject = useMutation({
    mutationFn: async (id: string) => rejectDocument(id, remarksById[id]),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['inbox'] }),
        qc.invalidateQueries({ queryKey: ['documents'] }),
      ])
    },
  })

  const forward = useMutation({
    mutationFn: async (id: string) =>
      forwardDocument({
        documentId: id,
        toUserId: toUserById[id] || undefined,
        toDepartmentId: toDeptById[id] || undefined,
        instruction: instructionById[id] || undefined,
        remarks: remarksById[id] || undefined,
      }),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['inbox'] }),
        qc.invalidateQueries({ queryKey: ['documents'] }),
      ])
    },
  })

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold text-slate-900">Inbox</div>

      {q.isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Loading…
        </div>
      ) : q.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {(q.error as Error).message}
        </div>
      ) : (
        <div className="space-y-3">
          {assigned.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              No assigned documents right now.
            </div>
          ) : null}

          {assigned.map((d) => (
            <div key={d.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link to={`/documents/${d.id}`} className="text-sm font-semibold text-slate-900">
                    {d.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-600">
                    <span className="rounded bg-slate-100 px-2 py-1">{d.originating_office}</span>
                    <span className="rounded bg-slate-100 px-2 py-1 font-mono">
                      {d.reference_number ?? '—'}
                    </span>
                    <span className="rounded bg-slate-100 px-2 py-1">priority: {d.priority}</span>
                    <span className="rounded bg-slate-100 px-2 py-1">status: {d.status}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                <label className="md:col-span-2">
                  <div className="text-xs font-medium text-slate-700">Remarks</div>
                  <textarea
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    rows={2}
                    value={remarksById[d.id] ?? ''}
                    onChange={(e) =>
                      setRemarksById((prev) => ({ ...prev, [d.id]: e.target.value }))
                    }
                    placeholder="Add your remarks (optional)…"
                  />
                </label>
                <div className="flex items-end justify-end gap-2">
                  <button
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
                    disabled={approve.isPending || reject.isPending || forward.isPending}
                    onClick={() => forward.mutate(d.id)}
                    type="button"
                    title="Forward requires a To user or department"
                  >
                    Forward
                  </button>
                  <button
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
                    disabled={approve.isPending || reject.isPending || forward.isPending}
                    onClick={() => reject.mutate(d.id)}
                    type="button"
                  >
                    Reject
                  </button>
                  <button
                    className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                    disabled={approve.isPending || reject.isPending || forward.isPending}
                    onClick={() => approve.mutate(d.id)}
                    type="button"
                  >
                    Approve
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                <label className="md:col-span-1">
                  <div className="text-xs font-medium text-slate-700">Forward to user</div>
                  <select
                    className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
                    value={toUserById[d.id] ?? ''}
                    onChange={(e) =>
                      setToUserById((prev) => ({ ...prev, [d.id]: e.target.value }))
                    }
                  >
                    <option value="">(none)</option>
                    {(profiles.data ?? []).map((p) => (
                      <option key={p.user_id} value={p.user_id}>
                        {p.email ?? p.display_name ?? p.user_id}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="md:col-span-1">
                  <div className="text-xs font-medium text-slate-700">Or to department</div>
                  <select
                    className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
                    value={toDeptById[d.id] ?? ''}
                    onChange={(e) =>
                      setToDeptById((prev) => ({ ...prev, [d.id]: e.target.value }))
                    }
                  >
                    <option value="">(none)</option>
                    {(deps.data ?? []).map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="md:col-span-1">
                  <div className="text-xs font-medium text-slate-700">Instruction</div>
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    value={instructionById[d.id] ?? ''}
                    onChange={(e) =>
                      setInstructionById((prev) => ({ ...prev, [d.id]: e.target.value }))
                    }
                    placeholder="Action requested…"
                  />
                </label>
              </div>

              {forward.isError ? (
                <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {(forward.error as Error).message}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

