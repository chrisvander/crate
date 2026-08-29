import { create, type StateCreator } from "zustand"

interface ErrorState {
  name: string
  message: string
  displayed: boolean
  showError: (error: Error) => void
  hide: () => void
}

const errorStateCreator: StateCreator<ErrorState> = (set): ErrorState => ({
  name: "",
  message: "",
  displayed: false,
  showError: ({ name, message }: Error) => {
    set({ name, message, displayed: true })
  },
  hide: () => {
    set((state) => ({ ...state, displayed: false }))
  },
})

export const useErrorStore = create(errorStateCreator)
