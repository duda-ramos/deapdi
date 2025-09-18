import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { useErrorHandler } from './hooks/useErrorHandler';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SetupCheck } from './components/SetupCheck';
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

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Carregando...</p>
    </div>
  </div>
);

const useSupabaseSetup = () => {
  const [setupComplete, setSetupComplete] = React.useState(false);
  const [checking, setChecking] = React.useState(true);

  React.useEffect(() => {
    const checkSetup = () => {
      const hasUrl = !!import.meta.env.VITE_SUPABASE_URL;
      const hasKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
      const offlineMode = localStorage.getItem('OFFLINE_MODE') === 'true';
      
      const isSetup = (hasUrl && hasKey) || offlineMode;
      
      if (import.meta.env.DEV) {
        console.log('🔧 Setup Check:', { hasUrl, hasKey, offlineMode, isSetup });
      }
      
      setSetupComplete(isSetup);
      setChecking(false);
    };

    checkSetup();
  }, []);

  return { setupComplete, checking, setSetupComplete };
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <ErrorBoundary>
      <Layout>{children}</Layout>
    </ErrorBoundary>
  );
};

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();
  const { setupComplete, checking, setSetupComplete } = useSupabaseSetup();

  if (checking) {
    return <LoadingScreen />;
  }

  if (!setupComplete) {
    return <SetupCheck onSetupComplete={() => setSetupComplete(true)} />;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
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
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </ErrorBoundary>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;