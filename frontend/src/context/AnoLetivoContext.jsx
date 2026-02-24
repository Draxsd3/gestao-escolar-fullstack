import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from './AuthContext'

const AnoLetivoContext = createContext(null)

export function AnoLetivoProvider({ children }) {
  const { autenticado } = useAuth()
  const [anoLetivo, setAnoLetivo] = useState(null)
  const [periodoAtivo, setPeriodoAtivo] = useState(null)
  const [periodos, setPeriodos] = useState([])
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(async () => {
    if (!autenticado) {
      setAnoLetivo(null)
      setPeriodoAtivo(null)
      setPeriodos([])
      setLoading(false)
      return
    }
    try {
      const { data } = await api.get('/ano-letivo/vigente', { skipSuccessMessage: true, skipConfirm: true })
      setAnoLetivo(data.ano_letivo || null)
      setPeriodoAtivo(data.periodo_ativo || null)
      setPeriodos(data.periodos || [])
    } catch {
      setAnoLetivo(null)
      setPeriodoAtivo(null)
      setPeriodos([])
    } finally {
      setLoading(false)
    }
  }, [autenticado])

  useEffect(() => { carregar() }, [carregar])

  const recarregar = useCallback(() => carregar(), [carregar])

  // Label formatada para exibir na barra de navegação
  const labelVigente = (() => {
    if (!anoLetivo) return 'Sem ano letivo'
    if (!periodoAtivo) return `${anoLetivo.ano} — Sem período ativo`
    return `${anoLetivo.ano} — ${periodoAtivo.nome}`
  })()

  // Modelo legível
  const modeloLabel = anoLetivo?.modelo_periodo === 'semestral' ? 'Semestral' : 'Bimestral'

  return (
    <AnoLetivoContext.Provider value={{
      anoLetivo,
      periodoAtivo,
      periodos,
      loading,
      labelVigente,
      modeloLabel,
      recarregar,
    }}>
      {children}
    </AnoLetivoContext.Provider>
  )
}

export const useAnoLetivo = () => useContext(AnoLetivoContext)
