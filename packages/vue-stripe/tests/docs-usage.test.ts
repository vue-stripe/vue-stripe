import { describe, it, expect } from 'vitest'
import {
  dayChunks,
  downloadsAfter,
  emptyUsage,
  fetchUsage,
  hasAnyFigure,
  lastPage,
  mergeUsage,
  weeklyTotals
} from '../../../apps/docs/.vitepress/theme/data/usage'
import { usageMarkdown } from '../../../apps/docs/.vitepress/llms'

/**
 * /usage fetches npm, GitHub and jsDelivr numbers at build time and again in the browser.
 * The build must pass offline (CI, a laptop on a plane), so every failure has to end in null
 * figures and the page's fallback, never a thrown error.
 */

interface FakeResponse {
  ok: boolean
  status: number
  headers: { get: (name: string) => string | null }
  json: () => Promise<unknown>
}

const reply = (body: unknown, headers: Record<string, string> = {}): FakeResponse => ({
  ok: true,
  status: 200,
  headers: { get: (name) => headers[name.toLowerCase()] ?? null },
  json: () => Promise.resolve(body)
})

/** A fetch that answers like the real APIs, except for URLs `fail` matches. */
const fakeFetch =
  (fail: (url: string) => boolean = () => false) =>
  (url: string): Promise<Response> => {
    if (fail(url)) return Promise.reject(new TypeError('fetch failed'))
    const range = /\/point\/(\d{4}-\d{2}-\d{2}):(\d{4}-\d{2}-\d{2})\//.exec(url)
    let body: FakeResponse
    if (range) body = reply({ downloads: 100, start: range[1], end: range[2] })
    else if (url.includes('/range/last-year/'))
      body = reply({
        downloads: Array.from({ length: 365 }, (_, i) => ({
          day: new Date(Date.UTC(2025, 9, 13) + i * 86_400_000).toISOString().slice(0, 10),
          downloads: 1
        }))
      })
    else if (url.includes('/contributors'))
      body = reply([{}], {
        link: '<https://api.github.com/x?per_page=1&anon=1&page=2>; rel="next", <https://api.github.com/x?per_page=1&anon=1&page=34>; rel="last"'
      })
    else if (url.includes('api.github.com'))
      body = reply({ stargazers_count: 1126, forks_count: 140 })
    else body = reply({ hits: { total: url.includes('year') ? 3461 : 281 } })
    return Promise.resolve(body as unknown as Response)
  }

describe('/usage numbers', () => {
  it('splits a long range into chunks npm serves whole', () => {
    const chunks = dayChunks('2021-01-06', '2026-10-12')
    expect(chunks[0]).toEqual(['2021-01-06', '2022-05-20'])
    expect(chunks.at(-1)?.[1]).toBe('2026-10-12')
    // Contiguous, no day twice, none over 18 months.
    for (let i = 1; i < chunks.length; i++) {
      const gap = Date.parse(chunks[i]![0]) - Date.parse(chunks[i - 1]![1])
      expect(gap).toBe(86_400_000)
    }
    expect(dayChunks('2026-10-12', '2026-10-12')).toEqual([['2026-10-12', '2026-10-12']])
  })

  it('folds daily counts into full weeks ending on the last day', () => {
    const days = Array.from({ length: 10 }, (_, i) => ({ day: `2026-10-${10 + i}`, downloads: i }))
    expect(weeklyTotals(days, 52)).toEqual([
      { start: '2026-10-13', end: '2026-10-19', downloads: 3 + 4 + 5 + 6 + 7 + 8 + 9 }
    ])
  })

  it("reads the contributor count from the Link header's last page", () => {
    expect(
      lastPage(
        '<https://x?per_page=1&page=2>; rel="next", <https://x?per_page=1&page=34>; rel="last"'
      )
    ).toBe(34)
    expect(lastPage(null)).toBeNull()
  })

  it('fetches every figure', async () => {
    const data = await fetchUsage({ fetch: fakeFetch() })
    expect(data.npm).toMatchObject({
      through: '2026-10-12',
      lastWeek: 7,
      lastMonth: 30,
      lastYear: 365
    })
    expect(data.npm.allTime).toBe(100 * dayChunks('2021-01-06', '2026-10-12').length)
    expect(data.npm.weekly).toHaveLength(52)
    expect(data.github).toEqual({ stars: 1126, forks: 140, contributors: 34 })
    expect(data.cdn).toEqual({ month: 281, year: 3461 })
    expect(data.fetchedAt).not.toBeNull()
  })

  it('offline, it resolves with no figures and the Markdown says so', async () => {
    const errors: string[] = []
    const data = await fetchUsage({
      fetch: fakeFetch(() => true),
      onError: (source) => errors.push(source)
    })
    expect(data).toEqual(emptyUsage())
    expect(hasAnyFigure(data)).toBe(false)
    expect(errors.length).toBeGreaterThan(0)
    expect(usageMarkdown(data)).toContain('Live numbers unavailable')
  })

  it('the Markdown carries the weekly table and the past-month CDN hits the page shows', async () => {
    const data = await fetchUsage({ fetch: fakeFetch() })
    const markdown = usageMarkdown(data)
    expect(markdown).toContain('| CDN hits, past year | 3,461 (281 in the past month) |')
    expect(markdown).toContain('\n## Weekly npm downloads\n')
    expect(markdown).toContain('| Week | Downloads |')
    const weeks = markdown.split('\n').filter((line) => / to .* \| \d[\d,]* \|$/.test(line))
    expect(weeks).toHaveLength(52)
    expect(weeks.at(-1)).toBe('| Oct 6, 2026 to Oct 12, 2026 | 7 |')
  })

  it('a failing source blanks only its own figures', async () => {
    const data = await fetchUsage({ fetch: fakeFetch((url) => url.includes('api.github.com')) })
    expect(data.github).toEqual({ stars: null, forks: null, contributors: null })
    expect(data.npm.lastWeek).toBe(7)
    expect(usageMarkdown(data)).toMatch(/\| GitHub stars \| Not available \|/)
  })

  it('an all-time chunk npm trims counts as unavailable, not as a smaller total', async () => {
    const trimming = (url: string) => {
      const range = /\/point\/(\d{4}-\d{2}-\d{2}):(\d{4}-\d{2}-\d{2})\//.exec(url)
      if (!range) return fakeFetch()(url)
      return Promise.resolve(
        reply({ downloads: 1, start: '2021-07-06', end: range[2] }) as unknown as Response
      )
    }
    const data = await fetchUsage({ fetch: trimming })
    expect(data.npm.allTime).toBeNull()
    expect(data.legacy.allTime).toBeNull()
  })

  it('in the browser, all-time totals add the days since the build to its totals', async () => {
    const urls: string[] = []
    const built = await fetchUsage({ fetch: fakeFetch() })
    built.npm.through = '2026-10-10'
    built.npm.allTime = 1000
    built.legacy.allTime = 500
    const fresh = await fetchUsage({
      since: built,
      fetch: (url) => {
        urls.push(url)
        return fakeFetch()(url)
      }
    })
    // One day of counts each: Oct 11 and Oct 12.
    expect(fresh.npm.allTime).toBe(1002)
    expect(fresh.legacy.allTime).toBe(502)
    // Two npm requests (a year of daily counts per package), no chunked totals.
    expect(urls.filter((u) => u.includes('api.npmjs.org'))).toHaveLength(2)
    expect(downloadsAfter([{ day: '2026-10-12', downloads: 5 }], '2026-10-01')).toBeNull()
  })

  it('browser numbers replace build numbers figure by figure', () => {
    const built = { ...emptyUsage(), fetchedAt: '2026-10-01T00:00:00.000Z' }
    built.github = { stars: 1000, forks: 100, contributors: 30 }
    built.npm.weekly = [{ start: '2026-09-01', end: '2026-09-07', downloads: 5 }]
    const fresh = { ...emptyUsage(), fetchedAt: '2026-10-14T00:00:00.000Z' }
    fresh.github = { stars: 1126, forks: null, contributors: null }
    const merged = mergeUsage(built, fresh)
    expect(merged.github).toEqual({ stars: 1126, forks: 100, contributors: 30 })
    expect(merged.npm.weekly).toEqual(built.npm.weekly)
    expect(merged.fetchedAt).toBe(fresh.fetchedAt)
  })
})
