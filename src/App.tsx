import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { Layout } from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import Profile from './pages/Profile';
import CareerTrack from './pages/CareerTrack';
import Competencies from './pages/Competencies';
import PDI from './pages/PDI';
import ActionGroups from './pages/ActionGroups';
import Achievements from './pages/Achievements';
import Learning from './pages/Learning';
import Mentorship from './pages/Mentorship';
import Reports from './pages/Reports';
import HRArea from './pages/HRArea';
import Administration from './pages/Administration';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  console.log('🛡️ ProtectedRoute: Checking auth state', { user: !!user, loading });

  if (loading) {
    console.log('🛡️ ProtectedRoute: Showing loading spinner');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  console.log('🛡️ ProtectedRoute: Auth resolved, redirecting or showing content');
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  console.log('🗺️ AppRoutes: Rendering with user:', !!user);

  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" /> : <Login />} 
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/career"
        element={
          <ProtectedRoute>
            <CareerTrack />
          </ProtectedRoute>
        }
      />
      <Route
        path="/competencies"
        element={
          <ProtectedRoute>
            <Competencies />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pdi"
        element={
          <ProtectedRoute>
            <PDI />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <UserManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/groups"
        element={
          <ProtectedRoute>
            <ActionGroups />
          </ProtectedRoute>
        }
      />
      <Route
        path="/achievements"
        element={
          <ProtectedRoute>
            <Achievements />
          </ProtectedRoute>
        }
      />
      <Route
        path="/learning"
        element={
          <ProtectedRoute>
            <Learning />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mentorship"
        element={
          <ProtectedRoute>
            <Mentorship />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr"
        element={
          <ProtectedRoute>
            <HRArea />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Administration />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;