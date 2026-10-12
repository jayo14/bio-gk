const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

type ApiError = Error & { fields?: Record<string, string | string[]> };

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('bg_token');
    if (token) headers.set('Authorization', `Token ${token}`);
  }
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers, cache: 'no-store' });
  } catch {
    throw new Error('Cannot reach the server. Make sure the Django backend is running.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const firstFieldError = Object.values(data as Record<string, unknown>).find((value) => Array.isArray(value) || typeof value === 'string');
    const message = typeof (data as { detail?: unknown }).detail === 'string'
      ? (data as { detail: string }).detail
      : Array.isArray(firstFieldError) ? String(firstFieldError[0])
      : typeof firstFieldError === 'string' ? firstFieldError
      : 'Something went wrong. Please try again.';
    const error = new Error(message) as ApiError;
    error.fields = data as Record<string, string | string[]>;
    throw error;
  }
  return data as T;
}

export type AuthUser = { id: number; email: string; display_name: string; username: string | null };
export type AuthResponse = { token: string; user: AuthUser };

export async function signup(payload: { email: string; password: string; display_name: string; username: string }) {
  const result = await apiRequest<AuthResponse>('/auth/signup/', { method: 'POST', body: JSON.stringify(payload) });
  localStorage.setItem('bg_token', result.token);
  localStorage.setItem('bg_user', JSON.stringify(result.user));
  return result;
}
export async function login(payload: { email: string; password: string }) {
  const result = await apiRequest<AuthResponse>('/auth/login/', { method: 'POST', body: JSON.stringify(payload) });
  localStorage.setItem('bg_token', result.token);
  localStorage.setItem('bg_user', JSON.stringify(result.user));
  return result;
}
export async function logout() {
  try { await apiRequest('/auth/logout/', { method: 'POST', body: '{}' }); } finally {
    localStorage.removeItem('bg_token');
    localStorage.removeItem('bg_user');
  }
}
export async function getCreator(username: string) {
  const response = await fetch(`${API_URL}/creators/${encodeURIComponent(username)}/`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Creator not found');
  return response.json();
}
