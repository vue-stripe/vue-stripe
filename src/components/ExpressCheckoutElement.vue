<template>
  <div ref="mountPoint"/>
</template>

<script setup>
import { EXPRESS_CHECKOUT_ELEMENT_TYPE as ELEMENT_TYPE } from '../constants';
import { install, ref, toRef, watch, defineEmits, defineProps, defineExpose } from 'vue-demi';

install();

const emit = defineEmits([
  'click',
  'confirm',
  'cancel',
  'shippingaddresschange',
  'shippingratechange',
]);

defineExpose({
  getElement,
  updateElement,
  fetchUpdates,
});

const props = defineProps({
  elements: {
    type: Object,
  },
  options: {
    type: Object,
    default: () => ({}),
  },
});

const elements = toRef(props, 'elements');
const options = toRef(props, 'options');

const mountPoint = ref(null);
const element = ref(null);

watch(props, () => {
  init();
});

function init () {
  if (!elements.value) return;

  element.value = elements.value.create(ELEMENT_TYPE, options.value);
  element.value.mount(mountPoint.value);

  // Handle emits
  element.value.on('click', () => emit('click'));
  element.value.on('confirm', () => emit('confirm'));
  element.value.on('cancel', () => emit('cancel'));
  element.value.on('shippingaddresschange', () => emit('shippingaddresschange'));
  element.value.on('shippingratechange', () => emit('shippingratechange'));
};

async function getElement () {
  return elements.value.getElement(ELEMENT_TYPE);
};

async function updateElement (options) {
  return element.value.update(options);
};

async function fetchUpdates () {
  return elements.value.fetchUpdates();
};
</script>
