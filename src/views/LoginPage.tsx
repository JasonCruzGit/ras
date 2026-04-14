import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type Mode = 'signin' | 'signup'

export function LoginPage() {
  const nav = useNavigate()
  const loc = useLocation()
  const from = (loc.state as { from?: string } | null)?.from ?? '/dashboard'

  const [mode, setMode] = useState<Mode>('signin')

  // sign-in fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // sign-up fields
  const [suEmail, setSuEmail] = useState('')
  const [suPassword, setSuPassword] = useState('')
  const [suConfirm, setSuConfirm] = useState('')
  const [suName, setSuName] = useState('')
  const [suDeptName, setSuDeptName] = useState('')
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([])
  const [suDeptId, setSuDeptId] = useState<string>('__new__')

  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // load departments for sign-up dropdown
  useEffect(() => {
    if (mode !== 'signup') return
    supabase
      .from('departments')
      .select('id,name')
      .order('name')
      .then(({ data }) => {
        if (data) setDepartments(data)
      })
  }, [mode])

  function switchMode(m: Mode) {
    setMode(m)
    setError(null)
    setInfo(null)
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) return setError(err.message)
    nav(from, { replace: true })
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (suPassword !== suConfirm) return setError('Passwords do not match.')
    if (suPassword.length < 6) return setError('Password must be at least 6 characters.')
    const name = suName.trim()
    const deptName = suDeptName.trim()
    if (!name) return setError('Please enter your name.')
    if (suDeptId === '__new__' && !deptName)
      return setError('Enter a department name or select an existing one.')

    setLoading(true)

    // 1. Sign up the user
    const { data: signupData, error: signupErr } = await supabase.auth.signUp({
      email: suEmail,
      password: suPassword,
    })
    if (signupErr || !signupData.user) {
      setLoading(false)
      return setError(signupErr?.message ?? 'Sign-up failed.')
    }
    const uid = signupData.user.id

    // 2. Resolve / create department
    let deptId: string | null = null
    if (suDeptId !== '__new__') {
      deptId = suDeptId
    } else {
      // Try to match an existing dept first (case-insensitive)
      const { data: existing } = await supabase
        .from('departments')
        .select('id')
        .ilike('name', deptName)
        .maybeSingle()
      if (existing) {
        deptId = existing.id
      } else {
        const { data: created, error: deptErr } = await supabase
          .from('departments')
          .insert({ name: deptName })
          .select('id')
          .single()
        if (deptErr) {
          setLoading(false)
          return setError('Could not create department: ' + deptErr.message)
        }
        deptId = created.id
      }
    }

    // 3. Upsert profile (profile_trigger may have already created a stub row)
    const { error: profErr } = await supabase.from('profiles').upsert({
      user_id: uid,
      display_name: name,
      email: suEmail,
      role: 'staff',
      department_id: deptId,
    })
    if (profErr) {
      setLoading(false)
      return setError('Account created but profile save failed: ' + profErr.message)
    }

    setLoading(false)
    setInfo(
      'Account created! ' +
        (signupData.session
          ? 'You are now signed in.'
          : 'Check your email to confirm your account, then sign in.'),
    )
    if (signupData.session) {
      nav(from, { replace: true })
    } else {
      switchMode('signin')
      setSuEmail('')
      setSuPassword('')
      setSuConfirm('')
      setSuName('')
      setSuDeptName('')
      setSuDeptId('__new__')
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Tabs */}
        <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1 gap-1 mb-6">
          <button
            type="button"
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              mode === 'signin'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => switchMode('signin')}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              mode === 'signup'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => switchMode('signup')}
          >
            Sign up
          </button>
        </div>

        {mode === 'signin' ? (
          <>
            <div className="text-lg font-semibold text-slate-900">Sign in</div>
            <div className="mt-1 text-sm text-slate-600">Routing Action Slip System</div>

            <form className="mt-5 space-y-3" onSubmit={handleSignIn}>
              <label className="block">
                <div className="text-xs font-medium text-slate-700">Email</div>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  required
                />
              </label>

              <label className="block">
                <div className="text-xs font-medium text-slate-700">Password</div>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </label>

              {error ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              ) : null}
              {info ? (
                <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  {info}
                </div>
              ) : null}

              <button
                className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                disabled={loading}
                type="submit"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="text-lg font-semibold text-slate-900">Create account</div>
            <div className="mt-1 text-sm text-slate-600">Routing Action Slip System</div>

            <form className="mt-5 space-y-3" onSubmit={handleSignUp}>
              <label className="block">
                <div className="text-xs font-medium text-slate-700">Full name</div>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
                  value={suName}
                  onChange={(e) => setSuName(e.target.value)}
                  placeholder="e.g. Juan dela Cruz"
                  autoComplete="name"
                  required
                />
              </label>

              <label className="block">
                <div className="text-xs font-medium text-slate-700">Email</div>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
                  value={suEmail}
                  onChange={(e) => setSuEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  required
                />
              </label>

              <div className="block">
                <div className="text-xs font-medium text-slate-700">Department</div>
                {departments.length > 0 ? (
                  <>
                    <select
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      value={suDeptId}
                      onChange={(e) => setSuDeptId(e.target.value)}
                    >
                      <option value="__new__">+ Type a new department name below</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    {suDeptId === '__new__' && (
                      <input
                        className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        value={suDeptName}
                        onChange={(e) => setSuDeptName(e.target.value)}
                        placeholder="New department name"
                      />
                    )}
                  </>
                ) : (
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
                    value={suDeptName}
                    onChange={(e) => setSuDeptName(e.target.value)}
                    placeholder="e.g. FLIGHT INFORMATION DISPLAY SYSTEM"
                    required
                  />
                )}
              </div>

              <label className="block">
                <div className="text-xs font-medium text-slate-700">Password</div>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
                  value={suPassword}
                  onChange={(e) => setSuPassword(e.target.value)}
                  type="password"
                  autoComplete="new-password"
                  required
                />
              </label>

              <label className="block">
                <div className="text-xs font-medium text-slate-700">Confirm password</div>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
                  value={suConfirm}
                  onChange={(e) => setSuConfirm(e.target.value)}
                  type="password"
                  autoComplete="new-password"
                  required
                />
              </label>

              {error ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              ) : null}
              {info ? (
                <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  {info}
                </div>
              ) : null}

              <button
                className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                disabled={loading}
                type="submit"
              >
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
