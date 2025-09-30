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
    if (import.meta.env.VITE_ANALYTICS_ID && import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
      window.gtag?.('config', import.meta.env.VITE_ANALYTICS_ID, {
        page_title: pageName,
        page_location: window.location.href,
        user_id: userId,
        custom_map: {
          user_role: 'dimension1'
        }
      });
    }
  },

  // Track custom events
  trackEvent(eventName: string, parameters?: Record<string, any>) {
    if (import.meta.env.VITE_ANALYTICS_ID && import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
      window.gtag?.('event', eventName, {
        event_category: 'user_interaction',
        event_label: eventName,
        send_to: import.meta.env.VITE_ANALYTICS_ID,
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
      value,
      timestamp: Date.now()
    });
  },

  // Track PDI events
  trackPDI(action: 'created' | 'completed' | 'validated', pdiId: string) {
    this.trackEvent('pdi_action', {
      action,
      pdi_id: pdiId,
      event_category: 'pdi',
      timestamp: Date.now()
    });
  },

  // Track competency evaluations
  trackCompetencyEvaluation(competencyName: string, rating: number, type: 'self' | 'manager') {
    this.trackEvent('competency_evaluation', {
      competency_name: competencyName,
      rating,
      evaluation_type: type,
      event_category: 'competency',
      timestamp: Date.now()
    });
  },

  // Track achievement unlocks
  trackAchievement(achievementTitle: string, points: number) {
    this.trackEvent('achievement_unlocked', {
      achievement_title: achievementTitle,
      points,
      event_category: 'gamification',
      timestamp: Date.now()
    });
  },

  // Track performance metrics
  trackPerformance(metric: string, value: number, context?: string) {
    this.trackEvent('performance_metric', {
      metric_name: metric,
      metric_value: value,
      context: context || 'general',
      event_category: 'performance',
      timestamp: Date.now()
    });
  },

  // Track errors
  trackError(error: string, context: string, severity: 'low' | 'medium' | 'high' | 'critical') {
    this.trackEvent('application_error', {
      error_message: error,
      error_context: context,
      error_severity: severity,
      event_category: 'error',
      timestamp: Date.now()
    });
  }
};