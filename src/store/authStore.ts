import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type UserRole = 'manager' | 'cashier' | 'barista' | 'customer';

interface User {
  userId: string;
  role: UserRole;
  email?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const initialState: Pick<AuthState, 'user' | 'isAuthenticated'> = {
  user: null,
  isAuthenticated: false,
};

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
