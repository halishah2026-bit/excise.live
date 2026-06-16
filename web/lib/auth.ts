export interface User {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'user';
  phone?: string;
  cnic?: string;
  searchCount?: number;
  isActive?: boolean;
  createdAt?: string;
  lastLogin?: string;
}

export const getUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const u = localStorage.getItem('excise_live_user') || localStorage.getItem('dmt_user');
    return u ? JSON.parse(u) : null;
  } catch { return null; }
};

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('excise_live_token') || localStorage.getItem('dmt_token');
};

export const saveAuth = (token: string, user: User) => {
  localStorage.setItem('excise_live_token', token);
  localStorage.setItem('excise_live_user', JSON.stringify(user));
  localStorage.removeItem('dmt_token');
  localStorage.removeItem('dmt_user');
};

export const clearAuth = () => {
  localStorage.removeItem('excise_live_token');
  localStorage.removeItem('excise_live_user');
  localStorage.removeItem('dmt_token');
  localStorage.removeItem('dmt_user');
};

export const isAuthenticated = (): boolean => !!getToken();
export const isAdmin = (): boolean => {
  const role = getUser()?.role;
  return role === 'admin' || role === 'superadmin';
};
