import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Menu, X, Search, LayoutDashboard, LogOut, ChevronDown } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)

  const navLinks = [
    { to: '/franchises', label: 'Browse' },
    { to: '/discover', label: 'Find My Match' },
  ]

  const active = (to) => location.pathname.startsWith(to)
    ? 'text-brand-600 font-semibold' : 'text-gray-600 hover:text-gray-900'

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">F</div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">FranchiseIQ</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(l => (
              <Link key={l.to} to={l.to} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${active(l.to)}`}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropOpen(v => !v)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-xs">
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user.name.split(' ')[0]}</span>
                  <ChevronDown size={14} className="text-gray-400" />
                </button>
                {dropOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-2xl shadow-elevated border border-gray-100 overflow-hidden py-1 z-50">
                    <Link
                      to={user.role === 'owner' ? '/owner/dashboard' : '/seeker/dashboard'}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setDropOpen(false)}
                    >
                      <LayoutDashboard size={15} className="text-gray-400" />
                      Dashboard
                    </Link>
                    <button
                      onClick={() => { logout(); setDropOpen(false); navigate('/') }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
                    >
                      <LogOut size={15} />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">Sign in</Link>
                <Link to="/register" className="btn-primary">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button onClick={() => setOpen(v => !v)} className="md:hidden p-2 rounded-xl hover:bg-gray-100">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-2 space-y-1">
          {navLinks.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
              {l.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-gray-100 space-y-1">
            {user ? (
              <>
                <Link to={user.role === 'owner' ? '/owner/dashboard' : '/seeker/dashboard'}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Dashboard
                </Link>
                <button onClick={() => { logout(); setOpen(false); navigate('/') }}
                  className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Sign in</Link>
                <Link to="/register" onClick={() => setOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-sm font-medium text-brand-600 hover:bg-brand-50">Get Started →</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
