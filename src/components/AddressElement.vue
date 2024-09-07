<template>
  <div ref="mountPoint"/>
</template>

<script setup>
import { ADDRESS_ELEMENT_TYPE as ELEMENT_TYPE  } from '../constants';
import { install, ref, toRef, watch, defineEmits, defineProps, defineExpose } from 'vue-demi';

install();

const emit = defineEmits(['change', 'ready', 'focus', 'blur', 'escape']);

defineExpose({
  getElement,
  updateElement,
  getValue,
});

const props = defineProps({
  elements: {
    type: Object,
  },
  options: {
    type: Object,
    default: () => ({
      mode: 'shipping',
    }),
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
};

async function getElement () {
  return elements.value.getElement(ELEMENT_TYPE);
};

async function updateElement (options) {
  return element.value.update(options);
};

async function getValue () {
  return elements.value.getValue();
};
</script>
