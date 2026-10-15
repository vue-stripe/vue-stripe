// Types for the VitePress 1.6 default-theme internals that the theme overrides import (the
// aliases in config.ts). VitePress ships them as .js and .vue files without declarations;
// tsconfig.json maps its components here, so vue-tsc does not type-check VitePress's own .vue
// files.

declare module 'vitepress/dist/client/theme-default/composables/sidebar.js' {
  import type { ComputedRef, Ref } from 'vue'
  import type { DefaultTheme } from 'vitepress/theme'

  export function useSidebarControl(item: ComputedRef<DefaultTheme.SidebarItem>): {
    collapsed: Ref<boolean>
    collapsible: ComputedRef<boolean>
    isLink: ComputedRef<boolean>
    isActiveLink: Ref<boolean>
    hasActiveLink: ComputedRef<boolean>
    hasChildren: ComputedRef<boolean>
    toggle: () => void
  }
}
