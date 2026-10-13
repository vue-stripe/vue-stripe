import type { ComponentOptionsMixin, DefineComponent, Ref, ShallowRef } from 'vue-demi'
import type {
  StripeCheckoutElementsSdk,
  StripeCheckoutFormSdk,
  StripeError
} from '@stripe/stripe-js'

// Public types of the element factory (src/utils/element-factory.ts).

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

export interface ElementDefinition {
  /** `elements.create()` type, e.g. 'card' or 'payment'. */
  elementType: string
  componentName: string
  /** Stripe events re-emitted as Vue events (exact Stripe.js 10 union). Defaults to BASE_EVENTS. */
  events?: readonly string[]
  /**
   * Events subscribed on the Stripe element only when the app listens for them, because
   * subscribing changes Stripe's behaviour (Express Checkout waits for the handler to call
   * `resolve()` once a `click` handler is attached).
   */
  listenerOnlyEvents?: readonly string[]
  /** Options merged under `props.options` (e.g. IBAN supportedCountries). */
  defaultOptions?: () => Record<string, unknown>
  /** Creator inside VueStripeCheckoutElementsProvider; omit when Checkout Sessions lack the element. */
  checkout?: (sdk: StripeCheckoutElementsSdk, options: Record<string, unknown>) => StripeElementLike
  /** Creator inside VueStripeCheckoutFormProvider; omit when the Checkout Form SDK lacks the element. */
  checkoutForm?: (sdk: StripeCheckoutFormSdk, options: Record<string, unknown>) => StripeElementLike
  /** `false` when `elements.create()` has no such type (the Checkout Form): Elements contexts are ignored. */
  elements?: boolean
  /** Extra members for the component's public instance (e.g. getValue). */
  expose?: (element: Ref<StripeElementLike | null>) => Record<string, unknown>
  loadingText?: string
  /** Drop option keys Stripe refuses in `element.update()` (e.g. the Address Element's `mode`). */
  updateOptions?: (options: Record<string, unknown>) => Record<string, unknown>
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

/**
 * Public type of a factory-built element component. `TUnsupported` drops standard members
 * the Stripe element rejects (the Express Checkout Element throws on `clear()`).
 */
export type StripeElementComponent<
  TOptions extends object,
  TElement,
  TExtra extends object = Record<never, never>,
  TEvents extends ElementEvents = ElementEvents,
  TUnsupported extends keyof StripeElementExposed<TElement> = never
> = DefineComponent<
  { options?: TOptions | undefined },
  Omit<StripeElementExposed<TElement>, TUnsupported> & TExtra,
  Record<never, never>,
  Record<never, never>,
  Record<never, never>,
  ComponentOptionsMixin,
  ComponentOptionsMixin,
  { [K in keyof TEvents]: (...args: TEvents[K]) => void }
>

/**
 * Public type of a hand-written component (providers, VueStripeCheckout, ...). It passes only
 * the first 8 `DefineComponent` parameters, which Vue 2.7 and Vue 3 share, so the emitted
 * `.d.ts` resolves on both; `defineComponent()`'s inferred type passes Vue 3's 16+.
 * `TProps` is the runtime props object (`typeof props`), so required props and defaults keep
 * their types; `TExposed` is what `expose()` publishes on the template ref.
 */
export type VueStripeComponent<
  TProps,
  TExposed extends object = Record<never, never>,
  TEvents extends ElementEvents = ElementEvents
> = DefineComponent<
  TProps,
  TExposed,
  Record<never, never>,
  Record<never, never>,
  Record<never, never>,
  ComponentOptionsMixin,
  ComponentOptionsMixin,
  { [K in keyof TEvents]: (...args: TEvents[K]) => void }
>
