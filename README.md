[![npm](https://img.shields.io/npm/v/ts-deepmerge)](https://www.npmjs.com/package/zustand-middlewares)
<a href="https://github.com/gearonix/zustand-middlewares" rel="nofollow">
  <img src="https://img.shields.io/github/license/gearonix/zustand-middlewares" alt="License">
</a>
<a href="https://github.com/gearonix/zustand-middlewares" rel="nofollow">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
</a>


Zustand Middlewares
=====================

The library makes it easier to work with [zustand](https://zustand-demo.pmnd.rs/) middlewares. <br/>

It's really convenient to use, and also contains amazing typescript support.

Usage
-----
Install the package
```sh
$ npm install zustand-middlewares
```

Import the `configure` function:
```typescript
import { configure } from 'zustand-middlewares'

const create = configure(
  [persist, { name: 'favorite-repos', version: 2 }],
  immer,
  [devtools, { name: 'repos' }],
  subscribeWithSelector
)
```
You can also specify default options for each middleware.

Use the `create` function in each module. 
```typescript
import { create } from './instance'

const useStore = create({ devtools: { enabled: true } })((set) => ({
  ids: [],
  add: (id: number) => {
    set((state) => ({
      ids: [...state.ids, id]
    }))
  }
}))
```
All middlewares will be picked up and used for every store.

You can override the middleware options for each store. 
Custom options will be merged with the default ones.

> [!WARNING]
> Works only with latest versions of `zustand`,
> 4.5.0 and higher


Example
-----

Checkout the [example](https://github.com/gearonix/zustand-middlewares/tree/main/example) to understand it better.

The idea for creating this library was this [discussion](https://github.com/pmndrs/zustand/discussions/2330).

---

### With vs Without

```typescript
// with helper
const useStore = create<State>({
  impl: (set) => ({
    ids: [],
    add: (id: number) => {
      set((state) => ({
        ids: [...state.ids, id]
      }))
    }
  }),
  devtools: { name: 'my-devtools' }
})

// 💀 without, there may also be some custom middlewares
const useStore = create<State>()(
  persist(
    immer(
      devtools(
        subscribeWithSelector((set) => ({
          ids: [],
          add: (id: number) => {
            set((state) => ({
              ids: [...state.ids, id]
            }))
          }
        })),
        { enabled: true }
      )
    ),
    { version: 2, name: 'favorite-repos' }
  )
)
```


