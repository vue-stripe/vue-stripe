// Conventional Commits, enforced locally (Husky commit-msg) and in CI (`pnpm lint:commits`).
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Long URLs and issue lists in bodies are fine.
    'body-max-line-length': [0],
    'footer-max-line-length': [0]
  }
}
