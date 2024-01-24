# Understanding Stripe.js

Vue Stripe is a wrapper around the Stripe.js library. It provides a convenient way to use Stripe.js in your Vue app.

This is a guide to help you understand how to use Stripe.js with Vue Stripe.

## TL;DR

Stripe instance is the product of calling the `Stripe()` function. It is the main object that you will use to interact with Stripe.js. Elements instance is the product of calling the `elements()` method on the Stripe instance. It is the main object that you will use to interact with Stripe Elements.

The Stripe Elements is used to manage the UI Elements called Element. The Element is used to collect sensitive information from the user. For example, the Card Element is used to collect the user's card number, expiration date and CVC.

## What is Stripe.js?

Stripe.js is a JavaScript library that allows you to accept payments on your website. It is the client-side component of Stripe's payment processing platform.

## Why use Stripe.js?

Stripe.js is a great way to accept payments on your website. It is easy to use and has a lot of features.

## The Stripe Instance

The Stripe instance is the main object that you will use to interact with Stripe.js. It is created by calling the `Stripe()` function.

```js
const stripe = Stripe('pk_test_12345', options);
```

The first argument is your publishable API key. You can check this link to see how to get your publishable API key. The second argument is an object with options.

More about the Stripe instance can be found [here](https://stripe.com/docs/js/initializing).

## The Elements Instance

The Elements instance is the main object that you will use to interact with Stripe Elements. It is created by calling the `elements()` method on the Stripe instance.

```js
const elements = stripe.elements(options);
```

More about the Elements instance can be found [here](https://stripe.com/docs/js/elements_object/create).

## How are these related to Vue Stripe?

Vue Stripe is a wrapper around the Stripe.js library. It provides a convenient way to use Stripe.js in your Vue app. It is built on top of the Stripe instance and the Elements instance. For example you don't need to create the Stripe instance or the Elements instance yourself. Vue Stripe will do that for you by calling the `useStripe` composables.

More about Stripe.js can be found in the [official documentation](https://stripe.com/docs/js).