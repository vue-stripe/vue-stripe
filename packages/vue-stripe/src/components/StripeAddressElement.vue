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

// Extended element type to include event methods with looser typing
interface AddressElementWithEvents extends StripeAddressElementType {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(eventType: string, handler: (...args: any[]) => void): this
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off(eventType: string, handler?: (...args: any[]) => void): this
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
  setup(props, { emit }) {
    const addressRef = ref<HTMLDivElement>()
    let addressElement: AddressElementWithEvents | null = null

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

      addressElement = elementsInstance.elements.value.create('address', props.options) as AddressElementWithEvents
      addressElement.mount(addressRef.value)

      addressElement.on('ready', handleReady)
      addressElement.on('change', handleChange)
      addressElement.on('blur', handleBlur)
      addressElement.on('focus', handleFocus)
      addressElement.on('escape', handleEscape)
      addressElement.on('loaderror', handleLoadError)
    }

    const updateElement = () => {
      if (!addressElement) return
      addressElement.update(props.options)
    }

    const destroyElement = () => {
      if (!addressElement) return

      addressElement.off('ready', handleReady)
      addressElement.off('change', handleChange)
      addressElement.off('blur', handleBlur)
      addressElement.off('focus', handleFocus)
      addressElement.off('escape', handleEscape)
      addressElement.off('loaderror', handleLoadError)

      addressElement.destroy()
      addressElement = null
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

    return {
      addressRef,
      element: addressElement
    }
  }
})
</script>