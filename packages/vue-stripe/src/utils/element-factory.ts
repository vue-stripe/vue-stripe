import { defineComponent, ref, inject, onMounted, onUnmounted, watch, h } from 'vue-demi'
import type { StripeElementChangeEvent } from '@stripe/stripe-js'
import { stripeElementsInjectionKey } from './injection-keys'
import { StripeElementsError } from './errors'

// Stripe element types that can be created
export type StripeElementType =
  | 'card'
  | 'cardNumber'
  | 'cardExpiry'
  | 'cardCvc'
  | 'payment'
  | 'address'
  | 'expressCheckout'
  | 'linkAuthentication'

export interface ElementFactoryOptions {
  elementType: StripeElementType
  componentName: string
}

// Generic element interface for our factory - Stripe elements have these common methods
interface StripeElementLike {
  mount(domElement: HTMLElement | string): void
  unmount(): void
  destroy(): void
  on(eventType: string, handler: (...args: unknown[]) => void): void
  off?(eventType: string, handler?: (...args: unknown[]) => void): void
  update?(options: Record<string, unknown>): void
  focus?(): void
  blur?(): void
  clear?(): void
}

export function createStripeElement({ elementType, componentName }: ElementFactoryOptions) {
  return defineComponent({
    name: componentName,
    props: {
      options: {
        type: Object,
        default: () => ({})
      }
    },
    emits: ['ready', 'change', 'focus', 'blur', 'escape'],
    setup(props, { emit, expose }) {
      const elementRef = ref<HTMLDivElement>()
      const element = ref<StripeElementLike | null>(null)
      const loading = ref(true)
      const error = ref<string | null>(null)

      const elementsInstance = inject(stripeElementsInjectionKey)

      if (!elementsInstance) {
        throw new StripeElementsError(
          `${componentName} must be used within StripeElements`
        )
      }

      const createElement = () => {
        if (!elementsInstance.elements.value) {
          error.value = 'Elements instance not available'
          loading.value = false
          return
        }

        if (!elementRef.value) {
          error.value = 'Mount point not available'
          loading.value = false
          return
        }

        try {
          error.value = null
          loading.value = true

          // Create element - use type assertion since we know our element types are valid
           
          const createdElement = (elementsInstance.elements.value as any).create(elementType, props.options) as StripeElementLike
          element.value = createdElement

          // Set up event listeners
          createdElement.on('ready', () => {
            loading.value = false
            emit('ready', element.value!)
          })

          createdElement.on('change', (event: unknown) => {
            const changeEvent = event as StripeElementChangeEvent
            // Update error state from Stripe
            if (changeEvent.error) {
              error.value = changeEvent.error.message
            } else {
              error.value = null
            }
            emit('change', changeEvent)
          })

          createdElement.on('focus', () => {
            emit('focus')
          })

          createdElement.on('blur', () => {
            emit('blur')
          })

          createdElement.on('escape', () => {
            emit('escape')
          })

          // Mount the element
          createdElement.mount(elementRef.value)
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : `Failed to create ${elementType} element`
          error.value = errorMessage
          loading.value = false
          console.error(`[Vue Stripe] ${componentName} creation error:`, errorMessage)
        }
      }

      // Watch for options changes
      watch(
        () => props.options,
        (newOptions) => {
          if (element.value?.update && newOptions) {
            element.value.update(newOptions as Record<string, unknown>)
          }
        },
        { deep: true }
      )

      // Watch for elements instance to become available
      watch(
        () => elementsInstance.elements.value,
        (newElements) => {
          if (newElements && elementRef.value && !element.value) {
            createElement()
          }
        },
        { immediate: true }
      )

      onMounted(() => {
        if (elementsInstance.elements.value && elementRef.value && !element.value) {
          createElement()
        }
      })

      onUnmounted(() => {
        if (element.value) {
          element.value.destroy()
        }
      })

      // Expose element and methods for parent access
      expose({
        element,
        loading,
        error,
        focus: () => {
          element.value?.focus?.()
        },
        blur: () => {
          element.value?.blur?.()
        },
        clear: () => {
          element.value?.clear?.()
        }
      })

      return () => {
        const className = `vue-stripe-${elementType}-element`
        
        return h('div', { class: className }, [
          error.value && h('div', { class: `${className}-error` }, [
            h('div', { class: 'vue-stripe-error-message' }, error.value)
          ]),
          h('div', {
            ref: elementRef,
            class: {
              [`${className}-mount`]: true,
              [`${className}-loading`]: loading.value
            }
          }),
          loading.value && h('div', { class: `${className}-loader` }, [
            h('div', { class: 'vue-stripe-loading-message' }, `Loading ${elementType}...`)
          ])
        ])
      }
    }
  })
}