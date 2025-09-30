import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { achievementService, AchievementNotification } from '../services/achievements';

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

  useEffect(() => {
    if (!user) return;

    let isCleanedUp = false;

    // Subscribe to new achievements
    const subscription = achievementService.subscribeToAchievements(
      user.id,
      (achievement) => {
        if (isCleanedUp) return;

        try {
          console.log('🏆 AchievementContext: New achievement received:', achievement);
          setNewAchievement(achievement);
        } catch (error) {
          console.error('🏆 AchievementContext: Error setting achievement:', error);
        }
      }
    );

    return () => {
      isCleanedUp = true;
      console.log('🏆 AchievementContext: Cleaning up subscription');

      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.error('🏆 AchievementContext: Error unsubscribing:', error);
        }
      }
    };
  }, [user]);

  const clearAchievement = () => {
    setNewAchievement(null);
  };

  const checkAchievements = async () => {
    if (!user) return;
    
    try {
      await achievementService.manualCheckAchievements(user.id);
      
      // Also check for career progression when checking achievements
      setTimeout(async () => {
        try {
          const { careerTrackService } = await import('../services/careerTrack');
          await careerTrackService.checkProgression(user.id);
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