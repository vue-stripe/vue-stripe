import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import StripeProviderView from './views/StripeProviderView.vue'
import StripeElementsView from './views/StripeElementsView.vue'
import UseStripeView from './views/UseStripeView.vue'
import CardElementView from './views/CardElementView.vue'
import SplitCardView from './views/SplitCardView.vue'

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
    },
    {
      path: '/use-stripe',
      name: 'useStripe',
      component: UseStripeView
    },
    {
      path: '/stripe-elements',
      name: 'StripeElements',
      component: StripeElementsView
    },
    {
      path: '/stripe-card-element',
      name: 'StripeCardElement',
      component: CardElementView
    },
    {
      path: '/stripe-split-card',
      name: 'SplitCardElements',
      component: SplitCardView
    }
    // Routes will be added as we test each component
  ]
})

export default router
