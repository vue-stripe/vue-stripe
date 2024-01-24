<script setup>
import { VPTeamMembers } from 'vitepress/theme'
import PaymentIntentDemo from './demo/PaymentIntentDemo.vue'

const members = [
  {
    avatar: 'https://www.github.com/jofftiquez.png',
    name: 'Joff Tiquez',
    title: 'Creator',
    links: [
      { icon: 'github', link: 'https://github.com/jofftiquez' },
      { icon: 'x', link: 'https://twitter.com/jrtiquez' }
    ]
  },
  {
    avatar: 'https://www.github.com/mahomuri.png',
    name: 'Paolo Santos',
    title: 'Contributor',
    links: [
      { icon: 'github', link: 'https://github.com/mahomuri' },
      { icon: 'x', link: 'https://twitter.com/mahomuri' }
    ]
  },
]
</script>


# Welcome to Vue Stripe

<PaymentIntentDemo />

## What is Vue Stripe?

Vue Stripe is the official Stripe partner component library for Vue.js. It provides a set of composable components and utilities for working with Stripe.

Vue Stripe (formerly vue-stripe-checkout) is one of the firsts Stripe integrations for Vue.js. dating back to 2016. It has been used by thousands of developers and has been downloaded over 1.5 million times.

## Why Vue Stripe?

Aside from the fact that Vue Stripe is the official Stripe partner component library for Vue.js, there are a few other reasons why you should use Vue Stripe:

- **Access to Stripe's beta features** - Vue Stripe provides access to Stripe's beta features, such as the Payment Request Button Element.

- **It's easy to use** - Vue Stripe provides a set of composable components and utilities that make it easy to build Stripe integrations in your Vue.js applications.

- **It's well tested** - Vue Stripe is well tested and used by thousands of developers.

- **It's well documented** - Vue Stripe is well documented and has been downloaded over 1.5 million times.

- **It's open source** - Vue Stripe is open source and available on GitHub.

## Who is Vue Stripe for?

Vue Stripe is for anyone who wants to build Stripe integrations in their Vue.js applications. It's especially useful for developers who are new to Stripe and want to get started quickly.

## The Team

Say hello to our awesome team.

<VPTeamMembers size="small" :members="members" />