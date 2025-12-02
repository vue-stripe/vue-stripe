import { onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vitepress'
import { useAnalytics } from './useAnalytics'

export function useLinkTracking() {
  const { trackNavigation, trackLinkClick } = useAnalytics()
  const route = useRoute()
  const router = useRouter()

  const isExternalLink = (url: string): boolean => {
    try {
      const link = new URL(url, window.location.origin)
      return link.hostname !== window.location.hostname
    } catch {
      return false
    }
  }

  const isOutboundLink = (url: string): boolean => {
    // Check for common external domains
    const outboundDomains = ['github.com', 'npmjs.com', 'stripe.com', 'twitter.com']
    return outboundDomains.some(domain => url.includes(domain))
  }

  const getSection = (element: HTMLElement): string => {
    // Try to find the section from nav or sidebar
    const nav = element.closest('nav')
    const sidebar = element.closest('.VPSidebar, aside')
    const tocLink = element.closest('.VPDocOutlineItem, .toc')

    if (sidebar) return 'sidebar'
    if (nav) return 'navigation'
    if (tocLink) return 'table-of-contents'

    return 'content'
  }

  const setupLinkTracking = () => {
    if (typeof window === 'undefined') return

    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')

      if (!link) return

      const href = link.getAttribute('href') || ''
      const linkText = link.textContent?.trim() || link.getAttribute('aria-label') || 'Unknown'
      const section = getSection(link)

      // Check if it's an external link
      if (isExternalLink(href)) {
        const url = new URL(href, window.location.origin)

        trackLinkClick({
          link_domain: url.hostname,
          link_url: href,
          link_text: linkText,
          outbound: isOutboundLink(href),
        })

        // Also track as navigation event
        trackNavigation({
          link_text: linkText,
          link_url: href,
          link_type: 'external',
          section,
        })
      } else {
        // Internal navigation
        trackNavigation({
          link_text: linkText,
          link_url: href,
          link_type: 'internal',
          section,
        })
      }
    }

    // Track anchor/hash links (table of contents clicks)
    const handleHashChange = () => {
      const hash = window.location.hash
      if (hash) {
        trackNavigation({
          link_text: hash.replace('#', ''),
          link_url: hash,
          link_type: 'internal',
          section: 'table-of-contents',
        })
      }
    }

    document.addEventListener('click', handleLinkClick)
    window.addEventListener('hashchange', handleHashChange)

    return () => {
      document.removeEventListener('click', handleLinkClick)
      window.removeEventListener('hashchange', handleHashChange)
    }
  }

  // Track route changes for SPA navigation
  const trackRouteChange = (to: string, from: string) => {
    if (to !== from) {
      trackNavigation({
        link_text: document.title,
        link_url: to,
        link_type: 'internal',
        section: 'spa-navigation',
      })
    }
  }

  let cleanup: (() => void) | null = null
  let previousRoute: string = ''

  onMounted(() => {
    cleanup = setupLinkTracking() || null
    previousRoute = route.path

    // Watch for route changes
    router.onAfterRouteChanged = (to: string) => {
      trackRouteChange(to, previousRoute)
      previousRoute = to
    }
  })

  onUnmounted(() => {
    if (cleanup) {
      cleanup()
    }
  })

  return {
    setupLinkTracking,
    trackRouteChange,
  }
}
