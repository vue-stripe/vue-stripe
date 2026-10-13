import type { Slots } from 'vue-demi'
import { hx } from './h'

/**
 * Error / loading / default-slot rendering shared by the provider components.
 * Renders `<div class="{prefix}-error">` (slot #error) or `<div class="{prefix}-loading">`
 * (slot #loading) or `<div>` with the default slot.
 *
 * Each state is keyed, so a switch replaces the subtree. Unkeyed, Vue 3 patched the library's
 * loading / error markup into the app's compiled slot root, which only gets its dynamic text
 * patched: the root kept the library's class and id (#675).
 */
export function statusShell(
  prefix: string,
  state: { error: string | null; loading: boolean },
  slots: Slots,
  slotProps: Record<string, unknown>,
  loadingText: string
) {
  if (state.error) {
    return hx(
      'div',
      { key: 'error', class: `${prefix}-error` },
      slots['error']?.({ error: state.error }) ?? [
        hx('div', { class: 'vue-stripe-error-message' }, state.error)
      ]
    )
  }
  if (state.loading) {
    return hx(
      'div',
      { key: 'loading', class: `${prefix}-loading` },
      slots['loading']?.() ?? [hx('div', { class: 'vue-stripe-loading-message' }, loadingText)]
    )
  }
  return hx('div', { key: 'default' }, slots['default']?.(slotProps))
}
