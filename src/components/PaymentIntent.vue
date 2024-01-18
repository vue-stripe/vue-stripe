<template>
  <div ref="stripeElementMountPoint"/>
</template>

<script>
import { PAYMENT_ELEMENT_TYPE  } from '../constants';
import {
  defineComponent,
  reactive,
  install,
  ref,
  watch,
} from 'vue-demi';

install();

export default defineComponent({
  name: 'PaymentIntent',
  props: {
    stripe: {
      type: Object,
    },
    elements: {
      type: Object,
    },
    options: {
      type: Object,
      default: () => ({}),
    },
    confirmParams: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props, { emit, expose }) {

    expose({
      submit,
    });
    
    const stripeElementMountPoint = ref(null);

    const data = reactive({
      paymentIntent: null,
    });

    watch(props, () => {
      if (stripeElementMountPoint.value) init(props.elements, props.options);
    }, { immediate: false });

    async function init(elements, options) {
      data.paymentIntent = elements.create(PAYMENT_ELEMENT_TYPE, options);
      data.paymentIntent.mount(stripeElementMountPoint.value);

      // Handle emits
      data.paymentIntent.on('change', handleElementChange);
      data.paymentIntent.on('ready', handleElementReady);
      data.paymentIntent.on('focus', handleElementFocus);
      data.paymentIntent.on('blur', handleElementBlur);
      data.paymentIntent.on('escape', handleElementEscape);
      data.paymentIntent.on('submit', submit);
    };

    // Methods
    async function submit () {
      try {
        emit('loading', true);
        const { error } = props.stripe.confirmPayment({
          elements: props.elements,
          confirmParams: props.confirmParams,
        });

        if (error) {
          console.error(error);
          emit('error', error);
        }
      } catch (error) {
        emit('error', error);
      }
    }
    
    // Emit events
    function handleElementChange (event) {
      emit('change', event);
    }

    function handleElementReady (event) {
      emit('ready', event);
    }

    function handleElementFocus (event) {
      emit('focus', event);
    }

    function handleElementBlur (event) {
      emit('blur', event);
    }

    function handleElementEscape (event) {
      emit('escape', event);
    }

    return {
      stripeElementMountPoint,
    }
  },
});
</script>
