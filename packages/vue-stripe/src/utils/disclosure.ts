import {
  defineComponent,
  getCurrentInstance,
  inject,
  onMounted,
  onUnmounted,
  ref,
  toRaw,
  watch,
  type ComponentOptionsMixin,
  type DefineComponent,
  type PropType,
  type Ref
} from 'vue-demi'
import type { Stripe, StripeError } from '@stripe/stripe-js'
import { stripeInjectionKey } from './injection-keys'
import { VueStripeProviderError } from './errors'
import { renderElement } from './element-render'
import { errorLogger } from './report'
import { renderAfterSetupError } from './h'
import type { StatusSlots, WithSlots } from './element-types'

/** `stripe` prop of a disclosure: an instance, a Promise of one, or `null` (React Stripe.js parity). */
export type DisclosureStripeProp = Stripe | PromiseLike<Stripe | null> | null

/** What `error` emits: Stripe's error, or `{ message }` when the call itself fails. */
export type DisclosureError = StripeError | { message: string }

/** Options of `VueStripeFinancialAccountDisclosure` (React Stripe.js `FinancialAccountDisclosure`). */
export interface FinancialAccountDisclosureOptions {
  /** Business name shown in the disclosure; inferred from the Stripe account when omitted. */
  businessName?: string | undefined
  /** Supplemental link where your users can learn more. */
  learnMoreLink?: string | undefined
}

/** Options of `VueStripeIssuingDisclosure` (React Stripe.js `IssuingDisclosure`). */
export interface IssuingDisclosureOptions {
  /** ID of the Issuing program to show the disclosure for. */
  issuingProgramID?: string | undefined
  /** Public name of the Issuing card program. */
  publicCardProgramName?: string | undefined
  /** Supplemental link where your users can learn more. */
  learnMoreLink?: string | undefined
}

/** Options of `VueStripeTreasuryDisclosure` (React Stripe.js `TreasuryDisclosure`). */
export interface TreasuryDisclosureOptions {
  /** Business name shown in the disclosure; inferred from the Stripe account when omitted. */
  businessName?: string | undefined
  /** Supplemental link where your users can learn more. */
  learnMoreLink?: string | undefined
}

/** Result of `stripe.create*Disclosure()` (not in the Stripe.js 10.0.0 type definitions). */
interface DisclosureResult {
  htmlElement?: HTMLElement
  error?: StripeError
}
type DisclosureMethod = (options: Record<string, string | undefined>) => Promise<DisclosureResult>

interface DisclosureDefinition<TOptions extends object> {
  componentName: string
  /** The Stripe instance method, e.g. 'createIssuingDisclosure'. */
  method: string
  /** Option keys forwarded to the method (React Stripe.js passes each one, set or not). */
  optionKeys: ReadonlyArray<keyof TOptions & string>
  className: string
}

/** Public type of a disclosure component. */
export type StripeDisclosureComponent<TOptions extends object> = WithSlots<
  DefineComponent<
    { stripe?: DisclosureStripeProp | undefined; options?: TOptions | undefined },
    { loading: Ref<boolean>; error: Ref<string | null> },
    Record<never, never>,
    Record<never, never>,
    Record<never, never>,
    ComponentOptionsMixin,
    ComponentOptionsMixin,
    { load: () => void; error: (error: DisclosureError) => void }
  >,
  StatusSlots
>

/**
 * Builds a React Stripe.js 7 style disclosure: it calls `stripe.<method>(options)` and
 * mounts the legal text element Stripe.js returns. Stripe comes from the `stripe` prop
 * or, without one, from the surrounding `<VueStripeProvider>`.
 */
export function createStripeDisclosure<TOptions extends object>(
  def: DisclosureDefinition<TOptions>
): StripeDisclosureComponent<TOptions> {
  const { componentName, method, optionKeys, className } = def

  const component = defineComponent({
    name: componentName,
    props: {
      stripe: {
        type: [Object, Promise] as PropType<DisclosureStripeProp | undefined>,
        default: undefined
      },
      options: {
        type: Object as PropType<Record<string, string | undefined> | undefined>,
        default: undefined
      }
    },
    emits: ['load', 'error'],
    setup(props, { emit, expose, slots }) {
      const providerCtx = inject(stripeInjectionKey, null)
      if (props.stripe === undefined && !providerCtx) {
        throw new VueStripeProviderError(
          `${componentName} needs a \`stripe\` prop, a VueStripeProvider ancestor or an app using createVueStripe()`
        )
      }
      const loading = ref(true)
      const error = ref<string | null>(null)
      const instance = getCurrentInstance()
      const mountPoint = () =>
        (instance?.proxy as { $refs: Record<string, HTMLElement | undefined> } | null)?.$refs[
          'mount'
        ] ?? null

      const stripeSource = () =>
        props.stripe !== undefined ? props.stripe : providerCtx?.stripe.value
      // A string key: an inline `:options="{ ... }"` re-render must not reload the disclosure.
      const optionsKey = () => JSON.stringify(optionKeys.map((key) => props.options?.[key]))

      // Each request gets a number; only the latest one (and only while mounted) may render.
      let latest = 0
      const logError = errorLogger(slots)
      // Stripe's `{ error }` result and a rejected call are both load failures: each one is
      // logged unless the app handles it, like every other component (#761).
      // `log: false` for the plugin's Stripe.js load failure, which the plugin logs itself.
      const fail = (err: DisclosureError, log = true) => {
        const message = err.message ?? `${componentName} failed to load`
        error.value = message
        loading.value = false
        if (log) logError(`${componentName} error`, message)
        emit('error', err)
      }
      const messageOf = (err: unknown) => (err instanceof Error ? err.message : String(err))

      const create = async () => {
        const request = ++latest
        const source = stripeSource()
        const options = Object.fromEntries(optionKeys.map((key) => [key, props.options?.[key]]))
        let resolved: Stripe | null | undefined
        try {
          resolved = await source
        } catch (err) {
          // A `stripe` promise that rejects: loadStripe() with Stripe.js blocked (#774).
          if (request === latest) fail({ message: messageOf(err) })
          return
        }
        // toRaw: a Stripe instance kept in a deep ref() arrives as a reactive proxy.
        const stripe = resolved ? toRaw(resolved) : null
        if (request !== latest) return
        if (!stripe) {
          // Without a `stripe` prop: the createVueStripe() plugin's Stripe.js load failed (#773).
          const loadError = props.stripe === undefined && providerCtx?.error.value
          if (loadError) fail({ message: loadError }, false)
          return
        }
        loading.value = true
        error.value = null
        try {
          const call = (stripe as unknown as Record<string, DisclosureMethod | undefined>)[method]
          if (typeof call !== 'function') {
            throw new VueStripeProviderError(
              `stripe.${method}() is not available in this Stripe.js version`
            )
          }
          const result = await call.call(stripe, options)
          if (request !== latest) return
          const target = mountPoint()
          if (result.error) fail(result.error)
          else if (result.htmlElement && target) {
            target.innerHTML = ''
            target.appendChild(result.htmlElement)
            emit('load')
          }
        } catch (err) {
          if (request !== latest) return
          fail({ message: messageOf(err) })
        } finally {
          if (request === latest) loading.value = false
        }
      }

      const reload = () => void create()
      // The source sits in an array: Vue attaches its own handler to a Promise a watch getter
      // returns, and reports its rejection as an unhandled watcher getter error (#774). A
      // separate watch for the options, so an inline `:options` re-render does not reload.
      watch(() => [stripeSource(), props.stripe === undefined && providerCtx?.error.value], reload)
      watch(optionsKey, reload)
      onMounted(() => void create())
      onUnmounted(() => {
        latest++
      })

      expose({ loading, error })

      return () =>
        renderElement(
          className,
          { error: error.value, loading: loading.value && !error.value },
          slots,
          'Loading disclosure...'
        )
    },
    render: renderAfterSetupError
  })
  // The runtime component is typed loosely; callers get the precise public type.
  return component as unknown as StripeDisclosureComponent<TOptions>
}
