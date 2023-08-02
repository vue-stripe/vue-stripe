import component from './LinkAuthenticationElement.vue';

export default {
  install: (app, options) => {
    app.component('LinkAuthenticationElement', component);
  },
};
