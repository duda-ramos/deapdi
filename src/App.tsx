import React from 'react';
import { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AchievementProvider } from './contexts/AchievementContext';
import { AchievementToast } from './components/AchievementToast';
import { useAchievements } from './contexts/AchievementContext';
import { ConfigurationError } from './components/ConfigurationError';
import { autoConfigureSupabase, type ConfigurationStatus } from './utils/supabaseAutoConfig';
import { Login } from './components/Login';
import { Onboarding } from './components/Onboarding';
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
  LazyUserManagement,
  LazyCareerTrackManagement,
  LazyCertificates,
  LazyPsychologicalRecord,
  LazyAnalyticsDashboard,
  LazyFormBuilder,
  LazyTaskManager,
  LazyMentalHealth,
  LazyMentalHealthAdmin,
  LazyWellnessAdmin,
  LazyEvaluationsManagement,
  LazyManagerFeedbackForm,
  LazyTeamManagement,
  LazyPeopleManagement,
  LazyQualityAssurance,
  LazyHRCalendar
} from './components/LazyComponents';

const AchievementWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { newAchievement, clearAchievement } = useAchievements();

  return (
    <>
      {children}
      <AchievementToast 
        achievement={newAchievement} 
        onClose={clearAchievement} 
      />
    </>
  );
};

const useSupabaseSetup = () => {
  const [configStatus, setConfigStatus] = React.useState<ConfigurationStatus | null>(null);
  const [checking, setChecking] = React.useState(true);
  const hasRunRef = React.useRef(false);

  const checkSetup = React.useCallback(async () => {
    setChecking(true);
    try {
      const status = await autoConfigureSupabase();
      setConfigStatus(status);
    } catch (error) {
      console.error('🔴 Auto-configuration failed:', error);
      setConfigStatus({
        isConfigured: false,
        isValid: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido na configuração',
        source: 'env',
        needsMigration: false
      });
    } finally {
      setChecking(false);
    }
  }, []);

  React.useEffect(() => {
    // Prevent duplicate execution
    if (hasRunRef.current) {
      console.log('🔧 Setup: Already executed, skipping');
      return;
    }

    hasRunRef.current = true;

    // Check for offline mode
    const offlineMode = localStorage.getItem('OFFLINE_MODE') === 'true';
    const skipHealthCheck = import.meta.env.VITE_SKIP_HEALTH_CHECK === 'true';

    if (skipHealthCheck && import.meta.env.DEV) {
      console.log('🔧 Setup: Health check skipped (dev mode)');
      setConfigStatus({
        isConfigured: true,
        isValid: true,
        error: null,
        source: 'env',
        needsMigration: false
      });
      setChecking(false);
      return;
    }

    if (offlineMode) {
      console.log('🔧 Setup: Offline mode enabled');
      setConfigStatus({
        isConfigured: true,
        isValid: true,
        error: null,
        source: 'env',
        needsMigration: false
      });
      setChecking(false);
      return;
    }

    checkSetup();
  }, [checkSetup]);

  return { configStatus, checking, retry: checkSetup };
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Verificando autenticação..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if user needs onboarding
  if (!user.is_onboarded) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return (
    <ErrorBoundary>
      <Layout>
        <Suspense fallback={<LoadingScreen message="Carregando página..." />}>
          {children}
        </Suspense>
      </Layout>
    </ErrorBoundary>
  );
};

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();
  const { configStatus, checking, retry } = useSupabaseSetup();

  if (checking) {
    return <LoadingScreen message="Verificando configuração..." />;
  }

  if (!configStatus || (!configStatus.isConfigured || !configStatus.isValid)) {
    return <ConfigurationError
      error={configStatus?.error || 'Configuração do Supabase não encontrada'}
      onRetry={retry}
    />;
  }

  if (loading) {
    return <LoadingScreen message="Carregando aplicação..." />;
  }

  return (
    <ErrorBoundary>
      <Routes>
        <Route 
          path="/mental-health/record"
          element={
            <ProtectedRoute>
              <LazyPsychologicalRecord />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mental-health/analytics"
          element={
            <ProtectedRoute>
              <LazyAnalyticsDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mental-health/forms"
          element={
            <ProtectedRoute>
              <LazyFormBuilder />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      <Route 
        path="/onboarding" 
        element={
          user ? (
            user.is_onboarded ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Onboarding />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        } 
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
        path="/people"
        element={
          <ProtectedRoute>
            <LazyPeopleManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teams"
        element={
          <ProtectedRoute>
            <LazyTeamManagement />
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
        path="/hr-calendar"
        element={
          <ProtectedRoute>
            <LazyHRCalendar />
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
      <Route
        path="/career-management"
        element={
          <ProtectedRoute>
            <LazyCareerTrackManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/certificates"
        element={
          <ProtectedRoute>
            <LazyCertificates />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mental-health"
        element={
          <ProtectedRoute>
            <LazyMentalHealth />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mental-health/admin"
        element={
          <ProtectedRoute>
            <LazyMentalHealthAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/wellness-admin"
        element={
          <ProtectedRoute>
            <LazyWellnessAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/evaluations"
        element={
          <ProtectedRoute>
            <LazyEvaluationsManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager-feedback"
        element={
          <ProtectedRoute>
            <LazyManagerFeedbackForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/qa"
        element={
          <ProtectedRoute>
            <LazyQualityAssurance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mental-health/analytics"
        element={
          <ProtectedRoute>
            <LazyAnalyticsDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mental-health/forms"
        element={
          <ProtectedRoute>
            <LazyFormBuilder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mental-health/tasks"
        element={
          <ProtectedRoute>
            <LazyTaskManager />
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
          <AchievementProvider>
            <AchievementWrapper>
              <AppRoutes />
            </AchievementWrapper>
          </AchievementProvider>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
