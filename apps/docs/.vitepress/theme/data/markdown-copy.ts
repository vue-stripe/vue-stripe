// Where a page's Markdown copy is served. The build writes the copies (../../llms.ts) and the
// "Copy for LLMs" button (../components/CopyForLLM.vue) fetches them, both through this, so
// the button copies exactly the file the site serves.

/** `/guide/testing` -> `/guide/testing.md`; a section overview, `/guide/` -> `/guide/index.md`. */
export function markdownPathOf(route: string): string {
  return `${route.endsWith('/') ? `${route}index` : route}.md`
}
