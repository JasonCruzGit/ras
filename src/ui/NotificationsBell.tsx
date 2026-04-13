import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'

type NotificationRow = {
  id: string
  title: string
  body: string | null
  read_at: string | null
  created_at: string
  document_id: string | null
}

export function NotificationsBell() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationRow[]>([])

  const unread = useMemo(() => items.filter((x) => !x.read_at).length, [items])

  async function refresh() {
    if (!user) return
    const { data, error } = await supabase
      .from('notifications')
      .select('id,title,body,read_at,created_at,document_id')
      .order('created_at', { ascending: false })
      .limit(20)
    if (!error && data) setItems(data as NotificationRow[])
  }

  useEffect(() => {
    refresh()
    if (!user) return

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => refresh(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  return (
    <div className="relative">
      <button
        className="relative rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
        onClick={() => {
          setOpen((v) => !v)
          refresh()
        }}
        type="button"
      >
        Notifications
        {unread ? (
          <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 text-xs text-white">
            {unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-96 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-2 text-sm font-medium text-slate-900">
            Recent
          </div>
          <div className="max-h-96 overflow-auto">
            {items.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-600">No notifications.</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.map((n) => (
                  <li key={n.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900">{n.title}</div>
                        {n.body ? (
                          <div className="mt-0.5 text-sm text-slate-600">{n.body}</div>
                        ) : null}
                        <div className="mt-1 text-xs text-slate-500">
                          {new Date(n.created_at).toLocaleString()}
                        </div>
                      </div>
                      {!n.read_at ? (
                        <span className="mt-1 inline-block h-2 w-2 rounded-full bg-slate-900" />
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

