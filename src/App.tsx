import React from 'react';
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { setupService } from './services/setup';
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

const useSupabaseSetup = () => {
  const [setupComplete, setSetupComplete] = React.useState(false);
  const [checking, setChecking] = React.useState(true);

  React.useEffect(() => {
    const checkSetup = () => {
      const hasUrl = !!import.meta.env.VITE_SUPABASE_URL;
      const hasKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
      const offlineMode = localStorage.getItem('OFFLINE_MODE') === 'true';
      const tempUrl = localStorage.getItem('TEMP_SUPABASE_URL');
      const tempKey = localStorage.getItem('TEMP_SUPABASE_ANON_KEY');
      
      const isSetup = (hasUrl && hasKey) || offlineMode || (tempUrl && tempKey);
      
      console.log('🔧 Setup Check:', {
        hasUrl,
        hasKey,
        offlineMode,
        tempUrl: !!tempUrl,
        tempKey: !!tempKey,
        isSetup
      });
      
      setSetupComplete(isSetup);
      setChecking(false);
    };

    checkSetup();
  }, []);

  return { setupComplete, checking, setSetupComplete };
};

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Carregando...</p>
    </div>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  console.log('🛡️ ProtectedRoute: user:', user, 'loading:', loading);

  if (loading) {
    console.log('🛡️ ProtectedRoute: Still loading, showing LoadingScreen');
    return <LoadingScreen />;
  }

  if (user) {
    console.log('🛡️ ProtectedRoute: User authenticated, rendering Layout');
    return <Layout>{children}</Layout>;
  } else {
    console.log('🛡️ ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/login" />;
  }
};

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();
  const { setupComplete, checking, setSetupComplete } = useSupabaseSetup();

  useEffect(() => {
    // Check initial setup status
    setupService.checkInitialSetup().then(status => {
      if (!status.hasUsers) {
        console.warn('⚠️ Sistema sem usuários configurados. Configure usuários de teste no Supabase Dashboard.');
        console.info('📋 Instruções: Vá para Authentication > Users e crie os usuários de teste.');
      } else {
        console.info(`✅ Sistema configurado com ${status.userCount} usuários e ${status.teamCount} times.`);
      }
    }).catch(error => {
      console.error('Erro ao verificar configuração inicial:', error);
    });
  }, []);

  console.log('🗺️ AppRoutes: user:', user, 'loading:', loading);

  if (checking) {
    console.log('🗺️ AppRoutes: Checking setup, showing LoadingScreen');
    return <LoadingScreen />;
  }

  if (!setupComplete) {
    console.log('🗺️ AppRoutes: Setup not complete, showing SetupCheck');
    return <SetupCheck onSetupComplete={() => setSetupComplete(true)} />;
  }

  if (loading) {
    console.log('🗺️ AppRoutes: Still loading, showing LoadingScreen');
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? (
          <>
            {console.log('🗺️ AppRoutes: User exists, redirecting to dashboard')}
            <Navigate to="/dashboard" />
          </>
        ) : (
          <>
            {console.log('🗺️ AppRoutes: No user, showing Login')}
            <Login />
          </>
        )} 
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