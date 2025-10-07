import { supabase } from '../lib/supabase';
import { UserRole } from '../types';

export interface FormAssignment {
  id: string;
  form_id: string;
  assigned_by: string;
  assigned_to: string[];
  assignment_type: 'individual' | 'multiple' | 'all';
  form_type: 'performance' | 'mental_health';
  status: 'active' | 'completed' | 'expired';
  due_date?: string;
  created_at: string;
  updated_at: string;
  assigned_by_name?: string;
  assigned_to_names?: string[];
}

export interface AssignmentPermission {
  canAssign: boolean;
  canViewResults: boolean;
  allowedUsers: string[];
  reason?: string;
}

export class FormAssignmentService {
  /**
   * Verifica se um usuário pode atribuir formulários de um tipo específico
   */
  static async checkAssignmentPermission(
    userRole: UserRole,
    formType: 'performance' | 'mental_health',
    targetUserIds: string[],
    currentUserId: string
  ): Promise<AssignmentPermission> {
    // Para formulários de saúde mental - APENAS RH
    if (formType === 'mental_health') {
      if (userRole !== 'hr') {
        return {
          canAssign: false,
          canViewResults: false,
          allowedUsers: [],
          reason: 'Apenas usuários do RH podem atribuir formulários de saúde mental'
        };
      }
      
      return {
        canAssign: true,
        canViewResults: true,
        allowedUsers: targetUserIds
      };
    }

    // Para formulários de performance
    if (formType === 'performance') {
      if (userRole === 'admin') {
        // Admin pode atribuir para qualquer usuário
        return {
          canAssign: true,
          canViewResults: true,
          allowedUsers: targetUserIds
        };
      }

      if (userRole === 'manager') {
        // Gestor pode atribuir apenas para sua equipe direta
        try {
          const { data: teamMembers } = await supabase
            .from('profiles')
            .select('id')
            .eq('manager_id', currentUserId);

          const managerTeamIds = teamMembers?.map(m => m.id) || [];
          const validTargets = targetUserIds.filter(id => managerTeamIds.includes(id));

          return {
            canAssign: validTargets.length > 0,
            canViewResults: true,
            allowedUsers: validTargets,
            reason: validTargets.length !== targetUserIds.length 
              ? 'Alguns usuários não fazem parte da sua equipe direta' 
              : undefined
          };
        } catch (error) {
          console.error('Error checking manager permissions:', error);
          return {
            canAssign: false,
            canViewResults: false,
            allowedUsers: [],
            reason: 'Erro ao verificar permissões de equipe'
          };
        }
      }

      return {
        canAssign: false,
        canViewResults: false,
        allowedUsers: [],
        reason: 'Apenas administradores e gestores podem atribuir formulários de performance'
      };
    }

    return {
      canAssign: false,
      canViewResults: false,
      allowedUsers: [],
      reason: 'Tipo de formulário não reconhecido'
    };
  }

  /**
   * Cria uma atribuição de formulário
   */
  static async createAssignment(
    formId: string,
    assignedBy: string,
    assignedTo: string[],
    assignmentType: 'individual' | 'multiple' | 'all',
    formType: 'performance' | 'mental_health',
    dueDate?: string
  ): Promise<{ success: boolean; assignment?: FormAssignment; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('form_assignments')
        .insert({
          form_id: formId,
          assigned_by: assignedBy,
          assigned_to: assignedTo,
          assignment_type: assignmentType,
          form_type: formType,
          status: 'active',
          due_date: dueDate
        })
        .select(`
          *,
          assigned_by_profile:profiles!assigned_by(name),
          assigned_to_profiles:profiles!assigned_to(name)
        `)
        .single();

      if (error) throw error;

      return {
        success: true,
        assignment: {
          ...data,
          assigned_by_name: data.assigned_by_profile?.name,
          assigned_to_names: data.assigned_to_profiles?.map((p: any) => p.name)
        }
      };
    } catch (error) {
      console.error('Error creating assignment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar atribuição'
      };
    }
  }

  /**
   * Obtém atribuições que um usuário pode visualizar
   */
  static async getUserAssignments(
    userId: string,
    userRole: UserRole,
    formType?: 'performance' | 'mental_health'
  ): Promise<{ success: boolean; assignments?: FormAssignment[]; error?: string }> {
    try {
      let query = supabase
        .from('form_assignments')
        .select(`
          *,
          assigned_by_profile:profiles!assigned_by(name),
          assigned_to_profiles:profiles!assigned_to(name)
        `);

      // Filtros baseados no tipo de usuário e formulário
      if (formType) {
        query = query.eq('form_type', formType);
      }

      if (userRole === 'admin') {
        // Admin vê todas as atribuições
        query = query;
      } else if (userRole === 'hr') {
        // RH vê todas as atribuições de saúde mental e as que criou
        query = query.or(`form_type.eq.mental_health,assigned_by.eq.${userId}`);
      } else if (userRole === 'manager') {
        // Gestor vê apenas as que criou e as atribuídas para ele
        query = query.or(`assigned_by.eq.${userId},assigned_to.cs.{${userId}}`);
      } else {
        // Colaborador vê apenas as atribuídas para ele
        query = query.contains('assigned_to', [userId]);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        assignments: data?.map(assignment => ({
          ...assignment,
          assigned_by_name: assignment.assigned_by_profile?.name,
          assigned_to_names: assignment.assigned_to_profiles?.map((p: any) => p.name)
        })) || []
      };
    } catch (error) {
      console.error('Error getting user assignments:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter atribuições'
      };
    }
  }

  /**
   * Obtém usuários que podem receber atribuições baseado no tipo de formulário e usuário atual
   */
  static async getAssignableUsers(
    currentUserId: string,
    userRole: UserRole,
    formType: 'performance' | 'mental_health'
  ): Promise<{ success: boolean; users?: any[]; error?: string }> {
    try {
      let query = supabase
        .from('profiles')
        .select('id, name, email, position, team_id, manager_id')
        .eq('status', 'active');

      if (formType === 'mental_health') {
        // Para saúde mental, RH pode atribuir para qualquer usuário ativo
        if (userRole !== 'hr') {
          return {
            success: false,
            error: 'Apenas usuários do RH podem atribuir formulários de saúde mental'
          };
        }
      } else if (formType === 'performance') {
        if (userRole === 'admin') {
          // Admin pode atribuir para qualquer usuário
          query = query;
        } else if (userRole === 'manager') {
          // Gestor pode atribuir apenas para sua equipe direta
          query = query.eq('manager_id', currentUserId);
        } else {
          return {
            success: false,
            error: 'Apenas administradores e gestores podem atribuir formulários de performance'
          };
        }
      }

      const { data, error } = await query.order('name');

      if (error) throw error;

      return {
        success: true,
        users: data || []
      };
    } catch (error) {
      console.error('Error getting assignable users:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter usuários'
      };
    }
  }

  /**
   * Registra acesso a dados sensíveis para auditoria
   */
  static async logDataAccess(
    userId: string,
    dataType: 'performance' | 'mental_health',
    action: 'view' | 'assign' | 'create' | 'update' | 'delete',
    details?: string
  ): Promise<void> {
    try {
      await supabase
        .from('data_access_logs')
        .insert({
          user_id: userId,
          data_type: dataType,
          action,
          details,
          timestamp: new Date().toISOString(),
          ip_address: 'unknown', // Em produção, obter IP real
          user_agent: navigator.userAgent
        });
    } catch (error) {
      console.error('Error logging data access:', error);
      // Não falhar a operação principal por erro de log
    }
  }

  /**
   * Verifica se dados de saúde mental estão sendo acessados incorretamente
   */
  static validateDataSeparation(
    formType: 'performance' | 'mental_health',
    userRole: UserRole,
    context: 'view' | 'assign' | 'report'
  ): { valid: boolean; reason?: string } {
    // Garantir que dados de saúde mental nunca apareçam em relatórios gerenciais
    if (formType === 'mental_health' && context === 'report' && userRole !== 'hr') {
      return {
        valid: false,
        reason: 'Dados de saúde mental não podem aparecer em relatórios gerenciais'
      };
    }

    // Garantir que apenas RH acesse dados de saúde mental
    if (formType === 'mental_health' && userRole !== 'hr') {
      return {
        valid: false,
        reason: 'Apenas usuários do RH podem acessar dados de saúde mental'
      };
    }

    return { valid: true };
  }
}