import { useQuery } from '@tanstack/react-query'
import { listDocuments } from '../api/documents'

export function DashboardPage() {
  const q = useQuery({ queryKey: ['documents'], queryFn: listDocuments })
  const docs = q.data ?? []
  const total = docs.length
  const pending = docs.filter((d) => d.status === 'pending' || d.status === 'in_progress').length
  const completed = docs.filter((d) => d.status === 'completed').length

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold text-slate-900">Dashboard</div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {[
          { label: 'Total documents', value: q.isLoading ? '…' : String(total) },
          { label: 'Pending / in progress', value: q.isLoading ? '…' : String(pending) },
          { label: 'Completed', value: q.isLoading ? '…' : String(completed) },
          { label: 'Recent activity', value: q.isLoading ? '…' : String(Math.min(10, total)) },
        ].map((x) => (
          <div key={x.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-medium text-slate-600">{x.label}</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{x.value}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-medium text-slate-900">Next</div>
        <div className="mt-1 text-sm text-slate-600">
          Next up: routing workflow (assign to users/departments), actions (approve/reject/forward),
          timeline view, and printable action slip PDF.
        </div>
      </div>
    </div>
  )
}

