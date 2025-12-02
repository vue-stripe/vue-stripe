import { onMounted, onUnmounted } from 'vue'
import { useAnalytics } from './useAnalytics'

export function useErrorTracking() {
  const { trackError } = useAnalytics()

  const handleError = (event: ErrorEvent) => {
    const { message, filename, lineno, colno, error } = event

    trackError({
      error_message: message,
      error_type: 'runtime_error',
      page_path: window.location.pathname,
      stack_trace: error?.stack || `${filename}:${lineno}:${colno}`,
    })

    // Don't prevent default error handling
    return false
  }

  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason

    let errorMessage = 'Unhandled Promise Rejection'
    let stackTrace = ''

    if (reason instanceof Error) {
      errorMessage = reason.message
      stackTrace = reason.stack || ''
    } else if (typeof reason === 'string') {
      errorMessage = reason
    } else {
      errorMessage = JSON.stringify(reason)
    }

    trackError({
      error_message: errorMessage,
      error_type: 'unhandled_rejection',
      page_path: window.location.pathname,
      stack_trace: stackTrace,
    })
  }

  const handleResourceError = (event: Event) => {
    const target = event.target as HTMLElement

    if (target.tagName === 'IMG' || target.tagName === 'SCRIPT' || target.tagName === 'LINK') {
      const src = target.getAttribute('src') || target.getAttribute('href') || 'unknown'

      trackError({
        error_message: `Failed to load resource: ${src}`,
        error_type: 'resource_error',
        page_path: window.location.pathname,
      })
    }
  }

  const track404Errors = () => {
    // Check if current page is 404
    if (window.location.pathname.includes('404') ||
        document.title.toLowerCase().includes('not found') ||
        document.body.textContent?.toLowerCase().includes('page not found')) {

      trackError({
        error_message: `404 - Page not found: ${window.location.pathname}`,
        error_type: '404_error',
        page_path: window.location.pathname,
      })
    }
  }

  const setupErrorTracking = () => {
    if (typeof window === 'undefined') return

    // Track JavaScript errors
    window.addEventListener('error', handleError, true)

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // Track resource loading errors
    window.addEventListener('error', handleResourceError, true)

    // Check for 404 errors
    track404Errors()

    return () => {
      window.removeEventListener('error', handleError, true)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleResourceError, true)
    }
  }

  let cleanup: (() => void) | null = null

  onMounted(() => {
    cleanup = setupErrorTracking() || null
  })

  onUnmounted(() => {
    if (cleanup) {
      cleanup()
    }
  })

  return {
    setupErrorTracking,
    handleError,
    handleUnhandledRejection,
  }
}
