/**
 * TalentFlow Analytics Utility
 * 
 * Provides Google Analytics 4 integration with custom event tracking.
 * Events are tracked only when analytics is enabled and GA is configured.
 * 
 * IMPORTANT: Never track sensitive user data (PII, health info, etc.)
 */

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// Check if analytics is enabled and configured
const isAnalyticsEnabled = (): boolean => {
  const analyticsId = import.meta.env.VITE_ANALYTICS_ID || import.meta.env.VITE_GA_MEASUREMENT_ID;
  const isEnabled = import.meta.env.VITE_ENABLE_ANALYTICS === 'true';
  return Boolean(analyticsId && isEnabled && typeof window !== 'undefined' && window.gtag);
};

// Get the analytics ID
const getAnalyticsId = (): string => {
  return import.meta.env.VITE_ANALYTICS_ID || import.meta.env.VITE_GA_MEASUREMENT_ID || '';
};

export const analytics = {
  /**
   * Initialize Google Analytics
   * Called automatically in main.tsx for production
   */
  init() {
    const analyticsId = getAnalyticsId();
    if (!analyticsId || !import.meta.env.PROD) return;

    // GA4 script is already loaded in main.tsx
    if (import.meta.env.DEV) {
      console.log('[Analytics] Initialized with ID:', analyticsId);
    }
  },

  /**
   * Track page views
   * Call this when navigating between pages
   */
  trackPageView(pageName: string, userId?: string) {
    if (!isAnalyticsEnabled()) return;

    window.gtag?.('config', getAnalyticsId(), {
      page_title: pageName,
      page_location: window.location.href,
      user_id: userId,
      custom_map: {
        user_role: 'dimension1'
      }
    });
  },

  /**
   * Generic event tracking
   * Base method used by other tracking functions
   */
  trackEvent(eventName: string, parameters?: Record<string, any>) {
    if (!isAnalyticsEnabled()) return;

    window.gtag?.('event', eventName, {
      event_category: 'user_interaction',
      event_label: eventName,
      send_to: getAnalyticsId(),
      ...parameters
    });
  },

  /**
   * Track user login/logout events
   * IMPORTANT: Do not track email or other PII
   */
  trackAuth(action: 'login' | 'logout' | 'signup', method?: string, userRole?: string) {
    this.trackEvent(action, {
      method: method || 'email',
      user_role: userRole,
      event_category: 'authentication',
      timestamp: Date.now()
    });
  },

  /**
   * Track user actions/interactions
   */
  trackUserAction(action: string, category: string, label?: string, value?: number) {
    this.trackEvent('user_action', {
      action,
      category,
      label,
      value,
      timestamp: Date.now()
    });
  },

  /**
   * Track PDI (Individual Development Plan) events
   */
  trackPDI(action: 'created' | 'updated' | 'completed' | 'validated' | 'deleted', pdiId: string, status?: string) {
    this.trackEvent('pdi_action', {
      action,
      pdi_id: pdiId,
      pdi_status: status,
      event_category: 'pdi',
      timestamp: Date.now()
    });
  },

  /**
   * Track development action completion
   */
  trackActionCompletion(actionId: string, actionType: string, points?: number) {
    this.trackEvent('action_completed', {
      action_id: actionId,
      action_type: actionType,
      points: points || 0,
      event_category: 'development',
      timestamp: Date.now()
    });
  },

  /**
   * Track competency evaluations
   * IMPORTANT: Only track competency names, not ratings (to protect privacy)
   */
  trackCompetencyEvaluation(competencyName: string, type: 'self' | 'manager') {
    this.trackEvent('competency_evaluation', {
      competency_name: competencyName,
      evaluation_type: type,
      event_category: 'competency',
      timestamp: Date.now()
    });
  },

  /**
   * Track mentorship events
   */
  trackMentorship(action: 'session_scheduled' | 'session_completed' | 'request_sent' | 'request_accepted') {
    this.trackEvent('mentorship_action', {
      action,
      event_category: 'mentorship',
      timestamp: Date.now()
    });
  },

  /**
   * Track emotional check-in completion
   * IMPORTANT: Never track actual mood/stress values - only completion
   */
  trackEmotionalCheckin(completed: boolean) {
    if (completed) {
      this.trackEvent('emotional_checkin', {
        action: 'completed',
        event_category: 'wellness',
        timestamp: Date.now()
      });
    }
  },

  /**
   * Track wellness resource access
   * IMPORTANT: Only track resource type, not specific content
   */
  trackWellnessResource(resourceType: string, category: string) {
    this.trackEvent('wellness_resource_accessed', {
      resource_type: resourceType,
      resource_category: category,
      event_category: 'wellness',
      timestamp: Date.now()
    });
  },

  /**
   * Track achievement unlocks (gamification)
   */
  trackAchievement(achievementTitle: string, points: number) {
    this.trackEvent('achievement_unlocked', {
      achievement_title: achievementTitle,
      points,
      event_category: 'gamification',
      timestamp: Date.now()
    });
  },

  /**
   * Track feature usage
   */
  trackFeatureUsage(featureName: string, action: string) {
    this.trackEvent('feature_usage', {
      feature_name: featureName,
      action,
      event_category: 'feature',
      timestamp: Date.now()
    });
  },

  /**
   * Track search events
   */
  trackSearch(searchTerm: string, resultCount: number, context: string) {
    this.trackEvent('search', {
      search_term: searchTerm.substring(0, 50), // Truncate for privacy
      result_count: resultCount,
      search_context: context,
      event_category: 'search',
      timestamp: Date.now()
    });
  },

  /**
   * Track performance metrics
   */
  trackPerformance(metric: string, value: number, context?: string) {
    this.trackEvent('performance_metric', {
      metric_name: metric,
      metric_value: value,
      context: context || 'general',
      event_category: 'performance',
      timestamp: Date.now()
    });
  },

  /**
   * Track application errors
   * Used in conjunction with Sentry for error monitoring
   */
  trackError(error: string, context: string, severity: 'low' | 'medium' | 'high' | 'critical') {
    this.trackEvent('application_error', {
      error_message: error.substring(0, 100), // Truncate
      error_context: context,
      error_severity: severity,
      event_category: 'error',
      timestamp: Date.now()
    });
  },

  /**
   * Track user timing for performance analysis
   */
  trackTiming(category: string, variable: string, value: number, label?: string) {
    if (!isAnalyticsEnabled()) return;

    window.gtag?.('event', 'timing_complete', {
      name: variable,
      value: value,
      event_category: category,
      event_label: label
    });
  },

  /**
   * Set user properties for segmentation
   * IMPORTANT: Never set PII as user properties
   */
  setUserProperties(properties: { role?: string; level?: string; team?: string }) {
    if (!isAnalyticsEnabled()) return;

    window.gtag?.('set', 'user_properties', {
      user_role: properties.role,
      user_level: properties.level,
      user_team: properties.team
    });
  }
};

// Export individual functions with proper `this` binding
// Methods that use `this.trackEvent()` internally must be bound to preserve context
export const initAnalytics = analytics.init.bind(analytics);
export const trackPageView = analytics.trackPageView.bind(analytics);
export const trackEvent = analytics.trackEvent.bind(analytics);
export const trackAuth = analytics.trackAuth.bind(analytics);
export const trackUserAction = analytics.trackUserAction.bind(analytics);
export const trackPDI = analytics.trackPDI.bind(analytics);
export const trackActionCompletion = analytics.trackActionCompletion.bind(analytics);
export const trackCompetencyEvaluation = analytics.trackCompetencyEvaluation.bind(analytics);
export const trackMentorship = analytics.trackMentorship.bind(analytics);
export const trackEmotionalCheckin = analytics.trackEmotionalCheckin.bind(analytics);
export const trackWellnessResource = analytics.trackWellnessResource.bind(analytics);
export const trackAchievement = analytics.trackAchievement.bind(analytics);
export const trackFeatureUsage = analytics.trackFeatureUsage.bind(analytics);
export const trackSearch = analytics.trackSearch.bind(analytics);
export const trackPerformance = analytics.trackPerformance.bind(analytics);
export const trackError = analytics.trackError.bind(analytics);
export const trackTiming = analytics.trackTiming.bind(analytics);
export const setUserProperties = analytics.setUserProperties.bind(analytics);