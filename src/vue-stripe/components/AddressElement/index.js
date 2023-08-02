import component from './AddressElement.vue';

export default {
  install: (app, options) => {
    app.component('AddressElement', component);
  },
};
