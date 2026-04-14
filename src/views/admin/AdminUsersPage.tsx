import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listDepartments, listProfiles, updateProfile } from '../../api/directory'

export function AdminUsersPage() {
  const qc = useQueryClient()
  const deps = useQuery({ queryKey: ['departments'], queryFn: listDepartments })
  const users = useQuery({ queryKey: ['profiles'], queryFn: listProfiles })
  const list = users.data ?? []

  const update = useMutation({
    mutationFn: updateProfile,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['profiles'] })
    },
  })

  const depOptions = deps.data ?? []

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold text-slate-900">Users</div>
        <div className="text-sm text-slate-600">Assign roles and departments.</div>
      </div>

      {users.isLoading || deps.isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Loading…
        </div>
      ) : users.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {(users.error as Error).message}
        </div>
      ) : deps.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {(deps.error as Error).message}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3 text-sm font-medium text-slate-900">
            Directory
          </div>
          <div className="overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-medium text-slate-600">
                <tr>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Display name</th>
                  <th className="px-4 py-2">Role</th>
                  <th className="px-4 py-2">Department</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((u) => (
                  <tr key={u.user_id}>
                    <td className="px-4 py-2">
                      <input
                        className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                        type="email"
                        value={u.email ?? ''}
                        onChange={(e) =>
                          update.mutate({ user_id: u.user_id, email: e.target.value || null })
                        }
                        placeholder="login@example.com"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                        value={u.display_name ?? ''}
                        onChange={(e) =>
                          update.mutate({ user_id: u.user_id, display_name: e.target.value })
                        }
                        placeholder="(name)"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                        value={u.role}
                        onChange={(e) =>
                          update.mutate({ user_id: u.user_id, role: e.target.value as any })
                        }
                      >
                        <option value="staff">staff</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <select
                        className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                        value={u.department_id ?? ''}
                        onChange={(e) =>
                          update.mutate({
                            user_id: u.user_id,
                            department_id: e.target.value ? e.target.value : null,
                          })
                        }
                      >
                        <option value="">(none)</option>
                        {depOptions.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {list.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-sm text-slate-600" colSpan={4}>
                      No profiles found. Create users in Supabase Auth, then insert profiles rows.
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

