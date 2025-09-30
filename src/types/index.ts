import { Database } from './database';

// Export database types for easier access
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Team = Database['public']['Tables']['teams']['Row'];
export type CareerTrack = Database['public']['Tables']['career_tracks']['Row'];
export type SalaryEntry = Database['public']['Tables']['salary_history']['Row'];
export type Competency = Database['public']['Tables']['competencies']['Row'];
export type PDI = Database['public']['Tables']['pdis']['Row'];
export type Achievement = Database['public']['Tables']['achievements']['Row'];
export type ActionGroup = Database['public']['Tables']['action_groups']['Row'];
export type Task = Database['public']['Tables']['tasks']['Row'];
export type PsychologicalRecord = Database['public']['Tables']['psychological_records']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];

// Legacy types for backward compatibility (will be removed in Phase 2)
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'hr' | 'manager' | 'employee';
  avatar?: string;
  team?: string;
  manager?: string;
  level: string;
  position: string;
  points: number;
  achievements: Achievement[];
  careerTrack: CareerTrack;
}

export interface LegacyAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  points: number;
}

export interface LegacyCareerTrack {
  profession: string;
  currentStage: string;
  progress: number;
  nextStage?: string;
  salaryHistory: SalaryEntry[];
}

export interface LegacySalaryEntry {
  date: Date;
  amount: number;
  position: string;
  reason: string;
}

export interface LegacyCompetency {
  id: string;
  name: string;
  type: 'hard' | 'soft';
  selfRating: number;
  managerRating: number;
  targetLevel: number;
  stage: string;
}

export interface LegacyPDI {
  id: string;
  title: string;
  description: string;
  deadline: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'validated';
  mentor?: string;
  points: number;
  createdBy: string;
  validatedBy?: string;
}

export interface LegacyActionGroup {
  id: string;
  title: string;
  description: string;
  participants: string[];
  tasks: Task[];
  deadline: Date;
  status: 'active' | 'completed' | 'cancelled';
}

export interface LegacyTask {
  id: string;
  title: string;
  assignee: string;
  deadline: Date;
  status: 'todo' | 'in-progress' | 'done';
}

// Utility types
export type UserRole = 'admin' | 'hr' | 'manager' | 'employee';
export type UserStatus = 'active' | 'inactive';
export type TrackType = 'development' | 'specialization';
export type CompetencyType = 'hard' | 'soft';
export type PDIStatus = 'pending' | 'in-progress' | 'completed' | 'validated';
export type GroupStatus = 'active' | 'completed' | 'cancelled';
export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface ProfileUpdateForm {
  name: string;
  bio?: string;
  formation?: string;
  avatar_url?: string;
}

export interface PDICreateForm {
  title: string;
  description: string;
  deadline: string;
  mentor_id?: string;
}

export interface CompetencyUpdateForm {
  id: string;
  self_rating?: number;
  manager_rating?: number;
}