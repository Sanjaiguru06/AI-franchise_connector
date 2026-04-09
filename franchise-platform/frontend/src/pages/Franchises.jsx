import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { franchiseAPI, seekerAPI, aiAPI } from '../api'
import { FranchiseCard, Spinner, Empty, ScoreRing } from '../components/UI'
import { fmt, CATEGORY_META, ZONES } from '../utils/helpers'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { SlidersHorizontal, X, GitCompare } from 'lucide-react'

export default function Franchises() {
  const [franchises, setFranchises] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(new Set())
  const [compareList, setCompareList] = useState([])
  const [comparing, setComparing] = useState(false)
  const [compareResult, setCompareResult] = useState(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, isSeeker } = useAuth()

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    zone: '', budgetMin: '', budgetMax: '',
    beginner: false, royalty: '', brand: '', search: ''
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: 12 }
      if (filters.category) params.category = filters.category
      if (filters.zone) params.zone = filters.zone
      if (filters.budgetMin) params.budgetMin = filters.budgetMin
      if (filters.budgetMax) params.budgetMax = filters.budgetMax
      if (filters.beginner) params.beginner = true
      if (filters.royalty) params.royalty = filters.royalty
      if (filters.brand) params.brand = filters.brand
      if (filters.search) params.search = filters.search

      const { data } = await franchiseAPI.getAll(params)
      setFranchises(data.franchises)
      setTotal(data.total)
      setPages(data.pages)
    } catch { toast.error('Failed to load franchises') }
    finally { setLoading(false) }
  }, [filters, page])

  useEffect(() => { load() }, [load])

  // Load saved IDs for the logged-in seeker
  useEffect(() => {
    if (isSeeker) {
      seekerAPI.getSaved().then(({ data }) => {
        setSaved(new Set(data.saved.map(f => f._id)))
      }).catch(() => {})
    }
  }, [isSeeker])

  const handleSave = async (id) => {
    if (!user) { navigate('/login'); return }
    try {
      if (saved.has(id)) {
        await seekerAPI.unsave(id)
        setSaved(s => { const n = new Set(s); n.delete(id); return n })
        toast('Removed from saved')
      } else {
        await seekerAPI.save(id)
        setSaved(s => new Set(s).add(id))
        toast.success('Franchise saved!')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error')
    }
  }

  const toggleCompare = (id) => {
    setCompareList(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= 2) { toast('You can only compare 2 at a time'); return prev }
      return [...prev, id]
    })
  }

  const runCompare = async () => {
    if (compareList.length < 2) { toast.error('Select 2 franchises to compare'); return }
    if (!user) { navigate('/login'); return }
    setComparing(true)
    try {
      const { data } = await aiAPI.compare(compareList[0], compareList[1], user?.seekerProfile)
      setCompareResult(data)
    } catch { toast.error('Compare failed') }
    finally { setComparing(false) }
  }

  const setFilter = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1) }
  const clearFilters = () => { setFilters({ category: '', zone: '', budgetMin: '', budgetMax: '', beginner: false, royalty: '', brand: '', search: '' }); setPage(1) }
  const activeCount = Object.values(filters).filter(v => v && v !== false).length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Browse Franchises</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} franchises in Chennai</p>
        </div>
        <button onClick={() => setFiltersOpen(v => !v)}
          className={`flex items-center gap-2 btn-secondary ${activeCount > 0 ? 'border-brand-400 text-brand-600' : ''}`}>
          <SlidersHorizontal size={16} />
          Filters {activeCount > 0 && <span className="bg-brand-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{activeCount}</span>}
        </button>
      </div>

      {/* Search bar */}
      <div className="relative mb-5">
        <input value={filters.search} onChange={e => setFilter('search', e.target.value)}
          className="input pl-10" placeholder="Search franchise name or category..." />
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
      </div>

      {/* Category quick filter */}
      <div className="flex gap-2 flex-wrap mb-5">
        <button onClick={() => setFilter('category', '')}
          className={`badge cursor-pointer px-3 py-1.5 text-xs font-medium transition-colors ${!filters.category ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          All
        </button>
        {Object.entries(CATEGORY_META).slice(0, 6).map(([cat, meta]) => (
          <button key={cat} onClick={() => setFilter('category', filters.category === cat ? '' : cat)}
            className={`badge cursor-pointer px-3 py-1.5 text-xs font-medium transition-colors ${filters.category === cat ? 'bg-brand-600 text-white' : `${meta.color} hover:opacity-80`}`}>
            {meta.icon} {cat}
          </button>
        ))}
      </div>

      {/* Expanded filters panel */}
      {filtersOpen && (
        <div className="card p-5 mb-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">Zone</label>
            <select value={filters.zone} onChange={e => setFilter('zone', e.target.value)} className="input text-sm">
              <option value="">All zones</option>
              {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">Budget max (Lakhs)</label>
            <input type="number" value={filters.budgetMax} onChange={e => setFilter('budgetMax', e.target.value)}
              className="input text-sm" placeholder="e.g. 25" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">Royalty level</label>
            <select value={filters.royalty} onChange={e => setFilter('royalty', e.target.value)} className="input text-sm">
              <option value="">Any</option>
              <option value="none">No royalty</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">Brand type</label>
            <select value={filters.brand} onChange={e => setFilter('brand', e.target.value)} className="input text-sm">
              <option value="">Any</option>
              {['Local','Regional','National','International'].map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 col-span-full">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={filters.beginner} onChange={e => setFilter('beginner', e.target.checked)}
                className="rounded" />
              <span className="text-sm text-gray-700">Show beginner-friendly only</span>
            </label>
            {activeCount > 0 && (
              <button onClick={clearFilters} className="ml-auto text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                <X size={12} /> Clear all filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Compare bar */}
      {compareList.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <div className="bg-gray-900 text-white rounded-2xl shadow-elevated px-5 py-3.5 flex items-center gap-4">
            <GitCompare size={18} className="text-brand-300" />
            <span className="text-sm font-medium">{compareList.length} selected{compareList.length < 2 ? ' — pick one more' : ''}</span>
            <button onClick={() => setCompareList([])} className="text-gray-400 hover:text-white">
              <X size={14} />
            </button>
            {compareList.length === 2 && (
              <button onClick={runCompare} disabled={comparing}
                className="bg-brand-500 hover:bg-brand-400 text-white text-sm font-semibold px-4 py-1.5 rounded-xl transition-colors flex items-center gap-2">
                {comparing ? <Spinner size="sm" /> : 'Compare with AI →'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* AI Compare result */}
      {compareResult && (
        <div className="card p-6 mb-6 border-l-4 border-brand-500">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🤖</span>
                <span className="font-semibold text-gray-900">AI Comparison</span>
                {compareResult.comparison?.winner !== 'Tie' && (
                  <span className="badge bg-emerald-50 text-emerald-700">
                    Winner: {compareResult.comparison?.winnerName}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 mb-3">{compareResult.comparison?.summary}</p>
              <div className="grid sm:grid-cols-2 gap-3 mb-3">
                <div className="bg-brand-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-brand-700 mb-1">{compareResult.franchiseA?.name} strengths</p>
                  {compareResult.comparison?.aStrengths?.map((s, i) => (
                    <p key={i} className="text-xs text-gray-600">• {s}</p>
                  ))}
                </div>
                <div className="bg-purple-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-purple-700 mb-1">{compareResult.franchiseB?.name} strengths</p>
                  {compareResult.comparison?.bStrengths?.map((s, i) => (
                    <p key={i} className="text-xs text-gray-600">• {s}</p>
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-600 italic">"{compareResult.comparison?.recommendation}"</p>
            </div>
            <button onClick={() => { setCompareResult(null); setCompareList([]) }} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : franchises.length === 0 ? (
        <Empty icon="🔍" title="No franchises found" desc="Try adjusting your filters or budget range."
          action={<button onClick={clearFilters} className="btn-secondary">Clear filters</button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {franchises.map(f => (
            <FranchiseCard
              key={f._id}
              franchise={f}
              compareList={compareList}
              onCompare={toggleCompare}
              onClick={(id) => navigate(`/franchises/${id}`)}
              onSave={isSeeker ? handleSave : null}
              saved={saved.has(f._id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">← Prev</button>
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${p === page ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {p}
            </button>
          ))}
          <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  )
}
