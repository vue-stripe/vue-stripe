<script>
import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PARTNER_DETAILS } from '../constants';
import { 
  defineComponent, 
  reactive, 
  install,
  onMounted,
} from 'vue-demi';

install();

export default defineComponent({
  name: 'VueStripe',
  props: {
    pk: {
      type: String,
      default: 'Vue Stripe Test',
    },
    options: {
      type: Object,
      default: () => ({}),
    },
  },
  setup (props, { slots }) {
    const data = reactive({
      stripe: null,
    });

    onMounted(() => {
      init(props.pk, props.options);
    });

    async function init (pk, options) {
      if (options?.disableAdvancedFraudDetection) loadStripe.setLoadParameters({ advancedFraudSignals: false });
      const stripeOptions = {
        stripeAccount: options?.stripeAccount,
        apiVersion: options?.apiVersion,
        locale: options?.locale,
      };
      data.stripe = await loadStripe(pk, stripeOptions);
      data.stripe.registerAppInfo(STRIPE_PARTNER_DETAILS);
    };

    return () => {
      if (slots.default) {
        return slots.default(data);
      }
    }
  },
});
</script>
