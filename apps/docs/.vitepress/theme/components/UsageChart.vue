<script setup lang="ts">
// Weekly npm downloads on /usage, drawn as an inline SVG area chart (no chart library).
// The SVG is drawn in pixels at the width it is shown, so its text stays at text size on a
// phone. One y scale places the area, the line, the grid, the tick labels and the points.
// Hover, or focus the chart and use the arrow keys, to read each week; the table below the
// chart lists every week too.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { formatCompact, formatCount, formatDay, type WeeklyDownloads } from '../data/usage'

const props = defineProps<{ weeks: WeeklyDownloads[]; label: string }>()

const frame = ref<HTMLElement | null>(null)
// The server render has no width; 720 is the page column on a laptop. The browser measures.
const width = ref(720)
const height = computed(() => (width.value < 520 ? 220 : 280))
const margin = { top: 32, right: 12, bottom: 28, left: 44 }

const plotWidth = computed(() => Math.max(width.value - margin.left - margin.right, 1))
const plotHeight = computed(() => height.value - margin.top - margin.bottom)
const baseline = computed(() => margin.top + plotHeight.value)

/** Round tick steps (1, 2, 2.5 or 5 times a power of ten) for about four gridlines. */
const ticks = computed(() => {
  const max = Math.max(...props.weeks.map((w) => w.downloads), 1)
  const raw = max / 4
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const step = ([1, 2, 2.5, 5, 10].find((s) => s * magnitude >= raw) ?? 10) * magnitude
  const top = Math.ceil(max / step) * step
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step)
})
const yMax = computed(() => ticks.value[ticks.value.length - 1] ?? 1)

const x = (i: number) =>
  margin.left + (props.weeks.length > 1 ? (i / (props.weeks.length - 1)) * plotWidth.value : 0)
const y = (n: number) => baseline.value - (n / yMax.value) * plotHeight.value

const points = computed(() => props.weeks.map((w, i) => ({ ...w, x: x(i), y: y(w.downloads) })))
const line = computed(() =>
  points.value.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('')
)
const area = computed(() => {
  const first = points.value[0]
  const last = points.value[points.value.length - 1]
  if (!first || !last) return ''
  return `${line.value}L${last.x.toFixed(1)},${baseline.value}L${first.x.toFixed(1)},${baseline.value}Z`
})

const monthName = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' })
const monthOf = (day: string) => day.slice(0, 7)

/** A label under the first week of each month, dropped where it would crowd the one before. */
const monthTicks = computed(() => {
  const out: { x: number; text: string }[] = []
  points.value.forEach((p, i) => {
    const previous = points.value[i - 1]
    if (!previous || monthOf(previous.start) === monthOf(p.start)) return
    const date = new Date(`${p.start}T00:00:00Z`)
    const text = date.getUTCMonth() === 0 ? `Jan ${date.getUTCFullYear()}` : monthName.format(date)
    const lastKept = out[out.length - 1]
    // About 7px per character at 12px, centred on the week, plus a 12px gap.
    const halfWidths = ((lastKept?.text.length ?? 0) + text.length) * 3.5
    if (lastKept && p.x - lastKept.x < halfWidths + 12) return
    if (p.x + 24 > width.value) return
    out.push({ x: p.x, text })
  })
  return out
})

const latest = computed(() => points.value[points.value.length - 1])
// The latest value sits above the last few weeks of the line, so the line never crosses it.
const latestLabelY = computed(() =>
  Math.max(Math.min(...points.value.slice(-6).map((p) => p.y)) - 12, 14)
)
const peak = computed(() =>
  points.value.reduce<(typeof points.value)[number] | undefined>(
    (best, p) => (!best || p.downloads > best.downloads ? p : best),
    undefined
  )
)
const low = computed(() =>
  points.value.reduce<(typeof points.value)[number] | undefined>(
    (best, p) => (!best || p.downloads < best.downloads ? p : best),
    undefined
  )
)

const weekText = (w: WeeklyDownloads) => `${formatDay(w.start)} to ${formatDay(w.end)}`

const summary = computed(() => {
  const first = props.weeks[0]
  if (!first || !latest.value || !peak.value || !low.value) return props.label
  return `${props.label}, ${props.weeks.length} weeks from ${formatDay(first.start)} to ${formatDay(
    latest.value.end
  )}. Highest week: ${formatCount(peak.value.downloads)} downloads (week of ${formatDay(
    peak.value.start
  )}). Lowest week: ${formatCount(low.value.downloads)}. Latest week: ${formatCount(
    latest.value.downloads
  )}.`
})

// The week under the pointer or the keyboard cursor.
const active = ref<number | null>(null)
const activePoint = computed(() => (active.value === null ? undefined : points.value[active.value]))

function onPointer(event: PointerEvent) {
  const svg = event.currentTarget as SVGSVGElement
  const box = svg.getBoundingClientRect()
  const px = ((event.clientX - box.left) / box.width) * width.value
  const n = points.value.length
  if (!n) return
  const i = Math.round(((px - margin.left) / plotWidth.value) * (n - 1))
  active.value = Math.min(Math.max(i, 0), n - 1)
}

function onFocus() {
  if (active.value === null) active.value = points.value.length - 1
}

function onKey(event: KeyboardEvent) {
  const last = points.value.length - 1
  const current = active.value ?? last
  const next =
    event.key === 'ArrowLeft'
      ? current - 1
      : event.key === 'ArrowRight'
        ? current + 1
        : event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? last
            : null
  if (event.key === 'Escape') active.value = null
  if (next === null) return
  event.preventDefault()
  active.value = Math.min(Math.max(next, 0), last)
}

// The tooltip sits beside the crosshair and flips to the left in the right half.
const tooltipStyle = computed(() => {
  const p = activePoint.value
  if (!p) return {}
  const percent = (p.x / width.value) * 100
  return p.x > width.value / 2
    ? { right: `${100 - percent}%`, marginRight: '12px' }
    : { left: `${percent}%`, marginLeft: '12px' }
})

let observer: ResizeObserver | undefined
onMounted(() => {
  if (!frame.value || typeof ResizeObserver === 'undefined') return
  observer = new ResizeObserver(([entry]) => {
    if (entry) width.value = Math.max(Math.round(entry.contentRect.width), 240)
  })
  observer.observe(frame.value)
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <figure class="usage-chart">
    <div
      ref="frame"
      class="usage-chart-frame"
      tabindex="0"
      :aria-label="`${label}. Use the left and right arrow keys to read each week.`"
      @keydown="onKey"
      @focus="onFocus"
      @blur="active = null"
    >
      <svg
        :viewBox="`0 0 ${width} ${height}`"
        :width="width"
        :height="height"
        role="img"
        :aria-label="summary"
        @pointermove="onPointer"
        @pointerleave="active = null"
      >
        <title>{{ summary }}</title>
        <g class="usage-chart-grid" aria-hidden="true">
          <g v-for="tick in ticks" :key="tick">
            <line :x1="margin.left" :x2="width - margin.right" :y1="y(tick)" :y2="y(tick)" />
            <text :x="margin.left - 8" :y="y(tick)" dy="0.32em" text-anchor="end">
              {{ formatCompact(tick) }}
            </text>
          </g>
          <text
            v-for="tick in monthTicks"
            :key="tick.x"
            :x="tick.x"
            :y="height - 8"
            text-anchor="middle"
          >
            {{ tick.text }}
          </text>
        </g>
        <g aria-hidden="true">
          <path class="usage-chart-area" :d="area" />
          <path class="usage-chart-line" :d="line" />
          <line
            v-if="activePoint"
            class="usage-chart-cursor"
            :x1="activePoint.x"
            :x2="activePoint.x"
            :y1="margin.top - 8"
            :y2="baseline"
          />
          <template v-if="latest">
            <circle class="usage-chart-dot" :cx="latest.x" :cy="latest.y" r="5" />
            <text class="usage-chart-latest" :x="latest.x" :y="latestLabelY" text-anchor="end">
              {{ formatCount(latest.downloads) }}
            </text>
          </template>
          <circle
            v-if="activePoint && activePoint !== latest"
            class="usage-chart-dot"
            :cx="activePoint.x"
            :cy="activePoint.y"
            r="5"
          />
        </g>
      </svg>
      <div v-if="activePoint" class="usage-chart-tooltip" :style="tooltipStyle" aria-hidden="true">
        <strong>{{ formatCount(activePoint.downloads) }}</strong>
        <span>{{ weekText(activePoint) }}</span>
      </div>
      <p class="sr-only" aria-live="polite">
        {{
          activePoint
            ? `${formatCount(activePoint.downloads)} downloads, ${weekText(activePoint)}`
            : ''
        }}
      </p>
    </div>
    <figcaption>
      <details class="usage-chart-table">
        <summary>Every week as a table</summary>
        <div class="usage-chart-table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Week</th>
                <th scope="col">Downloads</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="week in [...weeks].reverse()" :key="week.start">
                <td>{{ weekText(week) }}</td>
                <td>{{ formatCount(week.downloads) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
    </figcaption>
  </figure>
</template>

<style scoped>
.usage-chart {
  margin: 0;
}

.usage-chart-frame {
  position: relative;
  border-radius: 8px;
  touch-action: pan-y;
}

.usage-chart-frame:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 4px;
}

.usage-chart svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
  font-family: var(--vp-font-family-base);
  font-variant-numeric: tabular-nums;
}

.usage-chart-grid line {
  stroke: var(--vp-c-divider);
  stroke-width: 1;
  shape-rendering: crispEdges;
}

.usage-chart-grid text {
  fill: var(--vp-c-text-2);
  font-size: 12px;
}

.usage-chart-area {
  fill: var(--vp-c-brand-1);
  fill-opacity: 0.1;
}

.usage-chart-line {
  fill: none;
  stroke: var(--vp-c-brand-1);
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.usage-chart-cursor {
  stroke: var(--vp-c-text-3);
  stroke-width: 1;
  shape-rendering: crispEdges;
}

.usage-chart-dot {
  fill: var(--vp-c-brand-1);
  stroke: var(--usage-surface, var(--vp-c-bg));
  stroke-width: 2;
}

.usage-chart-latest {
  fill: var(--vp-c-text-1);
  font-size: 13px;
  font-weight: 600;
}

.usage-chart-tooltip {
  position: absolute;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-elv);
  box-shadow: var(--vp-shadow-2);
  pointer-events: none;
  white-space: nowrap;
  font-size: 12px;
  line-height: 1.4;
  color: var(--vp-c-text-2);
}

.usage-chart-tooltip strong {
  color: var(--vp-c-text-1);
  font-size: 15px;
  font-variant-numeric: tabular-nums;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.usage-chart-table {
  margin-top: 16px;
  font-size: 14px;
}

.usage-chart-table summary {
  cursor: pointer;
  color: var(--vp-c-text-2);
}

.usage-chart-table summary:hover {
  color: var(--vp-c-brand-1);
}

.usage-chart-table-scroll {
  max-height: 320px;
  margin-top: 12px;
  overflow: auto;
}

.usage-chart-table table {
  display: table;
  width: 100%;
  margin: 0;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}

.usage-chart-table th,
.usage-chart-table td {
  padding: 6px 12px;
  border: 0;
  border-bottom: 1px solid var(--vp-c-divider);
  text-align: left;
}

.usage-chart-table th:last-child,
.usage-chart-table td:last-child {
  text-align: right;
}

.usage-chart-table tr {
  background: transparent;
}
</style>
