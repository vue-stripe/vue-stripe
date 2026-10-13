import { getCurrentInstance } from 'vue-demi'

/**
 * Whether the parent listens for one of the current component's events: Vue 3 keeps
 * listeners in the vnode props (onError, onErrorOnce), Vue 2.7 in $listeners. Call in
 * setup(); the returned check reads the listeners when it runs.
 */
export function listenerCheck() {
  const instance = getCurrentInstance()
  return (name: string) => {
    const key = `on${name[0]!.toUpperCase()}${name.slice(1)}`
    const props = (instance?.vnode as { props?: Record<string, unknown> | null } | undefined)?.props
    const proxy = instance?.proxy as { $listeners?: Record<string, unknown> } | null | undefined
    return !!(props?.[key] || props?.[`${key}Once`] || proxy?.$listeners?.[name])
  }
}

/**
 * Logs a failure the component also reports through `event` and its `#error` slot, but only
 * when the app handles neither: a handled failure stays out of the console (and out of error
 * monitoring that collects console.error). Call in setup().
 */
export function errorLogger(slots: Record<string, unknown>, event = 'error') {
  const listens = listenerCheck()
  return (label: string, message: string) => {
    if (!slots['error'] && !listens(event)) console.error(`[Vue Stripe] ${label}:`, message)
  }
}
