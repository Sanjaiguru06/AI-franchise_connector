import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Spinner } from '../components/UI'
import toast from 'react-hot-toast'

// ── LOGIN ──
export function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      navigate(user.role === 'owner' ? '/owner/dashboard' : '/seeker/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="card w-full max-w-md p-8 page-enter">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">F</div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your FranchiseIQ account</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="input" placeholder="you@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input type="password" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="input" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
            {loading ? <Spinner size="sm" /> : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-600 font-medium hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  )
}

// ── REGISTER ──
export function Register() {
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    role: searchParams.get('role') || 'seeker'
  })
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try {
      const user = await register(form)
      navigate(user.role === 'owner' ? '/owner/dashboard' : '/discover')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally { setLoading(false) }
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="card w-full max-w-md p-8 page-enter">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">F</div>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 text-sm mt-1">Join FranchiseIQ — free to start</p>
        </div>

        {/* Role toggle */}
        <div className="flex rounded-xl border border-gray-200 p-1 mb-6 bg-gray-50">
          {[['seeker', '🔍 I want a franchise'], ['owner', '🏪 I own a franchise']].map(([r, l]) => (
            <button key={r} type="button"
              onClick={() => setForm(f => ({ ...f, role: r }))}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                form.role === r ? 'bg-white shadow-sm text-brand-700' : 'text-gray-500 hover:text-gray-700'
              }`}>{l}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
            <input required value={form.name} onChange={set('name')} className="input" placeholder="Ravi Kumar" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input type="email" required value={form.email} onChange={set('email')} className="input" placeholder="you@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone <span className="text-gray-400">(optional)</span></label>
            <input value={form.phone} onChange={set('phone')} className="input" placeholder="+91 98765 43210" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input type="password" required value={form.password} onChange={set('password')} className="input" placeholder="Min 6 characters" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
            {loading ? <Spinner size="sm" /> : `Create ${form.role === 'owner' ? 'owner' : 'seeker'} account`}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
