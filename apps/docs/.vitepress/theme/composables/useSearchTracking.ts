import { onMounted, onUnmounted } from 'vue'
import { useAnalytics } from './useAnalytics'

export function useSearchTracking() {
  const { trackSearch } = useAnalytics()

  const setupSearchTracking = () => {
    if (typeof window === 'undefined') return

    // Track search input with debouncing
    let searchTimeout: NodeJS.Timeout
    const trackSearchQuery = (searchTerm: string, resultsCount?: number) => {
      if (searchTimeout) clearTimeout(searchTimeout)

      searchTimeout = setTimeout(() => {
        if (searchTerm.trim().length > 0) {
          trackSearch({
            search_term: searchTerm,
            search_results: resultsCount,
            search_location: 'header',
          })
        }
      }, 1000) // Wait 1 second after user stops typing
    }

    // Wait for VitePress search to be available
    const observeSearchModal = () => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              // VitePress search modal
              const searchInput = node.querySelector('.DocSearch-Input, [role="searchbox"], input[type="search"]')
              if (searchInput) {
                let lastSearchTerm = ''

                // Track search input
                searchInput.addEventListener('input', (e) => {
                  const target = e.target as HTMLInputElement
                  const searchTerm = target.value

                  if (searchTerm !== lastSearchTerm) {
                    lastSearchTerm = searchTerm

                    // Try to count results
                    setTimeout(() => {
                      const resultsContainer = document.querySelector('.VPLocalSearchBox [role="list"], .DocSearch-Dropdown')
                      const results = resultsContainer?.querySelectorAll('[role="listitem"], .DocSearch-Hit')
                      const resultsCount = results?.length || 0

                      trackSearchQuery(searchTerm, resultsCount)
                    }, 300)
                  }
                })

                // Track search result clicks
                const resultsContainer = node.querySelector('.VPLocalSearchBox, .DocSearch-Modal')
                if (resultsContainer) {
                  resultsContainer.addEventListener('click', (e) => {
                    const target = e.target as HTMLElement
                    const resultLink = target.closest('a[href], [role="option"]')

                    if (resultLink) {
                      const searchInput = node.querySelector('input[type="search"]') as HTMLInputElement
                      const searchTerm = searchInput?.value || ''

                      if (searchTerm) {
                        trackSearch({
                          search_term: `${searchTerm} [clicked]`,
                          search_location: 'header',
                        })
                      }
                    }
                  })
                }
              }
            }
          })
        })
      })

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      })

      return observer
    }

    return observeSearchModal()
  }

  let observer: MutationObserver | null = null

  onMounted(() => {
    observer = setupSearchTracking() || null
  })

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
    }
  })

  return {
    setupSearchTracking,
  }
}
