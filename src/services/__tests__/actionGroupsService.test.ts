import { actionGroupService } from '../actionGroups';
import { supabase } from '../../lib/supabase';
import { supabaseRequest } from '../api';
import { notificationService } from '../notifications';

type MockedSupabaseRequest = jest.MockedFunction<typeof supabaseRequest>;

jest.mock('../../lib/supabase', () => {
  const from = jest.fn();
  return {
    supabase: {
      from
    }
  };
});

jest.mock('../api', () => ({
  supabaseRequest: jest.fn()
}));

jest.mock('../notifications', () => ({
  notificationService: {
    createNotification: jest.fn()
  }
}));

const mockSupabase = supabase as unknown as { from: jest.Mock };
const mockSupabaseRequest = supabaseRequest as MockedSupabaseRequest;
const mockNotificationService = notificationService as jest.Mocked<typeof notificationService>;

describe('ActionGroupService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.from.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getActionGroups', () => {
    it('should enrich groups with calculated progress and contributions', async () => {
      const groups = [
        {
          id: 'group-1',
          title: 'Transformação Digital',
          description: 'Implementar novas soluções',
          deadline: '2025-12-31',
          status: 'active',
          progress: 0,
          created_by: 'leader-1',
          created_at: '2024-01-10T00:00:00.000Z',
          updated_at: '2024-01-10T00:00:00.000Z',
          linked_pdi_id: null,
          participants: [
            {
              id: 'participant-1',
              profile_id: 'leader-1',
              role: 'leader',
              created_at: '2024-01-10T00:00:00.000Z',
              profile: {
                id: 'leader-1',
                name: 'Líder',
                avatar_url: null,
                position: 'Manager',
                email: 'lider@example.com'
              }
            },
            {
              id: 'participant-2',
              profile_id: 'member-1',
              role: 'member',
              created_at: '2024-01-10T00:00:00.000Z',
              profile: {
                id: 'member-1',
                name: 'Membro',
                avatar_url: null,
                position: 'Analista',
                email: 'membro@example.com'
              }
            }
          ],
          tasks: [
            {
              id: 'task-1',
              title: 'Planejamento',
              description: null,
              assignee_id: 'leader-1',
              group_id: 'group-1',
              deadline: '2025-11-01',
              status: 'done',
              created_at: '2024-01-11T00:00:00.000Z',
              updated_at: '2024-01-11T00:00:00.000Z',
              assignee: {
                id: 'leader-1',
                name: 'Líder',
                avatar_url: null
              }
            },
            {
              id: 'task-2',
              title: 'Execução',
              description: null,
              assignee_id: 'member-1',
              group_id: 'group-1',
              deadline: '2025-11-30',
              status: 'in-progress',
              created_at: '2024-01-11T00:00:00.000Z',
              updated_at: '2024-01-11T00:00:00.000Z',
              assignee: {
                id: 'member-1',
                name: 'Membro',
                avatar_url: null
              }
            }
          ]
        }
      ];

      mockSupabaseRequest.mockResolvedValueOnce(groups as any);

      const result = await actionGroupService.getActionGroups();

      expect(mockSupabaseRequest).toHaveBeenCalledWith(expect.any(Function), 'getActionGroups');
      expect(result[0].progress).toBe(50);
      expect(result[0].total_tasks).toBe(2);
      expect(result[0].completed_tasks).toBe(1);
      expect(result[0].member_contributions).toHaveLength(2);
      expect(result[0].member_contributions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ profile_id: 'leader-1', completion_rate: 100 }),
          expect.objectContaining({ profile_id: 'member-1', completion_rate: 0 })
        ])
      );
    });
  });

  describe('createGroup', () => {
    it('should validate required fields before creating', async () => {
      await expect(
        actionGroupService.createGroup(
          {
            title: '',
            description: 'Descrição',
            deadline: '2025-12-31',
            participants: []
          },
          'creator-1'
        )
      ).rejects.toThrow('Título do grupo é obrigatório');
    });

    it('should create group, include creator as leader and notify participants', async () => {
      const createdGroup = {
        id: 'group-2',
        title: 'Novo Grupo',
        description: 'Detalhes do novo grupo',
        deadline: '2025-12-31',
        status: 'active',
        created_by: 'creator-1',
        created_at: '2024-02-01T00:00:00.000Z',
        updated_at: '2024-02-01T00:00:00.000Z',
        linked_pdi_id: null
      };

      mockSupabaseRequest.mockImplementation(async (_operation, context) => {
        if (context === 'createActionGroup') {
          return createdGroup as any;
        }
        throw new Error(`Unexpected context: ${context}`);
      });

      const addParticipantSpy = jest
        .spyOn(actionGroupService, 'addParticipant')
        .mockResolvedValue();
      const getDetailsSpy = jest
        .spyOn(actionGroupService, 'getGroupWithDetails')
        .mockResolvedValue({
          ...createdGroup,
          participants: [],
          tasks: [],
          member_contributions: [],
          total_tasks: 0,
          completed_tasks: 0,
          progress: 0
        } as any);

      const groupData = {
        title: ' Novo Grupo ',
        description: '  Detalhes do novo grupo ',
        deadline: '2025-12-31',
        participants: ['creator-1', 'member-2']
      };

      const result = await actionGroupService.createGroup(groupData, 'creator-1');

      expect(mockSupabaseRequest).toHaveBeenCalledWith(expect.any(Function), 'createActionGroup');
      expect(addParticipantSpy).toHaveBeenCalledWith('group-2', 'creator-1', 'leader');
      expect(addParticipantSpy).toHaveBeenCalledWith('group-2', 'member-2', 'member');
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          profile_id: 'member-2',
          title: 'Adicionado a um Grupo de Ação',
          related_id: 'group-2'
        })
      );
      expect(getDetailsSpy).toHaveBeenCalledWith('group-2');
      expect(result.id).toBe('group-2');

      addParticipantSpy.mockRestore();
      getDetailsSpy.mockRestore();
    });
  });

  describe('completeGroup', () => {
    it('should block completion when progress is below 100%', async () => {
      jest.spyOn(actionGroupService, 'getGroupWithDetails').mockResolvedValue({
        id: 'group-1',
        title: 'Grupo Incompleto',
        description: 'Em andamento',
        deadline: '2025-12-31',
        status: 'active',
        progress: 80,
        created_by: 'leader-1',
        created_at: '2024-01-10T00:00:00.000Z',
        updated_at: '2024-01-10T00:00:00.000Z',
        linked_pdi_id: null,
        participants: [],
        tasks: [],
        member_contributions: [],
        total_tasks: 2,
        completed_tasks: 1
      } as any);

      await expect(actionGroupService.completeGroup('group-1')).rejects.toThrow(
        'Todas as tarefas devem estar concluídas antes de finalizar o grupo'
      );
    });

    it('should mark group as completed and update linked PDI', async () => {
      const eqMock = jest.fn().mockResolvedValue({ data: null, error: null });
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'pdis') {
          return {
            update: jest.fn().mockReturnValue({ eq: eqMock })
          } as any;
        }
        throw new Error(`Unexpected table ${table}`);
      });

      mockSupabaseRequest.mockImplementation(async (_operation, context) => {
        if (context === 'completeActionGroup') {
          return {} as any;
        }
        throw new Error(`Unexpected context: ${context}`);
      });

      const participants = [
        {
          id: 'participant-1',
          profile_id: 'leader-1',
          role: 'leader',
          created_at: '2024-01-10T00:00:00.000Z',
          profile: {
            id: 'leader-1',
            name: 'Líder',
            avatar_url: null,
            position: 'Manager',
            email: 'lider@example.com'
          }
        }
      ];

      jest.spyOn(actionGroupService, 'getGroupWithDetails').mockResolvedValue({
        id: 'group-1',
        title: 'Grupo Completo',
        description: 'Todas as tarefas finalizadas',
        deadline: '2025-12-31',
        status: 'active',
        progress: 100,
        created_by: 'leader-1',
        created_at: '2024-01-10T00:00:00.000Z',
        updated_at: '2024-01-10T00:00:00.000Z',
        linked_pdi_id: 'pdi-123',
        participants,
        tasks: [],
        member_contributions: [],
        total_tasks: 1,
        completed_tasks: 1
      } as any);

      await actionGroupService.completeGroup('group-1');

      expect(mockSupabaseRequest).toHaveBeenCalledWith(expect.any(Function), 'completeActionGroup');
      expect(eqMock).toHaveBeenCalledWith('id', 'pdi-123');
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          profile_id: 'leader-1',
          title: 'Grupo de Ação Concluído',
          related_id: 'group-1'
        })
      );
    });
  });

  describe('participant and task operations', () => {
    it('should prevent removing participant with pending tasks', async () => {
      mockSupabaseRequest.mockImplementation(async (_operation, context) => {
        if (context === 'checkParticipantTasks') {
          return [
            { id: 'task-1', status: 'in-progress' }
          ] as any;
        }
        throw new Error(`Unexpected context: ${context}`);
      });

      await expect(
        actionGroupService.removeParticipant('group-1', 'member-1')
      ).rejects.toThrow(
        'Participante possui tarefas pendentes. Reatribua ou conclua as tarefas antes de remover.'
      );
    });

    it('should throw friendly error when task creation fails', async () => {
      jest.spyOn(actionGroupService, 'getGroupParticipants').mockResolvedValue([
        {
          id: 'participant-1',
          profile_id: 'member-1',
          group_id: 'group-1',
          role: 'member',
          created_at: '2024-01-10T00:00:00.000Z',
          profile: {
            id: 'member-1',
            name: 'Membro',
            avatar_url: null,
            position: 'Analista',
            email: 'membro@example.com'
          }
        }
      ]);

      mockSupabaseRequest.mockImplementation(async (_operation, context) => {
        if (context === 'createGroupTask') {
          throw 'database offline';
        }
        throw new Error(`Unexpected context: ${context}`);
      });

      await expect(
        actionGroupService.createTask({
          title: 'Nova tarefa',
          description: 'Detalhes',
          assignee_id: 'member-1',
          deadline: '2025-10-10',
          group_id: 'group-1'
        })
      ).rejects.toThrow('Erro ao criar tarefa');
      expect(mockNotificationService.createNotification).not.toHaveBeenCalled();
    });
  });
});
