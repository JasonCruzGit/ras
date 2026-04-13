import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listDocuments } from '../api/documents'
import { useMemo, useState } from 'react'

export function DocumentsPage() {
  const q = useQuery({
    queryKey: ['documents'],
    queryFn: listDocuments,
  })
  const docs = q.data ?? []
  const [qText, setQText] = useState('')
  const [status, setStatus] = useState<string>('')
  const [priority, setPriority] = useState<string>('')

  const filtered = useMemo(() => {
    const t = qText.trim().toLowerCase()
    return docs.filter((d) => {
      if (status && d.status !== status) return false
      if (priority && d.priority !== priority) return false
      if (!t) return true
      const hay = `${d.title} ${d.originating_office} ${d.reference_number ?? ''}`.toLowerCase()
      return hay.includes(t)
    })
  }, [docs, qText, status, priority])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xl font-semibold text-slate-900">Documents</div>
          <div className="text-sm text-slate-600">Search, filter, and track routing slips.</div>
        </div>
        <Link
          to="/documents/new"
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          New
        </Link>
      </div>

      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-4">
        <label className="flex-1 min-w-64">
          <div className="text-xs font-medium text-slate-700">Search</div>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={qText}
            onChange={(e) => setQText(e.target.value)}
            placeholder="Title, office, reference…"
          />
        </label>
        <label>
          <div className="text-xs font-medium text-slate-700">Status</div>
          <select
            className="mt-1 rounded-md border border-slate-300 px-2 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All</option>
            <option value="pending">pending</option>
            <option value="in_progress">in_progress</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
            <option value="completed">completed</option>
          </select>
        </label>
        <label>
          <div className="text-xs font-medium text-slate-700">Priority</div>
          <select
            className="mt-1 rounded-md border border-slate-300 px-2 py-2 text-sm"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="">All</option>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
            <option value="urgent">urgent</option>
          </select>
        </label>
      </div>

      {q.isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Loading…
        </div>
      ) : q.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {(q.error as Error).message}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3 text-sm font-medium text-slate-900">
            Recent routing slips
          </div>
          <div className="overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-medium text-slate-600">
                <tr>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Originating office</th>
                  <th className="px-4 py-2">Reference</th>
                  <th className="px-4 py-2">Priority</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Created</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2">
                      <Link to={`/documents/${d.id}`} className="font-medium text-slate-900">
                        {d.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-slate-700">{d.originating_office}</td>
                    <td className="px-4 py-2 font-mono text-xs text-slate-700">
                      {d.reference_number ?? '—'}
                    </td>
                    <td className="px-4 py-2 text-slate-700">{d.priority}</td>
                    <td className="px-4 py-2 text-slate-700">{d.status}</td>
                    <td className="px-4 py-2 text-slate-600">
                      {new Date(d.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        to={`/print/documents/${d.id}`}
                        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs hover:bg-slate-50"
                      >
                        Preview
                      </Link>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-sm text-slate-600" colSpan={7}>
                      No matching documents.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

