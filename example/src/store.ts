import { configure } from '@lib'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

interface State {
  ids: number[]
  addRepo: (id: number) => void
  removeRepo: (id: number) => void
}

const scope = configure(
  [persist, { name: 'favorite-repos', version: 2 }],
  immer,
  [devtools, { name: 'repos' }],
  subscribeWithSelector
)

export const useStore = scope<State>({ devtools: { enabled: true } })(
  (set) => ({
    ids: [],
    addRepo: (id: number) => {
      set((state) => ({
        ids: [...state.ids, id]
      }))
    },
    removeRepo: (id: number) =>
      set((state) => ({
        ids: state.ids.filter((repoId) => repoId !== id)
      }))
  })
)
