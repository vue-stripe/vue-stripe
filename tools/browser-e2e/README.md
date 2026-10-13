# @vue-stripe/browser-e2e

A real-browser Playwright suite for Vue Stripe, with two projects:

- **`wallets`**: Link, Google Pay and the Payment Request API in your own Google Chrome profile, over HTTPS. This is the only part that needs a person and a real machine; the steps are in [Wallet check](#wallet-check-maintainer).
- **`flows`**: every docs live demo, the playground pricing table, BECS on an Australian account and the redirect payment methods, driven to their real test-mode outcome and checked through the Stripe API. It runs headless, on CI or a server; see [Flows](#flows-ci-and-headless).

The suite needs live servers, Stripe keys and a real browser, so it is **not** part of `pnpm test`, Turborepo or CI. There is no `test` script on purpose.

## Wallet check (maintainer)

Run from the repository root. You need three terminals.

1. **Install.** Node 22 or newer, pnpm through corepack (`corepack enable`), Google Chrome and cloudflared (`brew install cloudflared`; on Linux, Cloudflare's `.deb` or `.rpm`). Then:

   ```bash
   pnpm install
   cp tools/browser-e2e/.env.example tools/browser-e2e/.env
   ```

2. **Make a Chrome profile for the tests** (once). Don't point the tests at your main profile (`~/Library/Application Support/Google/Chrome` on macOS): Chrome locks a profile while it is open and refuses automation of its default directory. Make a dedicated one instead:

   ```bash
   open -na "Google Chrome" --args --user-data-dir="$HOME/.vue-stripe-e2e-chrome"
   ```

   In that window, sign in to Google and make sure Google Pay has a card (pay.google.com). Stripe test mode shows the real Google Pay sheet with your real card, but the charge stays in test mode: nothing is billed. Quit that Chrome window.

3. **Fill in `tools/browser-e2e/.env`:** `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` (test mode, one account) and `CHROME_PROFILE_DIR=/Users/<you>/.vue-stripe-e2e-chrome`. If Chrome is not in `/Applications`, also set `CHROME_PATH` to its binary (for example `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`).

4. **Terminal 1, start the local stack** and leave it running. The first run builds everything and takes a few minutes.

   ```bash
   pnpm --filter @vue-stripe/browser-e2e e2e:serve
   ```

5. **Terminal 2, open the HTTPS tunnels** and leave them running. This registers both tunnel hostnames as payment method domains through the Stripe API and prints two lines. Paste them into `.env`; no rebuild is needed.

   ```bash
   pnpm --filter @vue-stripe/browser-e2e e2e:tunnel
   # DOCS_URL=https://<random>.trycloudflare.com
   # PLAYGROUND_URL=https://<random>.trycloudflare.com
   ```

6. **Terminal 3, check the wallets.** Chrome opens with your profile. The run checks that the Express Checkout Element shows Link and Google Pay, and that `usePaymentRequest`'s `canMakePayment` finds a wallet.

   ```bash
   pnpm --filter @vue-stripe/browser-e2e e2e:wallets
   ```

7. **Pay with Google Pay and with Link.**

   ```bash
   E2E_INTERACTIVE=1 pnpm --filter @vue-stripe/browser-e2e e2e:wallets
   ```

   Each payment test clicks the wallet button and pauses in the Playwright Inspector. Complete the sheet in Chrome, then press **Resume** in the Inspector:
   - Google Pay: pick your card and pay.
   - Link: enter any email; when Link asks for a code, any six digits work except `000001`, `000002` and `000003`.
   - Payment Request: the browser sheet for the same wallet.

   The test then checks the success message and that the PaymentIntent `succeeded`.

8. **Apple Pay, by hand in Safari** (Playwright cannot drive Apple Pay). On a Mac or iPhone with a card in Wallet, open the tunnel's `DOCS_URL` in Safari:
   1. `e2e:tunnel` printed `apple_pay active` for the docs hostname.
   2. `/live-demo/express-checkout`: pick a product. An **Apple Pay** button shows. Pay with it: the demo shows **Payment successful!**
   3. `/live-demo/payment-request`: `canMakePayment` lists `applePay`. **Pay $10.99** opens the sheet; paying shows **Payment Successful**.

9. **Send the results back** on the release issue `<n>`: the summary as the comment body and the wallet screenshots attached.

   ```bash
   cd tools/browser-e2e/results
   gh issue comment <n> --body-file summary.md $(for f in screenshots/wallets-*.png; do printf -- '--attach %s ' "$f"; done)
   ```

   Add a line for the Apple Pay checklist (which steps passed). `results/html/` holds the full report if something failed: `pnpm --filter @vue-stripe/browser-e2e e2e:report`.

10. **Stop** terminals 1 and 2 with Ctrl+C. Stopping the tunnel disables the payment method domains it registered.

Quick tunnels get a new hostname each run. If you test wallets often, a stable hostname (a named Cloudflare tunnel or your own domain pointing at port 4310) registered once under **Settings > Payment method domains** is better.

## Flows (CI and headless)

With `e2e:serve` running:

```bash
pnpm --filter @vue-stripe/browser-e2e e2e                     # headless Chrome
pnpm --filter @vue-stripe/browser-e2e e2e:headed              # watch it run
pnpm --filter @vue-stripe/browser-e2e e2e tests/flows/checkout.spec.ts
pnpm --filter @vue-stripe/browser-e2e e2e -g "payment-element"
```

The browser is Google Chrome (`channel: 'chrome'`). `CHROME_PATH` or `PW_EXECUTABLE_PATH` pins any Chrome or Chromium binary, for example Playwright's headless shell on a server; without Chrome, run `pnpm --filter @vue-stripe/browser-e2e exec playwright install chromium` once.

| Spec                         | Covers                                                                                                          | Checked through the API                                |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `payment-element.spec.ts`    | payment-element: 4242, 3D Secure (Complete), decline                                                            | PaymentIntent succeeded or `card_declined`             |
| `cards.spec.ts`              | card-element, split-card-elements, create-payment-method, tokens                                                | PaymentIntent, PaymentMethod, ConfirmationToken, Token |
| `elements.spec.ts`           | setup-intent, link-authentication, address-element, payment-method-messaging, express-checkout, payment-request | SetupIntent, PaymentIntent; demo layout guard          |
| `checkout.spec.ts`           | checkout-redirect (both buttons), embedded-checkout, custom-checkout, checkout-form, both subscription demos     | Checkout Session paid; subscription active             |
| `bank-debits.spec.ts`        | iban-element, ach-debit (Financial Connections test bank), becs-payment, BECS on an AU account                  | PaymentIntent processing                               |
| `redirect-methods.spec.ts`   | Bancontact, iDEAL, EPS, P24, Alipay, Klarna, Affirm, Afterpay through the playground Payment Element            | PaymentIntent succeeded with that payment method       |
| `identity.spec.ts`           | identity: Complete with test data                                                                               | VerificationSession verified                           |
| `playground.spec.ts`         | the pricing table for `PRICING_TABLE_ID`                                                                        |                                                        |
| `issuing.spec.ts`            | skipped with the reason (see [Issuing](#issuing))                                                               |                                                        |
| `live-demo-coverage.spec.ts` | fails when a page in `apps/docs/live-demo/` has no spec                                                         |                                                        |

Every test fails on any `[Vue Stripe]` console error or warning and on any uncaught exception (Stripe's own test-mode notices are ignored), saves a key-step screenshot, and adds a row to `results/summary.md` with pass, fail or skip and the reason.

## Configuration

`tools/browser-e2e/.env` is gitignored, and shell variables win over it. `.env.example` lists every variable.

| Variable                                                   | Used by       | What                                                              |
| ---------------------------------------------------------- | ------------- | ----------------------------------------------------------------- |
| `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`              | all           | Test-mode keys of one account                                     |
| `CHROME_PROFILE_DIR`                                       | wallets       | Dedicated Chrome profile signed in to Google                      |
| `DOCS_URL`, `PLAYGROUND_URL`                               | all           | Where tests open the sites; the HTTPS tunnel URLs for wallets     |
| `CHROME_PATH`                                              | all           | Chrome binary instead of the installed Google Chrome              |
| `E2E_INTERACTIVE=1`                                        | wallets       | Pause for you to complete the Google Pay and Link payments        |
| `PRICING_TABLE_ID`                                         | flows         | A test-mode pricing table on the same account                     |
| `STRIPE_AU_SECRET_KEY`, `STRIPE_AU_PUBLISHABLE_KEY`        | flows         | An Australian test account, for BECS; the test skips without them |
| `PW_EXECUTABLE_PATH`                                       | all           | Any Chromium build (CI, headless servers)                         |
| `E2E_DOCS_PORT`, `E2E_PLAYGROUND_PORT`, `E2E_BACKEND_PORT` | serve, tunnel | Ports, default 4310, 4311 and 4312 (clear of the dev servers)     |

`e2e:serve` builds the docs and playground with `VITE_API_URL=/.`, so both call `/api` on their own origin and the serve script proxies it to the backend. The same build then works on localhost and behind the tunnel. `e2e:serve --no-build` serves the last build again.

## Results

| Path                   | What                                                                       |
| ---------------------- | -------------------------------------------------------------------------- |
| `results/summary.md`   | One row per test: pass, fail or skip, time and reason                      |
| `results/screenshots/` | The key-step screenshot of every test, named `<project>-<test>-<step>.png` |
| `results/html/`        | Playwright's HTML report (`e2e:report`)                                    |
| `results/artifacts/`   | Failure screenshots and traces (`playwright show-trace <trace.zip>`)       |

`results/` is gitignored, and each run replaces it.

## Dashboard setup

The suite uses the docs' test-mode account. It needs:

- active products with one-time and recurring prices (`pnpm stripe:seed` creates a set);
- cards, SEPA Direct Debit, ACH Direct Debit and the redirect methods above turned on under Settings > Payment methods;
- Stripe Identity;
- the Checkout Form beta (the `checkout-form` test skips without it);
- a pricing table for `PRICING_TABLE_ID`.

BECS runs on a separate Australian account. Klarna redirects to Klarna's own sandbox login instead of Stripe's Authorize Test Payment page, so its test stops there and skips with that reason.

## Issuing

Issuing Elements need Stripe Issuing, which Stripe Sales enables; the sandbox does not have it. They also need a page that renders them and a server route that exchanges the ephemeral key nonce for an ephemeral key, and neither the docs, the playground nor `apps/backend` has those yet. `issuing.spec.ts` skips and says what is missing. Once they exist, replace the skip with a flow like the others.

## Adding a demo

`live-demo-coverage.spec.ts` fails when a page in `apps/docs/live-demo/` has no spec that opens it. Add a test that drives the demo to its real outcome, ideally with an API check.
