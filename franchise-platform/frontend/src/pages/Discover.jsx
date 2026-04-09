import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { aiAPI } from '../api'
import { ScoreRing, Spinner, MatchBadge } from '../components/UI'
import { fmt, CATEGORY_META, ZONES } from '../utils/helpers'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { ArrowRight, ArrowLeft, ChevronRight } from 'lucide-react'

const STEPS = [
  { id: 'budget',     label: 'Budget',      icon: '💰' },
  { id: 'zone',       label: 'Location',    icon: '📍' },
  { id: 'category',   label: 'Category',    icon: '🏪' },
  { id: 'experience', label: 'Experience',  icon: '🎓' },
  { id: 'risk',       label: 'Risk',        icon: '⚖️' },
  { id: 'time',       label: 'Time',        icon: '🕐' },
]

const BUDGET_OPTIONS = [
  { label: 'Under ₹10L', min: 0, max: 10 },
  { label: '₹10L – ₹25L', min: 10, max: 25 },
  { label: '₹25L – ₹50L', min: 25, max: 50 },
  { label: '₹50L – ₹1Cr', min: 50, max: 100 },
  { label: 'Above ₹1Cr', min: 100, max: 500 },
]

export default function Discover() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({
    budget: null, zones: [], categories: [],
    experience: '', riskTolerance: '', timeAvailability: ''
  })
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const { user } = useAuth()
  const navigate = useNavigate()

  const set = (key, val) => setAnswers(a => ({ ...a, [key]: val }))
  const toggle = (key, val) => {
    setAnswers(a => ({
      ...a,
      [key]: a[key].includes(val) ? a[key].filter(x => x !== val) : [...a[key], val]
    }))
  }

  const canNext = () => {
    const s = STEPS[step].id
    if (s === 'budget') return answers.budget !== null
    if (s === 'zone') return answers.zones.length > 0
    if (s === 'category') return true // optional
    if (s === 'experience') return answers.experience !== ''
    if (s === 'risk') return answers.riskTolerance !== ''
    if (s === 'time') return answers.timeAvailability !== ''
    return true
  }

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else submit()
  }

  const submit = async () => {
    setLoading(true)
    try {
      const { data } = await aiAPI.recommend({
        budget: answers.budget,
        zones: answers.zones,
        categories: answers.categories.length > 0 ? answers.categories : undefined,
        experience: answers.experience,
        riskTolerance: answers.riskTolerance,
        timeAvailability: answers.timeAvailability,
      })
      setResults(data)
    } catch (err) {
      toast.error('AI matching failed — please try again')
    } finally { setLoading(false) }
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 page-enter">
      <Spinner size="lg" />
      <p className="text-gray-600 font-medium">Grok AI is finding your best matches…</p>
      <p className="text-sm text-gray-400">Analysing {'>'}138 franchises against your profile</p>
    </div>
  )

  // Results view
  if (results) return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 page-enter">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
          🤖 AI matched {results.recommendations?.length} franchises for you
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Your top franchise matches</h1>
        <p className="text-gray-500 text-sm mt-1">Ranked by compatibility with your budget, zone, and experience</p>
      </div>

      <div className="space-y-4">
        {results.recommendations?.map((f, i) => {
          const meta = CATEGORY_META[f.category] || {}
          return (
            <div key={f._id} className="card p-5 hover:shadow-elevated transition-shadow cursor-pointer group"
              onClick={() => navigate(`/franchises/${f._id}`)}>
              <div className="flex items-start gap-4">
                {/* Rank */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                  i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-gray-300 text-gray-700' : 'bg-orange-200 text-orange-800'
                }`}>
                  {i + 1}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`badge ${meta.color}`}>{meta.icon} {f.category}</span>
                        <span className={`badge ${fmt.brand(f.brandType)}`}>{f.brandType}</span>
                        {f.beginnerFriendly && <span className="badge bg-emerald-50 text-emerald-700">✓ Beginner OK</span>}
                      </div>
                      <h3 className="font-semibold text-gray-900">{f.name}</h3>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <MatchBadge score={f.matchScore} />
                      <ScoreRing score={f.viabilityScore} size={52} />
                    </div>
                  </div>

                  {/* AI explanation */}
                  {f.matchReason && (
                    <div className="bg-brand-50 rounded-xl px-3 py-2 mb-3">
                      <p className="text-xs text-brand-800 font-medium">🤖 Why this matches you:</p>
                      <p className="text-xs text-brand-700 mt-0.5">{f.matchReason}</p>
                    </div>
                  )}

                  {/* Risk flag */}
                  {f.keyRisk && (
                    <div className="bg-amber-50 rounded-xl px-3 py-2 mb-3">
                      <p className="text-xs text-amber-800 font-medium">⚠️ Key risk:</p>
                      <p className="text-xs text-amber-700 mt-0.5">{f.keyRisk}</p>
                    </div>
                  )}

                  {/* Quick verdict */}
                  {f.quickVerdict && (
                    <p className="text-xs text-gray-500 italic mb-3">"{f.quickVerdict}"</p>
                  )}

                  {/* Financials */}
                  <div className="flex flex-wrap gap-3 text-xs">
                    <span className="text-gray-600">💰 {fmt.range(f.investment.min, f.investment.max)}</span>
                    <span className="text-gray-600">📈 {fmt.revenue(f.monthlyRevenue.min, f.monthlyRevenue.max)}/mo</span>
                    <span className="text-gray-600">⏱ {fmt.months(f.breakevenMonths.min, f.breakevenMonths.max)} breakeven</span>
                  </div>
                </div>

                <ChevronRight size={18} className="text-gray-300 group-hover:text-brand-500 transition-colors shrink-0 mt-1" />
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-3 mt-8 justify-center">
        <button onClick={() => { setResults(null); setStep(0) }} className="btn-secondary">← Redo quiz</button>
        <button onClick={() => navigate('/franchises')} className="btn-ghost">Browse all franchises</button>
      </div>
    </div>
  )

  // Quiz view
  const progress = ((step) / STEPS.length) * 100

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Step {step + 1} of {STEPS.length}</span>
            <span className="text-sm text-gray-400">{STEPS[step].label}</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-brand-600 rounded-full transition-all duration-500"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
          <div className="flex gap-1 mt-2">
            {STEPS.map((s, i) => (
              <button key={s.id} onClick={() => i < step && setStep(i)}
                className={`flex-1 h-1 rounded-full transition-colors ${i <= step ? 'bg-brand-500' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>

        <div className="card p-8 page-enter">
          <div className="text-center mb-8">
            <div className="text-3xl mb-2">{STEPS[step].icon}</div>
          </div>

          {/* Step 0: Budget */}
          {step === 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 text-center mb-2">What's your investment budget?</h2>
              <p className="text-sm text-gray-500 text-center mb-6">Total money you can put into the franchise</p>
              <div className="space-y-2">
                {BUDGET_OPTIONS.map(opt => (
                  <button key={opt.label}
                    onClick={() => set('budget', { min: opt.min, max: opt.max })}
                    className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      answers.budget?.max === opt.max
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}>
                    {opt.label}
                    {answers.budget?.max === opt.max && <span className="text-brand-500">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Zone */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Which Chennai zone(s)?</h2>
              <p className="text-sm text-gray-500 text-center mb-6">Pick all areas where you can operate</p>
              <div className="grid grid-cols-2 gap-2">
                {ZONES.map(z => (
                  <button key={z}
                    onClick={() => toggle('zones', z)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      answers.zones.includes(z)
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}>
                    <span className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 ${
                      answers.zones.includes(z) ? 'border-brand-500 bg-brand-500' : 'border-gray-300'
                    }`}>
                      {answers.zones.includes(z) && <span className="text-white text-xs">✓</span>}
                    </span>
                    <span className="truncate">{z}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Category */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Any preferred categories?</h2>
              <p className="text-sm text-gray-500 text-center mb-6">Skip if you're open to everything</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(CATEGORY_META).slice(0, 6).map(([cat, meta]) => (
                  <button key={cat}
                    onClick={() => toggle('categories', cat)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      answers.categories.includes(cat)
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}>
                    <span>{meta.icon}</span>
                    <span className="truncate">{cat}</span>
                  </button>
                ))}
              </div>
              <p className="text-center text-xs text-gray-400 mt-3">None selected = show all categories</p>
            </div>
          )}

          {/* Step 3: Experience */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Your business experience?</h2>
              <p className="text-sm text-gray-500 text-center mb-6">This helps us match complexity level</p>
              <div className="space-y-2">
                {[
                  { val: 'none', label: 'No experience', desc: 'First time running a business' },
                  { val: 'basic', label: 'Some experience', desc: 'Worked in a business or ran something small' },
                  { val: 'experienced', label: 'Experienced', desc: 'Run a business before, know the ropes' },
                ].map(opt => (
                  <button key={opt.val}
                    onClick={() => set('experience', opt.val)}
                    className={`w-full flex flex-col text-left px-5 py-3.5 rounded-xl border-2 transition-all ${
                      answers.experience === opt.val
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}>
                    <span className={`font-medium text-sm ${answers.experience === opt.val ? 'text-brand-700' : 'text-gray-800'}`}>{opt.label}</span>
                    <span className="text-xs text-gray-500 mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Risk */}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Risk tolerance?</h2>
              <p className="text-sm text-gray-500 text-center mb-6">How comfortable are you with uncertainty?</p>
              <div className="space-y-2">
                {[
                  { val: 'low', label: 'Play it safe 🛡️', desc: 'I want proven brands, lower risk, even if returns are smaller' },
                  { val: 'medium', label: 'Balanced ⚖️', desc: 'I can handle some risk for better upside' },
                  { val: 'high', label: 'Growth mindset 🚀', desc: 'I can absorb higher risk for high-potential opportunities' },
                ].map(opt => (
                  <button key={opt.val}
                    onClick={() => set('riskTolerance', opt.val)}
                    className={`w-full flex flex-col text-left px-5 py-3.5 rounded-xl border-2 transition-all ${
                      answers.riskTolerance === opt.val
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}>
                    <span className={`font-medium text-sm ${answers.riskTolerance === opt.val ? 'text-brand-700' : 'text-gray-800'}`}>{opt.label}</span>
                    <span className="text-xs text-gray-500 mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Time */}
          {step === 5 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Time you can give?</h2>
              <p className="text-sm text-gray-500 text-center mb-6">This affects which business models suit you</p>
              <div className="space-y-2">
                {[
                  { val: 'part-time', label: 'Part-time ⏰', desc: 'Less than 6 hours a day — need something manageable' },
                  { val: 'full-time', label: 'Full-time 💼', desc: 'I can be fully dedicated — this is my main focus' },
                ].map(opt => (
                  <button key={opt.val}
                    onClick={() => set('timeAvailability', opt.val)}
                    className={`w-full flex flex-col text-left px-5 py-3.5 rounded-xl border-2 transition-all ${
                      answers.timeAvailability === opt.val
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}>
                    <span className={`font-medium text-sm ${answers.timeAvailability === opt.val ? 'text-brand-700' : 'text-gray-800'}`}>{opt.label}</span>
                    <span className="text-xs text-gray-500 mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center gap-3 mt-8">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex items-center gap-2">
                <ArrowLeft size={15} /> Back
              </button>
            )}
            <button
              onClick={next}
              disabled={!canNext()}
              className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 disabled:opacity-40"
            >
              {step === STEPS.length - 1 ? (
                <><span className="text-lg">🔍</span> Find my matches</>
              ) : (
                <>Next <ArrowRight size={15} /></>
              )}
            </button>
          </div>
        </div>

        {/* Skip to browse */}
        <p className="text-center mt-4 text-sm text-gray-400">
          Not sure yet?{' '}
          <button onClick={() => navigate('/franchises')} className="text-brand-500 hover:underline font-medium">
            Browse all franchises
          </button>
        </p>
      </div>
    </div>
  )
}
