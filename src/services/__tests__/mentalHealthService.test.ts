import { mentalHealthService } from '../mentalHealth';
import { supabase } from '../../lib/supabase';
import { supabaseRequest } from '../api';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'psych-1' } },
        error: null
      })
    }
  }
}));

jest.mock('../api', () => ({
  supabaseRequest: jest.fn()
}));

type MockSupabase = {
  from: jest.Mock;
  auth: {
    getUser: jest.Mock;
  };
};

const mockSupabase = supabase as unknown as MockSupabase;
const mockSupabaseRequest = supabaseRequest as jest.MockedFunction<typeof supabaseRequest>;

describe('mentalHealthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSessions', () => {
    it('filters sessions by employee and psychologist', async () => {
      const orderMock = jest.fn().mockResolvedValue({ data: [{ id: 'session-1' }], error: null });
      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: orderMock
      };

      mockSupabase.from.mockReturnValue(queryBuilder);
      mockSupabaseRequest.mockImplementation(async (operation) => {
        const result = await operation();
        return result.data;
      });

      const sessions = await mentalHealthService.getSessions('employee-1', 'psych-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('psychology_sessions');
      expect(queryBuilder.select).toHaveBeenCalled();
      expect(queryBuilder.eq).toHaveBeenNthCalledWith(1, 'employee_id', 'employee-1');
      expect(queryBuilder.eq).toHaveBeenNthCalledWith(2, 'psychologist_id', 'psych-1');
      expect(orderMock).toHaveBeenCalledWith('scheduled_date', { ascending: false });
      expect(sessions).toEqual([{ id: 'session-1' }]);
    });
  });

  describe('session requests', () => {
    it('creates a session request through supabaseRequest', async () => {
      const createdRequest = { id: 'request-1', employee_id: 'employee-1' } as any;
      const singleMock = jest.fn().mockResolvedValue({ data: createdRequest, error: null });
      const queryBuilder = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: singleMock
      };

      mockSupabase.from.mockReturnValue(queryBuilder);
      mockSupabaseRequest.mockImplementation(async (operation) => {
        const result = await operation();
        return result.data;
      });

      const payload = {
        employee_id: 'employee-1',
        urgency: 'normal',
        preferred_type: 'online',
        reason: 'Preciso de suporte',
        preferred_times: ['09:00'],
        status: 'pendente'
      } as any;

      const result = await mentalHealthService.createSessionRequest(payload);

      expect(mockSupabase.from).toHaveBeenCalledWith('session_requests');
      expect(mockSupabaseRequest).toHaveBeenCalledWith(expect.any(Function), 'createSessionRequest');
      expect(queryBuilder.insert).toHaveBeenCalledWith(payload);
      expect(singleMock).toHaveBeenCalled();
      expect(result).toEqual(createdRequest);
    });

    it('updates a session request with the provided data', async () => {
      const updatedRequest = { id: 'request-1', status: 'aceita' } as any;
      const singleMock = jest.fn().mockResolvedValue({ data: updatedRequest, error: null });
      const queryBuilder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: singleMock
      };

      mockSupabase.from.mockReturnValue(queryBuilder);
      mockSupabaseRequest.mockImplementation(async (operation) => {
        const result = await operation();
        return result.data;
      });

      const result = await mentalHealthService.updateSessionRequest('request-1', { status: 'aceita' });

      expect(mockSupabase.from).toHaveBeenCalledWith('session_requests');
      expect(mockSupabaseRequest).toHaveBeenCalledWith(expect.any(Function), 'updateSessionRequest');
      expect(queryBuilder.update).toHaveBeenCalledWith({ status: 'aceita' });
      expect(queryBuilder.eq).toHaveBeenCalledWith('id', 'request-1');
      expect(result).toEqual(updatedRequest);
    });
  });

  describe('getFormResponses', () => {
    it('calculates risk level based on score', async () => {
      const orderMock = jest.fn().mockResolvedValue({ data: [], error: null });
      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: orderMock
      };

      mockSupabase.from.mockReturnValue(queryBuilder);
      mockSupabaseRequest.mockImplementation(async (operation) => {
        await operation();
        return [
          { id: '1', score: 85 },
          { id: '2', score: 65 },
          { id: '3', score: 45 },
          { id: '4', score: 10 }
        ] as any;
      });

      const responses = await mentalHealthService.getFormResponses('employee-1');

      expect(queryBuilder.eq).toHaveBeenCalledWith('employee_id', 'employee-1');
      expect(responses).toEqual([
        expect.objectContaining({ id: '1', risk_level: 'critico' }),
        expect.objectContaining({ id: '2', risk_level: 'alto' }),
        expect.objectContaining({ id: '3', risk_level: 'medio' }),
        expect.objectContaining({ id: '4', risk_level: 'baixo' })
      ]);
    });
  });

  describe('resolveAlert', () => {
    it('updates alert as resolved with notes', async () => {
      const resolvedAlert = { id: 'alert-1', resolution_notes: 'Resolvido' } as any;
      const singleMock = jest.fn().mockResolvedValue({ data: resolvedAlert, error: null });
      const queryBuilder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: singleMock
      };

      mockSupabase.from.mockReturnValue(queryBuilder);
      mockSupabaseRequest.mockImplementation(async (operation) => {
        const result = await operation();
        return result.data;
      });

      const result = await mentalHealthService.resolveAlert('alert-1', 'Acompanhamento concluído');

      expect(mockSupabase.from).toHaveBeenCalledWith('mental_health_alerts');
      expect(mockSupabaseRequest).toHaveBeenCalledWith(expect.any(Function), 'resolveAlert');
      expect(queryBuilder.update).toHaveBeenCalledWith(expect.objectContaining({
        resolution_notes: 'Acompanhamento concluído'
      }));
      expect(queryBuilder.eq).toHaveBeenCalledWith('id', 'alert-1');
      expect(result).toEqual(resolvedAlert);
    });
  });

  describe('getMentalHealthStats', () => {
    it('aggregates stats using Promise.all results', async () => {
      const profilesSelect = jest.fn().mockResolvedValue({ data: null, error: null, count: 25 });
      const checkinsSelect = jest.fn().mockResolvedValue({ data: [{ mood_rating: 8 }, { mood_rating: 6 }, { mood_rating: 7 }], error: null });
      const sessionsGte = jest.fn().mockResolvedValue({ data: null, error: null, count: 3 });
      const responsesSelect = jest.fn().mockResolvedValue({ data: [{ score: 72 }, { score: 38 }, { score: 65 }], error: null });
      const alertsIs = jest.fn().mockResolvedValue({ data: null, error: null, count: 2 });

      mockSupabase.from.mockImplementation((table: string) => {
        switch (table) {
          case 'profiles':
            return { select: profilesSelect } as any;
          case 'emotional_checkins':
            return { select: checkinsSelect } as any;
          case 'psychology_sessions':
            return {
              select: jest.fn().mockReturnValue({ gte: sessionsGte })
            } as any;
          case 'form_responses':
            return { select: responsesSelect } as any;
          case 'mental_health_alerts':
            return {
              select: jest.fn().mockReturnValue({ is: alertsIs })
            } as any;
          default:
            throw new Error(`Unexpected table ${table}`);
        }
      });

      const stats = await mentalHealthService.getMentalHealthStats();

      expect(stats).toEqual({
        total_employees_participating: 25,
        average_mood_score: 7,
        sessions_this_month: 3,
        high_risk_responses: 2,
        active_alerts: 2,
        wellness_resources_accessed: 0
      });
    });

    it('returns default stats when an error occurs', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockRejectedValue(new Error('supabase offline'))
      }) as any);

      const stats = await mentalHealthService.getMentalHealthStats();

      expect(stats).toEqual({
        total_employees_participating: 0,
        average_mood_score: 0,
        sessions_this_month: 0,
        high_risk_responses: 0,
        active_alerts: 0,
        wellness_resources_accessed: 0
      });
    });
  });

  describe('getWellnessResources', () => {
    it('applies category filter when provided', async () => {
      const orderMock = jest.fn().mockResolvedValue({ data: [{ id: 'resource-1' }], error: null });
      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: orderMock
      };

      mockSupabase.from.mockReturnValue(queryBuilder);
      mockSupabaseRequest.mockImplementation(async (operation) => {
        const result = await operation();
        return result.data;
      });

      const resources = await mentalHealthService.getWellnessResources('mindfulness');

      expect(mockSupabase.from).toHaveBeenCalledWith('wellness_resources');
      expect(queryBuilder.eq).toHaveBeenCalledWith('category', 'mindfulness');
      expect(resources).toEqual([{ id: 'resource-1' }]);
    });
  });

  describe('badge helpers', () => {
    it('returns correct badges for risk level and urgency', () => {
      expect(mentalHealthService.getRiskLevelBadge('baixo')).toBe('success');
      expect(mentalHealthService.getRiskLevelBadge('medio')).toBe('warning');
      expect(mentalHealthService.getRiskLevelBadge('alto')).toBe('danger');
      expect(mentalHealthService.getRiskLevelBadge('critico')).toBe('danger');
      expect(mentalHealthService.getRiskLevelBadge('desconhecido')).toBe('default');

      expect(mentalHealthService.getUrgencyBadge('normal')).toBe('info');
      expect(mentalHealthService.getUrgencyBadge('prioritaria')).toBe('warning');
      expect(mentalHealthService.getUrgencyBadge('emergencial')).toBe('danger');
      expect(mentalHealthService.getUrgencyBadge('desconhecida')).toBe('default');
    });
  });
});
