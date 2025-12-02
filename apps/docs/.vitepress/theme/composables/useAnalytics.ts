import { onMounted, onUnmounted } from 'vue'
import type {
  AnalyticsEvent,
  SearchEvent,
  NavigationEvent,
  CodeCopyEvent,
  ScrollDepthEvent,
  ContentEngagementEvent,
  ComponentViewEvent,
  UserJourneyEvent,
  ErrorEvent,
  LinkClickEvent,
  UserPreference
} from './types'

export function useAnalytics() {
  const isGALoaded = () => typeof window !== 'undefined' && typeof window.gtag === 'function'

  const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
    if (!isGALoaded()) {
      console.debug('GA not loaded, skipping event:', eventName)
      return
    }

    window.gtag!('event', eventName, {
      ...parameters,
      timestamp: new Date().toISOString(),
      page_location: window.location.href,
      page_path: window.location.pathname,
    })
  }

  const trackSearch = (params: SearchEvent) => {
    trackEvent('doc_search', {
      search_term: params.search_term,
      search_results: params.search_results,
      search_location: params.search_location || 'header',
    })
  }

  const trackNavigation = (params: NavigationEvent) => {
    trackEvent('nav_click', {
      link_text: params.link_text,
      link_url: params.link_url,
      link_type: params.link_type,
      section: params.section,
    })
  }

  const trackCodeCopy = (params: CodeCopyEvent) => {
    trackEvent('code_copy', {
      code_language: params.code_language || 'unknown',
      code_length: params.code_length,
      page_path: params.page_path,
    })
  }

  const trackScrollDepth = (params: ScrollDepthEvent) => {
    trackEvent('scroll_depth', {
      scroll_depth: params.scroll_depth,
      page_path: params.page_path,
      time_to_depth: params.time_to_depth,
    })
  }

  const trackContentEngagement = (params: ContentEngagementEvent) => {
    trackEvent('content_engagement', {
      engagement_time: params.engagement_time,
      page_path: params.page_path,
      scroll_percentage: params.scroll_percentage,
    })
  }

  const trackComponentView = (params: ComponentViewEvent) => {
    trackEvent('component_view', {
      component_name: params.component_name,
      component_type: params.component_type,
      page_path: params.page_path,
    })
  }

  const trackUserJourney = (params: UserJourneyEvent) => {
    trackEvent('user_journey', {
      journey_step: params.journey_step,
      journey_name: params.journey_name,
      step_number: params.step_number,
    })
  }

  const trackError = (params: ErrorEvent) => {
    trackEvent('error_occurred', {
      error_message: params.error_message,
      error_type: params.error_type,
      page_path: params.page_path,
      stack_trace: params.stack_trace,
    })
  }

  const trackLinkClick = (params: LinkClickEvent) => {
    trackEvent('link_click', {
      link_domain: params.link_domain,
      link_url: params.link_url,
      link_text: params.link_text,
      outbound: params.outbound,
    })
  }

  const trackUserPreference = (params: UserPreference) => {
    trackEvent('user_preference', {
      preference_type: params.preference_type,
      preference_value: params.preference_value,
    })
  }

  const trackPageView = (path?: string) => {
    if (!isGALoaded()) return

    window.gtag!('event', 'page_view', {
      page_path: path || window.location.pathname,
      page_location: window.location.href,
      page_title: document.title,
    })
  }

  const setUserProperties = (properties: Record<string, any>) => {
    if (!isGALoaded()) return

    window.gtag!('set', 'user_properties', properties)
  }

  return {
    trackEvent,
    trackSearch,
    trackNavigation,
    trackCodeCopy,
    trackScrollDepth,
    trackContentEngagement,
    trackComponentView,
    trackUserJourney,
    trackError,
    trackLinkClick,
    trackUserPreference,
    trackPageView,
    setUserProperties,
    isGALoaded,
  }
}
