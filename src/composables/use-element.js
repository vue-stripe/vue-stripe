import { ref } from 'vue-demi';

export function useElement (emit) {

  const element = ref(null);
  const loading = ref(false);

  async function createElement(type, elements, options) {
    if (!elements) return;
    element.value = elements.create(type, options);
    // Handle emits
    element.value.on('change', handleElementChange);
    element.value.on('ready', handleElementReady);
    element.value.on('focus', handleElementFocus);
    element.value.on('blur', handleElementBlur);
    element.value.on('escape', handleElementEscape);
  };

  function mountElement (mountPoint) {
    if (!element.value) return;
    element.value.mount(mountPoint);
  }

  function handleElementChange (event) {
    emit('change', event);
  }

  function handleElementReady (event) {
    emit('ready', event);
  }

  function handleElementFocus (event) {
    emit('focus', event);
  }

  function handleElementBlur (event) {
    emit('blur', event);
  }

  function handleElementEscape (event) {
    emit('escape', event);
  }

  return {
    element,
    createElement,
    mountElement,
    handleElementChange,
    handleElementReady,
    handleElementFocus,
    handleElementBlur,
    handleElementEscape,
  }
}