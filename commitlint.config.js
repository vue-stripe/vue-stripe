// Conventional Commits, enforced locally (Husky commit-msg) and in CI (`pnpm lint:commits`).
export default {
  extends: ['@commitlint/config-conventional'],
  // Dependabot's own commits ("build(deps): Bump ...", signed off by dependabot[bot]) use a
  // capitalised subject it can't be told to change; the PR-title check still covers merges.
  ignores: [
    (message) =>
      /^build\(deps(-dev)?\): Bump /.test(message) &&
      message.includes('Signed-off-by: dependabot[bot]')
  ],
  rules: {
    // Long URLs and issue lists in bodies are fine.
    'body-max-line-length': [0],
    'footer-max-line-length': [0]
  }
}
