// Writes results/summary.md: one row per test with its outcome and, for skips and failures,
// the reason. Meant to be pasted into a GitHub issue.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type {
  FullConfig,
  FullResult,
  Reporter,
  TestCase,
  TestResult
} from '@playwright/test/reporter'

interface Row {
  sortKey: string
  project: string
  title: string
  outcome: 'pass' | 'fail' | 'skip' | 'flaky'
  seconds: string
  reason: string
}

const ANSI = new RegExp(String.raw`\u001b\[[0-9;]*m`, 'g')

const oneLine = (text: string): string =>
  text.replace(ANSI, '').replace(/\s+/g, ' ').replace(/\|/g, '\\|').trim().slice(0, 300)

export default class SummaryReporter implements Reporter {
  private readonly outputFile: string
  private readonly rows = new Map<string, Row>()
  private browserVersion = ''
  private startedAt = new Date()

  constructor(options: { outputFile: string }) {
    this.outputFile = options.outputFile
  }

  onBegin(_config: FullConfig): void {
    this.startedAt = new Date()
    // The summary and the screenshots next to it describe one run.
    rmSync(resolve(dirname(this.outputFile), 'screenshots'), { recursive: true, force: true })
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const project = test.parent.project()?.name ?? ''
    // Every reason that applied (a wallet test can be skipped for several at once).
    const skipReasons = [
      ...new Set(
        [...test.annotations, ...result.annotations]
          .filter((annotation) => annotation.type === 'skip' || annotation.type === 'fixme')
          .map((annotation) => annotation.description ?? '')
          .filter(Boolean)
      )
    ]
    const note = result.annotations.find((annotation) => annotation.type === 'note')
    const browser = result.annotations.find((annotation) => annotation.type === 'browser')
    if (browser?.description) this.browserVersion = browser.description

    let outcome: Row['outcome']
    let reason: string
    const status = test.outcome()
    if (status === 'skipped') {
      outcome = 'skip'
      reason = skipReasons.join('; ') || 'Skipped'
    } else if (status === 'expected') {
      outcome = 'pass'
      reason = note?.description ?? ''
    } else if (status === 'flaky') {
      outcome = 'flaky'
      reason = 'Passed on retry'
    } else {
      outcome = 'fail'
      reason = result.error?.message ?? result.errors[0]?.message ?? 'Failed'
    }

    this.rows.set(test.id, {
      sortKey: `${project} ${test.location.file} ${String(test.location.line).padStart(6, '0')}`,
      project,
      title: test.titlePath().slice(3).join(' > '),
      outcome,
      seconds: (result.duration / 1000).toFixed(1),
      reason: oneLine(reason)
    })
  }

  onEnd(result: FullResult): void {
    const rows = [...this.rows.values()].sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    const count = (outcome: Row['outcome']): number =>
      rows.filter((row) => row.outcome === outcome).length
    const label: Record<Row['outcome'], string> = {
      pass: 'Pass',
      fail: 'Fail',
      skip: 'Skip',
      flaky: 'Flaky'
    }

    const lines = [
      '# Vue Stripe browser e2e summary',
      '',
      `- Run: ${this.startedAt.toISOString()} (${result.status})`,
      `- Browser: ${this.browserVersion || 'see the HTML report'}`,
      `- Node: ${process.version} on ${process.platform}`,
      `- Result: ${count('pass')} passed, ${count('fail')} failed, ${count('skip')} skipped` +
        (count('flaky') ? `, ${count('flaky')} flaky` : ''),
      '',
      '| Project | Test | Result | Time (s) | Reason / note |',
      '|---------|------|--------|----------|---------------|',
      ...rows.map(
        (row) =>
          `| ${row.project} | ${oneLine(row.title)} | ${label[row.outcome]} | ${row.seconds} | ${row.reason} |`
      ),
      ''
    ]
    mkdirSync(dirname(this.outputFile), { recursive: true })
    writeFileSync(this.outputFile, lines.join('\n'))
  }

  printsToStdio(): boolean {
    return false
  }
}
