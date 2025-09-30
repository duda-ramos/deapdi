import { lazy } from 'react';

// Lazy load heavy components for better performance
export const LazyDashboard = lazy(() => import('../pages/Dashboard'));
export const LazyProfile = lazy(() => import('../pages/Profile'));
export const LazyCareerTrack = lazy(() => import('../pages/CareerTrack'));
export const LazyCompetencies = lazy(() => import('../pages/Competencies'));
export const LazyPDI = lazy(() => import('../pages/PDI'));
export const LazyActionGroups = lazy(() => import('../pages/ActionGroups'));
export const LazyAchievements = lazy(() => import('../pages/Achievements'));
export const LazyLearning = lazy(() => import('../pages/Learning'));
export const LazyMentorship = lazy(() => import('../pages/Mentorship'));
export const LazyReports = lazy(() => import('../pages/Reports'));
export const LazyHRArea = lazy(() => import('../pages/HRArea'));
export const LazyAdministration = lazy(() => import('../pages/Administration'));
export const LazyUserManagement = lazy(() => import('../pages/UserManagement'));
export const LazyCareerTrackManagement = lazy(() => import('../pages/CareerTrackManagement'));
export const LazyCertificates = lazy(() => import('../pages/Certificates'));
export const LazyMentalHealth = lazy(() => import('../pages/MentalHealth'));
export const LazyMentalHealthAdmin = lazy(() => import('../pages/MentalHealthAdmin'));

// HR Calendar
export const LazyHRCalendar = lazy(() => import('../pages/HRCalendar'));

// Quality Assurance
export const LazyQualityAssurance = lazy(() => import('../pages/QualityAssurance'));

// Team and People Management
export const LazyTeamManagement = lazy(() => import('../pages/TeamManagement'));
export const LazyPeopleManagement = lazy(() => import('../pages/PeopleManagement'));


// Action Groups service
export const LazyActionGroupService = lazy(() => import('../services/actionGroups'));