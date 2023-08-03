const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

app.use(express.json());
app.use(cors());

app.post('/create-payment-intent', async (req, res) => {
  // const { items } = req.body;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: 1400,
    currency: 'usd',
    automatic_payment_methods: {
      enabled: true,
    },
  });

  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});

app.listen(3000, () => console.log('Node Web Server listening on port 3000'));
