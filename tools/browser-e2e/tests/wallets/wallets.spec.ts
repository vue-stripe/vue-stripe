// Wallets need what a CI browser lacks: a headed Google Chrome, a profile signed in to Google
// with a card in Google Pay (or a Link account), and HTTPS on a domain registered with Stripe.
// Run with `pnpm e2e:wallets` after `pnpm e2e:tunnel` (see README). E2E_INTERACTIVE=1 opens
// the wallet sheet and pauses so you can finish the payment by hand.
import { chromium, type Frame, type Locator, type Page } from '@playwright/test'
import { config } from '../../src/config.ts'
import { expect, test as base } from '../../src/fixtures.ts'
import { backendResponse, pickFirstProduct } from '../../src/stripe-ui.ts'

const test = base.extend({
  // A persistent context on CHROME_PROFILE_DIR, so the Google account and saved cards load.
  context: async ({ headless }, use) => {
    const context = await chromium.launchPersistentContext(config.chromeProfileDir, {
      ...(config.executablePath
        ? { executablePath: config.executablePath }
        : { channel: 'chrome' }),
      headless,
      viewport: { width: 1280, height: 900 },
      // Without this flag Chrome shows the "controlled by automated software" bar, and some
      // wallet surfaces treat the browser as automated.
      ignoreDefaultArgs: ['--enable-automation']
    })
    await use(context)
    await context.close()
  }
})

test.describe.configure({ mode: 'serial' })

test.skip(({ headless }) => headless, 'Wallets need a headed Chrome: run pnpm e2e:wallets')
test.skip(
  () => !config.chromeProfileDir,
  'Set CHROME_PROFILE_DIR to a Chrome profile signed in to Google (see README step 6)'
)
test.skip(
  () => !config.docsUrl.startsWith('https://'),
  'Wallets need HTTPS on a domain registered with Stripe: run pnpm e2e:tunnel and set DOCS_URL'
)

/** Every frame Stripe mounted in `wrapper`, nested ones included (each wallet button has its own). */
async function walletFrames(page: Page, wrapper: string): Promise<Frame[]> {
  const frames: Frame[] = []
  const visit = (frame: Frame): void => {
    frames.push(frame)
    frame.childFrames().forEach(visit)
  }
  for (const handle of await page.locator(`${wrapper} iframe`).elementHandles()) {
    const frame = await handle.contentFrame()
    if (frame) visit(frame)
  }
  return frames
}

/** Accessible names and visible text of the wallet buttons, for matching "Link" or "Google Pay". */
async function walletLabels(page: Page, wrapper: string): Promise<string> {
  const texts = await Promise.all(
    (await walletFrames(page, wrapper)).map((frame) =>
      frame
        .evaluate(() =>
          [
            ...Array.from(document.querySelectorAll('[aria-label], [title]')).map(
              (el) => `${el.getAttribute('aria-label') ?? ''} ${el.getAttribute('title') ?? ''}`
            ),
            document.body?.innerText ?? ''
          ].join(' ')
        )
        .catch(() => '')
    )
  )
  return texts.join(' ')
}

/** The wallet button whose frame mentions `name`. */
async function walletButton(page: Page, wrapper: string, name: RegExp): Promise<Locator> {
  for (const frame of await walletFrames(page, wrapper)) {
    const button = frame.getByRole('button', { name })
    if (await button.count()) return button.first()
    const text = await frame.evaluate(() => document.body?.innerText ?? '').catch(() => '')
    if (name.test(text)) return frame.locator('button, [role="button"]').first()
  }
  throw new Error(`No wallet button matching ${name} in ${wrapper}`)
}

/** Lets the human finish the wallet sheet, then continues. */
async function handOver(page: Page, button: Locator): Promise<void> {
  await button.click()
  // Complete the payment in the Google Pay or Link sheet, then press Resume in the inspector.
  await page.pause()
}

test('express-checkout: Link shows, Google Pay when the profile has it', async ({
  page,
  stripe,
  snap
}) => {
  await page.goto(`${config.docsUrl}/live-demo/express-checkout`)
  const created = backendResponse<{ paymentIntentId: string }>(page, '/api/payment-intent')
  await pickFirstProduct(page)
  const { paymentIntentId } = await created

  const wrapper = '.vue-stripe-express-checkout-element'
  await expect(page.locator(`${wrapper} iframe`).first()).toBeVisible({ timeout: 60_000 })
  await expect.poll(() => walletLabels(page, wrapper), { timeout: 60_000 }).toMatch(/link/i)
  const labels = await walletLabels(page, wrapper)
  const googlePay = /google pay|gpay/i.test(labels)
  test.info().annotations.push({
    type: 'note',
    description: `Link: yes. Google Pay: ${googlePay ? 'yes' : 'no (no card in this profile?)'}`
  })
  await snap('express buttons')

  if (!config.interactive) return
  await handOver(page, await walletButton(page, wrapper, googlePay ? /google pay|gpay/i : /link/i))

  await expect(page.getByRole('heading', { name: 'Payment successful!' })).toBeVisible()
  await snap('paid')
  expect((await stripe.paymentIntents.retrieve(paymentIntentId)).status).toBe('succeeded')
})

test('payment-request: canMakePayment finds a wallet', async ({ page, stripe, snap }) => {
  await page.goto(`${config.docsUrl}/live-demo/payment-request`)
  const state = page.locator('[data-test="can-make-payment"] dd')
  await expect(state).not.toHaveText('Checking for a wallet...', { timeout: 60_000 })
  await expect(state).not.toHaveText('No wallet in this browser')
  test.info().annotations.push({
    type: 'note',
    description: `canMakePayment: ${(await state.textContent())?.trim()}`
  })
  await snap('wallet found')

  if (!config.interactive) return
  await handOver(page, page.locator('[data-test="payment-request-pay"]'))

  await expect(page.getByRole('heading', { name: 'Payment Successful' })).toBeVisible()
  const id = (await page.locator('.payment-id code').textContent())?.trim() ?? ''
  await snap('paid')
  expect((await stripe.paymentIntents.retrieve(id)).status).toBe('succeeded')
})
