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

  put: async <T>(endpoint: string, body: any, options: RequestOptions = {}): Promise<T> => {
    return request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  },

  delete: async <T>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
    return request<T>(endpoint, { ...options, method: 'DELETE' });
  },

  patch: async <T>(endpoint: string, body: any = {}, options: RequestOptions = {}): Promise<T> => {
    return request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  },

  upload: async <T>(endpoint: string, file: File, options: RequestOptions = {}): Promise<T> => {
    const formData = new FormData();
    formData.append('file', file);

    return request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
      // Content-Type header must be undefined for FormData, browser sets it with boundary
    });
  },
};

async function request<T>(endpoint: string, options: RequestOptions, isRetry: boolean = false): Promise<T> {
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

  // Handle 401 Unauthorized - try refresh token
  // Skip refresh logic for Auth endpoints (login, register, etc.) - let them handle their own errors
  const isAuthEndpoint = endpoint.startsWith('/Auth');

  if (response.status === 401 && !isRetry && !isAuthEndpoint) {
    const refreshToken = localStorage.getItem('refreshToken');

    if (refreshToken) {
      try {
        // Try to refresh the token
        const refreshResponse = await fetch(`${BASE_URL}/Auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          localStorage.setItem('accessToken', refreshData.accessToken);
          localStorage.setItem('refreshToken', refreshData.refreshToken);

          // Retry the original request with new token
          return request<T>(endpoint, options, true);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
    }

    // Refresh failed or no refresh token - logout and redirect
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    // Eger zaten login sayfasindaysak redirect yapma (race condition onleme)
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new Error('Oturum suresi doldu. Lutfen tekrar giris yapin.');
  }

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
    // Backend validation errors might be in "errors" array or "message" string
    if (typeof data === 'object' && data !== null) {
      // Check if it's a validation error with errors array
      if (Array.isArray((data as any).errors) && (data as any).errors.length > 0) {
        const errorMessages = (data as any).errors.map((err: any) => 
          err.error || `${err.field}: ${err.error || 'Geçersiz değer'}`
        ).join('\n');
        const error = new Error((data as any).message || 'Validation hatası');
        (error as any).validationErrors = (data as any).errors;
        (error as any).formattedMessage = errorMessages;
        throw error;
      }
      // Regular error with message
      throw new Error((data as any).message || JSON.stringify(data) || 'Bir hata olustu');
    }
    // String error
    throw new Error(typeof data === 'string' ? data : 'Bir hata olustu');
  }

  // Parse text response as generic T if possible, or wrap it
  return data as T;
}
