import type { Slots, VNode } from 'vue-demi'
import { hx } from './h'

/**
 * Markup of every element component: an error block (#error slot), the Stripe mount
 * point (string ref `mount`) and a loader (#loading slot). Each part carries the
 * element's own class (`{className}-error`, `-mount`, `-loader`) and a shared
 * `vue-stripe-element-*` class.
 *
 * The parts are keyed: Vue 2 drops a `null` child, so without keys the mount node
 * would be patched into the error block when an error appears. `state.mount` is the
 * rendered mount node; the `StripeElement*` classes Stripe.js put on it are kept,
 * since Vue rewrites the whole class attribute when `loading` changes.
 */
export function renderElement(
  className: string,
  state: { error: string | null; loading: boolean; mount?: HTMLElement | null },
  slots: Slots,
  loadingText: string
): VNode {
  const stripeClasses = Array.from(state.mount?.classList ?? []).filter((name) =>
    name.startsWith('StripeElement')
  )
  return hx('div', { class: [className, 'vue-stripe-element'] }, [
    state.error &&
      hx(
        'div',
        { key: 'error', class: [`${className}-error`, 'vue-stripe-element-error'] },
        slots['error']?.({ error: state.error }) ?? [
          hx('div', { class: 'vue-stripe-error-message' }, state.error)
        ]
      ),
    hx('div', {
      key: 'mount',
      ref: 'mount',
      class: [
        {
          [`${className}-mount`]: true,
          'vue-stripe-element-mount': true,
          [`${className}-loading`]: state.loading,
          'vue-stripe-element-loading': state.loading
        },
        ...stripeClasses
      ]
    }),
    state.loading &&
      hx(
        'div',
        { key: 'loader', class: [`${className}-loader`, 'vue-stripe-element-loader'] },
        slots['loading']?.() ?? [hx('div', { class: 'vue-stripe-loading-message' }, loadingText)]
      )
  ])
}
