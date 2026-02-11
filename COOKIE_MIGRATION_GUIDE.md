# 🍪 Руководство по миграции на httpOnly Cookies

## 📋 Обзор изменений

Refresh токены теперь хранятся в **httpOnly cookies** вместо localStorage для защиты от XSS атак.

### Что изменилось:
- ✅ Refresh token автоматически сохраняется в cookie
- ✅ Access token отправляется в теле ответа (как раньше)
- ✅ Добавлен endpoint `/auth/logout`
- ✅ Refresh endpoint больше не требует токен в body

## 🔄 Изменения в API

### 1. Регистрация и вход (без изменений)
```typescript
// POST /auth/register
// POST /auth/login
// Работают как раньше, но нужно добавить credentials: 'include'
```

### 2. Подтверждение email/login
```typescript
// БЫЛО:
const response = await fetch('/auth/verify-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, code })
});
const { accessToken, refreshToken } = await response.json();
localStorage.setItem('refreshToken', refreshToken);

// СТАЛО:
const response = await fetch('/auth/verify-email', {
  method: 'POST',
  credentials: 'include', // ДОБАВИТЬ!
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, code })
});
const { accessToken } = await response.json();
// refreshToken автоматически в cookie, не сохраняем в localStorage
```

### 3. Обновление токена
```typescript
// БЫЛО:
const refreshToken = localStorage.getItem('refreshToken');
const response = await fetch('/auth/refresh', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({ refreshToken })
});

// СТАЛО:
const response = await fetch('/auth/refresh', {
  method: 'POST',
  credentials: 'include', // ВАЖНО!
  headers: { 
    'Authorization': `Bearer ${accessToken}`
  }
  // body не нужен - токен из cookie
});
const { accessToken: newAccessToken } = await response.json();
```

### 4. Выход (НОВЫЙ endpoint)
```typescript
const response = await fetch('/auth/logout', {
  method: 'POST',
  credentials: 'include',
  headers: { 
    'Authorization': `Bearer ${accessToken}`
  }
});
// Cookies автоматически очищены
// Очистить access token из памяти
setAccessToken(null);
```

## 🛠️ Обновление API клиента

### Axios (рекомендуется)
```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true, // ВАЖНО: отправляет cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

// Интерцептор для добавления access token
apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken(); // из памяти/state
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Интерцептор для обновления токена
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Refresh token автоматически из cookie
        const { data } = await apiClient.post('/auth/refresh');
        setAccessToken(data.accessToken);
        
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Перенаправить на страницу входа
        window.location.href = '/auth';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

### Fetch API
```typescript
const API_URL = 'http://localhost:3000';

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const accessToken = getAccessToken();
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include', // ВАЖНО!
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
      ...options.headers
    }
  });
  
  // Обработка 401 для refresh
  if (response.status === 401 && endpoint !== '/auth/refresh') {
    const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (refreshResponse.ok) {
      const { accessToken: newToken } = await refreshResponse.json();
      setAccessToken(newToken);
      
      // Повторить оригинальный запрос
      return apiCall(endpoint, options);
    } else {
      // Перенаправить на страницу входа
      window.location.href = '/auth';
      throw new Error('Session expired');
    }
  }
  
  return response;
}
```

## 🗂️ Обновление State Management

### Zustand
```typescript
import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  // refreshToken больше не нужен в state
  setAccessToken: (token: string | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  
  setAccessToken: (token) => set({ accessToken: token }),
  
  logout: async () => {
    try {
      await fetch('http://localhost:3000/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${get().accessToken}`
        }
      });
    } finally {
      set({ accessToken: null });
    }
  }
}));
```

### React Context
```typescript
interface AuthContextType {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  
  const logout = async () => {
    try {
      await fetch('http://localhost:3000/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
    } finally {
      setAccessToken(null);
    }
  };
  
  return (
    <AuthContext.Provider value={{ accessToken, setAccessToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

## ✅ Чеклист миграции

### Backend (уже готово):
- [x] Установлен cookie-parser
- [x] Создан CookieService
- [x] Обновлены endpoints
- [x] Добавлен /auth/logout
- [x] Настроен CORS с credentials: true

### Frontend (нужно сделать):
- [ ] Удалить все `localStorage.setItem('refreshToken', ...)`
- [ ] Удалить все `localStorage.getItem('refreshToken')`
- [ ] Добавить `credentials: 'include'` во все auth запросы
- [ ] Обновить интерцептор refresh токена
- [ ] Удалить refreshToken из state/store
- [ ] Реализовать logout функцию
- [ ] Обновить API клиент (axios/fetch)
- [ ] Протестировать все auth flow

## 🧪 Тестирование

### Проверка cookies в браузере:
1. Откройте DevTools → Application → Cookies
2. После входа должен появиться `refreshToken` cookie
3. Проверьте флаги: HttpOnly ✓, Secure (в prod), SameSite: Strict

### Проверка refresh:
1. Дождитесь истечения access token (15 минут)
2. Сделайте любой защищенный запрос
3. Должен автоматически обновиться через refresh
4. Проверьте, что новый refreshToken в cookie

### Проверка logout:
1. Выполните logout
2. Проверьте, что refreshToken cookie удален
3. Попытка refresh должна вернуть 401

## ⚠️ Важные замечания

1. **CORS**: Убедитесь, что backend разрешает credentials
2. **HTTPS**: В продакшене cookies будут работать только по HTTPS
3. **SameSite**: Фронт и бэк должны быть на одном домене (или поддомене)
4. **Безопасность**: Никогда не храните refresh token в localStorage/sessionStorage

## 🚀 Продакшен

### Настройки для продакшена:
```typescript
// Backend .env
NODE_ENV=production

// Cookies автоматически получат:
// - secure: true (только HTTPS)
// - sameSite: 'strict'
```

### Проверка:
- [ ] HTTPS настроен
- [ ] Домены совпадают (или поддомены)
- [ ] CORS правильно настроен
- [ ] Cookies работают в production build