import { UserRole, Profile } from '../types';

export interface PermissionCheck {
  canManageAllUsers: boolean;
  canManageTeam: boolean;
  canCreateTeams: boolean;
  canChangeRoles: boolean;
  canAccessSystemSettings: boolean;
  canManageCareerTracks: boolean;
}

export const permissionService = {
  // Core permission checks
  canManageAllUsers(userRole: UserRole): boolean {
    return userRole === 'admin';
  },

  canManageTeam(userRole: UserRole): boolean {
    return ['admin', 'manager'].includes(userRole);
  },

  canCreateTeams(userRole: UserRole): boolean {
    return userRole === 'admin';
  },

  canChangeRoles(userRole: UserRole): boolean {
    return userRole === 'admin';
  },

  canAccessSystemSettings(userRole: UserRole): boolean {
    return userRole === 'admin';
  },

  canManageCareerTracks(userRole: UserRole): boolean {
    return ['admin', 'hr'].includes(userRole);
  },

  canManageMentalHealth(userRole: UserRole): boolean {
    return ['admin', 'hr'].includes(userRole);
  },

  canApproveOwnPDI(userId: string, pdiCreatedBy: string): boolean {
    return userId !== pdiCreatedBy;
  },

  // Get all permissions for a user
  getUserPermissions(userRole: UserRole): PermissionCheck {
    return {
      canManageAllUsers: this.canManageAllUsers(userRole),
      canManageTeam: this.canManageTeam(userRole),
      canCreateTeams: this.canCreateTeams(userRole),
      canChangeRoles: this.canChangeRoles(userRole),
      canAccessSystemSettings: this.canAccessSystemSettings(userRole),
      canManageCareerTracks: this.canManageCareerTracks(userRole)
    };
  },

  // Get visible users based on role
  getVisibleUserFilter(user: Profile): { all: boolean; managerFilter?: string } {
    if (user.role === 'admin' || user.role === 'hr') {
      return { all: true };
    }
    
    if (user.role === 'manager') {
      return { all: false, managerFilter: user.id };
    }
    
    // Employee can only see themselves
    return { all: false, managerFilter: undefined };
  },

  // Validation functions
  validateRoleChange(currentUser: Profile, targetUser: Profile, newRole: UserRole): string | null {
    // Admin can't demote themselves
    if (currentUser.id === targetUser.id && currentUser.role === 'admin' && newRole !== 'admin') {
      return 'Você não pode alterar seu próprio papel de administrador';
    }

    // Only admin can change roles
    if (currentUser.role !== 'admin') {
      return 'Apenas administradores podem alterar papéis de usuários';
    }

    // Can't promote to admin unless current user is admin
    if (newRole === 'admin' && currentUser.role !== 'admin') {
      return 'Apenas administradores podem promover outros usuários a administrador';
    }

    return null;
  },

  validateTeamManagerAssignment(currentUser: Profile, managerId: string): string | null {
    if (currentUser.role !== 'admin') {
      return 'Apenas administradores podem atribuir gestores a times';
    }

    if (managerId === currentUser.id) {
      return 'Você não pode se atribuir como gestor de um time';
    }

    return null;
  },

  validateTeamDeletion(team: any): string | null {
    if (team.members && team.members.length > 0) {
      return 'Não é possível excluir um time que possui membros. Transfira os membros primeiro.';
    }

    return null;
  }
};