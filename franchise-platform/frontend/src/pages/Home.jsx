import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { franchiseAPI } from '../api'
import { FranchiseCard, Spinner } from '../components/UI'
import { CATEGORY_META } from '../utils/helpers'
import { ArrowRight, TrendingUp, Shield, Zap, Users } from 'lucide-react'

export default function Home() {
  const [featured, setFeatured] = useState([])
  const [cats, setCats] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      franchiseAPI.getFeatured(),
      franchiseAPI.getCategories()
    ]).then(([f, c]) => {
      setFeatured(f.data.franchises.slice(0, 6))
      setCats(c.data.categories)
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-enter">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm font-medium mb-6 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              138 franchises across Chennai
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-5">
              Find the right franchise.<br />
              <span className="text-brand-200">With confidence.</span>
            </h1>
            <p className="text-brand-100 text-lg mb-8 leading-relaxed">
              Answer 6 questions. Our AI matches you with franchises that fit your budget,
              zone, and experience — then explains each one in plain English.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/discover" className="inline-flex items-center justify-center gap-2 bg-white text-brand-700 font-semibold px-7 py-3.5 rounded-xl hover:bg-brand-50 transition-colors shadow-lg">
                Find My Match
                <ArrowRight size={18} />
              </Link>
              <Link to="/franchises" className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-medium px-7 py-3.5 rounded-xl hover:bg-white/20 transition-colors">
                Browse All Franchises
              </Link>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              ['138', 'Franchises listed'],
              ['6', 'Categories'],
              ['9', 'Chennai zones covered'],
              ['AI', 'Powered matching'],
            ].map(([v, l]) => (
              <div key={l}>
                <div className="text-2xl font-bold">{v}</div>
                <div className="text-xs text-brand-200">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h2 className="section-title mb-2">Browse by category</h2>
        <p className="text-gray-500 text-sm mb-7">From ₹3L tea kiosks to ₹1Cr premium salons — every budget covered.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(CATEGORY_META).slice(0, 6).map(([cat, meta]) => {
            const found = cats.find(c => c._id === cat)
            return (
              <Link
                key={cat}
                to={`/franchises?category=${encodeURIComponent(cat)}`}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border ${meta.border} ${meta.color.replace('text-', 'bg-').split(' ')[0].replace('bg-', 'bg-').replace('50', '50')} hover:shadow-card transition-all group`}
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">{meta.icon}</span>
                <span className="font-medium text-xs text-center leading-tight">{cat}</span>
                {found && <span className="text-xs opacity-60">{found.count} options</span>}
              </Link>
            )
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <h2 className="section-title text-center mb-2">How FranchiseIQ works</h2>
          <p className="text-gray-500 text-center text-sm mb-10">Not just a directory — a guided decision engine</p>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: <Zap size={22} />, step: '01', title: 'Take the quiz', desc: 'Answer 6 quick questions about your budget, location, experience and goals.' },
              { icon: <TrendingUp size={22} />, step: '02', title: 'Get AI matches', desc: 'Grok AI ranks franchises by compatibility with your exact profile and Chennai zone.' },
              { icon: <Shield size={22} />, step: '03', title: 'See viability scores', desc: 'Every franchise gets a 0–100 risk/reward score. Green = safe, Red = high risk.' },
              { icon: <Users size={22} />, step: '04', title: 'Chat & decide', desc: 'Ask the AI anything about any franchise in plain English before you invest.' },
            ].map(item => (
              <div key={item.step} className="card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="text-xs font-bold text-brand-400 tracking-widest">{item.step}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1.5">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured franchises */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="section-title">Top-rated franchises</h2>
            <p className="text-sm text-gray-500 mt-1">Ranked by viability score — investment safety meets return potential</p>
          </div>
          <Link to="/franchises" className="btn-ghost hidden sm:flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featured.map(f => (
              <FranchiseCard
                key={f._id}
                franchise={f}
                onClick={(id) => navigate(`/franchises/${id}`)}
              />
            ))}
          </div>
        )}
        <div className="text-center mt-8">
          <Link to="/franchises" className="btn-secondary">Browse all 138 franchises →</Link>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-50 border-y border-brand-100">
        <div className="max-w-3xl mx-auto px-4 py-14 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Own a franchise? List it here.</h2>
          <p className="text-gray-500 mb-6">Reach thousands of serious franchise seekers in Chennai. Get verified inquiries, not just clicks.</p>
          <Link to="/register?role=owner" className="btn-primary inline-flex">Register as Franchise Owner</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-400">
          © 2024 FranchiseIQ · Franchise data focused on Chennai, India
        </div>
      </footer>
    </div>
  )
}
