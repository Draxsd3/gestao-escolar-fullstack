import axios from 'axios'
import { notifyError, notifySuccess, requestConfirmation } from './feedback'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
})

// Injeta token em todas as requisições
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('babel_token')
  if (token) config.headers.Authorization = `Bearer ${token}`

  const method = String(config.method || '').toLowerCase()
  const needsConfirm = ['put', 'patch', 'delete'].includes(method) && !config.skipConfirm
  if (needsConfirm && typeof window !== 'undefined') {
    const action = method === 'delete' ? 'excluir' : 'editar'
    const target = config.confirmTarget || 'este registro'
    const message = config.confirmMessage || `Confirma ${action} ${target}?`
    const ok = await requestConfirmation({ action, target, message, method })
    if (!ok) {
      return Promise.reject(new axios.Cancel('Operacao cancelada pelo usuario.'))
    }
  }
  return config
})

// Trata 401 SOMENTE fora do endpoint de login (sessão expirada)
api.interceptors.response.use(
  (response) => {
    const method = String(response.config?.method || '').toLowerCase()
    const shouldNotifySuccess = ['post', 'put', 'patch', 'delete'].includes(method)
      && !response.config?.skipSuccessMessage
      && !response.config?.url?.includes('/auth/login')

    if (shouldNotifySuccess) {
      const msg = response.data?.message
        || (method === 'delete' ? 'Exclusao realizada com sucesso.' : 'Operacao realizada com sucesso.')
      notifySuccess(msg)
    }
    return response
  },
  (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error)
    }

    const isLoginRoute = error.config?.url?.includes('/auth/login')
    if (error.response?.status === 401 && !isLoginRoute) {
      localStorage.removeItem('babel_token')
      localStorage.removeItem('babel_usuario')
      window.location.href = '/login'
    }

    if (!error.config?.skipErrorMessage) {
      const msg = error.response?.data?.message || 'Ocorreu um erro ao processar a solicitacao.'
      notifyError(msg)
    }

    return Promise.reject(error)
  }
)

export default api
