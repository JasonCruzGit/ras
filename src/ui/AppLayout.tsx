import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { NotificationsBell } from './NotificationsBell'

function NavItem(props: { to: string; label: string }) {
  return (
    <NavLink
      to={props.to}
      className={({ isActive }) =>
        [
          'block rounded-md px-3 py-2 text-sm',
          isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100',
        ].join(' ')
      }
    >
      {props.label}
    </NavLink>
  )
}

export function AppLayout() {
  const { signOut, user, profile } = useAuth()
  const nav = useNavigate()

  return (
    <div className="flex h-full">
      <aside className="w-64 border-r border-slate-200 bg-white p-4">
        <Link to="/dashboard" className="block px-2 py-2 text-sm font-semibold text-slate-900">
          Routing Action Slip
        </Link>
        <div className="mt-4 space-y-1">
          <NavItem to="/dashboard" label="Dashboard" />
          <NavItem to="/inbox" label="Inbox" />
          <NavItem to="/documents" label="Documents" />
          <NavItem to="/documents/new" label="New Routing Slip" />
          {profile?.role === 'admin' ? (
            <>
              <div className="pt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Admin
              </div>
              <NavItem to="/admin/departments" label="Departments" />
              <NavItem to="/admin/users" label="Users" />
            </>
          ) : null}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-slate-900">Welcome</div>
            <div className="truncate text-xs text-slate-500">{user?.email}</div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationsBell />
            <button
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
              onClick={async () => {
                await signOut()
                nav('/login')
              }}
            >
              Sign out
            </button>
          </div>
        </header>
        <main className="min-w-0 flex-1 bg-slate-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

