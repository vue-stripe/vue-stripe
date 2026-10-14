<script setup lang="ts">
// One icon component for the docs (markdown, home page, live demos). Icons come from
// Lucide (@lucide/vue) and are imported by name here, so only the ones listed ship.
// Usage in markdown or templates: <DocIcon name="check" /> or <DocIcon name="landmark" :size="20" />.
import { computed } from 'vue'
import {
  BadgeCheck,
  Ban,
  Banknote,
  BookOpen,
  Boxes,
  CalendarSync,
  Check,
  ChevronDown,
  Circle,
  CircleCheck,
  CircleDot,
  CircleX,
  Code,
  Coins,
  Columns2,
  Copy,
  CreditCard,
  ExternalLink,
  FileCode,
  Fingerprint,
  FolderOpen,
  GitFork,
  Gauge,
  Globe,
  Hash,
  Hourglass,
  IdCard,
  Info,
  KeyRound,
  Landmark,
  Layers,
  LayoutTemplate,
  Link,
  MapPin,
  MessageSquare,
  Minus,
  Network,
  Package,
  PanelTop,
  Play,
  Puzzle,
  Receipt,
  RefreshCw,
  Repeat,
  Search,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Star,
  Store,
  TriangleAlert,
  Users,
  Vault,
  Wallet,
  WalletCards,
  Workflow,
  X,
  Zap
} from '@lucide/vue'

const ICONS = {
  'badge-check': BadgeCheck,
  ban: Ban,
  banknote: Banknote,
  'book-open': BookOpen,
  boxes: Boxes,
  'calendar-sync': CalendarSync,
  check: Check,
  'chevron-down': ChevronDown,
  circle: Circle,
  'circle-check': CircleCheck,
  'circle-dot': CircleDot,
  'circle-x': CircleX,
  code: Code,
  coins: Coins,
  columns: Columns2,
  copy: Copy,
  'credit-card': CreditCard,
  'external-link': ExternalLink,
  'file-code': FileCode,
  fingerprint: Fingerprint,
  'folder-open': FolderOpen,
  'git-fork': GitFork,
  gauge: Gauge,
  globe: Globe,
  hash: Hash,
  hourglass: Hourglass,
  'id-card': IdCard,
  info: Info,
  key: KeyRound,
  landmark: Landmark,
  layers: Layers,
  'layout-template': LayoutTemplate,
  link: Link,
  'map-pin': MapPin,
  message: MessageSquare,
  minus: Minus,
  network: Network,
  package: Package,
  'panel-top': PanelTop,
  play: Play,
  puzzle: Puzzle,
  receipt: Receipt,
  refresh: RefreshCw,
  repeat: Repeat,
  search: Search,
  'shield-check': ShieldCheck,
  'shopping-cart': ShoppingCart,
  smartphone: Smartphone,
  star: Star,
  store: Store,
  users: Users,
  vault: Vault,
  warning: TriangleAlert,
  wallet: Wallet,
  'wallet-cards': WalletCards,
  workflow: Workflow,
  x: X,
  zap: Zap
} as const

export type DocIconName = keyof typeof ICONS

const props = withDefaults(
  defineProps<{
    name: DocIconName
    /** Pixel size. Without one the icon follows the surrounding text (1.1em). */
    size?: number | undefined
    strokeWidth?: number
    /** Accessible label. Without one the icon is decorative and hidden from screen readers. */
    label?: string | undefined
  }>(),
  { size: undefined, strokeWidth: 1.75, label: undefined }
)

const icon = computed(() => ICONS[props.name])
</script>

<template>
  <component
    :is="icon"
    :class="['doc-icon', { 'doc-icon--inline': size === undefined }]"
    v-bind="size === undefined ? {} : { size }"
    :stroke-width="strokeWidth"
    :aria-hidden="label ? undefined : 'true'"
    :aria-label="label"
    :role="label ? 'img' : undefined"
  />
</template>

<style scoped>
.doc-icon {
  display: inline-block;
  flex: none;
  vertical-align: -0.15em;
}

.doc-icon--inline {
  width: 1.1em;
  height: 1.1em;
}
</style>
