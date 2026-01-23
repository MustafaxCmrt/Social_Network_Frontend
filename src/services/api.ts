const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5265/api';

interface RequestOptions extends RequestInit {
  token?: string;
}

export const api = {
  get: async <T>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
    return request<T>(endpoint, { ...options, method: 'GET' });
  },

  post: async <T>(endpoint: string, body: any, options: RequestOptions = {}): Promise<T> => {
    return request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  },
};

async function request<T>(endpoint: string, options: RequestOptions): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers);

  // Auto-inject token if exists in storage (excluding auth endpoints if needed)
  const token = localStorage.getItem('accessToken');
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle empty responses or non-JSON
  const contentType = response.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    // Try to extract error message from backend structure
    // Backend validation errors might be in "errors" object or "message" string
    throw new Error(typeof data === 'string' ? data : data.message || JSON.stringify(data) || 'Bir hata oluştu');
  }

  // Parse text response as generic T if possible, or wrap it
  return data as T;
}
