/**
 * Authentication store
 * Manages user authentication state and session
 * Stores current user information including ID, role, and email
 * 
 * Uses Zustand with sessionStorage persistence for security
 * Session storage clears when browser tab closes
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type UserRole = 'manager' | 'cashier' | 'barista' | 'customer';

/**
 * User information interface
 */
interface User {
  userId: string;
  role: UserRole;
  email?: string;
}

/**
 * Authentication state interface
 */
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

/**
 * Initial authentication state (no user logged in)
 */
const initialState: Pick<AuthState, 'user' | 'isAuthenticated'> = {
  user: null,
  isAuthenticated: false,
};

/**
 * Storage configuration for persistence
 * Uses sessionStorage (clears on tab close) for security
 * Only available in browser environment
 */
const storage =
  typeof window !== 'undefined'
    ? createJSONStorage<AuthState>(() => window.sessionStorage)
    : undefined;

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initialState,
      setUser: (user) => {
        if (user) {
          set({ user, isAuthenticated: true });
        } else {
          set(initialState);
        }
      },
      logout: () => set(initialState),
    }),
    {
      name: 'sharetea-auth',
      storage,
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
