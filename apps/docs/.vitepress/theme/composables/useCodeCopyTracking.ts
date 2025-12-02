import { onMounted, onUnmounted } from 'vue'
import { useAnalytics } from './useAnalytics'

export function useCodeCopyTracking() {
  const { trackCodeCopy } = useAnalytics()

  const detectLanguage = (codeBlock: HTMLElement): string => {
    // Try to get language from class names
    const classList = Array.from(codeBlock.classList)
    const langClass = classList.find(cls =>
      cls.startsWith('language-') ||
      cls.startsWith('lang-')
    )

    if (langClass) {
      return langClass.replace(/^(language-|lang-)/, '')
    }

    // Try parent elements
    const pre = codeBlock.closest('pre')
    if (pre) {
      const preClasses = Array.from(pre.classList)
      const preLangClass = preClasses.find(cls =>
        cls.startsWith('language-') ||
        cls.startsWith('lang-')
      )
      if (preLangClass) {
        return preLangClass.replace(/^(language-|lang-)/, '')
      }
    }

    return 'unknown'
  }

  const setupCodeCopyTracking = () => {
    if (typeof window === 'undefined') return

    // Listen for copy button clicks (VitePress has built-in copy buttons)
    const handleCopyClick = (e: Event) => {
      const target = e.target as HTMLElement
      const copyButton = target.closest('.copy, [class*="copy"], button[title*="Copy"]')

      if (copyButton) {
        // Find the associated code block
        const codeContainer = copyButton.closest('.vp-code-group, div[class*="language-"], pre') ||
                            copyButton.parentElement?.querySelector('code, pre')

        if (codeContainer) {
          const codeElement = codeContainer.querySelector('code') || codeContainer
          const codeText = codeElement.textContent || ''
          const language = detectLanguage(codeElement as HTMLElement)

          trackCodeCopy({
            code_language: language,
            code_length: codeText.length,
            page_path: window.location.pathname,
          })
        }
      }
    }

    // Also listen for direct copy events on code blocks
    const handleCodeCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection()
      if (!selection || selection.toString().length === 0) return

      const target = e.target as HTMLElement
      const codeBlock = target.closest('code, pre')

      if (codeBlock) {
        const codeText = selection.toString()
        const language = detectLanguage(codeBlock as HTMLElement)

        trackCodeCopy({
          code_language: language,
          code_length: codeText.length,
          page_path: window.location.pathname,
        })
      }
    }

    document.addEventListener('click', handleCopyClick)
    document.addEventListener('copy', handleCodeCopy)

    return () => {
      document.removeEventListener('click', handleCopyClick)
      document.removeEventListener('copy', handleCodeCopy)
    }
  }

  let cleanup: (() => void) | null = null

  onMounted(() => {
    cleanup = setupCodeCopyTracking() || null
  })

  onUnmounted(() => {
    if (cleanup) {
      cleanup()
    }
  })

  return {
    setupCodeCopyTracking,
  }
}
