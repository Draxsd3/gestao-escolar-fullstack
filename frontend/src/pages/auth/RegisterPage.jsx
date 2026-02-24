import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { styles } from '../../components/ui'
import api from '../../services/api'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    senha_confirmation: '',
  })
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    setSucesso('')
    setLoading(true)

    try {
      await api.post('/auth/registrar-admin', form)
      setSucesso('Usuario criado com sucesso. Faca login para continuar.')
      setTimeout(() => navigate('/login'), 1200)
    } catch (err) {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat()[0]
        : (err.response?.data?.message || 'Erro ao criar usuario')
      setErro(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{styles}</style>
      <style>{`
        .login-page {
          min-height: 100vh; background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%);
          display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .login-card {
          background: #fff; border-radius: 16px; padding: 40px;
          width: 100%; max-width: 460px; box-shadow: 0 20px 60px rgba(0,0,0,.3);
        }
        .login-logo { text-align: center; margin-bottom: 24px; }
        .login-logo .logo { font-size: 44px; margin-bottom: 8px; }
        .login-logo h1 { font-size: 26px; font-weight: 800; color: #1e293b; margin: 0; }
        .login-logo p { color: #64748b; font-size: 14px; margin-top: 4px; }
        .login-form { display: flex; flex-direction: column; gap: 14px; }
        .login-btn {
          padding: 12px; background: #2563eb; color: #fff; border: none;
          border-radius: 8px; font-size: 15px; font-weight: 600;
          cursor: pointer; transition: background .15s; margin-top: 8px;
        }
        .login-btn:hover:not(:disabled) { background: #1d4ed8; }
        .login-btn:disabled { opacity: .6; cursor: not-allowed; }
        .auth-links { margin-top: 14px; text-align: center; font-size: 13px; color: #64748b; }
        .auth-links a { color: #2563eb; text-decoration: none; font-weight: 600; }
      `}</style>
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">
            <div className="logo">B</div>
            <h1>Criar Usuario</h1>
            <p>Novo acesso ao sistema</p>
          </div>

          {erro && <div className="alert alert-error" style={{ marginBottom: 14 }}>{erro}</div>}
          {sucesso && <div className="alert alert-success" style={{ marginBottom: 14 }}>{sucesso}</div>}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nome</label>
              <input
                className="form-control"
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input
                className="form-control"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Senha</label>
              <input
                className="form-control"
                type="password"
                minLength={8}
                value={form.senha}
                onChange={(e) => setForm({ ...form, senha: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmar senha</label>
              <input
                className="form-control"
                type="password"
                minLength={8}
                value={form.senha_confirmation}
                onChange={(e) => setForm({ ...form, senha_confirmation: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Salvando...' : 'Criar usuario'}
            </button>
          </form>

          <div className="auth-links">
            Ja possui conta? <Link to="/login">Entrar</Link>
          </div>
        </div>
      </div>
    </>
  )
}
