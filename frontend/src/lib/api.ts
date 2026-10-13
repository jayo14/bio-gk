const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

export type ApiError = Error & { fields?: Record<string, string | string[]> };

export type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  let body = options.body;

  if (body !== undefined && body !== null) {
    if (
      typeof body === 'object' &&
      !(body instanceof FormData) &&
      !(body instanceof Blob) &&
      !(body instanceof URLSearchParams)
    ) {
      body = JSON.stringify(body);
    }
    if (!headers.has('Content-Type') && typeof body === 'string') {
      headers.set('Content-Type', 'application/json');
    }
  }

  // Include credentials (cookies) in every request - HttpOnly cookies handle authentication safely
  const fetchOptions: RequestInit = {
    ...options,
    body: body as BodyInit,
    headers,
    credentials: 'include',
    cache: 'no-store',
  };

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, fetchOptions);
  } catch {
    throw new Error('Cannot reach the server. Make sure the Django backend is running.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const firstFieldError = Object.values(data as Record<string, unknown>).find(
      (value) => Array.isArray(value) || typeof value === 'string'
    );
    const message =
      typeof (data as { detail?: unknown }).detail === 'string'
        ? (data as { detail: string }).detail
        : Array.isArray(firstFieldError)
        ? String(firstFieldError[0])
        : typeof firstFieldError === 'string'
        ? firstFieldError
        : 'Something went wrong. Please try again.';

    const error = new Error(message) as ApiError;
    error.fields = data as Record<string, string | string[]>;
    throw error;
  }
  return data as T;
}

export type AuthUser = {
  id: number;
  email: string;
  display_name: string;
  username: string | null;
  is_verified?: boolean;
  subaccount_status?: 'unconnected' | 'pending' | 'active' | 'failed';
};

export type AuthResponse = {
  token?: string;
  user: AuthUser;
};

export type PublicCreator = {
  username: string;
  display_name: string;
  avatar_url: string;
  bio_text: string;
  min_message_fee_kobo: number;
  tip_presets_kobo: number[];
  is_verified: boolean;
  public_supporter_wall_enabled: boolean;
  leaderboard_period: 'weekly' | 'monthly' | 'all_time';
  subaccount_connected: boolean;
};

export type SupporterEntry = {
  rank: number;
  supporter_name: string;
  total_amount_kobo: number;
  total_amount_naira?: number;
  interaction_count: number;
  last_supported_at: string;
};

export type LeaderboardResponse = {
  period: string;
  enabled?: boolean;
  leaderboard: SupporterEntry[];
};

export type BankItem = {
  name: string;
  code: string;
  slug: string;
};

export type CreatorDashboardData = {
  creator: {
    username: string;
    display_name: string;
    avatar_url: string;
    bio_text: string;
    min_message_fee_kobo: number;
    tip_presets_kobo: number[];
    is_verified: boolean;
    public_supporter_wall_enabled: boolean;
    leaderboard_period: 'weekly' | 'monthly' | 'all_time';
    bank_name: string;
    account_number_last4: string;
    account_name: string;
    subaccount_status: 'unconnected' | 'pending' | 'active' | 'failed';
    notify_email: boolean;
    notify_whatsapp: boolean;
    whatsapp_phone_number: string;
  };
  metrics: {
    verified_earnings_kobo: number;
    platform_fees_kobo: number;
    net_earnings_kobo: number;
    total_interactions_count: number;
    unread_messages_count: number;
    subaccount_active: boolean;
  };
};

export type InteractionItem = {
  id: string;
  sender_name: string;
  sender_contact?: string;
  amount_kobo: number;
  amount_naira: number;
  currency: string;
  interaction_type: 'priority_dm' | 'public_tip' | 'whatsapp_pass';
  type_display?: string;
  message_body: string;
  payment_status: 'pending' | 'verified' | 'read' | 'archived' | 'refunded';
  is_public_on_wall: boolean;
  payment_reference: string;
  created_at: string;
};

export async function signup(payload: { email: string; password: string; display_name: string; username: string }) {
  const result = await apiRequest<AuthResponse>('/auth/signup/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (typeof window !== 'undefined') {
    localStorage.setItem('bg_user', JSON.stringify(result.user));
    localStorage.removeItem('bg_token');
  }
  return result;
}

export async function login(payload: { email: string; password: string }) {
  const result = await apiRequest<AuthResponse>('/auth/login/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (typeof window !== 'undefined') {
    localStorage.setItem('bg_user', JSON.stringify(result.user));
    localStorage.removeItem('bg_token');
  }
  return result;
}

export async function logout() {
  try {
    await apiRequest('/auth/logout/', { method: 'POST', body: '{}' });
  } finally {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bg_user');
      localStorage.removeItem('bg_token');
    }
  }
}

export async function changePassword(payload: { current_password: string; new_password: string }) {
  return apiRequest<{ detail: string }>('/auth/change-password/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getPublicCreator(username: string): Promise<PublicCreator> {
  const response = await fetch(`${API_URL}/creators/${encodeURIComponent(username)}/`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Creator not found');
  return response.json();
}

export async function getLeaderboard(username: string, period?: string): Promise<LeaderboardResponse> {
  const query = period ? `?period=${encodeURIComponent(period)}` : '';
  const response = await fetch(`${API_URL}/creators/${encodeURIComponent(username)}/leaderboard/${query}`, {
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Could not load leaderboard');
  return response.json();
}

export async function getCreatorDashboard(): Promise<CreatorDashboardData> {
  return apiRequest<CreatorDashboardData>('/creators/dashboard/');
}

export async function getBanksList(): Promise<{ banks: BankItem[] }> {
  return apiRequest<{ banks: BankItem[] }>('/creators/banks/');
}

export async function resolveBankAccount(account_number: string, bank_code: string) {
  return apiRequest<{ account_name: string; account_number: string; bank_code: string }>('/creators/bank/resolve/', {
    method: 'POST',
    body: JSON.stringify({ account_number, bank_code }),
  });
}

export async function connectBankAccount(payload: { bank_code: string; bank_name: string; account_number: string }) {
  return apiRequest<{ detail: string; creator: CreatorDashboardData['creator'] }>('/creators/bank/connect/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCreatorProfile(payload: Partial<CreatorDashboardData['creator']>) {
  return apiRequest<{ detail: string; creator: CreatorDashboardData['creator'] }>('/creators/profile/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function getInboxInteractions(params?: { status?: string; type?: string }) {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.type) query.set('type', params.type);
  const qStr = query.toString() ? `?${query.toString()}` : '';
  return apiRequest<{ count: number; results: InteractionItem[] }>(`/interactions/inbox/${qStr}`);
}

export async function markInteractionRead(id: string) {
  return apiRequest<{ detail: string; interaction: InteractionItem }>(`/interactions/${id}/read/`, {
    method: 'POST',
    body: '{}',
  });
}

export async function markInteractionArchived(id: string) {
  return apiRequest<{ detail: string; interaction: InteractionItem }>(`/interactions/${id}/archive/`, {
    method: 'POST',
    body: '{}',
  });
}
