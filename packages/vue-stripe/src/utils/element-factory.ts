import {
  defineComponent,
  getCurrentInstance,
  inject,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  watch,
  type PropType
} from 'vue-demi'
import type {
  ElementDefinition,
  ElementEvents,
  StripeElementComponent,
  StripeElementLike
} from './element-types'
import { stripeCheckoutInjectionKey, stripeElementsInjectionKey } from './injection-keys'
import { VueStripeElementsError } from './errors'
import { renderElement } from './element-render'

export type * from './element-types'

/** Stable snapshot used to skip `update()` when re-rendered options are deep-equal. */
const snapshot = (value: unknown): string => {
  try {
    return JSON.stringify(value)
  } catch {
    return String(Math.random())
  }
}

/** Keep only the keys a narrower Stripe option type accepts (Checkout SDK creators). */
export const pick = (options: Record<string, unknown>, keys: string[]) =>
  Object.fromEntries(Object.entries(options).filter(([key]) => keys.includes(key)))

export const BASE_EVENTS = ['ready', 'change', 'focus', 'blur', 'escape'] as const

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

      const updatable = (options: Record<string, unknown>) =>
        def.updateOptions ? def.updateOptions({ ...options }) : { ...options }
      // Last options applied to the element, so equal re-renders do not call update().
      let applied = ''

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
          applied = snapshot(updatable(props.options))
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

      // Templates often pass inline objects, so a re-render hands over a new but equal
      // object; only real changes reach element.update().
      watch(
        () => props.options,
        (next) => {
          const el = element.value
          if (!next || !el?.update) return
          const options = updatable(next)
          const key = snapshot(options)
          if (key === applied) return
          applied = key
          const report = (err: unknown) =>
            console.error(
              `[Vue Stripe] ${componentName} update error:`,
              err instanceof Error ? err.message : String(err)
            )
          try {
            Promise.resolve(el.update(options)).catch(report)
          } catch (err) {
            report(err)
          }
        },
        { deep: true }
      )
      const teardown = () => {
        const el = element.value
        if (!el) return
        for (const name of events) el.off?.(name, handlers[name])
        el.destroy()
        element.value = null
      }

      // VueStripeElements builds a new group when the Intent or the deferred-Intent
      // parameters change; an element left on the old group is invisible to confirm().
      watch(
        () => elementsCtx?.elements.value ?? checkoutCtx?.checkout.value,
        (next, prev) => {
          if (next !== prev) teardown()
          create()
        }
      )
      onMounted(create)
      onUnmounted(teardown)

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
        renderElement(className, { error: error.value, loading: loading.value }, slots, loadingText)
    }
  })
  // The runtime component is typed loosely; callers get the precise public type.
  return component as unknown as StripeElementComponent<TOptions, TElement, TExtra, TEvents>
}
