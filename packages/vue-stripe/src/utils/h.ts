import { h, isVue2, type VNode } from 'vue-demi'

type Props = Record<string, unknown>

/**
 * Tiny Vue 2/3 vnode adapter for render functions.
 *
 * Vue 3 takes flat props (`{ class, onClick, 'data-x': 1 }`); Vue 2.7 wants
 * `{ class, style, key, ref, attrs: {...}, on: {...} }`. Only the shapes this
 * library uses are translated. Vue 2 also resolves component props from `attrs`,
 * so the same call works for elements and components.
 */
export function hx(tag: string | object, props: Props = {}, children?: unknown): VNode {
  if (!isVue2) return h(tag as string, props, children as never)

  const data: Props = {}
  const attrs: Props = {}
  const on: Props = {}
  for (const [key, value] of Object.entries(props)) {
    if (key === 'class' || key === 'style' || key === 'key' || key === 'ref') data[key] = value
    else if (/^on[A-Z]/.test(key)) on[key.charAt(2).toLowerCase() + key.slice(3)] = value
    else attrs[key] = value
  }
  if (Object.keys(attrs).length) data['attrs'] = attrs
  if (Object.keys(on).length) data['on'] = on
  return h(tag as string, data, children as never)
}

/**
 * `render` option of every component whose setup() throws (a missing wrapper or key).
 * setup()'s own render function wins; Vue uses this one only after an app error handler
 * (Nuxt's, for one) caught the throw, and without it follows the error with "missing
 * template or render function" (Vue 2.7: "Failed to mount component") (#745).
 */
export const renderAfterSetupError = () => null
