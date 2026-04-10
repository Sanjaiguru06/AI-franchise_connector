import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  const bootstrap = useCallback(async () => {
    const token = localStorage.getItem('fiq_token')
    if (!token) { setLoading(false); return }
    try {
      const { data } = await authAPI.me()
      setUser(data.user)
    } catch {
      localStorage.removeItem('fiq_token')
      localStorage.removeItem('fiq_user')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { bootstrap() }, [bootstrap])

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password })
    localStorage.setItem('fiq_token', data.token)
    setUser(data.user)
    toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`)
    return data.user
  }

  const register = async (form) => {
    const { data } = await authAPI.register(form)
    localStorage.setItem('fiq_token', data.token)
    setUser(data.user)
    toast.success('Account created!')
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('fiq_token')
    localStorage.removeItem('fiq_user')
    setUser(null)
    toast('Logged out')
  }

  const updateUser = (updated) => setUser(u => ({ ...u, ...updated }))

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isSeeker: user?.role === 'seeker', isOwner: user?.role === 'owner' }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
