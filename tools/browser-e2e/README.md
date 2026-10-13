# @vue-stripe/browser-e2e

A real-browser Playwright suite for Vue Stripe. It drives every docs live demo and the playground's pricing table against Stripe test mode in Google Chrome, checks each outcome in the page and, for the important ones, through the Stripe API. A second project covers wallets (Link, Google Pay, the Payment Request API) in a signed-in Chrome profile over HTTPS.

It needs live servers, real Stripe keys and a real browser, so it is **not** part of `pnpm test`, Turborepo or CI. There is no `test` script on purpose. You run it on your own machine before a release.

## What it covers

| Project   | Spec                          | Demo or page                                                                                   | Checked in the page and through the API                                                   |
| --------- | ----------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `flows`   | `payment-element.spec.ts`     | payment-element                                                                                | 4242 succeeds; 4000 0025 0000 3155 succeeds after Complete on the 3D Secure page; 4000 0000 0000 0002 declines |
| `flows`   | `cards.spec.ts`               | card-element, split-card-elements, create-payment-method, tokens                               | PaymentIntent succeeded; PaymentMethod, ConfirmationToken and Token exist; Radar Session ID |
| `flows`   | `elements.spec.ts`            | setup-intent, link-authentication, address-element, payment-method-messaging, express-checkout, payment-request | SetupIntent succeeded; Link email captured and payment succeeded; address complete; BNPL message renders; wallet availability reported |
| `flows`   | `checkout.spec.ts`            | checkout-redirect (both buttons), embedded-checkout, custom-checkout, checkout-form, subscription-checkout, subscription-embedded | Checkout Session complete and paid; subscription active                                   |
| `flows`   | `bank-debits.spec.ts`         | iban-element, ach-debit, becs-payment                                                          | SEPA and ACH PaymentIntents processing; BECS needs an Australian account                  |
| `flows`   | `identity.spec.ts`            | identity                                                                                       | VerificationSession verified                                                              |
| `flows`   | `playground.spec.ts`          | playground `/stripe-pricing-table`                                                             | the pricing table renders priced products for `PRICING_TABLE_ID`                         |
| `flows`   | `issuing.spec.ts`             | Issuing Elements                                                                               | skipped with the reason (see [Issuing](#issuing))                                         |
| `flows`   | `live-demo-coverage.spec.ts`  | `apps/docs/live-demo/*.md`                                                                     | fails when a live demo has no browser test                                                |
| `wallets` | `wallets.spec.ts`             | express-checkout, payment-request                                                              | Link (and Google Pay when the profile has a card) in the Express Checkout Element; `canMakePayment` finds a wallet; with `E2E_INTERACTIVE=1`, you pay and the PaymentIntent is checked |

Every test also:

- fails on any `[Vue Stripe]` console error or warning and on any uncaught exception in the page (Stripe's own test-mode notices, such as the HTTP warning, the developer-tools banner and Apple Pay domain warnings, are ignored);
- saves a screenshot of its key step;
- adds a row to `results/summary.md` with pass, fail or skip and the reason.

## Run it

All commands run from the repository root.

1. **Install the prerequisites.**
   - Node 22 or newer (the repo's `.nvmrc` pins 24).
   - pnpm through corepack: `corepack enable`.
   - Google Chrome. The `flows` project uses it through Playwright's `chrome` channel. Without Chrome it falls back to Playwright's Chromium, which you download once with `pnpm --filter @vue-stripe/browser-e2e exec playwright install chromium`.
   - For wallets only: [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) (`brew install cloudflared` on macOS; on Linux, Cloudflare's `.deb` or `.rpm` package, or `sudo apt install cloudflared` from Cloudflare's apt repository).

2. **Install the workspace.**

   ```bash
   pnpm install
   ```

3. **Configure the keys.**

   ```bash
   cp tools/browser-e2e/.env.example tools/browser-e2e/.env
   ```

   Fill in `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` (test mode, same account) and `PRICING_TABLE_ID`. `.env` is gitignored; never commit it. The account needs what the demos use (see [Dashboard setup](#dashboard-setup)).

4. **Start the local stack** in its own terminal and leave it running.

   ```bash
   pnpm --filter @vue-stripe/browser-e2e e2e:serve
   ```

   It builds the library, `apps/backend` (with `STRIPE_SECRET_KEY`), the docs (with `VITE_STRIPE_PUBLISHABLE_KEY`) and the playground, then serves them and prints:

   ```text
   docs        http://localhost:4310
   playground  http://localhost:4311
   backend     http://localhost:4312
   ```

   The ports stay clear of the dev servers (3000, 3002, 5173); change them with `E2E_DOCS_PORT`, `E2E_PLAYGROUND_PORT` and `E2E_BACKEND_PORT`. Both sites call `/api` on their own origin and the serve script proxies it to the backend, so the same build works on localhost and behind an HTTPS tunnel. The first build takes a few minutes; `e2e:serve --no-build` serves the last build again. Ctrl+C stops all three servers.

5. **Run the flows** in a second terminal.

   ```bash
   pnpm --filter @vue-stripe/browser-e2e e2e          # headless Chrome
   pnpm --filter @vue-stripe/browser-e2e e2e:headed   # watch it run
   ```

   One spec or one test:

   ```bash
   pnpm --filter @vue-stripe/browser-e2e e2e tests/flows/checkout.spec.ts
   pnpm --filter @vue-stripe/browser-e2e e2e -g "payment-element"
   ```

   A full run takes about six minutes; Stripe's hosted pages and modals set the pace.

6. **Prepare a Chrome profile for wallets** (once).
   Chrome refuses automation of your everyday profile, so make a dedicated one and sign in there:

   ```bash
   # macOS
   open -na "Google Chrome" --args --user-data-dir="$HOME/.vue-stripe-e2e-chrome"
   # Linux
   google-chrome --user-data-dir="$HOME/.vue-stripe-e2e-chrome"
   ```

   In that window, sign in to your Google account and make sure Google Pay has a card (pay.google.com). In test mode Stripe swaps a real card for a test card and charges nothing. Link needs no setup: its button shows without an account. Quit that Chrome window before running the tests, because Chrome locks a profile while it is open. Then add the directory to `.env`:

   ```bash
   CHROME_PROFILE_DIR=/Users/you/.vue-stripe-e2e-chrome
   ```

7. **Open HTTPS tunnels** in a third terminal, with `e2e:serve` running.

   ```bash
   pnpm --filter @vue-stripe/browser-e2e e2e:tunnel
   ```

   Wallets only appear over HTTPS on a domain registered with Stripe. The helper starts a Cloudflare quick tunnel to the docs and one to the playground, registers both hostnames as payment method domains in test mode (`paymentMethodDomains.create`), and prints their wallet status and two lines to paste into `.env`:

   ```bash
   DOCS_URL=https://<random>.trycloudflare.com
   PLAYGROUND_URL=https://<random>.trycloudflare.com
   ```

   No rebuild is needed. Ctrl+C stops the tunnels and disables the domains this run registered. Quick tunnels get a new hostname each time; for regular use, a stable hostname (a named Cloudflare tunnel or a domain of your own pointing at the ports above) registered once under **Settings > Payment method domains** is better.

8. **Run the wallet checks.**

   ```bash
   pnpm --filter @vue-stripe/browser-e2e e2e:wallets
   ```

   This opens Chrome with your profile and checks that the Express Checkout Element shows Link (and Google Pay when the profile has a card) and that the Payment Request API's `canMakePayment` finds a wallet. To pay for real (in test mode):

   ```bash
   E2E_INTERACTIVE=1 pnpm --filter @vue-stripe/browser-e2e e2e:wallets
   ```

   Each test clicks the wallet button and pauses in the Playwright Inspector. Complete the Google Pay or Link sheet in the browser, then press **Resume** in the Inspector. The test then checks the success message and the PaymentIntent status through the API.

9. **Check Apple Pay by hand in Safari** (Playwright's WebKit cannot use Apple Pay). On a Mac or iPhone with a card in Wallet, open the tunnel's `DOCS_URL` in Safari and go through this list:
   1. `e2e:tunnel` printed `apple_pay active` for the docs hostname.
   2. `/live-demo/express-checkout`: pick a product. An **Apple Pay** button shows next to Link.
   3. Click it. The Apple Pay sheet shows the product's amount. Pay with Touch ID or Face ID.
   4. The demo shows **Payment successful!**, and the PaymentIntent is `succeeded` in the Dashboard.
   5. `/live-demo/payment-request`: `canMakePayment` lists `applePay`. **Pay $10.99** opens the sheet; paying shows **Payment Successful** with the PaymentIntent ID.
   6. `/live-demo/payment-element`: pick a product. Apple Pay is one of the Payment Element's options; paying with it reaches **Payment Successful!**.
   7. `/live-demo/checkout-redirect` and `/live-demo/embedded-checkout`: Apple Pay shows on Stripe's Checkout page; pay with it once.

10. **Read the results.**

    | Path                                       | What                                                                                   |
    | ------------------------------------------ | -------------------------------------------------------------------------------------- |
    | `tools/browser-e2e/results/summary.md`     | One row per test: pass, fail or skip, time and reason. Attach it to the release issue. |
    | `tools/browser-e2e/results/screenshots/`   | The key-step screenshot of every test, named after the test.                          |
    | `tools/browser-e2e/results/html/`          | Playwright's HTML report: `pnpm --filter @vue-stripe/browser-e2e e2e:report`.         |
    | `tools/browser-e2e/results/artifacts/`     | Failure screenshots and traces: `pnpm --filter @vue-stripe/browser-e2e exec playwright show-trace <trace.zip>`. |

    `results/` is gitignored and each run replaces it.

## Dashboard setup

The suite uses the same test-mode account as the docs demos. It needs:

- **Products**: at least one active product with a one-time price and one with a recurring price. `pnpm stripe:seed` creates a set.
- **Payment methods** (Settings > Payment methods): cards, SEPA Direct Debit and ACH Direct Debit turned on.
- **Identity**: Stripe Identity enabled on the account.
- **Checkout Form**: the `checkout-form` demo uses a Stripe beta. Without access the test skips and says so.
- **Pricing table**: a test-mode pricing table on the same account, its ID in `PRICING_TABLE_ID`.
- **BECS Direct Debit** only works on an Australian account. With other keys the test checks that the demo shows Stripe's rejection, then skips.
- **Wallets**: payment method domains for the tunnel hostnames (the tunnel helper registers them). For Apple Pay, if `e2e:tunnel` reports `apple_pay inactive`, follow the Dashboard's instructions for that domain under Settings > Payment method domains.

## Issuing

Issuing Elements show an issued card's number, CVC and expiry. Testing them needs an account onboarded to Stripe Issuing (with an issued test card), a page that renders them, and a server route that exchanges the ephemeral key nonce for an ephemeral key. Neither the docs nor the playground has an Issuing demo yet, and `apps/backend` has no ephemeral-key route, so `issuing.spec.ts` only reports what is missing (with `ISSUING=1`, it names the missing route). Once both exist, replace the skip with a flow like the others.

## Adding a demo

`live-demo-coverage.spec.ts` fails when a page in `apps/docs/live-demo/` has no spec that opens it. Add a test that drives the demo to its real outcome, ideally with an API check, and the guard passes again.

## Running on a headless server or in CI

Set `PW_EXECUTABLE_PATH` to any Chromium or Chrome build to skip channel detection, for example Playwright's headless shell. Wallet tests skip in headless mode, and without `CHROME_PROFILE_DIR` or an HTTPS `DOCS_URL`, with the reason in the summary.
