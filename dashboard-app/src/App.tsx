import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import AuthGuard from '@/components/AuthGuard'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Overview from '@/pages/Overview'
import PlatformAnalytics from '@/pages/PlatformAnalytics'
import EngagementOrders from '@/pages/EngagementOrders'
import Reports from '@/pages/Reports'
import Upload from '@/pages/Upload'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <AuthGuard>
              <Layout>
                <Routes>
                  <Route path="/" element={<Overview />} />
                  <Route path="/platform/:platform" element={<PlatformAnalytics />} />
                  <Route path="/engagement-orders" element={<EngagementOrders />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route
                    path="/upload"
                    element={
                      <AuthGuard requireAdmin>
                        <Upload />
                      </AuthGuard>
                    }
                  />
                </Routes>
              </Layout>
            </AuthGuard>
          }
        />
      </Routes>
    </AuthProvider>
  )
}

export default App
