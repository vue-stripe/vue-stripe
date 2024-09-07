<template>
  <div ref="mountPoint"/>
</template>

<script setup>
import { PAYMENT_ELEMENT_TYPE  } from '../constants';
import { useElement } from '../composables/use-element';
import { defineComponent, install, ref, watch, defineEmits, defineProps } from 'vue-demi';

install();

const emit = defineEmits(['loading', 'error']);

const props = defineProps({
  stripe: {
    type: Object,
  },
  elements: {
    type: Object,
  },
  options: {
    type: Object,
    default: () => ({}),
  },
});

const mountPoint = ref(null);

const { createElement, mountElement } = useElement(emit);

watch(props, () => {
  init();
});

function init () {
  try {
    emit('loading', true);
    createElement(PAYMENT_ELEMENT_TYPE, props.elements, props.options);
    mountElement(mountPoint.value);
  } catch (e) {
    console.error(e);
    emit('error', error);
  } finally {
    emit('loading', false);
  }
};
</script>
