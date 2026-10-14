import { onBeforeUnmount, onMounted, shallowRef, watch, type Ref } from 'vue'

/**
 * Counts a row of figures up from 0, once, the first time `root` scrolls into view.
 *
 * Returns the numbers to draw while counting, and null at every other time: on the server,
 * before the row is seen, after the count, and when the reader prefers reduced motion. Null
 * means "show the real values", so the static HTML always carries them and a reader with
 * JavaScript off or motion reduced never sees a count. Draw the counting numbers in an
 * aria-hidden copy over the real value, so screen readers only ever hear the real one.
 *
 * When `values` change during the count (the browser fetched newer numbers), the count
 * carries on from where it is to the new values; after it, the new values simply show.
 */
export function useCountUp(
  root: Ref<Element | null>,
  values: () => number[],
  duration = 1200
): Ref<number[] | null> {
  const counting = shallowRef<number[] | null>(null)
  let observer: IntersectionObserver | undefined
  let frame = 0
  let from: number[] = []
  let to: number[] = []
  let start = 0

  // Ease-out cubic: fast at first, settling into the value.
  const ease = (t: number) => 1 - (1 - t) ** 3

  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration)
    if (t < 1) {
      const k = ease(t)
      counting.value = to.map((v, i) => (from[i] ?? 0) + (v - (from[i] ?? 0)) * k)
      frame = requestAnimationFrame(tick)
    } else {
      counting.value = null
      frame = 0
    }
  }

  const run = (begin: number[]) => {
    from = begin
    to = values()
    start = performance.now()
    counting.value = to.map((_, i) => begin[i] ?? 0)
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(tick)
  }

  onMounted(() => {
    const el = root.value
    if (!el || typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        observer?.disconnect()
        observer = undefined
        run(values().map(() => 0))
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
  })

  watch(values, () => {
    if (counting.value) run(counting.value)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    cancelAnimationFrame(frame)
  })

  return counting
}
