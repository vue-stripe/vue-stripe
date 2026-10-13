import {
  defineComponent,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  shallowRef,
  watch,
  type PropType
} from 'vue-demi'
import type {
  Appearance,
  CssFontSource,
  CustomFontSource,
  StripeElements,
  StripeElementsOptions,
  StripeElementsOptionsClientSecret,
  StripeElementsOptionsMode,
  StripeElementsUpdateOptions
} from '@stripe/stripe-js'
import type { CaptureMethod, ElementsMode, SetupFutureUsage } from '../types'
import { stripeElementsInjectionKey, stripeInjectionKey } from '../utils/injection-keys'
import { VueStripeProviderError } from '../utils/errors'
import { statusShell } from '../utils/status-shell'

/** Stripe.js 10.0.0 declares only `on('update-end')` on the Elements group; `off` is used when present. */
type UpdateEndDetachable = { off?: (eventType: 'update-end', handler: () => void) => void }

/**
 * Creates a Stripe Elements group (`stripe.elements()`) and provides it to the
 * element components inside. Use `clientSecret` (Intent-based) or
 * `mode` + `currency` + `amount` (deferred Intent).
 */
export default /* @__PURE__ */ defineComponent({
  name: 'VueStripeElements',
  props: {
    /** Client secret of a PaymentIntent or SetupIntent (Intent-based flow). */
    clientSecret: { type: String as PropType<string | undefined>, default: undefined },
    /** Deferred Intent flow: 'payment' | 'setup' | 'subscription'. */
    mode: { type: String as PropType<ElementsMode | undefined>, default: undefined },
    /** Currency code (e.g. 'usd') for the deferred Intent flow. */
    currency: { type: String as PropType<string | undefined>, default: undefined },
    /** Amount in the smallest currency unit, for 'payment' and 'subscription' modes. */
    amount: { type: Number as PropType<number | undefined>, default: undefined },
    setupFutureUsage: {
      type: String as PropType<SetupFutureUsage | undefined>,
      default: undefined
    },
    captureMethod: { type: String as PropType<CaptureMethod | undefined>, default: undefined },
    /** Appearance API options (theme, variables, rules). Applied live via elements.update(). */
    appearance: {
      type: Object as PropType<Appearance | undefined>,
      default: undefined
    },
    /** Custom fonts (CssFontSource | CustomFontSource); creation time only. */
    fonts: {
      type: Array as PropType<Array<CssFontSource | CustomFontSource> | undefined>,
      default: undefined
    },
    locale: { type: String as PropType<string | undefined>, default: undefined },
    /** Any other `stripe.elements()` option (e.g. allowedPaymentMethodTypes in mode-based flows). */
    options: {
      type: Object as PropType<StripeElementsOptions | Record<string, unknown> | undefined>,
      default: undefined
    }
  },
  emits: ['ready', 'error', 'update-end'],
  setup(props, { emit, slots }) {
    const stripeInstance = inject(stripeInjectionKey, null)
    if (!stripeInstance) {
      throw new VueStripeProviderError(
        'VueStripeElements must be used within VueStripeProvider or an app using createVueStripe()'
      )
    }

    const elements = shallowRef<StripeElements | null>(null)
    const loading = ref(true)
    const error = ref<string | null>(null)

    // `update-end` fires when an elements.update() call has been applied. The listener follows
    // the current group: a re-created group gets a new one, and a replaced group (which may have
    // no `off`) can no longer emit.
    let detachUpdateEnd: (() => void) | null = null
    const listenUpdateEnd = (group: StripeElements) => {
      detachUpdateEnd?.()
      detachUpdateEnd = null
      if (typeof group.on !== 'function') return
      let active = true
      const handler = () => {
        if (active) emit('update-end')
      }
      group.on('update-end', handler)
      detachUpdateEnd = () => {
        active = false
        ;(group as UpdateEndDetachable).off?.('update-end', handler)
      }
    }

    const createElements = () => {
      const stripe = stripeInstance.stripe.value
      if (!stripe) {
        error.value = 'Stripe instance not available'
        loading.value = false
        return
      }

      try {
        error.value = null
        loading.value = true

        const elementsOptions: Record<string, unknown> = { ...props.options }
        // Removed in Stripe.js Endive: Stripe rejects `paymentMethodTypes` as an
        // integration error. Mode-based Elements: use options.allowedPaymentMethodTypes;
        // clientSecret flow: set allowed_payment_method_types on the Intent or use Dashboard settings.
        delete elementsOptions['paymentMethodTypes']

        // Intent-based flow vs deferred Intent flow (mode / currency / amount).
        if (props.clientSecret) elementsOptions['clientSecret'] = props.clientSecret
        if (props.mode) elementsOptions['mode'] = props.mode
        if (props.currency) elementsOptions['currency'] = props.currency
        if (props.amount !== undefined) elementsOptions['amount'] = props.amount
        if (props.setupFutureUsage) elementsOptions['setupFutureUsage'] = props.setupFutureUsage
        if (props.captureMethod) elementsOptions['captureMethod'] = props.captureMethod
        if (props.appearance) elementsOptions['appearance'] = props.appearance
        if (props.fonts) elementsOptions['fonts'] = props.fonts
        if (props.locale) elementsOptions['locale'] = props.locale

        // stripe.elements() is overloaded on the intent flow: clientSecret vs. deferred mode.
        // The options are assembled from props, so their shape is checked by Stripe at runtime.
        elements.value = props.clientSecret
          ? stripe.elements(elementsOptions as StripeElementsOptionsClientSecret)
          : stripe.elements(elementsOptions as unknown as StripeElementsOptionsMode)
        listenUpdateEnd(elements.value)
        loading.value = false

        // Emit ready after Vue has rendered the children.
        void nextTick(() => emit('ready', elements.value))
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create elements'
        error.value = errorMessage
        loading.value = false
        console.error('[Vue Stripe] Elements creation error:', errorMessage)
        emit('error', errorMessage)
      }
    }

    watch(
      () => stripeInstance.stripe.value,
      (stripe) => {
        if (stripe && !elements.value) createElements()
      },
      { immediate: true }
    )

    // A new Intent or new deferred-Intent parameters need a new Elements group.
    watch(
      () => [props.clientSecret, props.mode, props.currency, props.amount, props.setupFutureUsage],
      () => {
        if (stripeInstance.stripe.value) createElements()
      }
    )

    // Appearance / locale are applied with elements.update() so the mounted elements keep
    // their state. elements.update() returns a Promise since Stripe.js Dahlia.
    watch(
      () => [props.appearance, props.locale],
      () => {
        if (!elements.value) return
        const updateOptions: Record<string, unknown> = {}
        if (props.appearance) updateOptions['appearance'] = props.appearance
        if (props.locale) updateOptions['locale'] = props.locale
        Promise.resolve(elements.value.update(updateOptions as StripeElementsUpdateOptions)).catch(
          (err: unknown) => {
            const message = err instanceof Error ? err.message : 'elements.update() failed'
            error.value = message
            console.error('[Vue Stripe] Elements update error:', message)
            emit('error', message)
          }
        )
      },
      { deep: true }
    )

    onMounted(() => {
      if (stripeInstance.stripe.value && !elements.value) createElements()
    })

    onBeforeUnmount(() => {
      detachUpdateEnd?.()
      detachUpdateEnd = null
    })

    provide(stripeElementsInjectionKey, { elements, loading, error })

    return () =>
      statusShell(
        'vue-stripe-elements',
        // Without a VueStripeProvider (createVueStripe() only), nothing else shows a Stripe load failure.
        { error: error.value ?? stripeInstance.error.value, loading: loading.value },
        slots,
        {},
        'Initializing Elements...'
      )
  }
})
