<template>
  <div ref="mountPoint"/>
</template>

<script>
import { PAYMENT_ELEMENT_TYPE  } from '../constants';
import { useElement } from '../composables/use-element';
import { defineComponent, install, ref, watch } from 'vue-demi';

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

    const mountPoint = ref(null);
    
    const { createElement, mountElement } = useElement(emit);

    watch(props, () => {
      init();
    });

    function init () {
      try {
        emit('loading', true);
        createElement(PAYMENT_ELEMENT_TYPE, props.elements, props.options);
        mountElement(mountPoint.value);
      } catch (e) {
        console.error(e);
        emit('error', error);
      } finally {
        emit('loading', false);
      }
    }

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
      } finally {
        emit('loading', false);
      }
    }
  
    return {
      mountPoint,
    }
  },
});
</script>
