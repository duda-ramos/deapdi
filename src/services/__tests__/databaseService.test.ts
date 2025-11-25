// Mock api service first
jest.mock('../api');

import { databaseService } from '../database';
import { supabase } from '../../lib/supabase';

// Mock Supabase
jest.mock('../../lib/supabase');
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('DatabaseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfiles', () => {
    it('should fetch profiles successfully', async () => {
      const mockProfiles = [
        { id: '1', name: 'John Doe', email: 'john@example.com' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({ data: mockProfiles, error: null })
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const result = await databaseService.getProfiles();

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(result).toEqual(mockProfiles);
    });

    it('should handle database errors', async () => {
      const mockError = new Error('Database connection failed');
      
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({ data: null, error: mockError })
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      await expect(databaseService.getProfiles()).rejects.toThrow('Database connection failed');
    });
  });

  describe('createPDI', () => {
    it('should create PDI successfully', async () => {
      const mockPDI = {
        title: 'Learn React',
        description: 'Master React fundamentals',
        deadline: '2024-12-31',
        profile_id: '123',
        created_by: '123',
        status: 'pending' as const,
        points: 100,
        mentor_id: null,
        validated_by: null
      };

      const mockCreatedPDI = { id: '456', ...mockPDI };

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockCreatedPDI, error: null })
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const result = await databaseService.createPDI(mockPDI);

      expect(mockSupabase.from).toHaveBeenCalledWith('pdis');
      expect(mockQuery.insert).toHaveBeenCalledWith(mockPDI);
      expect(result).toEqual(mockCreatedPDI);
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const profileId = '123';
      const updates = { name: 'Updated Name', bio: 'Updated bio' };
      const mockUpdatedProfile = { id: profileId, ...updates };

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUpdatedProfile, error: null })
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const result = await databaseService.updateProfile(profileId, updates);

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockQuery.update).toHaveBeenCalledWith(updates);
      expect(mockQuery.eq).toHaveBeenCalledWith('id', profileId);
      expect(result).toEqual(mockUpdatedProfile);
    });
  });
});