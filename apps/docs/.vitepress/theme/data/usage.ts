// The numbers on /usage: npm downloads, GitHub stars and contributors, and jsDelivr CDN hits.
// The build fetches them through usage.data.ts (so the HTML and /usage.md carry real numbers)
// and the page fetches them again in the browser. Every endpoint is public, needs no token and
// allows cross-origin requests. A failed request leaves its figures null; it never throws.

export const PACKAGE = '@vue-stripe/vue-stripe'
/** The day `@vue-stripe/vue-stripe` was first published to npm. */
export const PACKAGE_CREATED = '2021-01-06'
/** The maintainer's earlier package, which `@vue-stripe/vue-stripe` replaced. */
export const LEGACY_PACKAGE = 'vue-stripe-checkout'
export const LEGACY_PACKAGE_CREATED = '2017-09-27'
export const REPOSITORY = 'vue-stripe/vue-stripe'

export const NPM_PAGE = `https://www.npmjs.com/package/${PACKAGE}`
export const LEGACY_NPM_PAGE = `https://www.npmjs.com/package/${LEGACY_PACKAGE}`
export const GITHUB_PAGE = `https://github.com/${REPOSITORY}`
export const DEPENDENTS_PAGE = `${GITHUB_PAGE}/network/dependents`
export const JSDELIVR_PAGE = `https://www.jsdelivr.com/package/npm/${PACKAGE}`

const NPM_API = 'https://api.npmjs.org/downloads'
const GITHUB_API = `https://api.github.com/repos/${REPOSITORY}`
const JSDELIVR_API = `https://data.jsdelivr.com/v1/stats/packages/npm/${PACKAGE}`

/**
 * npm's point API rejects ranges over 18 months (and silently trims some), so all-time totals
 * add up shorter chunks.
 */
const CHUNK_DAYS = 500
const TIMEOUT_MS = 30_000
const DAY_MS = 86_400_000

export interface WeeklyDownloads {
  /** First day of the week (YYYY-MM-DD, UTC). */
  start: string
  /** Last day of the week, inclusive. */
  end: string
  downloads: number
}

export interface UsageData {
  /** When the numbers were fetched (ISO); null when nothing could be fetched. */
  fetchedAt: string | null
  npm: {
    /** The last day npm's counts include (YYYY-MM-DD). */
    through: string | null
    lastWeek: number | null
    lastMonth: number | null
    lastYear: number | null
    /** Every download of `@vue-stripe/vue-stripe` since it was published. */
    allTime: number | null
    /** The past 52 full weeks, oldest first; empty when unavailable. */
    weekly: WeeklyDownloads[]
  }
  legacy: { allTime: number | null }
  github: { stars: number | null; forks: number | null; contributors: number | null }
  cdn: { month: number | null; year: number | null }
}

export const emptyUsage = (): UsageData => ({
  fetchedAt: null,
  npm: {
    through: null,
    lastWeek: null,
    lastMonth: null,
    lastYear: null,
    allTime: null,
    weekly: []
  },
  legacy: { allTime: null },
  github: { stars: null, forks: null, contributors: null },
  cdn: { month: null, year: null }
})

type Fetch = (url: string, init?: { signal?: AbortSignal }) => Promise<Response>

const isoDay = (time: number) => new Date(time).toISOString().slice(0, 10)
const dayTime = (day: string) => Date.parse(`${day}T00:00:00Z`)

/** Inclusive `[start, end]` day ranges of at most `size` days covering `from` to `to`. */
export function dayChunks(from: string, to: string, size = CHUNK_DAYS): [string, string][] {
  const chunks: [string, string][] = []
  const last = dayTime(to)
  for (let start = dayTime(from); start <= last; start += size * DAY_MS) {
    chunks.push([isoDay(start), isoDay(Math.min(start + (size - 1) * DAY_MS, last))])
  }
  return chunks
}

/** Daily counts, oldest first, folded into the latest `weeks` full 7-day weeks. */
export function weeklyTotals(
  days: { day: string; downloads: number }[],
  weeks = 52
): WeeklyDownloads[] {
  const recent = days.slice(-weeks * 7)
  const full = recent.slice(recent.length % 7)
  const out: WeeklyDownloads[] = []
  for (let i = 0; i < full.length; i += 7) {
    const week = full.slice(i, i + 7)
    out.push({
      start: week[0]!.day,
      end: week[week.length - 1]!.day,
      downloads: week.reduce((sum, d) => sum + d.downloads, 0)
    })
  }
  return out
}

/** The page count in a GitHub `Link` header's `rel="last"` URL. */
export function lastPage(link: string | null): number | null {
  const page = /[?&]page=(\d+)>;\s*rel="last"/.exec(link ?? '')?.[1]
  return page ? Number(page) : null
}

const count = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null

interface DailyDownloads {
  day: string
  downloads: number
}

const sum = (days: DailyDownloads[]) => days.reduce((total, d) => total + d.downloads, 0)

/** Downloads on the days after `day`, or null when `days` starts too late to cover them all. */
export function downloadsAfter(days: DailyDownloads[], day: string): number | null {
  const first = days[0]
  if (!first || dayTime(first.day) > dayTime(day) + DAY_MS) return null
  return sum(days.filter((d) => d.day > day))
}

export async function fetchUsage(
  options: {
    fetch?: Fetch
    onError?: (source: string, error: unknown) => void
    /**
     * Numbers fetched earlier (the build's). All-time totals then add the days since from the
     * year of daily counts fetched anyway, instead of summing every chunk since 2017 again:
     * two npm requests instead of a dozen, which keeps a page view clear of npm's rate limit.
     */
    since?: UsageData
  } = {}
): Promise<UsageData> {
  const doFetch: Fetch = options.fetch ?? ((url, init) => fetch(url, init))
  const onError = options.onError ?? (() => {})
  const since = options.since

  const request = async (url: string) => {
    const signal =
      typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(TIMEOUT_MS) : undefined
    const response = await doFetch(url, signal ? { signal } : {})
    if (!response.ok) throw new Error(`${url} answered ${response.status}`)
    return response
  }
  const json = async <T>(url: string) => (await (await request(url)).json()) as T
  // Each figure fails on its own: one rate-limited API must not blank the whole page.
  const attempt = async <T>(source: string, run: () => Promise<T>): Promise<T | null> => {
    try {
      return await run()
    } catch (error) {
      onError(source, error)
      return null
    }
  }

  /** The past year of daily counts (npm's `last-year`: 365 days to its latest counted day). */
  const lastYear = async (pkg: string) =>
    (await json<{ downloads: DailyDownloads[] }>(`${NPM_API}/range/last-year/${pkg}`)).downloads

  /** Downloads of `pkg` from `from` to `to`, summed over chunks npm accepts whole. */
  const chunkedTotal = async (pkg: string, from: string, to: string) => {
    const parts = await Promise.all(
      dayChunks(from, to).map(async ([start, end]) => {
        const p = await json<{ downloads: number; start: string; end: string }>(
          `${NPM_API}/point/${start}:${end}/${pkg}`
        )
        // npm trims a range it will not serve; a trimmed chunk would undercount.
        if (p.start !== start || p.end !== end) {
          throw new Error(`npm answered ${p.start}:${p.end} for ${start}:${end}`)
        }
        return p.downloads
      })
    )
    return parts.reduce((total, n) => total + n, 0)
  }

  const [daily, legacyDaily, github, contributors, cdnMonth, cdnYear] = await Promise.all([
    attempt('npm downloads', () => lastYear(PACKAGE)),
    since ? attempt('npm legacy downloads', () => lastYear(LEGACY_PACKAGE)) : null,
    attempt('github repository', () =>
      json<{ stargazers_count?: unknown; forks_count?: unknown }>(GITHUB_API)
    ),
    attempt('github contributors', async () => {
      const response = await request(`${GITHUB_API}/contributors?per_page=1&anon=1`)
      // One contributor per page, so the last page number is the count. Without a Link
      // header everything fits on the one page.
      return lastPage(response.headers.get('link')) ?? ((await response.json()) as unknown[]).length
    }),
    attempt('jsdelivr month', () =>
      json<{ hits?: { total?: unknown } }>(`${JSDELIVR_API}?period=month`)
    ),
    attempt('jsdelivr year', () =>
      json<{ hits?: { total?: unknown } }>(`${JSDELIVR_API}?period=year`)
    )
  ])

  // npm's latest counted day (yesterday or the day before, UTC).
  const through = daily?.[daily.length - 1]?.day ?? null

  const allTime = async (
    source: string,
    pkg: string,
    created: string,
    days: DailyDownloads[] | null,
    before: number | null
  ): Promise<number | null> => {
    // The earlier total plus the days npm has counted since. When that cannot be worked out
    // the figure stays null, and the page keeps the earlier total.
    if (since && before !== null) {
      const after = days && since.npm.through ? downloadsAfter(days, since.npm.through) : null
      return after === null ? null : before + after
    }
    return through ? attempt(source, () => chunkedTotal(pkg, created, through)) : null
  }
  const [packageAllTime, legacyAllTime] = await Promise.all([
    allTime('npm all-time', PACKAGE, PACKAGE_CREATED, daily, since?.npm.allTime ?? null),
    allTime(
      'npm legacy all-time',
      LEGACY_PACKAGE,
      LEGACY_PACKAGE_CREATED,
      legacyDaily,
      since?.legacy.allTime ?? null
    )
  ])

  const data: UsageData = {
    fetchedAt: null,
    npm: {
      through,
      lastWeek: daily ? sum(daily.slice(-7)) : null,
      lastMonth: daily ? sum(daily.slice(-30)) : null,
      lastYear: daily ? sum(daily) : null,
      allTime: packageAllTime,
      weekly: daily ? weeklyTotals(daily) : []
    },
    legacy: { allTime: legacyAllTime },
    github: {
      stars: count(github?.stargazers_count),
      forks: count(github?.forks_count),
      contributors
    },
    cdn: { month: count(cdnMonth?.hits?.total), year: count(cdnYear?.hits?.total) }
  }
  if (hasAnyFigure(data)) data.fetchedAt = new Date().toISOString()
  return data
}

export function hasAnyFigure(data: UsageData): boolean {
  const { npm, legacy, github, cdn } = data
  return (
    npm.weekly.length > 0 ||
    [npm.lastWeek, npm.lastMonth, npm.lastYear, npm.allTime, legacy.allTime]
      .concat(Object.values(github), Object.values(cdn))
      .some((n) => n !== null)
  )
}

/** `fresh` over `base`, figure by figure: a figure the browser could not refetch keeps the build's. */
export function mergeUsage(base: UsageData, fresh: UsageData): UsageData {
  const pick = <T extends Record<string, unknown>>(a: T, b: T): T => {
    const out = { ...a }
    for (const key of Object.keys(b) as (keyof T)[]) {
      if (b[key] !== null) out[key] = b[key]
    }
    return out
  }
  return {
    fetchedAt: fresh.fetchedAt ?? base.fetchedAt,
    npm: {
      ...pick(base.npm, fresh.npm),
      weekly: fresh.npm.weekly.length ? fresh.npm.weekly : base.npm.weekly
    },
    legacy: pick(base.legacy, fresh.legacy),
    github: pick(base.github, fresh.github),
    cdn: pick(base.cdn, fresh.cdn)
  }
}

const USAGE_CACHE = Symbol.for('vue-stripe.docs.usage')

/**
 * The build's one fetch: the data loader and the /usage.md writer (config.ts buildEnd) run in
 * the same process but import this file separately, so the promise is kept on globalThis.
 */
export function loadUsage(): Promise<UsageData> {
  const store = globalThis as typeof globalThis & { [USAGE_CACHE]?: Promise<UsageData> }
  store[USAGE_CACHE] ??= fetchUsage({
    onError: (source, error) =>
      console.warn(
        `[Vue Stripe docs] ${source} unavailable at build time, /usage shows it without that figure: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
  })
  return store[USAGE_CACHE]
}

// Formatting. The docs are en-US and dates are UTC, so the server render and the browser
// print the same text (no hydration mismatch).
const integer = new Intl.NumberFormat('en-US')
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })
const longDate = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC'
})
const monthYear = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  timeZone: 'UTC'
})

export const formatCount = (n: number) => integer.format(n)
export const formatCompact = (n: number) => compact.format(n)
/** `2026-10-12` or an ISO timestamp -> `Oct 12, 2026`. */
export const formatDay = (day: string) =>
  longDate.format(new Date(day.length === 10 ? `${day}T00:00:00Z` : day))
export const formatMonth = (day: string) => monthYear.format(new Date(`${day}T00:00:00Z`))

/** One headline figure, as the page and /usage.md both list it. */
export interface UsageFigure {
  id: string
  label: string
  value: number | null
  /** A second, smaller line under the value. */
  detail?: string | undefined
  source: string
  sourceLink: string
}

export function usageFigures(data: UsageData): UsageFigure[] {
  const npm = { source: 'npm', sourceLink: NPM_PAGE }
  const github = { source: 'GitHub', sourceLink: GITHUB_PAGE }
  const cdn = { source: 'jsDelivr', sourceLink: JSDELIVR_PAGE }
  return [
    { id: 'year', label: 'Downloads, past year', value: data.npm.lastYear, ...npm },
    { id: 'month', label: 'Downloads, past month', value: data.npm.lastMonth, ...npm },
    { id: 'week', label: 'Downloads, past week', value: data.npm.lastWeek, ...npm },
    {
      id: 'cdn',
      label: 'CDN hits, past year',
      value: data.cdn.year,
      detail:
        data.cdn.month === null ? undefined : `${formatCount(data.cdn.month)} in the past month`,
      ...cdn
    },
    { id: 'stars', label: 'GitHub stars', value: data.github.stars, ...github },
    { id: 'forks', label: 'Forks', value: data.github.forks, ...github },
    { id: 'contributors', label: 'Contributors', value: data.github.contributors, ...github }
  ]
}
