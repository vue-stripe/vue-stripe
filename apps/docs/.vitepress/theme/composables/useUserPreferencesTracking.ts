import { onMounted } from 'vue'
import { useAnalytics } from './useAnalytics'

export function useUserPreferencesTracking() {
  const { trackUserPreference, setUserProperties } = useAnalytics()

  const getDeviceType = (): string => {
    const ua = navigator.userAgent
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet'
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile'
    }
    return 'desktop'
  }

  const getBrowserInfo = (): { browser: string; version: string } => {
    const ua = navigator.userAgent
    let browser = 'Unknown'
    let version = 'Unknown'

    if (ua.indexOf('Firefox') > -1) {
      browser = 'Firefox'
      version = ua.match(/Firefox\/([0-9.]+)/)?.[1] || 'Unknown'
    } else if (ua.indexOf('Edg') > -1) {
      browser = 'Edge'
      version = ua.match(/Edg\/([0-9.]+)/)?.[1] || 'Unknown'
    } else if (ua.indexOf('Chrome') > -1) {
      browser = 'Chrome'
      version = ua.match(/Chrome\/([0-9.]+)/)?.[1] || 'Unknown'
    } else if (ua.indexOf('Safari') > -1) {
      browser = 'Safari'
      version = ua.match(/Version\/([0-9.]+)/)?.[1] || 'Unknown'
    }

    return { browser, version }
  }

  const getThemePreference = (): string => {
    // Check for VitePress theme class
    const htmlElement = document.documentElement
    if (htmlElement.classList.contains('dark')) {
      return 'dark'
    }
    return 'light'
  }

  const trackThemeChange = () => {
    if (typeof window === 'undefined') return

    // Watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const theme = getThemePreference()
          trackUserPreference({
            preference_type: 'theme',
            preference_value: theme,
          })
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return observer
  }

  const trackInitialPreferences = () => {
    if (typeof window === 'undefined') return

    // Track device type
    const deviceType = getDeviceType()
    trackUserPreference({
      preference_type: 'device',
      preference_value: deviceType,
    })

    // Track browser
    const { browser, version } = getBrowserInfo()
    trackUserPreference({
      preference_type: 'browser',
      preference_value: `${browser} ${version}`,
    })

    // Track initial theme
    const theme = getThemePreference()
    trackUserPreference({
      preference_type: 'theme',
      preference_value: theme,
    })

    // Track screen size
    const screenSize = `${window.screen.width}x${window.screen.height}`
    trackUserPreference({
      preference_type: 'screen',
      preference_value: screenSize,
    })

    // Track viewport size
    const viewportSize = `${window.innerWidth}x${window.innerHeight}`
    trackUserPreference({
      preference_type: 'viewport',
      preference_value: viewportSize,
    })

    // Set user properties for segmentation
    setUserProperties({
      device_type: deviceType,
      browser: browser,
      browser_version: version,
      theme_preference: theme,
    })

    // Track timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    setUserProperties({
      timezone,
    })

    // Track language
    const language = navigator.language || 'en-US'
    setUserProperties({
      language,
    })
  }

  onMounted(() => {
    trackInitialPreferences()
    trackThemeChange()
  })

  return {
    trackInitialPreferences,
    trackThemeChange,
    getDeviceType,
    getBrowserInfo,
    getThemePreference,
  }
}
