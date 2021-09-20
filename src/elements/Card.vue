<script>
import { ref, h, computed } from 'vue';
import { loadStripe } from '@stripe/stripe-js/dist/pure.esm.js';
import { isSecureHost } from '../utils';
import {
  DEFAULT_ELEMENT_STYLE,
  STRIPE_PARTNER_DETAILS,
  INSECURE_HOST_ERROR_MESSAGE,
} from '../constants';

const ELEMENT_TYPE = 'card';

export default {
  props: {
    pk: {
      type: String,
      required: true,
    },
    stripeAccount: {
      type: String,
      default: undefined,
    },
    apiVersion: {
      type: String,
      default: undefined,
    },
    locale: {
      type: String,
      default: 'auto',
    },
    elementsOptions: {
      type: Object,
      default: () => ({}),
    },
    disableAdvancedFraudDetection: {
      type: Boolean,
    },
    // element specific options
    classes: {
      type: Object,
      default: () => ({}),
    },
    elementStyle: {
      type: Object,
      default: () => (DEFAULT_ELEMENT_STYLE),
    },
    value: {
      type: String,
      default: undefined,
    },
    hidePostalCode: Boolean,
    iconStyle: {
      type: String,
      default: 'default',
      validator: value => ['solid', 'default'].includes(value),
    },
    hideIcon: Boolean,
    disabled: Boolean,
  },
  emits: ['token', 'error', 'loading', 'element-change', 'element-ready', 'element-focus', 'element-blur', 'element-escape', 'element-click'],
  setup (props, { slots, emit }) {
    if (!isSecureHost()) {
      document.getElementById('stripe-element-mount-point').innerHTML = `<p style="color: red">${INSECURE_HOST_ERROR_MESSAGE}</p>`;
      return false;
    }

    const stripe = ref(null);
    const elements = ref(null);
    const element = ref(null);

    const stripeOptions = {
      stripeAccount: props.stripeAccount,
      apiVersion: props.apiVersion,
      locale: props.locale,
    };

    const createOptions = {
      classes: props.classes,
      style: props.elementStyle,
      value: props.value,
      hidePostalCode: props.hidePostalCode,
      iconStyle: props.iconStyle,
      hideIcon: props.hideIcon,
      disabled: props.disabled,
    };

    const slot = slots['stripe-element-errors'] ? slots['stripe-element-errors']() : [];

    const modifiedSlot = slot.map(({ children }) =>
      h('div', {
        id: 'stripe-element-errors',
        role: 'alert',
      }, children));

    const form = computed(() => {
      return document.getElementById('stripe-element-form');
    });
    /**
     * Triggers the submission of the form
     * @return {void}
     */
    const submit = () => {
      form.value.submit();
    };
    /**
     * Clears the element
     * @return {void}
     */
    const clear = () => {
      element.value.clear();
    };
    /**
     * Destroys the element
     * @return {void}
     */
    const destroy = () => {
      element.value.destroy();
    };
    /**
     * Focuses on the element
     * @return {void}
     */
    const focus = () => {
      console.warn('This method will currently not work on iOS 13+ due to a system limitation.');
      element.value.focus();
    };
    /**
     * Unmounts the element
     * @return {void}
     */
    const unmount = () => {
      element.value.unmount();
    };
    /**
     * Updates the element
     * @param {string} opts.classes.base The base class applied to the container. Defaults to StripeElement.
     * @param {string} opts.classes.complete The class name to apply when the Element is complete. Defaults to StripeElement--complete.
     * @param {string} opts.classes.empty The class name to apply when the Element is empty. Defaults to StripeElement--empty.
     * @param {string} opts.classes.focus The class name to apply when the Element is focused. Defaults to StripeElement--focus.
     * @param {string} opts.classes.invalid The class name to apply when the Element is invalid. Defaults to StripeElement--invalid.
     * @param {string} opts.classes.webkitAutoFill The class name to apply when the Element has its value autofilled by the browser (only on Chrome and Safari). Defaults to StripeElement--webkit-autofill.
     * @param {Object} opts.style Customize the appearance of this element using CSS properties passed in a Style object.
     * @param {string} opts.value A pre-filled set of values to include in the input (e.g., {postalCode: '94110'}). Note that sensitive card information (card number, CVC, and expiration date) cannot be pre-filled
     * @param {boolean} opts.hidePostalCode Hide the postal code field. Default is false. If you are already collecting a full billing address or postal code elsewhere, set this to true.
     * @param {string} opts.iconStyle Appearance of the icon in the Element. Either solid or default.
     * @param {boolean} opts.hideIcon Hides the icon in the Element. Default is false.
     * @param {boolean} opts.disabled Applies a disabled state to the Element such that user input is not accepted. Default is false.
     */
    const update = (opts) => {
      element.value.update(opts);
    };
    // events
    const onChange = (e) => {
      emit('element-change', e);
    };

    const onReady = (e) => {
      emit('element-ready', e);
    };

    const onFocus = (e) => {
      emit('element-focus', e);
    };

    const onBlur = (e) => {
      emit('element-blur', e);
    };

    const onEscape = (e) => {
      emit('element-escape', e);
    };

    const onClick = (e) => {
      emit('element-click', e);
    };

    const onSubmit = async () => {
      try {
        emit('loading', true);
        const data = {
          ...element.value,
        };

        if (props.amount) data.amount = props.amount;

        const { token, error } = await stripe.value.createToken(data);

        if (error) {
          const errorElement = document.getElementById('stripe-element-errors');
          errorElement.textContent = error.message;
          emit('error', error);
          return;
        }

        emit('token', token);
      } catch (error) {
        emit('error', error);
      } finally {
        emit('loading', false);
      }
    };

    const start = async () => {
      stripe.value = await loadStripe(props.pk, stripeOptions);
      stripe.value.registerAppInfo(STRIPE_PARTNER_DETAILS);
      elements.value = stripe.value.elements(props.elementsOptions);
      element.value = elements.value.create(ELEMENT_TYPE, createOptions);
      element.value.mount('#stripe-element-mount-point');

      element.value.on('change', (event) => {
        const displayError = document.getElementById('stripe-element-errors');

        if (event.error) {
          displayError.textContent = event.error.message;
        } else {
          displayError.textContent = '';
        }
        onChange(event);
      });

      element.value.on('blur', onBlur);
      element.value.on('click', onClick);
      element.value.on('escape', onEscape);
      element.value.on('focus', onFocus);
      element.value.on('ready', onReady);
    };

    start();

    return {
      submit,
      modifiedSlot,
      onSubmit,
      stripe,
      element,
      clear,
      destroy,
      focus,
      unmount,
      update,
    };
  },
  render () {
    return h('div',
      {},
      [
        h(
          'form',
          {
            id: 'stripe-element-form',
            submit: this.onSubmit,
          },
          [
            h('div', {
              id: 'stripe-element-mount-point',
            }),
            this.modifiedSlot.length ? this.modifiedSlot : h('div', {
              id: 'stripe-element-errors',
            }),
          ],
        ),
      ]);
  },
};
</script>

<style>
/**
 * The CSS shown here will not be introduced in the Quickstart guide, but shows
 * how you can use CSS to style your Element's container.
 */
.StripeElement {
  box-sizing: border-box;

  height: 40px;

  padding: 10px 12px;

  border: 1px solid transparent;
  border-radius: 4px;
  background-color: white;

  box-shadow: 0 1px 3px 0 #e6ebf1;
  -webkit-transition: box-shadow 150ms ease;
  transition: box-shadow 150ms ease;
}

.StripeElement--focus {
  box-shadow: 0 1px 3px 0 #cfd7df;
}

.StripeElement--invalid {
  border-color: #fa755a;
}

.StripeElement--webkit-autofill {
  background-color: #fefde5 !important;
}

.hide {
  visibility: hidden;
}
</style>
