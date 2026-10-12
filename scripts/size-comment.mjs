// Posts (or updates) a plain-text bundle-size comment on the current PR.
// Usage: node scripts/size-comment.mjs <current.json> [base.json]
// (JSON from `size-limit --json`; base is optional). Needs GH_TOKEN, GITHUB_REPOSITORY, PR_NUMBER.
import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const MARKER = '<!-- vue-stripe-size-summary -->'
const [currentPath, basePath] = process.argv.slice(2)
const load = (path) => (path && existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : [])
const current = load(currentPath)
const base = new Map(load(basePath).map((entry) => [entry.name, entry.size]))
const kb = (bytes) => (bytes === undefined ? 'n/a' : `${(bytes / 1000).toFixed(2)} kB`)
const diff = (now, before) => {
  if (before === undefined) return 'new'
  const delta = now - before
  return `${delta >= 0 ? '+' : ''}${(delta / 1000).toFixed(2)} kB`
}
const rows = current
  .map(
    (entry) =>
      `| ${entry.name} | ${kb(base.get(entry.name))} | ${kb(entry.size)} | ${diff(entry.size, base.get(entry.name))} | ${entry.passed ? 'within budget' : 'OVER BUDGET'} |`
  )
  .join('\n')
const body = `${MARKER}
### Bundle size: packages/vue-stripe (minified + gzip, size-limit)

| Entry | Base | This PR | Change | Budget |
|---|---|---|---|---|
${rows}

Budgets live in \`packages/vue-stripe/.size-limit.json\`.`

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
console.log(existing ? 'updated' : 'created', 'size comment')
