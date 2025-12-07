<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBackendApi, type Product } from '../../composables/useBackendApi'

const props = defineProps<{
  filter?: 'one_time' | 'recurring' | 'all'
}>()

const emit = defineEmits<{
  select: [product: Product]
}>()

const { getProducts, formatPrice, loading, error } = useBackendApi()

const products = ref<Product[]>([])
const selected = ref<Product | null>(null)
const fetchError = ref<string | null>(null)

const filteredProducts = computed(() => {
  if (!props.filter || props.filter === 'all') {
    return products.value
  }
  return products.value.filter((p) => p.type === props.filter)
})

async function loadProducts() {
  try {
    fetchError.value = null
    products.value = await getProducts()
  } catch (err) {
    fetchError.value = err instanceof Error ? err.message : 'Failed to load products'
  }
}

function selectProduct(product: Product) {
  selected.value = product
  emit('select', product)
}

onMounted(() => {
  loadProducts()
})

defineExpose({
  selected,
  reload: loadProducts,
})
</script>

<template>
  <div class="product-selector">
    <div class="step-header">
      <span class="step-number">0</span>
      <h4>Select a Product</h4>
    </div>

    <div v-if="loading" class="loading">
      <span class="spinner"></span>
      Loading products...
    </div>

    <div v-else-if="fetchError || error" class="error-box">
      <strong>Error:</strong> {{ fetchError || error }}
      <button class="retry-btn" @click="loadProducts">Retry</button>
    </div>

    <div v-else-if="filteredProducts.length === 0" class="empty-state">
      <p>No products found.</p>
      <p class="hint">
        Create products in your
        <a href="https://dashboard.stripe.com/products" target="_blank" rel="noopener">
          Stripe Dashboard
        </a>
        to see them here.
      </p>
    </div>

    <div v-else class="products-grid">
      <div
        v-for="product in filteredProducts"
        :key="product.id"
        class="product-card"
        :class="{ selected: selected?.id === product.id }"
        @click="selectProduct(product)"
      >
        <div v-if="product.images.length > 0" class="product-image">
          <img :src="product.images[0]" :alt="product.name" />
        </div>
        <span class="badge" :class="product.type">
          {{ product.type === 'recurring' ? 'Subscription' : 'One-time' }}
        </span>
        <h5>{{ product.name }}</h5>
        <p v-if="product.description" class="description">{{ product.description }}</p>
        <p class="price">
          {{ formatPrice(product.price.amount, product.price.currency) }}
          <span v-if="product.type === 'recurring'" class="interval">
            /{{ product.price.interval }}
          </span>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-selector {
  margin-bottom: 1.5rem;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  background: var(--vp-c-brand-1);
  color: white;
  border-radius: 50%;
  font-size: 0.875rem;
  font-weight: 600;
}

.step-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
}

.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--vp-c-divider);
  border-top-color: var(--vp-c-brand-1);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-box {
  padding: 1rem;
  background: var(--vp-c-danger-soft);
  border: 1px solid var(--vp-c-danger-1);
  border-radius: 8px;
  color: var(--vp-c-danger-1);
}

.retry-btn {
  margin-left: 1rem;
  padding: 0.25rem 0.75rem;
  background: var(--vp-c-danger-1);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.retry-btn:hover {
  opacity: 0.9;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
}

.empty-state p {
  margin: 0.5rem 0;
}

.empty-state .hint {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.empty-state a {
  color: var(--vp-c-brand-1);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.product-card {
  position: relative;
  padding: 1rem;
  background: var(--vp-c-bg-soft);
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.product-card:hover {
  border-color: var(--vp-c-brand-2);
}

.product-card.selected {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.badge {
  display: inline-block;
  margin-bottom: 0.375rem;
  padding: 0.0625rem 0.375rem;
  font-size: 0.5625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  border-radius: 3px;
}

.badge.one_time {
  background: var(--vp-c-green-soft);
  color: var(--vp-c-green-1);
}

.badge.recurring {
  background: var(--vp-c-indigo-soft);
  color: var(--vp-c-indigo-1);
}

.product-image {
  width: 100%;
  height: 80px;
  margin-bottom: 0.5rem;
  overflow: hidden;
  border-radius: 4px;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-card h5 {
  margin: 0 0 0.25rem 0;
  font-size: 0.875rem;
  font-weight: 600;
}

.product-card .description {
  margin: 0 0 0.5rem 0;
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-card .price {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--vp-c-brand-1);
}

.product-card .interval {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--vp-c-text-2);
}
</style>
