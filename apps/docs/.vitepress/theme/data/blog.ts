// The blog posts (blog/*.md), as config.ts reads them from their frontmatter. The /blog/ index
// gets them through `useData().theme.blogPosts`; /blog/index.md lists them as Markdown.

export interface BlogPost {
  title: string
  /** Publication day, YYYY-MM-DD. */
  date: string
  description: string
  /** The post's route, e.g. `/blog/vue-stripe-6`. */
  link: string
}
