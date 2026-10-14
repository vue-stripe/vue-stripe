import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'

// The UMD build is for a page with no bundler: <script> tags for Vue, vue-demi and the
// library, in that order, and nothing else. @stripe/stripe-js ships no browser build that
// could define a global, so the UMD build bundles its loader (#714). Each test runs the real
// files in a fresh window, as a browser would, then lets the loader inject Stripe.js.
const require = createRequire(import.meta.url)
const distDir = dirname(dirname(require.resolve('@vue-stripe/vue-stripe')))
const read = (path: string) => readFileSync(path, 'utf8')
const umdBundle = read(`${distDir}/umd/index.js`)
const vueDemiIife = read(require.resolve('vue-demi/lib/index.iife.js'))
const vueGlobalBuilds = {
  'Vue 2.7': read(require.resolve('vue/dist/vue.js')),
  'Vue 3': read(require.resolve('vue3/dist/vue.global.js'))
}

type Exports = Record<string, unknown>
type PageWindow = Window & {
  Vue: Exports & { version: string }
  VueDemi: Exports & { isVue2: boolean }
  VueStripe?: Exports
  Stripe?: unknown
  eval(code: string): unknown
}

const openPage = (vue: string) => {
  const { window } = new JSDOM('<!doctype html><html><head></head><body><div id="app"></div>', {
    url: 'https://shop.example/',
    runScripts: 'outside-only'
  })
  const page = window as unknown as PageWindow
  const errors: unknown[] = []
  page.console.error = (...args: unknown[]) => errors.push(args)
  for (const script of [vue, vueDemiIife, umdBundle]) page.eval(script)
  return { page, errors }
}

// What js.stripe.com/endive/stripe.js defines: a Stripe() constructor with its version.
const fakeStripeJs = () => {
  const keys: string[] = []
  const Stripe = Object.assign(
    (key: string) => {
      keys.push(key)
      return { registerAppInfo: () => {}, elements: () => ({}) }
    },
    { version: 'endive' }
  )
  return { Stripe, keys }
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

describe.each(Object.entries(vueGlobalBuilds))(
  'the UMD build in a <script> tag page on %s',
  (_, vue) => {
    it('needs only the Vue and VueDemi globals', async () => {
      const { page, errors } = openPage(vue)
      const umd = page.VueStripe!
      expect(typeof umd.VueStripeProvider).toBe('object')
      expect(typeof umd.VueStripeCardElement).toBe('object')
      expect(typeof umd.VueStripePaymentElement).toBe('object')
      expect(typeof umd.createVueStripe).toBe('function')
      expect(typeof umd.loadStripe).toBe('function')
      expect(page.Stripe).toBeUndefined()
      expect(errors).toEqual([])
      // The bundled loader is the pure one: loading the file injects no Stripe.js script.
      await settle()
      expect(page.document.querySelector('script[src^="https://js.stripe.com/"]')).toBeNull()
      // The UMD wrapper requires no module but vue-demi, so it reads no other global.
      const wrapper = umdBundle.slice(
        umdBundle.indexOf('(function('),
        umdBundle.indexOf('})(this,')
      )
      const required = [...wrapper.matchAll(/require\(["'`]([^"'`]+)/g)].map((match) => match[1])
      expect(required).toEqual(['vue-demi'])
    })

    it('loads Stripe.js from js.stripe.com through the bundled loader', async () => {
      const { page, errors } = openPage(vue)
      const loadStripe = page.VueStripe!.loadStripe as (key: string) => Promise<unknown>
      const loaded = loadStripe('pk_test_umd')
      const script = page.document.querySelector<HTMLScriptElement>(
        'script[src^="https://js.stripe.com/"]'
      )
      expect(script?.src).toBe('https://js.stripe.com/endive/stripe.js')

      const { Stripe, keys } = fakeStripeJs()
      page.Stripe = Stripe
      script!.dispatchEvent(new page.Event('load'))
      expect(await loaded).toHaveProperty('elements')
      expect(keys).toEqual(['pk_test_umd'])
      expect(errors).toEqual([])
    })

    it('mounts VueStripeProvider, which emits load once Stripe.js is in', async () => {
      const { page, errors } = openPage(vue)
      const { Vue, VueDemi } = page
      const { VueStripeProvider } = page.VueStripe!
      const loads: unknown[] = []
      const h = VueDemi.h as (...args: unknown[]) => unknown
      // Vue 2 takes props and listeners in separate fields of the vnode data.
      const providerData = VueDemi.isVue2
        ? { props: { publishableKey: 'pk_test_umd' }, on: { load: (s: unknown) => loads.push(s) } }
        : { publishableKey: 'pk_test_umd', onLoad: (s: unknown) => loads.push(s) }
      const render = () =>
        h(
          VueStripeProvider,
          providerData,
          VueDemi.isVue2 ? [h('p', 'ready')] : { default: () => h('p', 'ready') }
        )
      if (VueDemi.isVue2) {
        const Ctor = Vue as unknown as new (options: object) => { $mount(el: string): void }
        new Ctor({ render }).$mount('#app')
      } else {
        const createApp = Vue.createApp as (root: object) => { mount(el: string): void }
        createApp({ render }).mount('#app')
      }
      await settle()
      expect(page.document.body.textContent).toContain('Loading Stripe...')
      const script = page.document.querySelector('script[src^="https://js.stripe.com/"]')!
      page.Stripe = fakeStripeJs().Stripe
      script.dispatchEvent(new page.Event('load'))
      await settle()
      await settle()

      expect(loads).toHaveLength(1)
      expect(page.document.body.textContent).toContain('ready')
      expect(errors).toEqual([])
    })
  }
)
