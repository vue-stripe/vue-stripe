export interface AnalyticsEvent {
  event: string
  [key: string]: any
}

export interface SearchEvent {
  search_term: string
  search_results?: number
  search_location?: string
}

export interface NavigationEvent {
  link_text: string
  link_url: string
  link_type: 'internal' | 'external'
  section?: string
}

export interface CodeCopyEvent {
  code_language?: string
  code_length: number
  page_path: string
}

export interface ScrollDepthEvent {
  scroll_depth: number
  page_path: string
  time_to_depth: number
}

export interface ContentEngagementEvent {
  engagement_time: number
  page_path: string
  scroll_percentage: number
}

export interface ComponentViewEvent {
  component_name: string
  component_type: 'api' | 'guide'
  page_path: string
}

export interface UserJourneyEvent {
  journey_step: string
  journey_name: string
  step_number: number
}

export interface ErrorEvent {
  error_message: string
  error_type: string
  page_path: string
  stack_trace?: string
}

export interface LinkClickEvent {
  link_domain: string
  link_url: string
  link_text: string
  outbound: boolean
}

export interface UserPreference {
  preference_type: 'theme' | 'device' | 'browser'
  preference_value: string
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    dataLayer?: any[]
  }
}
