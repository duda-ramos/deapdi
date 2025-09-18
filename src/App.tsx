import React from 'react';
import { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { useErrorHandler } from './hooks/useErrorHandler';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SetupCheck } from './components/SetupCheck';
import { Login } from './components/Login';
import { Layout } from './components/layout/Layout';
import {
  LazyDashboard,
  LazyProfile,
  LazyCareerTrack,
  LazyCompetencies,
  LazyPDI,
  LazyActionGroups,
  LazyAchievements,
  LazyLearning,
  LazyMentorship,
  LazyReports,
  LazyHRArea,
  LazyAdministration,
  LazyUserManagement
} from './components/LazyComponents';

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
      <Layout>
        <Suspense fallback={<LoadingScreen />}>
          {children}
        </Suspense>
      </Layout>
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
            <LazyDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <LazyProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/career"
        element={
          <ProtectedRoute>
            <LazyCareerTrack />
          </ProtectedRoute>
        }
      />
      <Route
        path="/competencies"
        element={
          <ProtectedRoute>
            <LazyCompetencies />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pdi"
        element={
          <ProtectedRoute>
            <LazyPDI />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <LazyUserManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/groups"
        element={
          <ProtectedRoute>
            <LazyActionGroups />
          </ProtectedRoute>
        }
      />
      <Route
        path="/achievements"
        element={
          <ProtectedRoute>
            <LazyAchievements />
          </ProtectedRoute>
        }
      />
      <Route
        path="/learning"
        element={
          <ProtectedRoute>
            <LazyLearning />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mentorship"
        element={
          <ProtectedRoute>
            <LazyMentorship />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <LazyReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr"
        element={
          <ProtectedRoute>
            <LazyHRArea />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <LazyAdministration />
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