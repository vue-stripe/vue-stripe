import type { ComponentOptionsMixin, DefineComponent, Ref, ShallowRef, VNode } from 'vue-demi'
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
  /**
   * `false` when `elements.create()` cannot build the type (the Checkout Form, the Currency
   * Selector): Elements contexts are skipped, and one alone reports the element unavailable.
   */
  elements?: boolean
  /**
   * Set when `elements.create()` needs a group with a `clientSecret` or `mode`: Stripe.js
   * builds the element on a bare group, then fails asynchronously without `ready` or
   * `loaderror`. On a bare group the factory reports this message through `loaderror` /
   * `#error` instead.
   */
  needsIntent?: string
  /**
   * `true` to create the element a tick after mount, once the elements rendered after it
   * exist: Stripe.js throws when the Currency Selector is created before the Checkout Form.
   */
  createLast?: boolean
  /** Extra members for the component's public instance (e.g. getValue). */
  expose?: (element: Ref<StripeElementLike | null>) => Record<string, unknown>
  loadingText?: string
  /**
   * Option keys `element.update()` refuses (Stripe.js warns or throws), kept out of updates:
   * the keys of the element's options type missing from its update type ({@link CreateOnly}).
   */
  createOnly?: Record<string, true>
  /** What `ready` emits: the Stripe element (default) or Stripe's ready event (Express Checkout). */
  readyPayload?: 'element' | 'event'
  /** Root CSS class; `-error`, `-mount`, `-loader` are derived from it. */
  className?: string
}

/** The create-only keys of an element: in its create options, not in what its `update()` takes. */
export type CreateOnly<TOptions, TElement extends { update(options: never): unknown }> = Record<
  Exclude<keyof TOptions, keyof Parameters<TElement['update']>[0]>,
  true
>

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

/** Stripe's `{ elementType }` event: `focus`, `blur`, `escape` and `loaderstart`. */
export type ElementTypeEvent<T extends string> = [event: { elementType: T }]

/** Payloads of the events most elements share; the element type comes from `TChange`. */
export type BaseElementEvents<TElement, TChange extends { elementType: string }> = {
  ready: [element: TElement]
  change: [event: TChange]
  focus: ElementTypeEvent<TChange['elementType']>
  blur: ElementTypeEvent<TChange['elementType']>
  escape: ElementTypeEvent<TChange['elementType']>
}

/** Payload of `loaderstart` / `loaderror` for an element type. */
export type LoadStartEvent<T extends string> = ElementTypeEvent<T>
export type LoadErrorEvent<T extends string> = [event: { elementType: T; error: StripeError }]

/**
 * Payload of the card elements' `networkschange`. Stripe.js 10's `.d.ts` declares only
 * `elementType`; Stripe sends `networks` (null while `loading`) as well.
 */
export type NetworksChangeEvent<T extends 'card' | 'cardNumber'> = [
  event: { elementType: T; networks: string[] | null; loading: boolean }
]

/** A slot that receives `TProps` (nothing when `void`). */
export type ScopedSlot<TProps = void> = (
  ...args: [TProps] extends [void] ? [] : [props: TProps]
) => VNode[]

/**
 * The `#loading` and `#error` slots every element (and most other components) renders;
 * `#error` receives the error message.
 */
export interface StatusSlots {
  loading?: ScopedSlot
  error?: ScopedSlot<{ error: string }>
}

/**
 * A component type with typed slots (#671). vue-tsc reads slot props from the `$slots` of
 * the instance that `new Component(props)` builds, and the `DefineComponent` parameters that
 * Vue 2.7 and Vue 3 share have no slots, so `$slots` would type every slot prop as `any`.
 * The extra construct signature comes first, so `new` picks it; `InstanceType` (template
 * refs) keeps reading the last one, the component's own.
 */
export type WithSlots<TComponent extends abstract new (...args: never[]) => object, TSlots> = (new (
  ...args: unknown[]
) => Omit<InstanceType<TComponent>, '$slots'> & { $slots: TSlots }) &
  TComponent

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
> = WithSlots<
  DefineComponent<
    { options?: TOptions | undefined },
    Omit<StripeElementExposed<TElement>, TUnsupported> & TExtra,
    Record<never, never>,
    Record<never, never>,
    Record<never, never>,
    ComponentOptionsMixin,
    ComponentOptionsMixin,
    { [K in keyof TEvents]: (...args: TEvents[K]) => void }
  >,
  StatusSlots
>

/**
 * Public type of a hand-written component (providers, VueStripeCheckout, ...). It passes only
 * the first 8 `DefineComponent` parameters, which Vue 2.7 and Vue 3 share, so the emitted
 * `.d.ts` resolves on both; `defineComponent()`'s inferred type passes Vue 3's 16+.
 * `TProps` is the runtime props object (`typeof props`), so required props and defaults keep
 * their types; `TExposed` is what `expose()` publishes on the template ref; `TSlots` gives
 * each slot's props.
 */
export type VueStripeComponent<
  TProps,
  TExposed extends object = Record<never, never>,
  TEvents extends ElementEvents = ElementEvents,
  TSlots = StatusSlots
> = WithSlots<
  DefineComponent<
    TProps,
    TExposed,
    Record<never, never>,
    Record<never, never>,
    Record<never, never>,
    ComponentOptionsMixin,
    ComponentOptionsMixin,
    { [K in keyof TEvents]: (...args: TEvents[K]) => void }
  >,
  TSlots
>
