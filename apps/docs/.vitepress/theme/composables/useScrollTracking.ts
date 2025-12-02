import { ref, onMounted, onUnmounted } from 'vue'
import { useAnalytics } from './useAnalytics'

export function useScrollTracking() {
  const { trackScrollDepth, trackContentEngagement } = useAnalytics()
  const trackedDepths = ref(new Set<number>())
  const startTime = ref(Date.now())
  const maxScrollPercentage = ref(0)

  const depths = [25, 50, 75, 100]

  const calculateScrollPercentage = (): number => {
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    const scrollPercentage = (scrollTop / (documentHeight - windowHeight)) * 100

    return Math.min(Math.round(scrollPercentage), 100)
  }

  const handleScroll = () => {
    const scrollPercentage = calculateScrollPercentage()

    // Update max scroll percentage
    if (scrollPercentage > maxScrollPercentage.value) {
      maxScrollPercentage.value = scrollPercentage
    }

    // Track depth milestones
    depths.forEach(depth => {
      if (scrollPercentage >= depth && !trackedDepths.value.has(depth)) {
        trackedDepths.value.add(depth)
        const timeToDepth = Date.now() - startTime.value

        trackScrollDepth({
          scroll_depth: depth,
          page_path: window.location.pathname,
          time_to_depth: Math.round(timeToDepth / 1000), // Convert to seconds
        })
      }
    })
  }

  const trackEngagementOnLeave = () => {
    const engagementTime = Date.now() - startTime.value

    // Only track if user spent more than 10 seconds and scrolled
    if (engagementTime > 10000 && maxScrollPercentage.value > 0) {
      trackContentEngagement({
        engagement_time: Math.round(engagementTime / 1000), // Convert to seconds
        page_path: window.location.pathname,
        scroll_percentage: maxScrollPercentage.value,
      })
    }
  }

  const reset = () => {
    trackedDepths.value.clear()
    startTime.value = Date.now()
    maxScrollPercentage.value = 0
  }

  let scrollListener: any
  let visibilityListener: any

  onMounted(() => {
    if (typeof window === 'undefined') return

    // Throttle scroll events
    let scrollTimeout: NodeJS.Timeout
    scrollListener = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(handleScroll, 100)
    }

    window.addEventListener('scroll', scrollListener, { passive: true })

    // Track engagement when user leaves page
    visibilityListener = () => {
      if (document.visibilityState === 'hidden') {
        trackEngagementOnLeave()
      }
    }
    document.addEventListener('visibilitychange', visibilityListener)

    // Track engagement on beforeunload
    window.addEventListener('beforeunload', trackEngagementOnLeave)
  })

  onUnmounted(() => {
    if (typeof window === 'undefined') return

    if (scrollListener) {
      window.removeEventListener('scroll', scrollListener)
    }
    if (visibilityListener) {
      document.removeEventListener('visibilitychange', visibilityListener)
    }
    window.removeEventListener('beforeunload', trackEngagementOnLeave)

    // Track final engagement
    trackEngagementOnLeave()
  })

  return {
    reset,
    maxScrollPercentage,
  }
}
