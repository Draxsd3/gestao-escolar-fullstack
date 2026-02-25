import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { Alert, Button, Card } from '../../components/ui'

function iniciais(nome) {
  if (!nome) return '?'
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')
}

const LABEL_STYLE = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: 6,
}

export default function PerfilPage() {
  const { usuario, atualizarUsuario } = useAuth()
  const [nome, setNome] = useState(usuario?.nome || '')
  const [email, setEmail] = useState(usuario?.email || '')
  const [fotoFile, setFotoFile] = useState(null)
  const [removerFoto, setRemoverFoto] = useState(false)

  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('')

  const [savingPerfil, setSavingPerfil] = useState(false)
  const [savingSenha, setSavingSenha] = useState(false)
  const [errorPerfil, setErrorPerfil] = useState('')
  const [errorSenha, setErrorSenha] = useState('')
  const [okPerfil, setOkPerfil] = useState('')
  const [okSenha, setOkSenha] = useState('')
  const [previewFotoLocal, setPreviewFotoLocal] = useState('')

  useEffect(() => {
    if (!fotoFile) {
      setPreviewFotoLocal('')
      return undefined
    }
    const url = URL.createObjectURL(fotoFile)
    setPreviewFotoLocal(url)
    return () => URL.revokeObjectURL(url)
  }, [fotoFile])

  const previewFoto = previewFotoLocal || (!removerFoto ? usuario?.foto_url : null)

  const onTrocarFoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoFile(file)
    setRemoverFoto(false)
  }

  const onSalvarPerfil = async (e) => {
    e.preventDefault()
    setErrorPerfil('')
    setOkPerfil('')
    setSavingPerfil(true)

    try {
      const formData = new FormData()
      formData.append('nome', nome.trim())
      formData.append('email', email.trim())
      if (fotoFile) formData.append('foto', fotoFile)
      if (removerFoto) formData.append('remover_foto', '1')

      const { data } = await api.post('/auth/perfil', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        skipSuccessMessage: true,
      })

      if (data?.usuario) {
        atualizarUsuario(data.usuario)
      }
      setFotoFile(null)
      setRemoverFoto(false)
      setOkPerfil(data?.message || 'Perfil atualizado com sucesso.')
    } catch (err) {
      setErrorPerfil(err.response?.data?.message || 'Nao foi possivel atualizar o perfil.')
    } finally {
      setSavingPerfil(false)
    }
  }

  const onSalvarSenha = async (e) => {
    e.preventDefault()
    setErrorSenha('')
    setOkSenha('')

    if (novaSenha !== confirmacaoSenha) {
      setErrorSenha('A confirmacao da senha nao confere.')
      return
    }

    setSavingSenha(true)
    try {
      const { data } = await api.post('/auth/senha', {
        senha_atual: senhaAtual,
        nova_senha: novaSenha,
        nova_senha_confirmation: confirmacaoSenha,
      }, { skipSuccessMessage: true })

      setSenhaAtual('')
      setNovaSenha('')
      setConfirmacaoSenha('')
      setOkSenha(data?.message || 'Senha alterada com sucesso.')
    } catch (err) {
      setErrorSenha(err.response?.data?.message || 'Nao foi possivel alterar a senha.')
    } finally {
      setSavingSenha(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div>
        <h1 className="page-title">Meu perfil</h1>
        <p className="page-subtitle">Atualize seus dados, foto e senha de acesso.</p>
      </div>

      <Card title="Dados da conta">
        {errorPerfil && <Alert variant="error" onClose={() => setErrorPerfil('')}>{errorPerfil}</Alert>}
        {okPerfil && <Alert variant="success" onClose={() => setOkPerfil('')}>{okPerfil}</Alert>}

        <form onSubmit={onSalvarPerfil} style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            {previewFoto ? (
              <img
                src={previewFoto}
                alt="Foto do perfil"
                style={{
                  width: 78,
                  height: 78,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1px solid var(--border-light)',
                }}
              />
            ) : (
              <div style={{
                width: 78,
                height: 78,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
                fontWeight: 700,
                fontSize: 24,
                border: '1px solid var(--accent-border)',
              }}>
                {iniciais(nome || usuario?.nome)}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                Alterar foto
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={onTrocarFoto}
                  style={{ display: 'none' }}
                />
              </label>
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  setFotoFile(null)
                  setRemoverFoto(true)
                }}
              >
                Remover foto
              </Button>
            </div>
          </div>

          <div className="form-grid">
            <div>
              <label style={LABEL_STYLE}>Nome</label>
              <input
                className="form-control"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={LABEL_STYLE}>E-mail</label>
              <input
                className="form-control"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Button type="submit" disabled={savingPerfil || !nome.trim() || !email.trim()}>
              {savingPerfil ? 'Salvando...' : 'Salvar perfil'}
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Seguranca">
        {errorSenha && <Alert variant="error" onClose={() => setErrorSenha('')}>{errorSenha}</Alert>}
        {okSenha && <Alert variant="success" onClose={() => setOkSenha('')}>{okSenha}</Alert>}

        <form onSubmit={onSalvarSenha} style={{ display: 'grid', gap: 14 }}>
          <div className="form-grid">
            <div>
              <label style={LABEL_STYLE}>Senha atual</label>
              <input
                className="form-control"
                type="password"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={LABEL_STYLE}>Nova senha</label>
              <input
                className="form-control"
                type="password"
                minLength={8}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ maxWidth: 420 }}>
            <label style={LABEL_STYLE}>Confirmar nova senha</label>
            <input
              className="form-control"
              type="password"
              minLength={8}
              value={confirmacaoSenha}
              onChange={(e) => setConfirmacaoSenha(e.target.value)}
              required
            />
          </div>

          <div>
            <Button
              type="submit"
              disabled={savingSenha || !senhaAtual || !novaSenha || !confirmacaoSenha}
            >
              {savingSenha ? 'Alterando...' : 'Alterar senha'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
