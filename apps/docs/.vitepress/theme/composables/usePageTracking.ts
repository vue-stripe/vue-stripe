import { watch } from 'vue'
import { useRoute } from 'vitepress'
import { useAnalytics } from './useAnalytics'

export function usePageTracking() {
  const { trackComponentView, trackUserJourney } = useAnalytics()
  const route = useRoute()

  // The tutorial is the entry point; installing into your own app and the background
  // reading on what Vue Stripe is are optional follow-ups.
  const journeySteps = [
    { path: '/guide/first-payment', name: 'getting_started', step: 1 },
    { path: '/guide/installation', name: 'getting_started', step: 2 },
    { path: '/guide/introduction', name: 'getting_started', step: 3 }
  ]

  const detectComponentType = (path: string): 'api' | 'guide' | null => {
    if (path.startsWith('/api/')) return 'api'
    if (path.startsWith('/guide/')) return 'guide'
    return null
  }

  const extractComponentName = (path: string): string => {
    // Remove leading/trailing slashes and get the last segment
    const segments = path.split('/').filter(Boolean)
    return segments[segments.length - 1] || 'index'
  }

  const trackPageContent = (path: string) => {
    const componentType = detectComponentType(path)

    if (componentType) {
      const componentName = extractComponentName(path)

      trackComponentView({
        component_name: componentName,
        component_type: componentType,
        page_path: path
      })

      // Track journey progress
      const journeyStep = journeySteps.find((step) => step.path === path)
      if (journeyStep) {
        trackUserJourney({
          journey_step: componentName,
          journey_name: journeyStep.name,
          step_number: journeyStep.step
        })
      }
    }

    // No page_view here: GA sends it itself, on the first load (`send_page_view` in the gtag
    // config) and on each route change (Enhanced Measurement's browser history events).
    // Sending one here as well counted every page twice.
  }

  // Track initial page load
  if (typeof window !== 'undefined') {
    trackPageContent(route.path)
  }

  // Track route changes
  watch(
    () => route.path,
    (newPath, oldPath) => {
      if (newPath !== oldPath) {
        trackPageContent(newPath)
      }
    }
  )

  return {
    trackPageContent
  }
}
