# Vue Stripe - Firebase Functions Backend

This directory contains the Firebase Functions backend for the Vue Stripe playground app.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add your Stripe API keys.

3. Install Firebase CLI globally:
   ```bash
   npm install -g firebase-tools
   ```

4. Login to Firebase:
   ```bash
   firebase login
   ```

## Development

### Run locally with emulators:
```bash
npm run serve
```

This will start the Firebase emulators for Functions and Hosting.

### Build TypeScript:
```bash
npm run build
```

### Watch mode:
```bash
npm run build:watch
```

## Available Functions

### `createPaymentIntent`
Creates a new Stripe Payment Intent.

**POST** `/createPaymentIntent`
```json
{
  "amount": 2000,
  "currency": "usd",
  "metadata": {
    "orderId": "12345"
  }
}
```

### `createSetupIntent`
Creates a new Stripe Setup Intent for saving payment methods.

**POST** `/createSetupIntent`
```json
{
  "customerId": "cus_xxx",
  "metadata": {}
}
```

### `createCustomer`
Creates a new Stripe Customer.

**POST** `/createCustomer`
```json
{
  "email": "customer@example.com",
  "name": "John Doe",
  "metadata": {}
}
```

### `createCheckoutSession`
Creates a new Stripe Checkout Session.

**POST** `/createCheckoutSession`
```json
{
  "lineItems": [
    {
      "price": "price_xxx",
      "quantity": 1
    }
  ],
  "mode": "payment",
  "successUrl": "https://example.com/success",
  "cancelUrl": "https://example.com/cancel",
  "customerId": "cus_xxx"
}
```

### `handleWebhook`
Handles Stripe webhooks. Configure your webhook endpoint in the Stripe Dashboard.

## Deployment

Deploy to Firebase:
```bash
npm run deploy
```

## Security Notes

- Always validate input data
- Use environment variables for sensitive keys
- Enable CORS only for your domains in production
- Implement proper authentication for production use
- Rate limit your endpoints