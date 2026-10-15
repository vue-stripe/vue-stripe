<script setup lang="ts">
// Replaces VitePress's VPSidebarItem (aliased in config.ts) so a collapsible group has one
// control that says whether it is open. VitePress makes the group header a role="button" div
// with a second role="button" caret inside it (axe nested-interactive), neither with
// aria-expanded, and gives every group header a tab stop even when it cannot collapse. Here a
// group without a page of its own has a <button aria-expanded> inside its heading, with the
// caret drawn in it; a group with a page keeps its link, and its caret is a separate button
// beside it; a header that cannot collapse is plain text. Otherwise this is VitePress 1.6.4's
// component, with its classes and styles.
import type { DefaultTheme } from 'vitepress/theme'
import { computed } from 'vue'
import { useSidebarControl } from 'vitepress/dist/client/theme-default/composables/sidebar.js'
import VPLink from 'vitepress/dist/client/theme-default/components/VPLink.vue'

const props = defineProps<{
  item: DefaultTheme.SidebarItem
  depth: number
}>()

const { collapsed, collapsible, isLink, isActiveLink, hasActiveLink, hasChildren, toggle } =
  useSidebarControl(computed(() => props.item))

const sectionTag = computed(() => (hasChildren.value ? 'section' : `div`))

const textTag = computed(() => {
  return !hasChildren.value ? 'p' : props.depth + 2 === 7 ? 'p' : `h${props.depth + 2}`
})

const canToggle = computed(() => collapsible.value && hasChildren.value)

// The caret button beside a group's link is named after the group (its text may hold HTML).
const caretLabel = computed(() => `Pages under ${(props.item.text ?? '').replace(/<[^>]*>/g, '')}`)

const classes = computed(() => [
  [`level-${props.depth}`],
  { collapsible: collapsible.value },
  { collapsed: collapsed.value },
  { 'is-link': isLink.value },
  { 'is-active': isActiveLink.value },
  { 'has-active': hasActiveLink.value }
])
</script>

<template>
  <component :is="sectionTag" class="VPSidebarItem" :class="classes">
    <div v-if="item.text" class="item">
      <div class="indicator" />

      <VPLink
        v-if="item.link"
        tag="a"
        class="link"
        :href="item.link"
        :rel="item.rel"
        :target="item.target"
      >
        <!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -- textTag is always an element (p, h2 to h6) -->
        <component :is="textTag" class="text" v-html="item.text" />
      </VPLink>
      <component :is="textTag" v-else-if="canToggle" class="text has-toggle">
        <button type="button" class="toggle" :aria-expanded="!collapsed" @click="toggle">
          <span class="toggle-text" v-html="item.text" />
          <span class="caret" aria-hidden="true">
            <span class="vpi-chevron-right caret-icon" />
          </span>
        </button>
      </component>
      <!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -- textTag is always an element (p, h2 to h6) -->
      <component :is="textTag" v-else class="text" v-html="item.text" />

      <button
        v-if="item.link && canToggle"
        type="button"
        class="caret"
        :aria-expanded="!collapsed"
        :aria-label="caretLabel"
        @click="toggle"
      >
        <span class="vpi-chevron-right caret-icon" />
      </button>
    </div>

    <div v-if="item.items && item.items.length" class="items">
      <template v-if="depth < 5">
        <SidebarItem
          v-for="(i, index) in item.items"
          :key="i.text ?? index"
          :item="i"
          :depth="depth + 1"
        />
      </template>
    </div>
  </component>
</template>

<style scoped>
.VPSidebarItem.level-0 {
  padding-bottom: 24px;
}

.VPSidebarItem.collapsed.level-0 {
  padding-bottom: 10px;
}

.item {
  position: relative;
  display: flex;
  width: 100%;
}

.VPSidebarItem.collapsible > .item {
  cursor: pointer;
}

.indicator {
  position: absolute;
  top: 6px;
  bottom: 6px;
  left: -17px;
  width: 2px;
  border-radius: 2px;
  transition: background-color 0.25s;
}

.VPSidebarItem.level-2.is-active > .item > .indicator,
.VPSidebarItem.level-3.is-active > .item > .indicator,
.VPSidebarItem.level-4.is-active > .item > .indicator,
.VPSidebarItem.level-5.is-active > .item > .indicator {
  background-color: var(--vp-c-brand-1);
}

.link {
  display: flex;
  align-items: center;
  flex-grow: 1;
}

.text {
  flex-grow: 1;
  padding: 4px 0;
  line-height: 24px;
  font-size: 14px;
  transition: color 0.25s;
}

/* The heading holds the button, which spans the row and carries the padding and the caret. */
.text.has-toggle {
  padding: 0;
}

.toggle {
  display: flex;
  align-items: flex-start;
  width: 100%;
  text-align: left;
  font: inherit;
  color: inherit;
}

.toggle-text {
  flex-grow: 1;
  padding: 4px 0;
}

.VPSidebarItem.level-0 .text {
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.VPSidebarItem.level-1 .text,
.VPSidebarItem.level-2 .text,
.VPSidebarItem.level-3 .text,
.VPSidebarItem.level-4 .text,
.VPSidebarItem.level-5 .text {
  font-weight: 500;
  color: var(--vp-c-text-2);
}

.VPSidebarItem.level-0.is-link > .item > .link:hover .text,
.VPSidebarItem.level-1.is-link > .item > .link:hover .text,
.VPSidebarItem.level-2.is-link > .item > .link:hover .text,
.VPSidebarItem.level-3.is-link > .item > .link:hover .text,
.VPSidebarItem.level-4.is-link > .item > .link:hover .text,
.VPSidebarItem.level-5.is-link > .item > .link:hover .text {
  color: var(--vp-c-brand-1);
}

.VPSidebarItem.level-0.has-active > .item > .text,
.VPSidebarItem.level-1.has-active > .item > .text,
.VPSidebarItem.level-2.has-active > .item > .text,
.VPSidebarItem.level-3.has-active > .item > .text,
.VPSidebarItem.level-4.has-active > .item > .text,
.VPSidebarItem.level-5.has-active > .item > .text,
.VPSidebarItem.level-0.has-active > .item > .link > .text,
.VPSidebarItem.level-1.has-active > .item > .link > .text,
.VPSidebarItem.level-2.has-active > .item > .link > .text,
.VPSidebarItem.level-3.has-active > .item > .link > .text,
.VPSidebarItem.level-4.has-active > .item > .link > .text,
.VPSidebarItem.level-5.has-active > .item > .link > .text {
  color: var(--vp-c-text-1);
}

.VPSidebarItem.level-0.is-active > .item .link > .text,
.VPSidebarItem.level-1.is-active > .item .link > .text,
.VPSidebarItem.level-2.is-active > .item .link > .text,
.VPSidebarItem.level-3.is-active > .item .link > .text,
.VPSidebarItem.level-4.is-active > .item .link > .text,
.VPSidebarItem.level-5.is-active > .item .link > .text {
  color: var(--vp-c-brand-1);
}

.caret {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: -7px;
  width: 32px;
  height: 32px;
  color: var(--vp-c-text-3);
  cursor: pointer;
  transition: color 0.25s;
  flex-shrink: 0;
}

.item:hover .caret {
  color: var(--vp-c-text-2);
}

.item:hover .caret:hover {
  color: var(--vp-c-text-1);
}

.caret-icon {
  font-size: 18px;
  /*rtl:ignore*/
  transform: rotate(90deg);
  transition: transform 0.25s;
}

.VPSidebarItem.collapsed .caret-icon {
  transform: rotate(0) /*rtl:rotate(180deg)*/;
}

.VPSidebarItem.level-1 .items,
.VPSidebarItem.level-2 .items,
.VPSidebarItem.level-3 .items,
.VPSidebarItem.level-4 .items,
.VPSidebarItem.level-5 .items {
  border-left: 1px solid var(--vp-c-divider);
  padding-left: 16px;
}

.VPSidebarItem.collapsed .items {
  display: none;
}
</style>
