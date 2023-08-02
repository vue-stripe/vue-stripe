<template>
  <div>
    <div id="link-authentication-mount-point"></div>
    <slot name="link-authentication-errors">
      <div id="link-authentication-errors" role="alert" />
    </slot>
  </div>
</template>

<script>
import { loadStripe } from '@stripe/stripe-js/pure';
import { ref, watch } from 'vue';
import { STRIPE_PARTNER_DETAILS, LINK_AUTHENTICATION_ELEMENT_TYPE } from '../../constants';

export default {
  name: 'LinkAuthenticationElement',
  props: {
    pk: {
      type: String,
      required: true,
    },
    stripeAccount: String,
    apiVersion: String,
    locale: String,
    disableAdvancedFraudDetection: {
      type: Boolean,
      default: false,
    },
    elementOptions: {
      type: Object,
      default: () => ({}),
    },
  },
  setup (props, { emit }) {
    const stripe = ref(null);
    const elements = ref(null);
    const linkAuthElement = ref(null);
    const displayError = ref('');

    // onMounted(() => {
    //   console.warn('props.pk && props.elementOptions?.clientSecret', props.pk && props.elementOptions?.clientSecret);
    //   if (props.pk && props.elementOptions?.clientSecret) init();
    // });

    watch(props, () => init());

    async function init () {
      try {
        const loadParams = {
          advancedFraudSignals: !props.disableAdvancedFraudDetection,
        };

        loadStripe.setLoadParameters(loadParams);

        const stripeOptions = {
          apiVersion: props.apiVersion,
          locale: props.locale,
          stripeAccount: props.stripeAccount,
          advancedFraudSignals: !props.disableAdvancedFraudDetection,
        };

        stripe.value = await loadStripe(props.pk, stripeOptions);
        stripe.value.registerAppInfo(STRIPE_PARTNER_DETAILS);

        elements.value = stripe.value.elements(props.elementOptions);

        linkAuthElement.value = elements.value.create(
          LINK_AUTHENTICATION_ELEMENT_TYPE,
        );

        linkAuthElement.value.mount('#link-authentication-mount-point');

        // Events
        linkAuthElement.value.on('change', handleElementChange);
        linkAuthElement.value.on('ready', handleElementReady);
        linkAuthElement.value.on('focus', handleElementFocus);
        linkAuthElement.value.on('blur', handleElementBlur);
        linkAuthElement.value.on('escape', handleElementEscape);
      } catch (e) {
        console.error(e);
      }
    }

    function handleElementChange (event) {
      displayError.value = event?.error?.message || '';
      emit('element-change', event);
    }

    function handleElementReady (event) {
      emit('element-ready', event);
    }

    function handleElementFocus (event) {
      emit('element-focus', event);
    }

    function handleElementBlur (event) {
      emit('element-blur', event);
    }

    function handleElementEscape (event) {
      emit('element-escape', event);
    }

    // Watch for props change
    // watch(props. () => {
    //   try {
    //     console.warn('props changed', stripe.value);
    //     if (stripe.value) {
    //       stripe.value = null;
    //       elements.value = null;
    //       linkAuthElement.value.unmount();
    //       await init();
    //     }
    //   } catch (error) {
    //     displayError.value = 'Error initializing Stripe.';
    //   }
    // });

    // Methods
    function blur () {
      linkAuthElement.value.blur();
    }

    function clear () {
      linkAuthElement.value.clear();
    }

    function destroy () {
      linkAuthElement.value.destroy();
    }

    function focus () {
      linkAuthElement.value.focus();
    }

    function unmount () {
      linkAuthElement.value.unmount();
    }

    function getElement () {
      return elements.value.getElement(LINK_AUTHENTICATION_ELEMENT_TYPE);
    }

    return {
      displayError,
      blur,
      clear,
      destroy,
      focus,
      unmount,
      getElement,
    };
  },
};
</script>
