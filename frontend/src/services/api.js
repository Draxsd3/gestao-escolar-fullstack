import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
})

// Injeta token em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('babel_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Trata 401 SOMENTE fora do endpoint de login (sessão expirada)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRoute = error.config?.url?.includes('/auth/login')
    if (error.response?.status === 401 && !isLoginRoute) {
      localStorage.removeItem('babel_token')
      localStorage.removeItem('babel_usuario')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
