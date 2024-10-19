<template>
  <div ref="mountPoint"/>
</template>

<script setup>
import { AU_BANK_ACCOUNT_ELEMENT_TYPE as ELEMENT_TYPE } from '../constants';
import { install, ref, toRef, watch, defineEmits, defineProps, defineExpose } from 'vue-demi';

install();

const emit = defineEmits([
  'change',
  'ready',
  'focus',
  'blur',
  'escape',
]);

defineExpose({
  getElement,
  updateElement,
});

const props = defineProps({
  elements: {
    type: Object,
    required: true,
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

function init() {
  if (!elements.value) return;

  element.value = elements.value.create(ELEMENT_TYPE, options.value);
  element.value.mount(mountPoint.value);

  // Handle emits
  element.value.on('change', (event) => emit('change', event));
  element.value.on('ready', () => emit('ready'));
  element.value.on('focus', () => emit('focus'));
  element.value.on('blur', () => emit('blur'));
  element.value.on('escape', () => emit('escape'));
}

async function getElement() {
  return elements.value.getElement(ELEMENT_TYPE);
}

async function updateElement(options) {
  return element.value.update(options);
}
</script>