import type { RouteRecordRaw } from 'vue-router'
import HomeView from './views/HomeView.vue'
import StripeProviderView from './views/StripeProviderView.vue'
import StripeElementsView from './views/StripeElementsView.vue'
import UseStripeView from './views/UseStripeView.vue'
import CardElementView from './views/CardElementView.vue'
import SplitCardView from './views/SplitCardView.vue'
import PaymentElementView from './views/PaymentElementView.vue'
import AddressElementView from './views/AddressElementView.vue'
import LinkAuthenticationView from './views/LinkAuthenticationView.vue'
import ExpressCheckoutView from './views/ExpressCheckoutView.vue'
import SetupIntentView from './views/SetupIntentView.vue'
import CheckoutView from './views/CheckoutView.vue'
// European Regional Elements (v5.2.0)
import IbanElementView from './views/IbanElementView.vue'
import IdealBankElementView from './views/IdealBankElementView.vue'
import P24BankElementView from './views/P24BankElementView.vue'
import EpsBankElementView from './views/EpsBankElementView.vue'

// Route metadata for SEO
export interface RouteMeta {
  title: string
  description: string
}

// Routes exported separately for vite-ssg
export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: {
      title: 'Vue Stripe Playground',
      description: 'Interactive playground for testing Vue Stripe components and integrations'
    }
  },
  {
    path: '/stripe-provider',
    name: 'StripeProvider',
    component: StripeProviderView,
    meta: {
      title: 'VueStripeProvider - Vue Stripe',
      description: 'Learn how to use VueStripeProvider to initialize Stripe.js in your Vue application'
    }
  },
  {
    path: '/use-stripe',
    name: 'useStripe',
    component: UseStripeView,
    meta: {
      title: 'useStripe Composable - Vue Stripe',
      description: 'Access the Stripe instance using the useStripe composable in Vue components'
    }
  },
  {
    path: '/stripe-elements',
    name: 'StripeElements',
    component: StripeElementsView,
    meta: {
      title: 'VueStripeElements - Vue Stripe',
      description: 'Create and manage Stripe Elements with VueStripeElements component'
    }
  },
  {
    path: '/stripe-card-element',
    name: 'StripeCardElement',
    component: CardElementView,
    meta: {
      title: 'Card Element - Vue Stripe',
      description: 'Collect card details securely with the Vue Stripe Card Element component'
    }
  },
  {
    path: '/stripe-split-card',
    name: 'SplitCardElements',
    component: SplitCardView,
    meta: {
      title: 'Split Card Elements - Vue Stripe',
      description: 'Use separate card number, expiry, and CVC elements for custom card forms'
    }
  },
  {
    path: '/stripe-payment-element',
    name: 'StripePaymentElement',
    component: PaymentElementView,
    meta: {
      title: 'Payment Element - Vue Stripe',
      description: 'Accept multiple payment methods with the unified Payment Element component'
    }
  },
  {
    path: '/stripe-address-element',
    name: 'StripeAddressElement',
    component: AddressElementView,
    meta: {
      title: 'Address Element - Vue Stripe',
      description: 'Collect shipping and billing addresses with the Address Element'
    }
  },
  {
    path: '/stripe-link-authentication',
    name: 'StripeLinkAuthenticationElement',
    component: LinkAuthenticationView,
    meta: {
      title: 'Link Authentication Element - Vue Stripe',
      description: 'Enable Stripe Link for faster checkout with saved payment methods'
    }
  },
  {
    path: '/stripe-express-checkout',
    name: 'StripeExpressCheckoutElement',
    component: ExpressCheckoutView,
    meta: {
      title: 'Express Checkout Element - Vue Stripe',
      description: 'Add Apple Pay, Google Pay, and other express checkout options'
    }
  },
  {
    path: '/use-setup-intent',
    name: 'useSetupIntent',
    component: SetupIntentView,
    meta: {
      title: 'useSetupIntent - Vue Stripe',
      description: 'Save payment methods for future use with the useSetupIntent composable'
    }
  },
  {
    path: '/stripe-checkout',
    name: 'StripeCheckout',
    component: CheckoutView,
    meta: {
      title: 'Stripe Checkout - Vue Stripe',
      description: 'Embed Stripe Checkout directly in your Vue application'
    }
  },
  // European Regional Elements (v5.2.0)
  {
    path: '/stripe-iban-element',
    name: 'IbanElement',
    component: IbanElementView,
    meta: {
      title: 'IBAN Element - Vue Stripe',
      description: 'Collect IBAN bank account details for SEPA payments'
    }
  },
  {
    path: '/stripe-ideal-bank-element',
    name: 'IdealBankElement',
    component: IdealBankElementView,
    meta: {
      title: 'iDEAL Bank Element - Vue Stripe',
      description: 'Accept iDEAL payments popular in the Netherlands'
    }
  },
  {
    path: '/stripe-p24-bank-element',
    name: 'P24BankElement',
    component: P24BankElementView,
    meta: {
      title: 'P24 Bank Element - Vue Stripe',
      description: 'Accept Przelewy24 payments popular in Poland'
    }
  },
  {
    path: '/stripe-eps-bank-element',
    name: 'EpsBankElement',
    component: EpsBankElementView,
    meta: {
      title: 'EPS Bank Element - Vue Stripe',
      description: 'Accept EPS payments popular in Austria'
    }
  }
]
