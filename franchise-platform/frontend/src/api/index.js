import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT on every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('fiq_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Handle 401 globally
api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('fiq_token')
      localStorage.removeItem('fiq_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── AUTH ──
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  me:       ()     => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
}

// ── FRANCHISES ──
export const franchiseAPI = {
  getAll:      (params) => api.get('/franchises', { params }),
  getFeatured: ()       => api.get('/franchises/featured'),
  getCategories: ()     => api.get('/franchises/categories'),
  getOne:      (id)     => api.get(`/franchises/${id}`),
  create:      (data)   => api.post('/franchises', data),
  update:      (id, d)  => api.put(`/franchises/${id}`, d),
  remove:      (id)     => api.delete(`/franchises/${id}`),
}

// ── AI ──
export const aiAPI = {
  recommend: (profile) => api.post('/ai/recommend', profile),
  explain:   (franchiseId, question) => api.post('/ai/explain', { franchiseId, question }),
  chat:      (messages, franchiseId) => api.post('/ai/chat', { messages, franchiseId }),
  roadmap:   (franchiseId, userProfile) => api.post('/ai/roadmap', { franchiseId, userProfile }),
  compare:   (franchiseIdA, franchiseIdB, userProfile) =>
               api.post('/ai/compare', { franchiseIdA, franchiseIdB, userProfile }),
}

// ── SEEKER ──
export const seekerAPI = {
  getSaved:    ()          => api.get('/seeker/saved'),
  save:        (id)        => api.post(`/seeker/save/${id}`),
  unsave:      (id)        => api.delete(`/seeker/save/${id}`),
  inquire:     (data)      => api.post('/seeker/inquire', data),
  getInquiries: ()         => api.get('/seeker/inquiries'),
}

// ── OWNER ──
export const ownerAPI = {
  getListings:  ()       => api.get('/owner/listings'),
  getInquiries: ()       => api.get('/owner/inquiries'),
  replyInquiry: (id, reply) => api.put(`/owner/inquiries/${id}/reply`, { reply }),
  getStats:     ()       => api.get('/owner/stats'),
}

export default api
