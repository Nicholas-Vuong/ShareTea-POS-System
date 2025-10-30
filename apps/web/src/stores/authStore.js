import { create } from 'zustand'

const STORAGE_KEY = 'sharetea.auth'

const initialState = {
  user: null,
  token: null,
  loading: false,
  error: null
}

export const useAuthStore = create((set, get) => ({
  ...initialState,
  initialize: () => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const { token, user } = JSON.parse(stored)
      set({ token, user })
    }
  },
  setAuth: ({ token, user }) => {
    set({ token, user, loading: false, error: null })
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }))
  },
  startLoading: () => set({ loading: true, error: null }),
  setError: (error) => set({ error, loading: false }),
  logout: () => {
    set(initialState)
    localStorage.removeItem(STORAGE_KEY)
  },
  isAuthenticated: () => !!get().token
}))

export default useAuthStore
