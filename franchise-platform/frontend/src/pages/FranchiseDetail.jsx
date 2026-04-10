import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { franchiseAPI, aiAPI, seekerAPI } from '../api'
import { ScoreRing, Spinner } from '../components/UI'
import { fmt, CATEGORY_META } from '../utils/helpers'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Send, MapPin, Users, Clock, CheckCircle, MessageSquare, Map, BookOpen } from 'lucide-react'

export default function FranchiseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isSeeker } = useAuth()

  const [franchise, setFranchise] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState('overview') // overview | chat | roadmap | inquire

  // AI chat
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [explanation, setExplanation] = useState('')
  const [explainLoading, setExplainLoading] = useState(false)

  // Roadmap
  const [roadmap, setRoadmap] = useState(null)
  const [roadmapLoading, setRoadmapLoading] = useState(false)

  // Inquiry
  const [inquiryMsg, setInquiryMsg] = useState('')
  const [inquiryPhone, setInquiryPhone] = useState('')
  const [inquirySent, setInquirySent] = useState(false)

  const chatEndRef = useRef(null)

  useEffect(() => {
    franchiseAPI.getOne(id).then(({ data }) => {
      setFranchise(data.franchise)
      setLoading(false)
      // Auto-load AI explanation
      loadExplanation(data.franchise._id)
    }).catch(() => { toast.error('Franchise not found'); navigate('/franchises') })
  }, [id])

  useEffect(() => {
    if (isSeeker) {
      seekerAPI.getSaved().then(({ data }) => {
        setSaved(data.saved.some(f => f._id === id))
      }).catch(() => {})
    }
  }, [isSeeker, id])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const loadExplanation = async (fid) => {
    setExplainLoading(true)
    try {
      const { data } = await aiAPI.explain(fid, null)
      setExplanation(data.explanation)
    } catch { setExplanation('') }
    finally { setExplainLoading(false) }
  }

  const sendChat = async () => {
    if (!chatInput.trim()) return
    if (!user) { navigate('/login'); return }
    const userMsg = { role: 'user', content: chatInput }
    setMessages(m => [...m, userMsg])
    setChatInput('')
    setChatLoading(true)
    try {
      const { data } = await aiAPI.chat([...messages, userMsg], franchise._id)
      setMessages(m => [...m, { role: 'assistant', content: data.reply }])
    } catch { toast.error('Chat error') }
    finally { setChatLoading(false) }
  }

  const loadRoadmap = async () => {
    if (!user) { navigate('/login'); return }
    setRoadmapLoading(true)
    setTab('roadmap')
    try {
      const { data } = await aiAPI.roadmap(franchise._id, user?.seekerProfile)
      setRoadmap(data.roadmap)
    } catch { toast.error('Roadmap generation failed') }
    finally { setRoadmapLoading(false) }
  }

  const handleSave = async () => {
    if (!user) { navigate('/login'); return }
    try {
      if (saved) {
        await seekerAPI.unsave(id)
        setSaved(false)
        toast('Removed from saved')
      } else {
        await seekerAPI.save(id)
        setSaved(true)
        toast.success('Franchise saved!')
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Error') }
  }

  const sendInquiry = async (e) => {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    try {
      await seekerAPI.inquire({ franchiseId: franchise._id, message: inquiryMsg, phone: inquiryPhone })
      setInquirySent(true)
      toast.success('Inquiry sent!')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send') }
  }

  if (loading) return <div className="flex justify-center items-center py-32"><Spinner size="lg" /></div>
  if (!franchise) return null

  const meta = CATEGORY_META[franchise.category] || CATEGORY_META['Other']
  const { label: scoreLabel, color: scoreColor, bg: scoreBg } = fmt.score(franchise.viabilityScore)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BookOpen size={15} /> },
    { id: 'chat', label: 'Ask AI', icon: <MessageSquare size={15} /> },
    { id: 'roadmap', label: 'Roadmap', icon: <Map size={15} /> },
    { id: 'inquire', label: 'Inquire', icon: <Send size={15} /> },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
      {/* Hero card */}
      <div className="card p-7 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`badge ${meta.color}`}>{meta.icon} {franchise.category}</span>
              <span className={`badge ${fmt.brand(franchise.brandType)}`}>{franchise.brandType}</span>
              {franchise.beginnerFriendly && <span className="badge bg-emerald-50 text-emerald-700">✓ Beginner Friendly</span>}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{franchise.name}</h1>
            <p className="text-gray-600 text-sm leading-relaxed">{franchise.description}</p>
          </div>
          <div className="flex sm:flex-col items-center gap-4">
            <ScoreRing score={franchise.viabilityScore} size={80} />
            <div className="flex gap-2 sm:flex-col">
              {isSeeker && (
                <button onClick={handleSave}
                  className={`btn-secondary text-sm ${saved ? 'text-brand-600 border-brand-300' : ''}`}>
                  {saved ? '♥ Saved' : '♡ Save'}
                </button>
              )}
              <button onClick={() => { setTab('inquire') }}
                className="btn-primary text-sm">
                Contact
              </button>
            </div>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-100">
          {[
            { label: 'Investment', value: fmt.range(franchise.investment.min, franchise.investment.max) },
            { label: 'Franchise Fee', value: fmt.range(franchise.franchiseFee.min, franchise.franchiseFee.max) },
            { label: 'Monthly Revenue', value: fmt.revenue(franchise.monthlyRevenue.min, franchise.monthlyRevenue.max) },
            { label: 'Breakeven', value: fmt.months(franchise.breakevenMonths.min, franchise.breakevenMonths.max) },
          ].map(m => (
            <div key={m.label} className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">{m.label}</p>
              <p className="font-semibold text-gray-900 text-sm">{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-6">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === t.id ? 'bg-white shadow-sm text-brand-700' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t.icon} <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Left: Details */}
          <div className="lg:col-span-2 space-y-5">
            {/* AI Summary */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🤖</span>
                <h3 className="font-semibold text-gray-900">AI Overview</h3>
                {explainLoading && <Spinner size="sm" />}
              </div>
              {explanation ? (
                <p className="text-sm text-gray-700 leading-relaxed">{explanation}</p>
              ) : explainLoading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-3 bg-gray-100 rounded animate-pulse" style={{ width: `${85 - i*8}%` }} />)}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Loading AI analysis...</p>
              )}
              <button onClick={() => setTab('chat')}
                className="mt-4 text-sm text-brand-600 font-medium hover:underline flex items-center gap-1">
                <MessageSquare size={13} /> Ask a specific question →
              </button>
            </div>

            {/* Zones */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin size={16} className="text-brand-500" /> Best Chennai zones
              </h3>
              <div className="flex flex-wrap gap-2">
                {(franchise.zones || []).map(z => (
                  <span key={z} className="badge bg-blue-50 text-blue-700 px-3 py-1">{z}</span>
                ))}
              </div>
            </div>

            {/* Setup & Operations */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Operations</h3>
              <div className="grid sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
                {[
                  ['Outlet Format', franchise.outletFormat],
                  ['Min Area', `${franchise.minArea} sq.ft`],
                  ['Staff Required', franchise.staffRequired],
                  ['Royalty', fmt.royalty(franchise.royaltyLevel).label],
                  ['Training', franchise.trainingProvided ? 'Provided' : 'Not included'],
                  ['Complexity', franchise.operationalComplexity],
                  ['Footfall Need', franchise.footfall],
                  ['Sub-category', franchise.subCategory],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-gray-500">{k}</span>
                    <span className="font-medium text-gray-800 capitalize">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: sidebar */}
          <div className="space-y-5">
            {/* Setup includes */}
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Setup includes</h3>
              <div className="space-y-2">
                {(franchise.setupIncludes || []).map(s => (
                  <div key={s} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle size={14} className="text-emerald-500 shrink-0" /> {s}
                  </div>
                ))}
              </div>
            </div>

            {/* Licenses */}
            {franchise.licenses?.length > 0 && (
              <div className="card p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Licenses required</h3>
                <div className="space-y-1.5">
                  {franchise.licenses.map(l => (
                    <span key={l} className="badge bg-amber-50 text-amber-700 text-xs block w-fit">{l}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Views</span><span className="font-medium">{franchise.views || 0}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Inquiries</span><span className="font-medium">{franchise.inquiryCount || 0}</span></div>
              </div>
            </div>

            {/* Get roadmap CTA */}
            <button onClick={loadRoadmap}
              className="w-full card p-4 text-center hover:shadow-elevated transition-shadow group">
              <div className="text-2xl mb-1">🗺️</div>
              <p className="font-semibold text-gray-900 text-sm">Generate 90-day roadmap</p>
              <p className="text-xs text-gray-500 mt-0.5">Step-by-step plan to launch this franchise</p>
              <p className="text-xs text-brand-600 font-medium mt-2 group-hover:underline">Generate →</p>
            </button>
          </div>
        </div>
      )}

      {/* AI Chat tab */}
      {tab === 'chat' && (
        <div className="card flex flex-col" style={{ height: '520px' }}>
          <div className="flex items-center gap-3 p-5 border-b border-gray-100">
            <div className="w-9 h-9 bg-brand-100 rounded-xl flex items-center justify-center text-lg">🤖</div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">FranchiseIQ Chat</p>
              <p className="text-xs text-gray-500">Ask anything about {franchise.name}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500 text-center mb-4">Suggested questions:</p>
                {[
                  'Is this good for someone with no business experience?',
                  'What are the biggest risks I should know about?',
                  'How much do I actually need to earn to break even?',
                  'How does this compare to other franchises in the category?'
                ].map(q => (
                  <button key={q} onClick={() => { setChatInput(q); }}
                    className="w-full text-left text-sm bg-gray-50 hover:bg-brand-50 hover:text-brand-700 px-4 py-2.5 rounded-xl border border-gray-100 transition-colors">
                    "{q}"
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                  m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-gray-100'
                }`}>
                  {m.role === 'user' ? user?.name?.[0]?.toUpperCase() : '🤖'}
                </div>
                <div className={`rounded-2xl px-4 py-3 max-w-[80%] text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-brand-600 text-white rounded-tr-sm'
                    : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex gap-3">
                <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center text-xs">🤖</div>
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1 items-center h-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-100 flex gap-2">
            {!user ? (
              <div className="w-full text-center">
                <button onClick={() => navigate('/login')} className="btn-primary text-sm">Sign in to chat</button>
              </div>
            ) : (
              <>
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
                  className="input flex-1 text-sm"
                  placeholder="Ask about this franchise..."
                />
                <button onClick={sendChat} disabled={!chatInput.trim() || chatLoading}
                  className="btn-primary px-4 disabled:opacity-50">
                  <Send size={15} />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Roadmap tab */}
      {tab === 'roadmap' && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xl">🗺️</span>
            <h3 className="font-semibold text-gray-900">90-Day Launch Roadmap for {franchise.name}</h3>
          </div>
          {!user ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Sign in to generate your personalized roadmap</p>
              <button onClick={() => navigate('/login')} className="btn-primary">Sign in →</button>
            </div>
          ) : roadmapLoading ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <Spinner size="lg" />
              <p className="text-sm text-gray-500">Generating your personalized roadmap...</p>
            </div>
          ) : roadmap ? (
            <div className="space-y-5">
              {/* Warning flags */}
              {roadmap.warningFlags?.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-amber-800 mb-2">⚠️ Key things to watch</p>
                  {roadmap.warningFlags.map((w, i) => (
                    <p key={i} className="text-sm text-amber-700">• {w}</p>
                  ))}
                </div>
              )}

              {/* Phases */}
              {roadmap.phases?.map((phase, i) => (
                <div key={i} className="relative pl-8">
                  <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">
                    {phase.phase}
                  </div>
                  {i < roadmap.phases.length - 1 && (
                    <div className="absolute left-3 top-6 bottom-0 w-px bg-brand-200" />
                  )}
                  <div className="bg-gray-50 rounded-xl p-4 mb-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{phase.title}</h4>
                      <span className="text-xs text-gray-500 bg-white px-2.5 py-1 rounded-full border border-gray-200">{phase.duration}</span>
                    </div>
                    <div className="space-y-1.5 mb-3">
                      {phase.tasks?.map((task, j) => (
                        <div key={j} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle size={14} className="text-brand-500 shrink-0 mt-0.5" />
                          {task}
                        </div>
                      ))}
                    </div>
                    {phase.milestone && (
                      <div className="bg-brand-50 rounded-lg px-3 py-1.5 text-xs text-brand-700 font-medium">
                        🏁 Milestone: {phase.milestone}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Summary */}
              <div className="card p-4 bg-brand-50 border border-brand-100">
                <div className="flex flex-wrap gap-4 text-sm">
                  <div><span className="text-gray-500">Estimated total cost:</span> <span className="font-semibold text-gray-900 ml-1">{roadmap.estimatedCost}</span></div>
                  <div><span className="text-gray-500">Licenses needed:</span> <span className="font-medium text-gray-800 ml-1">{roadmap.licenses?.join(', ')}</span></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <button onClick={loadRoadmap} className="btn-primary">Generate my roadmap →</button>
            </div>
          )}
        </div>
      )}

      {/* Inquire tab */}
      {tab === 'inquire' && (
        <div className="card p-6 max-w-lg mx-auto">
          {inquirySent ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="font-semibold text-gray-900 mb-1">Inquiry sent!</h3>
              <p className="text-sm text-gray-500">The franchise owner will reach out to you soon.</p>
            </div>
          ) : !user ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Sign in to contact this franchise</p>
              <button onClick={() => navigate('/login')} className="btn-primary">Sign in →</button>
            </div>
          ) : (
            <>
              <h3 className="font-semibold text-gray-900 mb-1">Contact {franchise.name}</h3>
              <p className="text-sm text-gray-500 mb-5">Your message will be sent directly to the franchise owner.</p>
              <form onSubmit={sendInquiry} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Your message</label>
                  <textarea required rows={4} value={inquiryMsg} onChange={e => setInquiryMsg(e.target.value)}
                    className="input resize-none" placeholder="Hi, I'm interested in this franchise. Can you share more about the territory availability in South Chennai?" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone <span className="text-gray-400">(optional)</span></label>
                  <input value={inquiryPhone} onChange={e => setInquiryPhone(e.target.value)}
                    className="input" placeholder="+91 98765 43210" />
                </div>
                <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                  <Send size={15} /> Send Inquiry
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  )
}
