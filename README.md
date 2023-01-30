# Vue Footprints

Breadcrumbs plugin for Vue.js & Vue Router. Why footprints? Coz it's similar to the idea of breadcrumbs. Also, there's already a bunch of packages that has "breadcrumbs" on their name.

> NOTE: This requires Vue Router to work.

> Is this compatible with Vue 2? I don't know, I haven't tried. It might tho, give it a try.

## Installation

**Yarn**

```bash
yarn add vue-footprints
```

**NPM**

```bash
npm install vue-footprints
```

## Usage

This will add a global computed mixin array called `$footprints`. Remember this one, we'll talk about it in the implmentation part.

```js
import { createApp } from 'vue'
import VueFootprints from 'vue-footprints';

const app = createApp({});

app.use(VueFootprints);
```

## Implementation with Vue App

**Step 1**

In your Vue Router routes, add the object `footprint` in the `meta` object of each route that you want to be added to the footprints. Assumming that you have the routes below:

```
|- grandparent
  |- parent
    |- child 1
    |- child 2
```

```diff
...
{
  path: '/grandparent',
  name: 'grandparent',
  meta: {
+    footprint: {
+      name: 'Grandparent',
+    },
  },
  component: () => import('pages/GrandParentPage'),
  children: [
    {
      path: 'parent',
      name: 'parent',
      component: () => import('pages/ParentPage'),
      meta: {
+        footprint: {
+          name: 'Parent',
+        },
      },
      children: [
        {
          path: 'child-1',
          name: 'child-1',
          component: () => import('pages/ChildOnePage'),
          meta: {
+            footprint: {
+              name: 'Child 1',
+            },
          },
        },
        {
          path: 'child-2',
          name: 'child-2',
          component: () => import('pages/ChildTwoPage'),
          meta: {
+            footprint: {
+              name: 'Child 2',
+            },
          },
        },
      ],
    },
  ],
}
```

**Step 2**

Given the input above, the `$footprints` will look like this depending on how deep you are in the route history. Say you're just in the `/grandparent` it will look like:

```js
$footprints: [
  {
    footprint: {
      name: 'Grandparent'
    },
    active: true,
    route: {
      name: 'grandparent',
      path: '/grandparent'
    }
  }
]
```

But if you're in the `/grandparent/parent` it will look like:

```js
$footprints: [
  {
    footprint: {
      name: 'Grandparent'
    },
    active: false,
    route: {
      name: 'grandparent',
      path: '/grandparent'
    }
  },
  {
    footprint: {
      name: 'Parent'
    },
    active: true,
    route: {
      name: 'parent',
      path: '/grandparent/parent'
    }
  }
]
```

And finally if you're in `/granparent/parent/child-1` it will look like:

```js
$footprints: [
  {
    footprint: {
      name: 'Grandparent'
    },
    active: false,
    route: {
      name: 'grandparent',
      path: '/grandparent'
    }
  },
  {
    footprint: {
      name: 'Parent'
    },
    active: false,
    route: {
      name: 'parent',
      path: '/grandparent/parent'
    }
  },
  {
    footprint: {
      name: 'Child 1'
    },
    active: true,
    route: {
      name: 'child-1',
      path: '/grandparent/parent/child-1'
    }
  }
]
```

**Step 3**

Do whatever you want with the `$footprints` object. In my case I made this for my quasar app so I used their [`QBreadcrumbs`](https://quasar.dev/vue-components/breadcrumbs) component.

## API (Object structure)

```js
$footprints: [
  {
    // Whatever you put Route#meta.footer will appear here
    footprint: Object,
    // True if the this footprint is the active route. False, otherwise.
    active: Boolean,
    // The route object in case you want to use it.
    // You can return everything or just the essential by
    // passing returnRoute: true in the options. 
    // E.x. app.use(VueFootprints, { returnRoute: true });
    route: Object,
  }
]
```

## Example

This is just a screenshot from my app, I don't have time create an example, sorry. If you have a question, join our [discord server](https://discord.com/invite/4ujGbRJyDN).

<img src="./example.png">