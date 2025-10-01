import type { CalendarEvent, CalendarRequest } from '../hrCalendar';

const supabaseRequestMock = jest.fn();

interface QueryOptions {
  orderResult?: { data: any; error: any };
  singleResult?: { data: any; error: any };
  eqReturn?: any;
}

const createQueryBuilder = (options: QueryOptions = {}) => {
  const builder: any = {};

  builder.select = jest.fn().mockReturnValue(builder);
  builder.insert = jest.fn().mockReturnValue(builder);
  builder.update = jest.fn().mockReturnValue(builder);
  builder.delete = jest.fn().mockReturnValue(builder);
  builder.gte = jest.fn().mockReturnValue(builder);
  builder.lte = jest.fn().mockReturnValue(builder);
  builder.eq = jest.fn().mockImplementation(() => (options.eqReturn !== undefined ? options.eqReturn : builder));
  builder.order = jest.fn().mockResolvedValue(options.orderResult ?? { data: [], error: null });
  builder.single = jest.fn().mockResolvedValue(options.singleResult ?? { data: null, error: null });
  builder.then = jest.fn();
  builder.is = jest.fn().mockReturnValue(builder);

  return builder;
};

const loadService = async (supabaseMock: any) => {
  jest.resetModules();
  supabaseRequestMock.mockReset();
  supabaseRequestMock.mockImplementation(async (operation: any) => {
    const result = await operation();
    return result?.data ?? result;
  });

  jest.doMock('../../lib/supabase', () => ({
    supabase: supabaseMock
  }));

  jest.doMock('../api', () => ({
    supabaseRequest: supabaseRequestMock
  }));

  const module = await import('../hrCalendar');
  return module.hrCalendarService;
};

const createSupabaseMock = (handlers: { [table: string]: any }, rpcMock?: jest.Mock) => ({
  from: jest.fn((table: string) => {
    if (!handlers[table]) {
      throw new Error(`Unhandled table ${table}`);
    }
    return handlers[table];
  }),
  rpc: rpcMock ?? jest.fn()
});

describe('hrCalendarService', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe('getEvents', () => {
    it('applies filters and returns events from Supabase', async () => {
      const events: CalendarEvent[] = [
        {
          id: 'evt-1',
          type: 'ferias',
          title: 'Férias João',
          start_date: '2024-01-01',
          end_date: '2024-01-10',
          all_day: true,
          category: 'vacation',
          status: 'approved',
          is_public: true,
          color: '#F59E0B',
          created_at: '2023-12-01',
          updated_at: '2023-12-01'
        } as CalendarEvent
      ];

      const eventsQuery = createQueryBuilder({
        orderResult: { data: events, error: null }
      });

      const supabaseMock = createSupabaseMock({
        calendar_events: eventsQuery
      });

      const service = await loadService(supabaseMock as any);

      const filters = {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        type: 'ferias',
        user_id: 'user-1',
        team_id: 'team-1',
        is_public: true
      };

      const result = await service.getEvents(filters);

      expect(supabaseMock.from).toHaveBeenCalledWith('calendar_events');
      expect(eventsQuery.gte).toHaveBeenCalledWith('start_date', filters.start_date);
      expect(eventsQuery.lte).toHaveBeenCalledWith('end_date', filters.end_date);
      expect(eventsQuery.eq).toHaveBeenCalledWith('type', filters.type);
      expect(eventsQuery.eq).toHaveBeenCalledWith('user_id', filters.user_id);
      expect(eventsQuery.eq).toHaveBeenCalledWith('team_id', filters.team_id);
      expect(eventsQuery.eq).toHaveBeenCalledWith('is_public', filters.is_public);
      expect(supabaseRequestMock).toHaveBeenCalledWith(expect.any(Function), 'getCalendarEvents');
      expect(result).toEqual(events);
    });

    it('returns empty array and logs warning when Supabase is unavailable', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

      const service = await loadService(null);
      const result = await service.getEvents();

      expect(result).toEqual([]);
      expect(warnSpy).toHaveBeenCalledWith('📅 HRCalendar: Supabase not available');
      expect(supabaseRequestMock).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });
  });

  describe('getRequests', () => {
    it('applies filters and returns requests ordered by creation date', async () => {
      const requests: CalendarRequest[] = [
        {
          id: 'req-1',
          event_type: 'ferias',
          requester_id: 'user-1',
          start_date: '2024-02-01',
          end_date: '2024-02-10',
          reason: 'Viagem',
          status: 'pending',
          days_requested: 7,
          created_at: '2023-12-15',
          updated_at: '2023-12-15'
        } as CalendarRequest
      ];

      const requestsQuery = createQueryBuilder({
        orderResult: { data: requests, error: null }
      });

      const supabaseMock = createSupabaseMock({
        calendar_requests: requestsQuery
      });

      const service = await loadService(supabaseMock as any);

      const filters = {
        requester_id: 'user-1',
        status: 'pending',
        event_type: 'ferias'
      };

      const result = await service.getRequests(filters);

      expect(supabaseMock.from).toHaveBeenCalledWith('calendar_requests');
      expect(requestsQuery.eq).toHaveBeenCalledWith('requester_id', filters.requester_id);
      expect(requestsQuery.eq).toHaveBeenCalledWith('status', filters.status);
      expect(requestsQuery.eq).toHaveBeenCalledWith('event_type', filters.event_type);
      expect(requestsQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(supabaseRequestMock).toHaveBeenCalledWith(expect.any(Function), 'getCalendarRequests');
      expect(result).toEqual(requests);
    });
  });

  describe('event mutations', () => {
    it('creates events using Supabase and returns the created record', async () => {
      const createdEvent = {
        id: 'evt-123',
        type: 'evento',
        title: 'Workshop',
        start_date: '2024-03-01',
        end_date: '2024-03-01',
        all_day: false,
        category: 'training',
        status: 'confirmed',
        is_public: true,
        color: '#000000',
        created_at: '2024-02-10',
        updated_at: '2024-02-10'
      } as CalendarEvent;

      const eventsQuery = createQueryBuilder({
        singleResult: { data: createdEvent, error: null }
      });

      const supabaseMock = createSupabaseMock({
        calendar_events: eventsQuery
      });

      const service = await loadService(supabaseMock as any);

      const input = {
        type: 'evento',
        title: 'Workshop',
        start_date: '2024-03-01',
        end_date: '2024-03-01',
        all_day: false,
        category: 'training',
        status: 'confirmed',
        is_public: true,
        color: '#000000'
      } as Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>;

      const result = await service.createEvent(input);

      expect(eventsQuery.insert).toHaveBeenCalledWith(input);
      expect(eventsQuery.select).toHaveBeenCalled();
      expect(eventsQuery.single).toHaveBeenCalled();
      expect(supabaseRequestMock).toHaveBeenCalledWith(expect.any(Function), 'createCalendarEvent');
      expect(result).toEqual(createdEvent);
    });

    it('updates events based on identifier', async () => {
      const updatedEvent = {
        id: 'evt-10',
        type: 'ferias',
        title: 'Férias atualizadas',
        start_date: '2024-04-01',
        end_date: '2024-04-10',
        all_day: true,
        category: 'vacation',
        status: 'approved',
        is_public: true,
        color: '#F59E0B',
        created_at: '2024-02-01',
        updated_at: '2024-02-15'
      } as CalendarEvent;

      const eventsQuery = createQueryBuilder({
        singleResult: { data: updatedEvent, error: null }
      });

      const supabaseMock = createSupabaseMock({
        calendar_events: eventsQuery
      });

      const service = await loadService(supabaseMock as any);

      const updates: Partial<CalendarEvent> = {
        title: 'Férias atualizadas',
        status: 'approved'
      };

      const result = await service.updateEvent('evt-10', updates);

      expect(eventsQuery.update).toHaveBeenCalledWith(updates);
      expect(eventsQuery.eq).toHaveBeenCalledWith('id', 'evt-10');
      expect(eventsQuery.select).toHaveBeenCalled();
      expect(eventsQuery.single).toHaveBeenCalled();
      expect(result).toEqual(updatedEvent);
      expect(supabaseRequestMock).toHaveBeenCalledWith(expect.any(Function), 'updateCalendarEvent');
    });

    it('deletes events using Supabase', async () => {
      const eventsQuery = createQueryBuilder({
        eqReturn: Promise.resolve({ data: null, error: null })
      });

      const supabaseMock = createSupabaseMock({
        calendar_events: eventsQuery
      });

      const service = await loadService(supabaseMock as any);

      await service.deleteEvent('evt-9');

      expect(eventsQuery.delete).toHaveBeenCalled();
      expect(eventsQuery.eq).toHaveBeenCalledWith('id', 'evt-9');
      expect(supabaseRequestMock).toHaveBeenCalledWith(expect.any(Function), 'deleteCalendarEvent');
    });
  });

  describe('RPC helpers', () => {
    it('validates vacation request via RPC', async () => {
      const rpcMock = jest.fn().mockResolvedValue({ data: { valid: true }, error: null });
      const supabaseMock = createSupabaseMock({}, rpcMock);
      const service = await loadService(supabaseMock as any);

      const result = await service.validateVacationRequest('user-1', '2024-05-01', '2024-05-10', 7);

      expect(rpcMock).toHaveBeenCalledWith('validate_vacation_request', {
        requester_id: 'user-1',
        start_date: '2024-05-01',
        end_date: '2024-05-10',
        days_requested: 7
      });
      expect(result).toEqual({ valid: true });
    });

    it('throws when vacation validation RPC returns error', async () => {
      const rpcError = new Error('validation failed');
      const rpcMock = jest.fn().mockResolvedValue({ data: null, error: rpcError });
      const supabaseMock = createSupabaseMock({}, rpcMock);
      const service = await loadService(supabaseMock as any);

      await expect(
        service.validateVacationRequest('user-1', '2024-05-01', '2024-05-10', 7)
      ).rejects.toThrow('validation failed');
      expect(rpcMock).toHaveBeenCalled();
    });

    it('calculates business days and returns zero on RPC failure', async () => {
      const rpcMock = jest.fn()
        .mockResolvedValueOnce({ data: 5, error: null })
        .mockResolvedValueOnce({ data: null, error: new Error('rpc failed') });

      const supabaseMock = createSupabaseMock({}, rpcMock);
      const service = await loadService(supabaseMock as any);

      const success = await service.calculateBusinessDays('2024-06-01', '2024-06-10');
      expect(success).toBe(5);

      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const fallback = await service.calculateBusinessDays('2024-07-01', '2024-07-05');
      expect(fallback).toBe(0);
      expect(errorSpy).toHaveBeenCalledWith('📅 HRCalendar: Error calculating business days:', expect.any(Error));
      errorSpy.mockRestore();

      expect(rpcMock).toHaveBeenNthCalledWith(1, 'calculate_business_days', {
        start_date: '2024-06-01',
        end_date: '2024-06-10'
      });
      expect(rpcMock).toHaveBeenNthCalledWith(2, 'calculate_business_days', {
        start_date: '2024-07-01',
        end_date: '2024-07-05'
      });
    });
  });

  describe('automatic generation helpers', () => {
    it('returns RPC data for birthday events and falls back to zero on error', async () => {
      const rpcMock = jest.fn()
        .mockResolvedValueOnce({ data: 4, error: null })
        .mockResolvedValueOnce({ data: null, error: new Error('birthday failure') });

      const supabaseMock = createSupabaseMock({}, rpcMock);
      const service = await loadService(supabaseMock as any);

      const created = await service.createBirthdayEvents();
      expect(created).toBe(4);

      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const fallback = await service.createBirthdayEvents();
      expect(fallback).toBe(0);
      expect(errorSpy).toHaveBeenCalledWith('📅 HRCalendar: Error creating birthday events:', expect.any(Error));
      errorSpy.mockRestore();

      expect(rpcMock).toHaveBeenNthCalledWith(1, 'create_birthday_events');
      expect(rpcMock).toHaveBeenNthCalledWith(2, 'create_birthday_events');
    });

    it('returns RPC data for company anniversary events and falls back to zero on error', async () => {
      const rpcMock = jest.fn()
        .mockResolvedValueOnce({ data: 2, error: null })
        .mockResolvedValueOnce({ data: null, error: new Error('anniversary failure') });

      const supabaseMock = createSupabaseMock({}, rpcMock);
      const service = await loadService(supabaseMock as any);

      const created = await service.createCompanyAnniversaryEvents();
      expect(created).toBe(2);

      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      const fallback = await service.createCompanyAnniversaryEvents();
      expect(fallback).toBe(0);
      expect(errorSpy).toHaveBeenCalledWith('📅 HRCalendar: Error creating anniversary events:', expect.any(Error));
      errorSpy.mockRestore();

      expect(rpcMock).toHaveBeenNthCalledWith(1, 'create_company_anniversary_events');
      expect(rpcMock).toHaveBeenNthCalledWith(2, 'create_company_anniversary_events');
    });
  });
});
