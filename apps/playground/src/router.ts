import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import StripeProviderView from './views/StripeProviderView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/stripe-provider',
      name: 'StripeProvider',
      component: StripeProviderView
    }
    // Routes will be added as we test each component
  ]
})

export default router
