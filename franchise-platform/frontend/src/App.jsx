import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import { Login, Register } from './pages/Auth'
import Franchises from './pages/Franchises'
import FranchiseDetail from './pages/FranchiseDetail'
import Discover from './pages/Discover'
import SeekerDashboard from './pages/SeekerDashboard'
import OwnerDashboard from './pages/OwnerDashboard'
import { Spinner } from './components/UI'

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex justify-center items-center min-h-screen"><Spinner size="lg" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { loading } = useAuth()
  if (loading) return <div className="flex justify-center items-center min-h-screen"><Spinner size="lg" /></div>

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/franchises" element={<Franchises />} />
          <Route path="/franchises/:id" element={<FranchiseDetail />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/seeker/dashboard" element={
            <ProtectedRoute role="seeker"><SeekerDashboard /></ProtectedRoute>
          } />
          <Route path="/owner/dashboard" element={
            <ProtectedRoute role="owner"><OwnerDashboard /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
