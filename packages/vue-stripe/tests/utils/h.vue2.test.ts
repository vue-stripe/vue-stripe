import { describe, it, expect, vi } from 'vitest'

// Exercise the Vue 2 branch of hx(): vue-demi reports Vue 2 and h() records its arguments.
vi.mock('vue-demi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-demi')>()),
  isVue2: true,
  h: vi.fn((...args: unknown[]) => args)
}))

const { hx } = await import('../../src/utils/h')

describe('hx() on Vue 2', () => {
  it('splits flat props into class/style/key/ref, attrs and on', () => {
    const onClick = () => {}
    const result = hx(
      'button',
      {
        class: 'btn',
        style: { color: 'red' },
        key: 'k',
        ref: 'mount',
        disabled: true,
        'data-x': 1,
        onClick
      },
      ['Pay']
    )
    expect(result).toEqual([
      'button',
      {
        class: 'btn',
        style: { color: 'red' },
        key: 'k',
        ref: 'mount',
        attrs: { disabled: true, 'data-x': 1 },
        on: { click: onClick }
      },
      ['Pay']
    ])
  })

  it('maps camelCase listeners to Vue 2 event names and omits empty attrs/on', () => {
    const handler = () => {}
    expect(hx('div', { onBeforeRedirect: handler })).toEqual([
      'div',
      { on: { beforeRedirect: handler } },
      undefined
    ])
    expect(hx('div')).toEqual(['div', {}, undefined])
  })
})
