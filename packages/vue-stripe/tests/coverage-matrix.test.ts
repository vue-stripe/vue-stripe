import { describe, it, expect } from 'vitest'
import * as VueStripe from '../src'
import { coverage } from '../../../apps/docs/.vitepress/theme/data/stripe-coverage'

/**
 * Guards the home-page Stripe.js coverage tracker
 * (apps/docs/.vitepress/theme/data/stripe-coverage.ts) against drift: anything
 * marked `covered` must name a real export of @vue-stripe/vue-stripe, so the
 * headline number can never claim more than actually ships.
 */
describe('docs coverage matrix', () => {
  const exportNames = new Set(Object.keys(VueStripe))
  const items = coverage.flatMap((c) => c.items)

  it('every "covered" entry names a real package export', () => {
    for (const item of items.filter((i) => i.status === 'covered')) {
      expect(item.artifact, `"${item.name}" is covered but has no artifact`).toBeTruthy()
      expect(
        exportNames.has(item.artifact!),
        `"${item.name}" claims export "${item.artifact}" which is not exported from @vue-stripe/vue-stripe`
      ).toBe(true)
    }
  })

  it('planned entries link a roadmap issue; only covered entries carry an artifact', () => {
    for (const item of items) {
      if (item.status === 'planned') {
        expect(typeof item.issue, `"${item.name}" is planned but has no issue number`).toBe('number')
      }
      if (item.status !== 'covered') {
        expect(item.artifact, `"${item.name}" is ${item.status} but names an artifact`).toBeUndefined()
      }
    }
  })
})
