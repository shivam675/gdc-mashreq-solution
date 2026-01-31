import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PRPosts from './pages/PRPosts';
import DatabaseManagement from './pages/DatabaseManagement';
import Settings from './pages/Settings';
import AuditTrail from './pages/AuditTrail';
import ExecutiveDashboard from './pages/ExecutiveDashboard';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="posts" element={<PRPosts />} />
            <Route path="audit-trail" element={<AuditTrail />} />
            <Route path="executive" element={<ExecutiveDashboard />} />
            <Route path="database" element={<DatabaseManagement />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
