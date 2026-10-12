// Posts (or updates) a plain-text coverage summary comment on the current PR.
// Usage in CI: node scripts/coverage-comment.mjs packages/vue-stripe/coverage/coverage-summary.json
// Needs GH_TOKEN, GITHUB_REPOSITORY and PR_NUMBER in the environment.
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const MARKER = '<!-- vue-stripe-coverage-summary -->'
const [summaryPath] = process.argv.slice(2)
const total = JSON.parse(readFileSync(summaryPath, 'utf8')).total
const rows = ['statements', 'branches', 'functions', 'lines']
  .map(
    (metric) =>
      `| ${metric} | ${total[metric].pct}% | ${total[metric].covered} / ${total[metric].total} |`
  )
  .join('\n')
const body = `${MARKER}
### Coverage: packages/vue-stripe

| Metric | Coverage | Covered / total |
|---|---|---|
${rows}

Thresholds ratchet themselves (\`autoUpdate\`) and every file has per-file floors; see \`vitest.config.ts\`.`

const repo = process.env.GITHUB_REPOSITORY
const pr = process.env.PR_NUMBER
const gh = (...args) => execFileSync('gh', args, { encoding: 'utf8' })
const existing = JSON.parse(
  gh('api', `repos/${repo}/issues/${pr}/comments`, '--paginate', '--slurp')
)
  .flat()
  .find((comment) => comment.body.includes(MARKER))
if (existing)
  gh('api', '-X', 'PATCH', `repos/${repo}/issues/comments/${existing.id}`, '-f', `body=${body}`)
else gh('api', '-X', 'POST', `repos/${repo}/issues/${pr}/comments`, '-f', `body=${body}`)
console.log(existing ? 'updated' : 'created', 'coverage comment')
