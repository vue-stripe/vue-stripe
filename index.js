import Vue from 'vue';
import App from './App.vue';
import VueStripeCheckout from './src/index.js';

Vue.use(VueStripeCheckout, 'pk_test_INH6o8QUdJyZM1TuGKs5PIsT');
// Vue.use(VueStripeCheckout);

new Vue({
	el: '#app',
	render: h => h(App),
});
