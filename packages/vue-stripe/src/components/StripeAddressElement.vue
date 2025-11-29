<template>
  <div ref="addressRef" />
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount, watch, inject } from 'vue-demi'
import type {
  StripeAddressElement as StripeAddressElementType,
  StripeAddressElementOptions,
  StripeAddressElementChangeEvent
} from '@stripe/stripe-js'
import { stripeElementsInjectionKey } from '../utils/injection-keys'
import { StripeElementsError } from '../utils/errors'

// Extended element type to include event methods and getValue with looser typing
interface AddressElementWithEvents extends StripeAddressElementType {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(eventType: string, handler: (...args: any[]) => void): this
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off(eventType: string, handler?: (...args: any[]) => void): this
  getValue(): Promise<Pick<StripeAddressElementChangeEvent, 'complete' | 'isNewAddress' | 'value'>>
}

export default defineComponent({
  name: 'StripeAddressElement',
  props: {
    options: {
      type: Object as () => StripeAddressElementOptions,
      default: () => ({
        mode: 'shipping' as const
      })
    }
  },
  emits: ['ready', 'change', 'blur', 'focus', 'escape', 'loadError'],
  setup(props, { emit, expose }) {
    const addressRef = ref<HTMLDivElement>()
    const elementRef = ref<AddressElementWithEvents | null>(null)

    const elementsInstance = inject(stripeElementsInjectionKey)

    if (!elementsInstance) {
      throw new StripeElementsError('StripeAddressElement must be used within StripeElements')
    }

    const handleReady = () => {
      emit('ready')
    }

    const handleChange = (event: StripeAddressElementChangeEvent) => {
      emit('change', event)
    }

    const handleBlur = () => {
      emit('blur')
    }

    const handleFocus = () => {
      emit('focus')
    }

    const handleEscape = () => {
      emit('escape')
    }

    const handleLoadError = (event: { elementType: 'address'; error: string }) => {
      emit('loadError', event)
    }

    const mountElement = () => {
      if (!elementsInstance.elements.value || !addressRef.value) return

      elementRef.value = elementsInstance.elements.value.create('address', props.options) as AddressElementWithEvents
      elementRef.value.mount(addressRef.value)

      elementRef.value.on('ready', handleReady)
      elementRef.value.on('change', handleChange)
      elementRef.value.on('blur', handleBlur)
      elementRef.value.on('focus', handleFocus)
      elementRef.value.on('escape', handleEscape)
      elementRef.value.on('loaderror', handleLoadError)
    }

    const updateElement = () => {
      if (!elementRef.value) return
      elementRef.value.update(props.options)
    }

    const destroyElement = () => {
      if (!elementRef.value) return

      elementRef.value.off('ready', handleReady)
      elementRef.value.off('change', handleChange)
      elementRef.value.off('blur', handleBlur)
      elementRef.value.off('focus', handleFocus)
      elementRef.value.off('escape', handleEscape)
      elementRef.value.off('loaderror', handleLoadError)

      elementRef.value.destroy()
      elementRef.value = null
    }

    // Exposed methods
    const getValue = async () => {
      if (!elementRef.value) {
        throw new StripeElementsError('Address element not mounted')
      }
      return elementRef.value.getValue()
    }

    const focus = () => {
      elementRef.value?.focus()
    }

    const clear = () => {
      elementRef.value?.clear()
    }

    onMounted(() => {
      mountElement()
    })

    onBeforeUnmount(() => {
      destroyElement()
    })

    watch(() => props.options, () => {
      updateElement()
    }, { deep: true })

    // Expose element and methods to parent via ref
    expose({
      element: elementRef,
      getValue,
      focus,
      clear
    })

    return {
      addressRef,
      element: elementRef,
      getValue,
      focus,
      clear
    }
  }
})
</script>