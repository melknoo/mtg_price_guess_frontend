import React, { createContext, useContext } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { useAchievements } from '../hooks/useAchievements';
import AchievementToast from '../components/AchievementToast';

const AchievementContext = createContext(null);

export function AchievementProvider({ children }) {
  const { user } = useAuth();
  const achievements = useAchievements(user);

  return (
    <AchievementContext.Provider value={achievements}>
      {children}
      
      {/* Global Toast - renders at app level */}
      <AchievementToast 
        achievement={achievements.currentToast}
        onDismiss={achievements.dismissToast}
      />
    </AchievementContext.Provider>
  );
}

export function useAchievementContext() {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievementContext must be used within AchievementProvider');
  }
  return context;
}