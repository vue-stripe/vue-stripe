import {
  defineComponent,
  getCurrentInstance,
  inject,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  watch,
  type ComponentOptionsMixin,
  type DefineComponent,
  type PropType,
  type Ref,
  type ShallowRef
} from 'vue-demi'
import type { StripeCheckoutElementsSdk, StripeError } from '@stripe/stripe-js'
import { stripeCheckoutInjectionKey, stripeElementsInjectionKey } from './injection-keys'
import { VueStripeElementsError } from './errors'
import { hx } from './h'

/** Keep only the keys a narrower Stripe option type accepts (Checkout SDK creators). */
export const pick = (options: Record<string, unknown>, keys: string[]) =>
  Object.fromEntries(Object.entries(options).filter(([key]) => keys.includes(key)))

/** The Stripe element methods the factory relies on. */
export interface StripeElementLike {
  mount(domElement: HTMLElement | string): void
  destroy(): void
  on(eventType: string, handler: (...args: unknown[]) => void): unknown
  off?(eventType: string, handler?: (...args: unknown[]) => void): unknown
  update?(options: Record<string, unknown>): unknown
  focus?(): void
  blur?(): void
  clear?(): void
  getValue?(...args: unknown[]): Promise<unknown>
}

export const BASE_EVENTS = ['ready', 'change', 'focus', 'blur', 'escape'] as const

export interface ElementDefinition {
  /** `elements.create()` type, e.g. 'card' or 'payment'. */
  elementType: string
  componentName: string
  /** Stripe events re-emitted as Vue events (exact Stripe.js 10 union). Defaults to BASE_EVENTS. */
  events?: readonly string[]
  /** Options merged under `props.options` (e.g. IBAN supportedCountries). */
  defaultOptions?: () => Record<string, unknown>
  /** Creator inside VueStripeCheckoutElementsProvider; omit when Checkout Sessions lack the element. */
  checkout?: (sdk: StripeCheckoutElementsSdk, options: Record<string, unknown>) => StripeElementLike
  /** Extra members for the component's public instance (e.g. getValue). */
  expose?: (element: Ref<StripeElementLike | null>) => Record<string, unknown>
  loadingText?: string
  /** What `ready` emits: the Stripe element (default) or Stripe's ready event (Express Checkout). */
  readyPayload?: 'element' | 'event'
  /** Root CSS class; `-error`, `-mount`, `-loader` are derived from it. */
  className?: string
}

/** Members every element component exposes (template ref / `InstanceType`). */
export interface StripeElementExposed<TElement> {
  /** The Stripe element instance (null until created). */
  element: ShallowRef<TElement | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  focus: () => void
  blur: () => void
  clear: () => void
}

/** Event name -> payload tuple, used to type a component's listeners (`@change`, ...). */
export type ElementEvents = Record<string, unknown[]>

/** Payloads of the events most elements share. */
export type BaseElementEvents<TElement, TChange> = {
  ready: [element: TElement]
  change: [event: TChange]
  focus: []
  blur: []
  escape: []
}

/** Payload of `loaderstart` / `loaderror` for an element type. */
export type LoadStartEvent<T extends string> = [event: { elementType: T }]
export type LoadErrorEvent<T extends string> = [event: { elementType: T; error: StripeError }]

/** Public type of a factory-built element component. */
export type StripeElementComponent<
  TOptions extends object,
  TElement,
  TExtra extends object = Record<never, never>,
  TEvents extends ElementEvents = ElementEvents
> = DefineComponent<
  { options?: TOptions | undefined },
  StripeElementExposed<TElement> & TExtra,
  Record<never, never>,
  Record<never, never>,
  Record<never, never>,
  ComponentOptionsMixin,
  ComponentOptionsMixin,
  { [K in keyof TEvents]: (...args: TEvents[K]) => void }
>

/**
 * Builds an element component from a definition. Type parameters describe the public
 * surface: the `options` prop type, the Stripe element type and extra exposed members.
 */
export function createStripeElement<
  TOptions extends object = Record<string, unknown>,
  TElement = StripeElementLike,
  TExtra extends object = Record<never, never>,
  TEvents extends ElementEvents = ElementEvents
>(def: ElementDefinition): StripeElementComponent<TOptions, TElement, TExtra, TEvents> {
  const { elementType, componentName, events = BASE_EVENTS } = def
  const loadingText = def.loadingText ?? `Loading ${elementType}...`
  const className = def.className ?? `vue-stripe-${elementType}-element`

  const component = defineComponent({
    name: componentName,
    props: {
      options: { type: Object as PropType<Record<string, unknown>>, default: () => ({}) }
    },
    emits: [...events],
    setup(props, { emit, expose, slots }) {
      // shallowRef: Vue must never walk into Stripe's element object.
      const element = shallowRef<StripeElementLike | null>(null)
      const loading = ref(true)
      const error = ref<string | null>(null)
      const instance = getCurrentInstance()

      // An Elements context always wins: inject() returns the nearest provider of each key,
      // so a VueStripeElements nested inside a Checkout provider drives its own children.
      const elementsCtx = inject(stripeElementsInjectionKey, null)
      const checkoutCtx = inject(stripeCheckoutInjectionKey, null)
      if (!elementsCtx && !checkoutCtx) {
        throw new VueStripeElementsError(
          `${componentName} must be used within VueStripeElements or VueStripeCheckoutElementsProvider`
        )
      }

      // String template ref: resolves the same way on Vue 2 and Vue 3.
      const mountPoint = () =>
        (instance?.proxy as { $refs: Record<string, HTMLElement | undefined> } | null)?.$refs[
          'mount'
        ] ?? null

      const handlers: Record<string, (...args: unknown[]) => void> = {}
      for (const name of events) {
        handlers[name] = (...args: unknown[]) => {
          const event = args[0] as { error?: { message?: string } } | undefined
          if (name === 'ready') loading.value = false
          if (name === 'change') error.value = event?.error?.message ?? null
          if (name === 'loaderror') {
            error.value = event?.error?.message ?? 'Element failed to load'
            loading.value = false
          }
          if (name === 'ready' && def.readyPayload !== 'event') emit(name, element.value)
          else emit(name, ...args)
        }
      }

      const createRaw = (options: Record<string, unknown>): StripeElementLike | null => {
        const elements = elementsCtx?.elements.value as
          | { create: (type: string, options: Record<string, unknown>) => StripeElementLike }
          | null
          | undefined
        if (elements) return elements.create(elementType, options)
        const sdk = checkoutCtx?.checkout.value
        if (!sdk) return null
        if (!def.checkout) {
          throw new VueStripeElementsError(
            `${componentName} is not available inside Checkout Sessions; use it within VueStripeElements`
          )
        }
        return def.checkout(sdk, options)
      }

      const create = () => {
        const target = mountPoint()
        if (element.value || !target) return
        try {
          error.value = null
          const created = createRaw({ ...def.defaultOptions?.(), ...props.options })
          if (!created) return
          loading.value = true
          element.value = created
          for (const name of events) created.on(name, handlers[name] as never)
          created.mount(target)
        } catch (err) {
          error.value =
            err instanceof Error ? err.message : `Failed to create ${elementType} element`
          loading.value = false
          console.error(`[Vue Stripe] ${componentName} creation error:`, error.value)
          // Same payload shape as Stripe's own loaderror event.
          if (events.includes('loaderror')) {
            emit('loaderror', { elementType, error: { message: error.value } })
          }
        }
      }

      watch(
        () => props.options,
        (next) => {
          if (next) element.value?.update?.({ ...next })
        },
        { deep: true }
      )
      watch(() => elementsCtx?.elements.value ?? checkoutCtx?.checkout.value, create)
      onMounted(create)
      onUnmounted(() => {
        const el = element.value
        if (!el) return
        for (const name of events) el.off?.(name, handlers[name])
        el.destroy()
        element.value = null
      })

      expose({
        element,
        loading,
        error,
        focus: () => element.value?.focus?.(),
        blur: () => element.value?.blur?.(),
        clear: () => element.value?.clear?.(),
        ...def.expose?.(element)
      })

      return () =>
        hx('div', { class: [className, 'vue-stripe-element'] }, [
          error.value &&
            hx(
              'div',
              { class: [`${className}-error`, 'vue-stripe-element-error'] },
              slots['error']?.({ error: error.value }) ?? [
                hx('div', { class: 'vue-stripe-error-message' }, error.value)
              ]
            ),
          hx('div', {
            ref: 'mount',
            class: {
              [`${className}-mount`]: true,
              'vue-stripe-element-mount': true,
              [`${className}-loading`]: loading.value,
              'vue-stripe-element-loading': loading.value
            }
          }),
          loading.value &&
            hx(
              'div',
              { class: [`${className}-loader`, 'vue-stripe-element-loader'] },
              slots['loading']?.() ?? [
                hx('div', { class: 'vue-stripe-loading-message' }, loadingText)
              ]
            )
        ])
    }
  })
  // The runtime component is typed loosely; callers get the precise public type.
  return component as unknown as StripeElementComponent<TOptions, TElement, TExtra, TEvents>
}
