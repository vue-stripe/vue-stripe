<script>
import {
  defineComponent,
  reactive,
  install,
  watch,
} from 'vue-demi';

install();

export default defineComponent({
  name: 'Elements',
  props: {
    stripe: {
      type: Object,
    },
    clientSecret: {
      type: String,
    },
    options: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props, { slots, emit, expose }) {
    const data = reactive({
      elements: null,
    });

    watch(props, () => {
      init(props.stripe, props.clientSecret, props.options);
    }, { immediate: false });

    async function init(stripe, clientSecret, options) {
      data.elements = stripe.elements({ 
        ...options,
        clientSecret, 
      });
    };

    return () => {
      if (slots.default) {
        return slots.default(data);
      }
    }
  },
});
</script>
