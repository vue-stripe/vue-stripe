<template>
  <div ref="mountPoint"/>
</template>

<script setup>
import { install, ref, toRef, watch, defineProps } from 'vue-demi';

install();

const props = defineProps({
  elements: {
    type: Object,
  },
  options: {
    type: Object,
    default: () => ({}),
  },
  elementType: {
    type: String,
    required: true,
  },
});

const elements = toRef(props, 'elements');
const options = toRef(props, 'options');
const elementType = toRef(props, 'elementType');

const mountPoint = ref(null);
const element = ref(null);

watch(props, () => {
  init();
});

function init () {
  if (!elements.value) return;

  element.value = elements.value.create(elementType.value, options.value);
  element.value.mount(mountPoint.value);
};
</script>
