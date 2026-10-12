import { defineComponent, inject, onMounted, ref, type PropType } from 'vue-demi'
import { stripeConfigInjectionKey } from '../utils/injection-keys'
import { VueStripeProviderError } from '../utils/errors'
import { hx } from '../utils/h'

const PRICING_TABLE_SCRIPT_URL = 'https://js.stripe.com/v3/pricing-table.js'

/** Load Stripe's pricing-table web component script once per page. */
const loadPricingTableScript = (): Promise<void> =>
  new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${PRICING_TABLE_SCRIPT_URL}"]`)) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = PRICING_TABLE_SCRIPT_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Stripe pricing table script'))
    document.head.appendChild(script)
  })

/**
 * Stripe's no-code `<stripe-pricing-table>`. Rendered from a render function, so the
 * custom element is never resolved as a Vue component (no "Failed to resolve component").
 */
export default /* @__PURE__ */ defineComponent({
  name: 'VueStripePricingTable',
  props: {
    pricingTableId: { type: String, required: true },
    customerEmail: { type: String as PropType<string | undefined>, default: undefined },
    customerSessionClientSecret: {
      type: String as PropType<string | undefined>,
      default: undefined
    },
    clientReferenceId: { type: String as PropType<string | undefined>, default: undefined }
  },
  emits: ['load', 'error'],
  setup(props, { emit, expose, slots }) {
    const config = inject(stripeConfigInjectionKey, null)
    if (!config?.publishableKey) {
      throw new VueStripeProviderError(
        'VueStripePricingTable must be used within a VueStripeProvider component'
      )
    }
    const publishableKey = config.publishableKey
    const loading = ref(true)
    const error = ref<string | null>(null)

    onMounted(async () => {
      try {
        loading.value = true
        error.value = null
        await loadPricingTableScript()
        loading.value = false
        emit('load')
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load pricing table'
        error.value = errorMessage
        loading.value = false
        emit('error', err instanceof Error ? err : new Error(errorMessage))
        console.error('[Vue Stripe] Pricing table error:', errorMessage)
      }
    })

    expose({ loading, error })

    return () => {
      const status = loading.value
        ? (slots['loading']?.() ?? [
            hx('div', { class: 'vue-stripe-pricing-table-loading' }, 'Loading pricing table...')
          ])
        : error.value
          ? (slots['error']?.({ error: error.value }) ?? [
              hx('div', { class: 'vue-stripe-pricing-table-error' }, error.value)
            ])
          : []
      return hx('div', { class: 'vue-stripe-pricing-table' }, [
        ...status,
        hx('stripe-pricing-table', {
          'pricing-table-id': props.pricingTableId,
          'publishable-key': publishableKey,
          'customer-email': props.customerEmail,
          'customer-session-client-secret': props.customerSessionClientSecret,
          'client-reference-id': props.clientReferenceId,
          style: loading.value || error.value ? { display: 'none' } : undefined
        })
      ])
    }
  }
})
