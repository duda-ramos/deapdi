// Analytics utility functions

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export const analytics = {
  // Track page views
  trackPageView(pageName: string, userId?: string) {
    if (import.meta.env.VITE_ANALYTICS_ID && import.meta.env.PROD) {
      window.gtag?.('config', import.meta.env.VITE_ANALYTICS_ID, {
        page_title: pageName,
        page_location: window.location.href,
        user_id: userId
      });
    }
  },

  // Track custom events
  trackEvent(eventName: string, parameters?: Record<string, any>) {
    if (import.meta.env.VITE_ANALYTICS_ID && import.meta.env.PROD) {
      window.gtag?.('event', eventName, {
        event_category: 'user_interaction',
        event_label: eventName,
        ...parameters
      });
    }
  },

  // Track user actions
  trackUserAction(action: string, category: string, label?: string, value?: number) {
    this.trackEvent('user_action', {
      action,
      category,
      label,
      value
    });
  },

  // Track PDI events
  trackPDI(action: 'created' | 'completed' | 'validated', pdiId: string) {
    this.trackEvent('pdi_action', {
      action,
      pdi_id: pdiId,
      event_category: 'pdi'
    });
  },

  // Track competency evaluations
  trackCompetencyEvaluation(competencyName: string, rating: number, type: 'self' | 'manager') {
    this.trackEvent('competency_evaluation', {
      competency_name: competencyName,
      rating,
      evaluation_type: type,
      event_category: 'competency'
    });
  },

  // Track achievement unlocks
  trackAchievement(achievementTitle: string, points: number) {
    this.trackEvent('achievement_unlocked', {
      achievement_title: achievementTitle,
      points,
      event_category: 'gamification'
    });
  }
};