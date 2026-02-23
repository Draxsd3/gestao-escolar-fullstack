import { createContext, useContext, useState, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Inicializa a partir do localStorage — persiste sessão entre recargas
  const [usuario, setUsuario] = useState(() => {
    try {
      const stored = localStorage.getItem('babel_usuario')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const login = useCallback(async (email, senha) => {
    // Faz a chamada — lança exceção em caso de erro (4xx/5xx)
    const { data } = await api.post('/auth/login', { email, senha })

    // Persiste ANTES de atualizar o estado — garante que o interceptor
    // do axios já tem o token para requisições subsequentes imediatas
    localStorage.setItem('babel_token', data.token)
    localStorage.setItem('babel_usuario', JSON.stringify(data.usuario))

    // Atualiza o contexto — dispara re-render do RotaPublica → Navigate para /
    setUsuario(data.usuario)

    return data.usuario
  }, [])

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout') } catch { /* ignora erro de rede no logout */ }
    localStorage.removeItem('babel_token')
    localStorage.removeItem('babel_usuario')
    setUsuario(null)
  }, [])

  const isPerfil = useCallback((...perfis) => {
    return perfis.includes(usuario?.perfil)
  }, [usuario])

  return (
    <AuthContext.Provider value={{
      usuario,
      autenticado: !!usuario,
      login,
      logout,
      isPerfil,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
