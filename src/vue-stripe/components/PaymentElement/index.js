import component from './PaymentElement.vue';

export default {
  install: (app, options) => {
    app.component('PaymentElement', component);
  },
};
