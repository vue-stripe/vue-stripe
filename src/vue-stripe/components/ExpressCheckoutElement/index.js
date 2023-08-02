import component from './ExpressCheckoutElement.vue';

export default {
  install: (app, options) => {
    app.component('ExpressCheckoutElement', component);
  },
};
