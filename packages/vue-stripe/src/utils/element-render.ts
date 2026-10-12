import type { Slots } from 'vue-demi'
import { hx } from './h'

/**
 * Markup of every element component: an error block (#error slot), the Stripe mount
 * point (string ref `mount`) and a loader (#loading slot). Each part carries the
 * element's own class (`{className}-error`, `-mount`, `-loader`) and a shared
 * `vue-stripe-element-*` class.
 */
export function renderElement(
  className: string,
  state: { error: string | null; loading: boolean },
  slots: Slots,
  loadingText: string
) {
  return hx('div', { class: [className, 'vue-stripe-element'] }, [
    state.error &&
      hx(
        'div',
        { class: [`${className}-error`, 'vue-stripe-element-error'] },
        slots['error']?.({ error: state.error }) ?? [
          hx('div', { class: 'vue-stripe-error-message' }, state.error)
        ]
      ),
    hx('div', {
      ref: 'mount',
      class: {
        [`${className}-mount`]: true,
        'vue-stripe-element-mount': true,
        [`${className}-loading`]: state.loading,
        'vue-stripe-element-loading': state.loading
      }
    }),
    state.loading &&
      hx(
        'div',
        { class: [`${className}-loader`, 'vue-stripe-element-loader'] },
        slots['loading']?.() ?? [hx('div', { class: 'vue-stripe-loading-message' }, loadingText)]
      )
  ])
}
