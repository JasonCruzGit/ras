import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { createDepartment, listDepartments } from '../../api/directory'

export function AdminDepartmentsPage() {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['departments'], queryFn: listDepartments })
  const departments = q.data ?? []
  const [name, setName] = useState('')

  const create = useMutation({
    mutationFn: async () => createDepartment(name.trim()),
    onSuccess: async () => {
      setName('')
      await qc.invalidateQueries({ queryKey: ['departments'] })
    },
  })

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold text-slate-900">Departments</div>
        <div className="text-sm text-slate-600">Manage departments used for routing.</div>
      </div>

      <form
        className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim()) return
          create.mutate()
        }}
      >
        <label className="flex-1">
          <div className="text-xs font-medium text-slate-700">New department</div>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Finance"
          />
        </label>
        <button
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          disabled={create.isPending}
          type="submit"
        >
          {create.isPending ? 'Adding…' : 'Add'}
        </button>
      </form>

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
            All departments
          </div>
          <ul className="divide-y divide-slate-100">
            {departments.map((d) => (
              <li key={d.id} className="px-4 py-3 text-sm text-slate-900">
                {d.name}
              </li>
            ))}
            {departments.length === 0 ? (
              <li className="px-4 py-6 text-sm text-slate-600">No departments yet.</li>
            ) : null}
          </ul>
        </div>
      )}
    </div>
  )
}

