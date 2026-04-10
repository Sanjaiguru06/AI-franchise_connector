import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { seekerAPI } from '../api'
import { ScoreRing, Spinner, Empty, StatCard } from '../components/UI'
import { fmt, CATEGORY_META } from '../utils/helpers'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Heart, MessageCircle, Zap } from 'lucide-react'

export default function SeekerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [saved, setSaved] = useState([])
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('saved')

  useEffect(() => {
    Promise.all([seekerAPI.getSaved(), seekerAPI.getInquiries()])
      .then(([s, i]) => { setSaved(s.data.saved); setInquiries(i.data.inquiries) })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  const unsave = async (id) => {
    await seekerAPI.unsave(id)
    setSaved(s => s.filter(f => f._id !== id))
    toast('Removed from saved')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 page-enter">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-gray-500 text-sm mt-1">Track your saved franchises and inquiry status</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon="♥" label="Saved franchises" value={saved.length} color="bg-pink-50 text-pink-600" />
        <StatCard icon="📩" label="Inquiries sent" value={inquiries.length} color="bg-blue-50 text-blue-600" />
        <StatCard icon="🔍" label="AI match ready" value={user?.seekerProfile?.quizCompleted ? 'Done' : 'Take quiz'} color="bg-brand-50 text-brand-600" />
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 gap-3 mb-8">
        <Link to="/discover"
          className="card p-4 flex items-center gap-4 hover:shadow-elevated transition-shadow group">
          <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center text-brand-600">
            <Zap size={18} />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Find my match</p>
            <p className="text-xs text-gray-500">AI-powered 6-question quiz</p>
          </div>
          <span className="ml-auto text-gray-300 group-hover:text-brand-500 transition-colors">→</span>
        </Link>
        <Link to="/franchises"
          className="card p-4 flex items-center gap-4 hover:shadow-elevated transition-shadow group">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600">
            🏪
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Browse all franchises</p>
            <p className="text-xs text-gray-500">138 options, filter by budget & zone</p>
          </div>
          <span className="ml-auto text-gray-300 group-hover:text-brand-500 transition-colors">→</span>
        </Link>
      </div>

      {/* Last AI result */}
      {user?.seekerProfile?.quizCompleted && (
        <div className="card p-5 mb-8 bg-brand-50 border border-brand-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🤖</span>
            <p className="font-semibold text-gray-900 text-sm">Your last AI match</p>
          </div>
          <p className="text-sm text-gray-600">
            Budget: <strong>{fmt.range(user.seekerProfile.budget?.min, user.seekerProfile.budget?.max)}</strong> ·
            Experience: <strong className="capitalize ml-1">{user.seekerProfile.experience}</strong> ·
            Risk: <strong className="capitalize ml-1">{user.seekerProfile.riskTolerance}</strong>
          </p>
          <Link to="/discover" className="text-sm text-brand-600 font-medium hover:underline mt-2 inline-block">
            Redo quiz with updated preferences →
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 w-fit">
        {[['saved', `♥ Saved (${saved.length})`], ['inquiries', `📩 Inquiries (${inquiries.length})`]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id ? 'bg-white shadow-sm text-brand-700' : 'text-gray-500 hover:text-gray-700'
            }`}>{label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : tab === 'saved' ? (
        saved.length === 0 ? (
          <Empty icon="♡" title="No saved franchises yet"
            desc="Browse franchises and tap ♡ to save ones you like"
            action={<Link to="/franchises" className="btn-primary">Browse franchises →</Link>} />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {saved.map(f => {
              const meta = CATEGORY_META[f.category] || {}
              return (
                <div key={f._id} className="card p-4 flex gap-3 hover:shadow-elevated transition-shadow">
                  <div className="flex-1 cursor-pointer" onClick={() => navigate(`/franchises/${f._id}`)}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge ${meta.color} text-xs`}>{meta.icon} {f.category}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm">{f.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{fmt.range(f.investment?.min, f.investment?.max)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <ScoreRing score={f.viabilityScore} size={44} />
                    <button onClick={() => unsave(f._id)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        inquiries.length === 0 ? (
          <Empty icon="📭" title="No inquiries sent yet"
            desc="Found a franchise you like? Click Contact to send an inquiry"
            action={<Link to="/franchises" className="btn-primary">Browse franchises →</Link>} />
        ) : (
          <div className="space-y-3">
            {inquiries.map(inq => {
              const meta = CATEGORY_META[inq.franchise?.category] || {}
              return (
                <div key={inq._id} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`badge ${meta.color} text-xs`}>{meta.icon} {inq.franchise?.category}</span>
                        <span className={`badge text-xs ${inq.status === 'responded' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                          {inq.status}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm">{inq.franchise?.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{inq.message}</p>
                      {inq.ownerReply && (
                        <div className="mt-2 bg-emerald-50 rounded-lg p-2">
                          <p className="text-xs text-emerald-800 font-medium">Owner replied:</p>
                          <p className="text-xs text-emerald-700 mt-0.5">{inq.ownerReply}</p>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{new Date(inq.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}
