export const fmt = {
  lakhs: (n) => n === 0 ? 'Included' : `₹${n}L`,
  range: (min, max) => min === max ? fmt.lakhs(min) : `₹${min}–${max}L`,
  revenue: (min, max) => {
    const f = (n) => n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : `₹${(n/1000).toFixed(0)}K`
    return min === max ? f(max) : `${f(min)}–${f(max)}`
  },
  months: (min, max) => min === max ? `${min}m` : `${min}–${max} months`,
  score: (n) => {
    if (n >= 70) return { label: 'Safe', color: 'text-emerald-600', bg: 'bg-emerald-50', ring: '#10b981' }
    if (n >= 50) return { label: 'Moderate', color: 'text-amber-600', bg: 'bg-amber-50', ring: '#f59e0b' }
    return { label: 'High Risk', color: 'text-red-500', bg: 'bg-red-50', ring: '#ef4444' }
  },
  royalty: (level) => {
    const map = { none: { label: 'No Royalty', cls: 'bg-emerald-50 text-emerald-700' }, low: { label: 'Low Royalty', cls: 'bg-blue-50 text-blue-700' }, medium: { label: 'Medium Royalty', cls: 'bg-amber-50 text-amber-700' }, high: { label: 'High Royalty', cls: 'bg-red-50 text-red-700' } }
    return map[level] || map.low
  },
  brand: (b) => {
    const map = { National: 'bg-purple-50 text-purple-700', Regional: 'bg-teal-50 text-teal-700', Local: 'bg-gray-100 text-gray-700', International: 'bg-indigo-50 text-indigo-700' }
    return map[b] || map.Regional
  }
}

export const CATEGORY_META = {
  'Tea & Coffee':    { icon: '☕', color: 'bg-amber-50 text-amber-700', border: 'border-amber-200' },
  'Shawarma & BBQ':  { icon: '🌯', color: 'bg-orange-50 text-orange-700', border: 'border-orange-200' },
  'Biryani':         { icon: '🍛', color: 'bg-red-50 text-red-700', border: 'border-red-200' },
  'Pharmacy':        { icon: '💊', color: 'bg-blue-50 text-blue-700', border: 'border-blue-200' },
  'Salon':           { icon: '✂️', color: 'bg-pink-50 text-pink-700', border: 'border-pink-200' },
  'Car Care':        { icon: '🚗', color: 'bg-slate-50 text-slate-700', border: 'border-slate-200' },
  'Laundry':         { icon: '🧺', color: 'bg-cyan-50 text-cyan-700', border: 'border-cyan-200' },
  'Other':           { icon: '🏪', color: 'bg-gray-50 text-gray-700', border: 'border-gray-200' },
}

export const ZONES = [
  'South Chennai', 'Central Chennai', 'North Chennai',
  'West Chennai', 'OMR / IT Corridor', 'College Areas',
  'Residential Areas', 'Malls', 'ECR / Outskirts'
]

export const CATEGORIES = Object.keys(CATEGORY_META)
