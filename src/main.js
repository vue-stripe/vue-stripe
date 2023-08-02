import { createApp } from 'vue';
import App from './App.vue';
import AddressElement from './vue-stripe/components/AddressElement';

createApp(App)
  .use(AddressElement)
  .mount('#app');
