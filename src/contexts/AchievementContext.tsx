import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { achievementService, AchievementNotification } from '../services/achievements';
import { memoryMonitor } from '../utils/memoryMonitor';

interface AchievementContextType {
  newAchievement: AchievementNotification | null;
  clearAchievement: () => void;
  checkAchievements: () => Promise<void>;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

export const useAchievements = () => {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievements must be used within an AchievementProvider');
  }
  return context;
};

export const AchievementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [newAchievement, setNewAchievement] = useState<AchievementNotification | null>(null);
  const subscriptionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Log memory usage on component mount
    memoryMonitor.logMemoryUsage('AchievementContext', 'Component mounted');

    if (user) {
      // Subscribe to new achievements
      subscriptionRef.current = achievementService.subscribeToAchievements(
        user.id,
        (achievement) => {
          console.log('🏆 AchievementContext: New achievement received:', achievement);
          setNewAchievement(achievement);
          memoryMonitor.logMemoryUsage('AchievementContext', 'New achievement received');
        }
      );

      memoryMonitor.logMemoryUsage('AchievementContext', `Subscribed to achievements for user: ${user.id}`);
    }

    return () => {
      // Clean up subscription
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
        memoryMonitor.logMemoryUsage('AchievementContext', 'Achievement subscription cleaned up');
      }

      // Clean up any pending timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      memoryMonitor.logMemoryUsage('AchievementContext', 'Component unmounted - cleanup complete');
    };
  }, [user]);

  const clearAchievement = () => {
    setNewAchievement(null);
  };

  const checkAchievements = async () => {
    if (!user) return;
    
    try {
      await achievementService.manualCheckAchievements(user.id);
      memoryMonitor.logMemoryUsage('AchievementContext', 'Manual achievement check completed');
      
      // Also check for career progression when checking achievements
      timeoutRef.current = setTimeout(async () => {
        try {
          const { careerTrackService } = await import('../services/careerTrack');
          await careerTrackService.checkProgression(user.id);
          memoryMonitor.logMemoryUsage('AchievementContext', 'Career progression check completed');
        } catch (error) {
          console.error('Error checking career progression from achievements:', error);
        }
      }, 500);
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  const value: AchievementContextType = {
    newAchievement,
    clearAchievement,
    checkAchievements
  };

  return (
    <AchievementContext.Provider value={value}>
      {children}
    </AchievementContext.Provider>
  );
};