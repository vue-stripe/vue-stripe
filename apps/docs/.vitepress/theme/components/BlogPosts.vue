<script setup lang="ts">
// The post list on /blog/, newest first. config.ts reads the posts from blog/*.md frontmatter.
import { useData, withBase } from 'vitepress'
import type { BlogPost } from '../data/blog'
import { formatDay } from '../data/usage'

const { theme } = useData<{ blogPosts: BlogPost[] }>()
</script>

<template>
  <ul class="blog-posts">
    <li v-for="post in theme.blogPosts" :key="post.link" class="blog-post">
      <time class="blog-post-date" :datetime="post.date">{{ formatDay(post.date) }}</time>
      <h2 class="blog-post-title">
        <a :href="withBase(post.link)">{{ post.title }}</a>
      </h2>
      <p class="blog-post-description">{{ post.description }}</p>
    </li>
  </ul>
</template>

<style scoped>
.vp-doc .blog-posts {
  margin: 1.5rem 0 0;
  padding: 0;
  list-style: none;
}

.vp-doc .blog-post {
  margin: 0;
  padding: 1.5rem 0;
  border-top: 1px solid var(--vp-c-divider);
}

.blog-post-date {
  color: var(--vp-c-text-2);
  font-size: 0.875rem;
}

.vp-doc .blog-post-title {
  margin: 0.25rem 0 0.5rem;
  padding: 0;
  border: 0;
  font-size: 1.25rem;
  line-height: 1.4;
}

.vp-doc .blog-post-title a {
  text-decoration: none;
}

.vp-doc .blog-post-title a:hover {
  text-decoration: underline;
}

.vp-doc .blog-post-description {
  margin: 0;
  color: var(--vp-c-text-2);
}
</style>
