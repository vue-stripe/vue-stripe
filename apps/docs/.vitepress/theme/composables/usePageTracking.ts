import { watch } from 'vue'
import { useRoute } from 'vitepress'
import { useAnalytics } from './useAnalytics'

export function usePageTracking() {
  const { trackComponentView, trackUserJourney, trackPageView } = useAnalytics()
  const route = useRoute()

  const journeySteps = [
    { path: '/guide/introduction', name: 'getting_started', step: 1 },
    { path: '/guide/installation', name: 'getting_started', step: 2 },
    { path: '/guide/first-payment', name: 'getting_started', step: 3 },
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
        page_path: path,
      })

      // Track journey progress
      const journeyStep = journeySteps.find(step => step.path === path)
      if (journeyStep) {
        trackUserJourney({
          journey_step: componentName,
          journey_name: journeyStep.name,
          step_number: journeyStep.step,
        })
      }
    }

    // Track page view
    trackPageView(path)
  }

  // Track initial page load
  if (typeof window !== 'undefined') {
    trackPageContent(route.path)
  }

  // Track route changes
  watch(() => route.path, (newPath, oldPath) => {
    if (newPath !== oldPath) {
      trackPageContent(newPath)
    }
  })

  return {
    trackPageContent,
  }
}
