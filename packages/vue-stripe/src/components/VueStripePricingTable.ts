import {
  defineComponent,
  Fragment,
  h,
  inject,
  isVue2,
  onMounted,
  ref,
  type PropType,
  type Ref
} from 'vue-demi'
import { stripeConfigInjectionKey } from '../utils/injection-keys'
import { VueStripeProviderError } from '../utils/errors'
import { hx } from '../utils/h'
import { errorLogger } from '../utils/report'
import type { VueStripeComponent } from '../utils/element-types'

const PRICING_TABLE_SCRIPT_URL = 'https://js.stripe.com/v3/pricing-table.js'
const PRICING_TABLE_TAG = 'stripe-pricing-table'
const LOADED_ATTRIBUTE = 'data-vue-stripe-loaded'

// The script tag being loaded, shared by every table mounted meanwhile.
let inFlight: { script: HTMLScriptElement; promise: Promise<void> } | null = null

/**
 * Load Stripe's pricing-table web component script once per page. A failed tag is
 * removed, so the next mount (a retry) adds a new one.
 */
const loadPricingTableScript = (): Promise<void> => {
  if (customElements.get(PRICING_TABLE_TAG)) return Promise.resolve()
  if (inFlight?.script.isConnected) return inFlight.promise
  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${PRICING_TABLE_SCRIPT_URL}"]`
  )
  if (existing?.hasAttribute(LOADED_ATTRIBUTE)) return Promise.resolve()
  // A tag from the page's own HTML: wait for the element it defines.
  if (existing) return customElements.whenDefined(PRICING_TABLE_TAG).then(() => undefined)

  const script = document.createElement('script')
  script.src = PRICING_TABLE_SCRIPT_URL
  script.async = true
  const promise = new Promise<void>((resolve, reject) => {
    script.onload = () => {
      script.setAttribute(LOADED_ATTRIBUTE, '')
      inFlight = null
      resolve()
    }
    script.onerror = () => {
      script.remove()
      inFlight = null
      reject(new Error('Failed to load Stripe pricing table script'))
    }
  })
  inFlight = { script, promise }
  document.head.appendChild(script)
  return promise
}

const pricingTableProps = {
  pricingTableId: { type: String, required: true },
  customerEmail: { type: String as PropType<string | undefined>, default: undefined },
  customerSessionClientSecret: {
    type: String as PropType<string | undefined>,
    default: undefined
  },
  clientReferenceId: { type: String as PropType<string | undefined>, default: undefined }
}

/** Template ref members. */
type PricingTableExposed = {
  /** `true` while the pricing table script loads. */
  loading: Ref<boolean>
  /** Message of a script load failure. */
  error: Ref<string | null>
}

/** Event name -> payload. */
type PricingTableEvents = {
  load: []
  error: [error: Error]
}

/**
 * Stripe's no-code `<stripe-pricing-table>`. Rendered from a render function, so the
 * custom element is never resolved as a Vue component (no "Failed to resolve component").
 */
export default /* @__PURE__ */ defineComponent({
  name: 'VueStripePricingTable',
  props: pricingTableProps,
  emits: ['load', 'error'] satisfies Array<keyof PricingTableEvents>,
  setup(props, { emit, expose, slots }) {
    const config = inject(stripeConfigInjectionKey, null)
    if (!config?.publishableKey) {
      throw new VueStripeProviderError(
        'VueStripePricingTable must be used within a VueStripeProvider component or an app using createVueStripe()'
      )
    }
    const publishableKey = config.publishableKey
    const loading = ref(true)
    const error = ref<string | null>(null)
    const logError = errorLogger(slots)

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
        logError('Pricing table error', errorMessage)
      }
    })

    expose({ loading, error } satisfies PricingTableExposed)

    // Each state's nodes sit in a keyed Fragment on Vue 3, so a switch replaces them: unkeyed,
    // Vue patched the loading root into a compiled #error root, which only gets its text
    // patched and kept the loading root's class. Vue 2 patches every attribute; no wrapper.
    const state = (key: string, nodes: unknown[]) =>
      isVue2 ? nodes : [h(Fragment, { key }, nodes as never)]

    return () => {
      const status = loading.value
        ? state(
            'loading',
            slots['loading']?.() ?? [
              hx('div', { class: 'vue-stripe-pricing-table-loading' }, 'Loading pricing table...')
            ]
          )
        : error.value
          ? state(
              'error',
              slots['error']?.({ error: error.value }) ?? [
                hx('div', { class: 'vue-stripe-pricing-table-error' }, error.value)
              ]
            )
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
}) as unknown as VueStripeComponent<
  typeof pricingTableProps,
  PricingTableExposed,
  PricingTableEvents
>
