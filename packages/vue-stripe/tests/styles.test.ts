import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const css = readFileSync(join(__dirname, '../src/styles.css'), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  ''
)
const rules = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].map((m) => ({
  selector: m[1]!.trim(),
  body: m[2]!
}))

describe('styles.css', () => {
  // #649: on the browser default content-box, a 44px min-height plus 12px padding and a
  // border gave 70px fields with the input at the top in apps without a box-sizing reset.
  it('sizes every padded rule with a min-height as border-box', () => {
    const sized = rules.filter((r) => /min-height:/.test(r.body) && /padding:/.test(r.body))
    expect(sized.map((r) => r.selector)).toContain('.vue-stripe-card-element-mount')
    expect(
      sized.filter((r) => !/box-sizing:\s*border-box/.test(r.body)).map((r) => r.selector)
    ).toEqual([])
  })

  // #784: the pricing table is hidden with `hidden`, which an author rule must back up, as a
  // custom element's own :host display rule would beat the browser's [hidden] rule.
  it('hides a hidden <stripe-pricing-table>', () => {
    const rule = rules.find((r) => r.selector === '.vue-stripe-pricing-table > [hidden]')
    expect(rule?.body).toMatch(/display:\s*none/)
  })
})
