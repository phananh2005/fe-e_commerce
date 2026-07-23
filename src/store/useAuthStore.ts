import { create } from 'zustand';

export type RoleName = 'ROLE_CUSTOMER' | 'ROLE_DELIVERY_STAFF' | 'ROLE_STORE_ADMIN' | 'ROLE_SUPER_ADMIN';

export interface User {
  uuid: string;
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  roles: RoleName[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set: any) => ({
  user: null,
  isAuthenticated: !!sessionStorage.getItem('accessToken'),
  login: (user: User, accessToken: string, refreshToken: string) => {
    sessionStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ user, isAuthenticated: true });
  },
  logout: () => {
    sessionStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, isAuthenticated: false });
  },
  setTokens: (accessToken: string, refreshToken: string) => {
    sessionStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },
  setUser: (user: User) => {
    set({ user, isAuthenticated: true });
  }
}));
