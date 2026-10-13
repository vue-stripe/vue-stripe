// Helpers for Stripe's iframes and the docs demos. Stripe renders every field in a
// cross-origin iframe, so the helpers go through the iframe that Vue Stripe's wrapper
// (`.vue-stripe-<type>-element`) mounted, and wait on what Stripe rendered, never on sleeps.
import { expect, type Frame, type FrameLocator, type Page, type Route } from '@playwright/test'

export const CARDS = {
  success: '4242424242424242',
  threeDS: '4000002500003155',
  declined: '4000000000000002'
} as const

/** The first iframe Stripe mounted inside a Vue Stripe element wrapper. */
export function elementFrame(page: Page, wrapper: string, index = 0): FrameLocator {
  return page.locator(`${wrapper} iframe`).nth(index).contentFrame()
}

/** Fills the card form of a Payment Element (selecting Card first when it shows a list). */
export async function fillPaymentElementCard(
  page: Page,
  number: string,
  wrapper = '.vue-stripe-payment-element'
): Promise<void> {
  const frame = elementFrame(page, wrapper)
  const numberInput = frame.locator('input[name="number"]')
  const cardOption = frame.getByRole('button', { name: 'Card', exact: true })
  await expect(numberInput.or(cardOption).first()).toBeVisible({ timeout: 60_000 })
  if (!(await numberInput.isVisible())) await cardOption.click()

  await numberInput.fill(number)
  await frame.locator('input[name="expiry"]').fill('12 / 34')
  await frame.locator('input[name="cvc"]').fill('123')

  // The country defaults to the visitor's IP location; pin it so the postal code is predictable.
  const country = frame.locator('select[name="country"]')
  if (await country.isVisible()) await country.selectOption('US')
  const postal = frame.locator('input[name="postalCode"]')
  if (await postal.isVisible()) await postal.fill('10001')

  // Link's "save my info" opt-in would ask for a phone number; leave it off.
  const linkOptIn = frame.locator('input[name="linkOptIn"]')
  if ((await linkOptIn.count()) && (await linkOptIn.isChecked())) {
    await linkOptIn.uncheck({ force: true })
  }
}

/** Fills the single-line Card Element. */
export async function fillCardElement(
  page: Page,
  number: string,
  wrapper = '.vue-stripe-card-element'
): Promise<void> {
  const frame = elementFrame(page, wrapper)
  await expect(frame.locator('input[name="cardnumber"]')).toBeVisible({ timeout: 60_000 })
  await frame.locator('input[name="cardnumber"]').fill(number)
  await frame.locator('input[name="exp-date"]').fill('12 / 34')
  await frame.locator('input[name="cvc"]').fill('123')
  const postal = frame.locator('input[name="postal"]')
  if (await postal.isVisible()) await postal.fill('10001')
}

/** Searches every frame (Stripe nests the 3D Secure challenge two or three deep). */
export async function findInFrames(
  page: Page,
  selector: string,
  timeoutMs: number
): Promise<Frame> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      const count = await frame
        .locator(selector)
        .count()
        .catch(() => 0)
      if (count > 0) return frame
    }
    await page.waitForTimeout(500)
  }
  throw new Error(`No frame contains ${selector} after ${timeoutMs} ms`)
}

/** Clicks Complete (or Fail) on Stripe's test 3D Secure page. */
export async function answer3DS(
  page: Page,
  outcome: 'complete' | 'fail' = 'complete'
): Promise<void> {
  const selector = outcome === 'complete' ? '#test-source-authorize-3ds' : '#test-source-fail-3ds'
  const frame = await findInFrames(page, selector, 60_000)
  await frame.locator(selector).click()
}

/**
 * Resolves with the JSON body of the next POST the page makes to the backend at `path`.
 * The request goes through a route, so the body is still readable when the page navigates
 * away right after it (the Checkout redirects).
 */
export function backendResponse<T>(page: Page, path: string): Promise<T> {
  return new Promise<T>((resolvePromise, reject) => {
    let captured = false
    // The route stays for the page's lifetime: unrouting while Stripe.js requests are in
    // flight can leave one of them paused forever.
    page
      .route(`**${path}`, async (route: Route) => {
        if (captured || route.request().method() !== 'POST') return route.fallback()
        captured = true
        try {
          const response = await route.fetch()
          const body = (await response.json()) as T
          await route.fulfill({ response, json: body })
          resolvePromise(body)
        } catch (error) {
          reject(error instanceof Error ? error : new Error(String(error)))
        }
      })
      .catch(reject)
  })
}

/** Picks the first product the demo's ProductSelector lists. */
export async function pickFirstProduct(page: Page): Promise<string> {
  const card = page.locator('.product-card').first()
  await expect(card).toBeVisible({ timeout: 60_000 })
  const name = (await card.getByRole('heading').first().textContent())?.trim() ?? ''
  await card.click()
  return name
}

/**
 * Fills and submits Stripe's Checkout page, hosted (`target` is the page) or embedded
 * (`target` is the embedded iframe).
 */
export async function payOnCheckoutPage(
  target: Page | FrameLocator,
  email: string,
  number: string = CARDS.success
): Promise<void> {
  const emailInput = target.locator('#email')
  await expect(emailInput).toBeVisible({ timeout: 60_000 })
  await emailInput.fill(email)

  // Sessions with several payment methods show an accordion; card is one of the entries.
  const cardNumber = target.locator('#cardNumber')
  const cardAccordion = target.locator('[data-testid="card-accordion-item-button"]')
  if (!(await cardNumber.isVisible()) && (await cardAccordion.isVisible())) {
    await cardAccordion.click()
  }
  await cardNumber.fill(number)
  await target.locator('#cardExpiry').fill('12 / 34')
  await target.locator('#cardCvc').fill('123')
  await target.locator('#billingName').fill('Jenny Rosen')
  await target.locator('#billingCountry').selectOption('US')
  const postal = target.locator('#billingPostalCode')
  if (await postal.isVisible()) await postal.fill('10001')

  // Saving the card to Link would ask for a phone number.
  const savePass = target.locator('#enableStripePass')
  if ((await savePass.count()) && (await savePass.isChecked())) {
    await savePass.uncheck({ force: true })
  }
  await target.locator('[data-testid="hosted-payment-submit-button"]').click()
}

/** Waits for a frame whose URL contains `fragment` (Stripe's modals load their own iframe). */
export async function waitForFrame(
  page: Page,
  fragment: string,
  timeoutMs = 60_000
): Promise<Frame> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const frame = page.frames().find((candidate) => candidate.url().includes(fragment))
    if (frame) return frame
    await page.waitForTimeout(250)
  }
  throw new Error(`No ${fragment} frame after ${timeoutMs} ms`)
}

/** The playground reads its publishable key from localStorage (the header's key dialog). */
export async function setPlaygroundKey(page: Page, publishableKey: string): Promise<void> {
  await page.addInitScript((key) => {
    localStorage.setItem(
      'vue-stripe-playground-config',
      JSON.stringify({ publishableKey: key, clientSecret: '', setupSecret: '', sessionId: '' })
    )
  }, publishableKey)
}
