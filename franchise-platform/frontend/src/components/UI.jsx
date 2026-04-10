import { fmt, CATEGORY_META } from '../utils/helpers'

// ── Viability Score Ring ──
export function ScoreRing({ score, size = 64 }) {
  const { label, color, ring } = fmt.score(score)
  const r = (size / 2) - 6
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="5" />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={ring} strokeWidth="5"
            strokeDasharray={circ} strokeDashoffset={circ - dash}
            strokeLinecap="round" className="score-ring" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-800">
          {score}
        </span>
      </div>
      <span className={`text-xs font-medium ${color}`}>{label}</span>
    </div>
  )
}

// ── Franchise Card ──
// ✅ FIXED: was using require() inside component — replaced with top-level import
export function FranchiseCard({ franchise, onCompare, compareList = [], onClick, onSave, saved }) {
  const { name, category, brandType, investment, monthlyRevenue,
          breakevenMonths, royaltyLevel, beginnerFriendly, viabilityScore, description } = franchise
  const { icon, color } = CATEGORY_META[category] || {}
  const inCompare = compareList.includes(franchise._id)

  return (
    <div
      className="card p-5 flex flex-col gap-4 hover:shadow-elevated transition-shadow duration-200 cursor-pointer group"
      onClick={() => onClick?.(franchise._id)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`badge ${color}`}>{icon} {category}</span>
            <span className={`badge ${fmt.brand(brandType)}`}>{brandType}</span>
            {beginnerFriendly && <span className="badge bg-emerald-50 text-emerald-700">✓ Beginner OK</span>}
          </div>
          <h3 className="font-semibold text-gray-900 text-base leading-tight truncate">{name}</h3>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{description}</p>
        </div>
        <ScoreRing score={viabilityScore} size={56} />
      </div>

      {/* Financials grid */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-gray-50 rounded-xl p-2">
          <p className="text-xs text-gray-500 mb-0.5">Investment</p>
          <p className="text-sm font-semibold text-gray-800">{fmt.range(investment.min, investment.max)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-2">
          <p className="text-xs text-gray-500 mb-0.5">Revenue/mo</p>
          <p className="text-sm font-semibold text-gray-800">{fmt.revenue(monthlyRevenue.min, monthlyRevenue.max)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-2">
          <p className="text-xs text-gray-500 mb-0.5">Breakeven</p>
          <p className="text-sm font-semibold text-gray-800">{fmt.months(breakevenMonths.min, breakevenMonths.max)}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 pt-1 border-t border-gray-100" onClick={e => e.stopPropagation()}>
        <span className={`badge ${fmt.royalty(royaltyLevel).cls}`}>{fmt.royalty(royaltyLevel).label}</span>
        <div className="ml-auto flex items-center gap-2">
          {onSave && (
            <button
              onClick={(e) => { e.stopPropagation(); onSave(franchise._id) }}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                saved ? 'bg-brand-50 text-brand-600' : 'text-gray-400 hover:text-brand-500 hover:bg-brand-50'
              }`}
            >
              {saved ? '♥ Saved' : '♡ Save'}
            </button>
          )}
          {onCompare && (
            <button
              onClick={(e) => { e.stopPropagation(); onCompare(franchise._id) }}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                inCompare ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-indigo-500 hover:bg-indigo-50'
              }`}
            >
              {inCompare ? '✓ Compare' : '+ Compare'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Spinner ──
export function Spinner({ size = 'md', className = '' }) {
  const s = { sm: 'w-4 h-4 border-2', md: 'w-7 h-7 border-2', lg: 'w-10 h-10 border-[3px]' }[size]
  return <div className={`${s} border-brand-500 border-t-transparent rounded-full animate-spin ${className}`} />
}

// ── Empty state ──
export function Empty({ icon = '🔍', title, desc, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="text-4xl">{icon}</div>
      <h3 className="font-semibold text-gray-700">{title}</h3>
      {desc && <p className="text-sm text-gray-500 max-w-xs">{desc}</p>}
      {action}
    </div>
  )
}

// ── Match score badge for recommendations ──
export function MatchBadge({ score }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-gray-400'
  return (
    <div className={`${color} text-white text-xs font-bold px-2.5 py-1 rounded-full`}>
      {score}% match
    </div>
  )
}

// ── Section header ──
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// ── Stat card ──
export function StatCard({ label, value, sub, icon, color = 'bg-brand-50 text-brand-600' }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${color}`}>{icon}</div>
        <span className="text-sm text-gray-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}
