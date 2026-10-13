import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { REPO_ROOT } from '../../src/config.ts'
import { expect, test } from '../../src/fixtures.ts'

// Every page under apps/docs/live-demo must have a browser test. A new demo fails here until
// a spec covers it (a spec covers a demo when it opens /live-demo/<name>).
test('every live demo has a browser test', () => {
  const demos = readdirSync(resolve(REPO_ROOT, 'apps/docs/live-demo'))
    .filter((file) => file.endsWith('.md') && file !== 'index.md')
    .map((file) => file.replace(/\.md$/, ''))

  const specsDir = resolve(import.meta.dirname, '..')
  const specs = ['flows', 'wallets']
    .flatMap((dir) =>
      readdirSync(resolve(specsDir, dir))
        .filter((file) => file.endsWith('.spec.ts'))
        .map((file) => resolve(specsDir, dir, file))
    )
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n')

  const uncovered = demos.filter((demo) => !specs.includes(`/live-demo/${demo}\``))
  expect(uncovered, 'live demos without a browser test').toEqual([])
})
