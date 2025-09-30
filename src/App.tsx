import React from 'react';
import { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AchievementProvider } from './contexts/AchievementContext';
import { AchievementToast } from './components/AchievementToast';
import { useAchievements } from './contexts/AchievementContext';
import { SetupCheck } from './components/SetupCheck';
import { checkDatabaseHealth } from './lib/supabase';
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
  LazyMentalHealth,
  LazyMentalHealthAdmin,
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
  const [setupComplete, setSetupComplete] = React.useState(false);
  const [checking, setChecking] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isExpiredToken, setIsExpiredToken] = React.useState(false);
  const [isInvalidKey, setIsInvalidKey] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    const checkSetup = async () => {
      const hasUrl = !!import.meta.env.VITE_SUPABASE_URL;
      const hasKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
      const offlineMode = localStorage.getItem('OFFLINE_MODE') === 'true';

      if (offlineMode) {
        if (mounted) {
          setSetupComplete(true);
          setChecking(false);
        }
        return;
      }

      if (!hasUrl || !hasKey) {
        if (mounted) {
          setSetupComplete(false);
          setChecking(false);
          setError('Missing Supabase credentials');
        }
        return;
      }

      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Setup check timeout after 15s')), 15000);
        });

        const healthCheckPromise = checkDatabaseHealth(10000);
        const healthCheck = await Promise.race([healthCheckPromise, timeoutPromise]);

        if (mounted) {
          setSetupComplete(healthCheck.healthy);
          setError(healthCheck.error || null);
          setIsExpiredToken(healthCheck.isExpiredToken || false);
          setIsInvalidKey(healthCheck.isInvalidKey || false);
        }
      } catch (error) {
        if (mounted) {
          setSetupComplete(false);
          setError(error instanceof Error ? error.message : 'Unknown error occurred');
        }
      } finally {
        if (mounted) {
          setChecking(false);
        }
      }
    };

    checkSetup();

    return () => {
      mounted = false;
    };
  }, []);

  return { setupComplete, checking, error, isExpiredToken, isInvalidKey, setSetupComplete };
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
  const { setupComplete, checking, error, isExpiredToken, isInvalidKey, setSetupComplete } = useSupabaseSetup();

  if (checking) {
    return <LoadingScreen message="Verificando configuração..." />;
  }

  if (!setupComplete) {
    return <SetupCheck
      onSetupComplete={() => setSetupComplete(true)}
      initialError={error}
      isExpiredToken={isExpiredToken}
      isInvalidKey={isInvalidKey}
    />;
  }

  if (loading) {
    return <LoadingScreen message="Carregando aplicação..." />;
  }

  return (
    <ErrorBoundary>
      <Routes>
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
        path="/qa"
        element={
          <ProtectedRoute>
            <LazyQualityAssurance />
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
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </ErrorBoundary>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AchievementProvider>
          <Router>
            <AchievementWrapper>
              <AppRoutes />
            </AchievementWrapper>
          </Router>
        </AchievementProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;