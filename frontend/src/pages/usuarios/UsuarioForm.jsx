import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, Card } from '../../components/ui'
import api from '../../services/api'

const INITIAL_FORM = {
  nome: '',
  email: '',
  perfil_id: '',
  senha: '',
  senha_confirmation: '',
  ativo: true,
}

export default function UsuarioForm() {
  const navigate = useNavigate()

  const [form, setForm] = useState(INITIAL_FORM)
  const [perfis, setPerfis] = useState([])
  const [erros, setErros] = useState({})
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState('')

  useEffect(() => {
    api.get('/usuarios/perfis')
      .then((r) => setPerfis(r.data || []))
      .catch((err) => {
        setErros({ geral: [err.response?.data?.message || 'Erro ao carregar perfis'] })
      })
      .finally(() => setLoading(false))
  }, [])

  const set = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErros({})
    setSucesso('')
    setSalvando(true)

    try {
      await api.post('/usuarios', form)
      setSucesso('Usuario criado com sucesso.')
      setForm(INITIAL_FORM)
    } catch (err) {
      setErros(err.response?.data?.errors || { geral: [err.response?.data?.message || 'Erro ao criar usuario'] })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Novo Usuario</h1>
          <p className="page-subtitle">Criar acesso ao sistema</p>
        </div>
        <Button variant="secondary" onClick={() => navigate(-1)}>Voltar</Button>
      </div>

      {erros.geral && <Alert variant="error">{erros.geral[0]}</Alert>}
      {sucesso && <Alert variant="success">{sucesso}</Alert>}

      <Card title="Dados de acesso">
        {loading ? (
          <p style={{ margin: 0, color: '#64748b' }}>Carregando perfis...</p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Nome *</label>
                <input
                  className={`form-control ${erros.nome ? 'error' : ''}`}
                  type="text"
                  value={form.nome}
                  onChange={(e) => set('nome', e.target.value)}
                  required
                />
                {erros.nome && <span className="form-error">{erros.nome[0]}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">E-mail *</label>
                <input
                  className={`form-control ${erros.email ? 'error' : ''}`}
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  required
                />
                {erros.email && <span className="form-error">{erros.email[0]}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Perfil *</label>
                <select
                  className={`form-control ${erros.perfil_id ? 'error' : ''}`}
                  value={form.perfil_id}
                  onChange={(e) => set('perfil_id', e.target.value)}
                  required
                >
                  <option value="">Selecione...</option>
                  {perfis.map((perfil) => (
                    <option key={perfil.id} value={perfil.id}>
                      {perfil.nome}
                    </option>
                  ))}
                </select>
                {erros.perfil_id && <span className="form-error">{erros.perfil_id[0]}</span>}
              </div>

              <div className="form-group" style={{ alignSelf: 'end' }}>
                <label className="form-label" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={form.ativo}
                    onChange={(e) => set('ativo', e.target.checked)}
                  />
                  Usuario ativo
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">Senha *</label>
                <input
                  className={`form-control ${erros.senha ? 'error' : ''}`}
                  type="password"
                  minLength={8}
                  value={form.senha}
                  onChange={(e) => set('senha', e.target.value)}
                  required
                />
                {erros.senha && <span className="form-error">{erros.senha[0]}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Confirmar senha *</label>
                <input
                  className={`form-control ${erros.senha_confirmation ? 'error' : ''}`}
                  type="password"
                  minLength={8}
                  value={form.senha_confirmation}
                  onChange={(e) => set('senha_confirmation', e.target.value)}
                  required
                />
                {erros.senha_confirmation && <span className="form-error">{erros.senha_confirmation[0]}</span>}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button variant="secondary" type="button" onClick={() => navigate(-1)}>Cancelar</Button>
              <Button type="submit" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Criar usuario'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}
