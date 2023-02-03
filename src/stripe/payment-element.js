import { onMounted } from 'vue';
import { PAYMENT_ELEMENT_TYPE } from '../constants';

export const usePaymentElement = (elements, options) => {
  onMounted(() => {
    elements.create(PAYMENT_ELEMENT_TYPE, options);
  });
};
