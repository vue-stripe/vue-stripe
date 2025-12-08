<script setup lang="ts">
import { ref, provide, computed, reactive, watch, onMounted } from 'vue'
import { RouterLink, RouterView, useRouter, useRoute } from 'vue-router'
import { useDark, useToggle } from '@vueuse/core'
import { useHead } from '@unhead/vue'
import { inject } from '@vercel/analytics'
import {
  Moon,
  Sun,
  Settings,
  CreditCard,
  Wallet,
  KeyRound,
  MapPin,
  Link2,
  CheckSquare,
  Layers,
  Landmark,
  Euro,
  Table2,
} from 'lucide-vue-next'
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Label,
  Alert,
  AlertDescription,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  Separator,
  TooltipProvider,
} from '@/components/ui'

// Dark mode
const isDark = useDark()
const toggleDark = useToggle(isDark)

// Vercel Analytics - only inject in browser
onMounted(() => {
  inject()
})

// SEO head management
const route = useRoute()
useHead({
  title: computed(() => (route.meta?.title as string) || 'Vue Stripe Playground'),
  meta: [
    {
      name: 'description',
      content: computed(() => (route.meta?.description as string) || 'Interactive playground for testing Vue Stripe components and integrations')
    },
    // Open Graph
    {
      property: 'og:title',
      content: computed(() => (route.meta?.title as string) || 'Vue Stripe Playground')
    },
    {
      property: 'og:description',
      content: computed(() => (route.meta?.description as string) || 'Interactive playground for testing Vue Stripe components and integrations')
    },
    {
      property: 'og:type',
      content: 'website'
    },
    // Twitter Card
    {
      name: 'twitter:card',
      content: 'summary_large_image'
    },
    {
      name: 'twitter:title',
      content: computed(() => (route.meta?.title as string) || 'Vue Stripe Playground')
    },
    {
      name: 'twitter:description',
      content: computed(() => (route.meta?.description as string) || 'Interactive playground for testing Vue Stripe components and integrations')
    }
  ],
  link: [
    {
      rel: 'canonical',
      href: computed(() => `https://playground.vuestripe.com${route.path}`)
    }
  ]
})

// Storage key for localStorage
const STORAGE_KEY = 'vue-stripe-playground-config'

// Check if we're in a browser environment (SSR-safe)
const isBrowser = typeof window !== 'undefined'

// Load config from localStorage
const loadConfig = () => {
  if (!isBrowser) {
    // Return default config during SSR
    return {
      publishableKey: '',
      clientSecret: '',
      setupSecret: '',
      sessionId: ''
    }
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.warn('Failed to load config from localStorage:', e)
  }

  // Default empty config - user will provide via UI
  return {
    publishableKey: '',
    clientSecret: '',
    setupSecret: '',
    sessionId: ''
  }
}

// Save config to localStorage
const saveConfig = (config: typeof stripeConfig) => {
  if (!isBrowser) return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch (e) {
    console.warn('Failed to save config to localStorage:', e)
  }
}

// Clear config from localStorage
const clearConfig = () => {
  if (!isBrowser) return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) {
    console.warn('Failed to clear config from localStorage:', e)
  }
}

// Reactive config
const stripeConfig = reactive(loadConfig())

// Save whenever config changes
watch(stripeConfig, (newConfig) => {
  saveConfig(newConfig)
}, { deep: true })

// Provide config to all child components
provide('stripeConfig', stripeConfig)

const showConfigModal = ref(false)
const router = useRouter()

// Temp values for the modal form
const tempPublishableKey = ref(stripeConfig.publishableKey)
const tempClientSecret = ref(stripeConfig.clientSecret)

// Navigation items grouped by category
const navGroups = computed(() => {
  const routes = router.getRoutes().filter(r => r.name !== 'home')

  // Define icons for each route
  const routeIcons: Record<string, any> = {
    'StripeProvider': Layers,
    'StripeElements': Layers,
    'CardElement': CreditCard,
    'SplitCard': CreditCard,
    'PaymentElement': Wallet,
    'Checkout': CheckSquare,
    'ExpressCheckout': Wallet,
    'SetupIntent': KeyRound,
    'LinkAuthentication': Link2,
    'AddressElement': MapPin,
    // European Regional Elements (v5.2.0)
    'IbanElement': Landmark,
    'IdealBankElement': Landmark,
    'P24BankElement': Landmark,
    'EpsBankElement': Landmark,
    // Pricing Table (v5.3.0)
    'PricingTable': Table2,
  }

  // Group routes
  const groups = {
    core: {
      label: 'Core Components',
      items: [] as { name: string; path: string; icon: any }[]
    },
    elements: {
      label: 'Stripe Elements',
      items: [] as { name: string; path: string; icon: any }[]
    },
    european: {
      label: 'European Elements',
      items: [] as { name: string; path: string; icon: any }[]
    },
    checkout: {
      label: 'Checkout',
      items: [] as { name: string; path: string; icon: any }[]
    }
  }

  // European element route names
  const europeanElements = ['IbanElement', 'IdealBankElement', 'P24BankElement', 'EpsBankElement']

  routes.forEach(route => {
    const name = String(route.name)
    const icon = routeIcons[name] || CreditCard
    const item = { name, path: route.path, icon }

    if (name.includes('Provider') || name.includes('Elements') && !name.includes('Element')) {
      groups.core.items.push(item)
    } else if (name.includes('Checkout') || name === 'PricingTable') {
      groups.checkout.items.push(item)
    } else if (europeanElements.includes(name)) {
      groups.european.items.push(item)
    } else {
      groups.elements.items.push(item)
    }
  })

  return Object.values(groups).filter(g => g.items.length > 0)
})

const hasKey = computed(() => {
  return !!stripeConfig.publishableKey &&
    stripeConfig.publishableKey !== 'pk_test_your_key_here' &&
    stripeConfig.publishableKey.startsWith('pk_')
})

const openConfigModal = () => {
  tempPublishableKey.value = stripeConfig.publishableKey
  tempClientSecret.value = stripeConfig.clientSecret
  showConfigModal.value = true
}

const saveConfigModal = () => {
  stripeConfig.publishableKey = tempPublishableKey.value.trim()
  stripeConfig.clientSecret = tempClientSecret.value.trim()
  showConfigModal.value = false
  // Force page reload to reinitialize Stripe with new key
  window.location.reload()
}

const resetConfig = () => {
  if (confirm('Clear all saved Stripe configuration? The page will reload.')) {
    clearConfig()
    window.location.reload()
  }
}
</script>

<template>
  <TooltipProvider>
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" as-child>
                <RouterLink to="/" class="flex items-center gap-3">
                  <div class="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-lg">
                    💳
                  </div>
                  <div class="grid flex-1 text-left text-sm leading-tight">
                    <span class="truncate font-semibold">Vue Stripe</span>
                    <span class="truncate text-xs text-muted-foreground">Playground</span>
                  </div>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <!-- Navigation Groups -->
          <SidebarGroup v-for="group in navGroups" :key="group.label">
            <SidebarGroupLabel>{{ group.label }}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem v-for="item in group.items" :key="item.path">
                  <SidebarMenuButton as-child>
                    <RouterLink
                      :to="item.path"
                      class="flex items-center gap-2"
                      active-class="bg-sidebar-accent text-sidebar-accent-foreground"
                    >
                      <component :is="item.icon" class="size-4" />
                      <span>{{ item.name }}</span>
                    </RouterLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <!-- Stripe Key Status -->
            <SidebarMenuItem>
              <SidebarMenuButton @click="openConfigModal" class="w-full">
                <div
                  class="size-2 rounded-full"
                  :class="hasKey ? 'bg-green-500' : 'bg-orange-500'"
                />
                <span v-if="hasKey" class="truncate text-xs">
                  {{ stripeConfig.publishableKey.slice(0, 8) }}...
                </span>
                <span v-else class="text-xs">Configure Key</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <!-- Dark Mode Toggle -->
            <SidebarMenuItem>
              <SidebarMenuButton @click="toggleDark()">
                <Sun v-if="isDark" class="size-4" />
                <Moon v-else class="size-4" />
                <span>{{ isDark ? 'Light Mode' : 'Dark Mode' }}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <!-- Header with trigger -->
        <header class="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger class="-ml-1" />
          <Separator orientation="vertical" class="mr-2 h-4" />
          <div class="flex-1">
            <h1 class="text-lg font-semibold">Vue Stripe Playground</h1>
          </div>
          <Button v-if="!hasKey" variant="outline" size="sm" @click="openConfigModal">
            <Settings class="mr-2 h-4 w-4" />
            Add Stripe Key
          </Button>
        </header>

        <!-- Main Content -->
        <main class="flex-1 p-4 md:p-6">
          <RouterView />
        </main>

        <!-- Footer -->
        <footer class="border-t px-4 py-3 text-center text-sm text-muted-foreground">
          Vue Stripe Playground
        </footer>
      </SidebarInset>
    </SidebarProvider>
  </TooltipProvider>

  <!-- Config Modal -->
  <Dialog v-model:open="showConfigModal">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Stripe Configuration</DialogTitle>
        <DialogDescription>
          Enter your Stripe test keys. These are stored in your browser's localStorage and never sent anywhere.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <div class="space-y-2">
          <Label for="publishableKey">
            Publishable Key <span class="text-destructive">*</span>
          </Label>
          <Input
            id="publishableKey"
            v-model="tempPublishableKey"
            type="text"
            placeholder="pk_test_..."
            class="font-mono text-sm"
            :class="{ 'border-success': tempPublishableKey.startsWith('pk_test_') }"
          />
          <p class="text-sm text-muted-foreground">
            Get this from
            <a
              href="https://dashboard.stripe.com/test/apikeys"
              target="_blank"
              class="text-primary hover:underline"
            >
              Stripe Dashboard → API Keys
            </a>
          </p>
        </div>

        <div class="space-y-2">
          <Label for="clientSecret">
            Client Secret <span class="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="clientSecret"
            v-model="tempClientSecret"
            type="text"
            placeholder="pi_xxx_secret_xxx"
            class="font-mono text-sm"
          />
          <p class="text-sm text-muted-foreground">
            Needed for Payment Element. Create a PaymentIntent via CLI or API.
          </p>
        </div>
      </div>

      <DialogFooter class="flex-col sm:flex-row gap-2">
        <Button variant="outline" @click="showConfigModal = false">
          Cancel
        </Button>
        <Button v-if="hasKey" variant="destructive" @click="resetConfig">
          Reset All
        </Button>
        <Button
          @click="saveConfigModal"
          :disabled="!tempPublishableKey.startsWith('pk_')"
        >
          Save & Reload
        </Button>
      </DialogFooter>

      <Alert variant="warning" class="mt-4">
        <AlertDescription>
          <strong>Security:</strong> Only use test keys (pk_test_...) here. Never enter live keys.
        </AlertDescription>
      </Alert>
    </DialogContent>
  </Dialog>
</template>
