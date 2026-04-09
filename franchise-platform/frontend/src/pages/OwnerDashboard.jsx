import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ownerAPI, franchiseAPI } from '../api'
import { Spinner, Empty, StatCard } from '../components/UI'
import { fmt, CATEGORY_META } from '../utils/helpers'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Plus, Eye, MessageSquare, TrendingUp } from 'lucide-react'

export default function OwnerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [listings, setListings] = useState([])
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('listings')
  const [replyState, setReplyState] = useState({})
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    Promise.all([ownerAPI.getStats(), ownerAPI.getListings(), ownerAPI.getInquiries()])
      .then(([s, l, i]) => { setStats(s.data.stats); setListings(l.data.franchises); setInquiries(i.data.inquiries) })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  const sendReply = async (inquiryId) => {
    const reply = replyState[inquiryId]
    if (!reply?.trim()) return
    try {
      await ownerAPI.replyInquiry(inquiryId, reply)
      setInquiries(prev => prev.map(i => i._id === inquiryId ? { ...i, status: 'responded', ownerReply: reply } : i))
      toast.success('Reply sent!')
      setReplyState(s => ({ ...s, [inquiryId]: '' }))
    } catch { toast.error('Failed to send reply') }
  }

  // Simple franchise submission form state
  const [form, setForm] = useState({
    name: '', category: 'Tea & Coffee', brandType: 'Regional',
    description: '', investmentMin: '', investmentMax: '',
    franchiseFeeMin: '', royaltyLevel: 'low',
    outletFormat: '', minArea: '', zones: [],
    staffRequired: '', trainingProvided: true, beginnerFriendly: false,
    operationalComplexity: 'medium', monthlyRevenueMin: '', monthlyRevenueMax: '',
    breakevenMin: '', breakevenMax: '', contactEmail: '', contactPhone: '',
  })

  const submitListing = async (e) => {
    e.preventDefault()
    try {
      await franchiseAPI.create({
        ...form,
        investment: { min: Number(form.investmentMin), max: Number(form.investmentMax) },
        franchiseFee: { min: Number(form.franchiseFeeMin), max: Number(form.franchiseFeeMin) },
        monthlyRevenue: { min: Number(form.monthlyRevenueMin) * 100000, max: Number(form.monthlyRevenueMax) * 100000 },
        breakevenMonths: { min: Number(form.breakevenMin), max: Number(form.breakevenMax) },
        zones: form.zones,
      })
      toast.success('Franchise submitted for review!')
      setShowForm(false)
      const { data } = await ownerAPI.getListings()
      setListings(data.franchises)
    } catch (err) { toast.error(err.response?.data?.message || 'Submission failed') }
  }

  const setF = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 page-enter">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Owner Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">{user?.name} · {user?.ownerProfile?.businessName || 'Franchise Owner'}</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> List Franchise
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<TrendingUp size={16} />} label="Total listings" value={stats.totalListings} color="bg-brand-50 text-brand-600" />
          <StatCard icon="✅" label="Active" value={stats.activeListings} color="bg-emerald-50 text-emerald-600" />
          <StatCard icon={<Eye size={16} />} label="Total views" value={stats.totalViews} color="bg-blue-50 text-blue-600" />
          <StatCard icon={<MessageSquare size={16} />} label="Inquiries" value={stats.totalInquiries} color="bg-amber-50 text-amber-600" />
        </div>
      )}

      {/* New listing form */}
      {showForm && (
        <div className="card p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-5">Submit a new franchise listing</h3>
          <form onSubmit={submitListing} className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Franchise name *</label>
              <input required value={form.name} onChange={setF('name')} className="input" placeholder="e.g. My Tea Brand" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
              <select value={form.category} onChange={setF('category')} className="input text-sm">
                {Object.keys(CATEGORY_META).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Brand type</label>
              <select value={form.brandType} onChange={setF('brandType')} className="input text-sm">
                {['Local','Regional','National','International'].map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
              <textarea required rows={3} value={form.description} onChange={setF('description')} className="input resize-none"
                placeholder="What makes this franchise unique?" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Investment min (Lakhs) *</label>
              <input type="number" required value={form.investmentMin} onChange={setF('investmentMin')} className="input" placeholder="e.g. 5" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Investment max (Lakhs) *</label>
              <input type="number" required value={form.investmentMax} onChange={setF('investmentMax')} className="input" placeholder="e.g. 15" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Franchise fee (Lakhs)</label>
              <input type="number" value={form.franchiseFeeMin} onChange={setF('franchiseFeeMin')} className="input" placeholder="e.g. 2" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Royalty level</label>
              <select value={form.royaltyLevel} onChange={setF('royaltyLevel')} className="input text-sm">
                {['none','low','medium','high'].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Min area (sq.ft)</label>
              <input type="number" value={form.minArea} onChange={setF('minArea')} className="input" placeholder="e.g. 200" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Staff required</label>
              <input value={form.staffRequired} onChange={setF('staffRequired')} className="input" placeholder="e.g. 2-4" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Monthly revenue min (Lakhs)</label>
              <input type="number" value={form.monthlyRevenueMin} onChange={setF('monthlyRevenueMin')} className="input" placeholder="e.g. 2" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Monthly revenue max (Lakhs)</label>
              <input type="number" value={form.monthlyRevenueMax} onChange={setF('monthlyRevenueMax')} className="input" placeholder="e.g. 5" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Breakeven min (months)</label>
              <input type="number" value={form.breakevenMin} onChange={setF('breakevenMin')} className="input" placeholder="e.g. 12" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Breakeven max (months)</label>
              <input type="number" value={form.breakevenMax} onChange={setF('breakevenMax')} className="input" placeholder="e.g. 24" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contact email</label>
              <input type="email" value={form.contactEmail} onChange={setF('contactEmail')} className="input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contact phone</label>
              <input value={form.contactPhone} onChange={setF('contactPhone')} className="input" />
            </div>
            <div className="sm:col-span-2 flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={form.trainingProvided} onChange={e => setForm(f => ({ ...f, trainingProvided: e.target.checked }))} />
                Training provided
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={form.beginnerFriendly} onChange={e => setForm(f => ({ ...f, beginnerFriendly: e.target.checked }))} />
                Beginner friendly
              </label>
            </div>
            <div className="sm:col-span-2 flex gap-3 pt-2">
              <button type="submit" className="btn-primary">Submit for review</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 w-fit">
        {[['listings', `My Listings (${listings.length})`], ['inquiries', `Inquiries (${inquiries.length})`]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id ? 'bg-white shadow-sm text-brand-700' : 'text-gray-500 hover:text-gray-700'
            }`}>{label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : tab === 'listings' ? (
        listings.length === 0 ? (
          <Empty icon="🏪" title="No listings yet"
            desc="List your first franchise to start receiving inquiries"
            action={<button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2"><Plus size={15} /> Add listing</button>} />
        ) : (
          <div className="space-y-3">
            {listings.map(f => {
              const meta = CATEGORY_META[f.category] || {}
              return (
                <div key={f._id} className="card p-4 flex items-center gap-4">
                  <div className="flex-1 cursor-pointer" onClick={() => navigate(`/franchises/${f._id}`)}>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`badge ${meta.color} text-xs`}>{meta.icon} {f.category}</span>
                      <span className={`badge text-xs ${f.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {f.status}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm">{f.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{fmt.range(f.investment.min, f.investment.max)} · {f.views || 0} views · {f.inquiryCount || 0} inquiries</p>
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        inquiries.length === 0 ? (
          <Empty icon="📭" title="No inquiries yet" desc="Inquiries from interested franchise seekers will appear here" />
        ) : (
          <div className="space-y-4">
            {inquiries.map(inq => (
              <div key={inq._id} className="card p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{inq.seeker?.name}</p>
                    <p className="text-xs text-gray-500">{inq.seeker?.email} · {inq.seeker?.phone || inq.phone}</p>
                  </div>
                  <div className="text-right">
                    <span className={`badge text-xs ${inq.status === 'responded' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {inq.status}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">{new Date(inq.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 mb-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">About: {inq.franchise?.name}</p>
                  <p className="text-sm text-gray-700">{inq.message}</p>
                </div>
                {inq.ownerReply ? (
                  <div className="bg-emerald-50 rounded-xl p-3">
                    <p className="text-xs font-medium text-emerald-700 mb-1">Your reply:</p>
                    <p className="text-sm text-emerald-800">{inq.ownerReply}</p>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={replyState[inq._id] || ''}
                      onChange={e => setReplyState(s => ({ ...s, [inq._id]: e.target.value }))}
                      className="input flex-1 text-sm"
                      placeholder="Type your reply..."
                      onKeyDown={e => e.key === 'Enter' && sendReply(inq._id)}
                    />
                    <button onClick={() => sendReply(inq._id)} className="btn-primary text-sm px-4">Reply</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
