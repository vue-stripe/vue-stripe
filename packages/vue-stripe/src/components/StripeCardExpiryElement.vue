<script lang="ts">
import { createStripeElement } from '../utils/element-factory'

export default createStripeElement({
  elementType: 'cardExpiry',
  componentName: 'StripeCardExpiryElement'
})
</script>

<style>
.vue-stripe-cardExpiry-element {
  position: relative;
}

.vue-stripe-cardExpiry-element-mount {
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: white;
  transition: all 0.3s ease;
  min-height: 44px;
}

.vue-stripe-cardExpiry-element-mount:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.vue-stripe-cardExpiry-element-loading {
  opacity: 0.5;
}

.vue-stripe-cardExpiry-element-error {
  color: #dc3545;
  padding: 0.5rem 0;
  font-size: 0.875rem;
}

.vue-stripe-cardExpiry-element-loader {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #6c757d;
  text-align: center;
}
</style>