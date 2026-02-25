import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'
import { Alert, Button, Card, Loading } from '../../components/ui'

function gerarSenha() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const special = '!@#$%&*'
  const all = upper + lower + digits + special

  const base = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ]

  for (let i = 4; i < 10; i += 1) {
    base.push(all[Math.floor(Math.random() * all.length)])
  }

  return base.sort(() => Math.random() - 0.5).join('')
}

const RESP_EMPTY = {
  id: null,
  nome: '',
  cpf: '',
  email: '',
  telefone: '',
  parentesco: 'Responsavel',
  responsavel_financeiro: true,
  contato_emergencia: true,
}

function CampoSenha({ value, onChange, onGerar }) {
  const [mostrar, setMostrar] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const copiar = () => {
    if (!value) return
    navigator.clipboard.writeText(value).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1800)
    })
  }

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <div style={{ position: 'relative', flex: 1 }}>
        <input
          className="form-control"
          type={mostrar ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Senha de acesso"
          style={{ paddingRight: 36, fontFamily: 'var(--mono)' }}
        />
        <button
          type="button"
          onClick={() => setMostrar((s) => !s)}
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
          }}
        >
          {mostrar ? 'Ocultar' : 'Ver'}
        </button>
      </div>
      <Button type="button" variant="secondary" onClick={onGerar}>Gerar</Button>
      <Button type="button" variant="secondary" onClick={copiar} disabled={!value}>{copiado ? 'Copiado' : 'Copiar'}</Button>
    </div>
  )
}

export default function AlunoForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    nome: '', cpf: '', rg: '', data_nascimento: '', sexo: 'M', email: '', telefone: '',
    rua: '', numero: '', bairro: '', cidade: '', estado: '', cep: '',
  })

  const [responsaveis, setResponsaveis] = useState([{ ...RESP_EMPTY }])
  const [responsavelProprio, setResponsavelProprio] = useState(false)

  const [gerarAcesso, setGerarAcesso] = useState(false)
  const [emailLogin, setEmailLogin] = useState('')
  const [senha, setSenha] = useState('')
  const [trocarSenha, setTrocarSenha] = useState(true)

  const setCampo = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const setResp = (idx, key, value) => {
    setResponsaveis((prev) => prev.map((r, i) => (i === idx ? { ...r, [key]: value } : r)))
  }

  const marcarRespFinanceiro = (idx) => {
    setResponsaveis((prev) => prev.map((r, i) => ({ ...r, responsavel_financeiro: i === idx })))
  }

  const addResp = () => {
    setResponsaveis((prev) => [
      ...prev,
      { ...RESP_EMPTY, responsavel_financeiro: false, contato_emergencia: false },
    ])
  }

  const removeResp = (idx) => {
    setResponsaveis((prev) => {
      const next = prev.filter((_, i) => i !== idx)
      if (!next.length) return [{ ...RESP_EMPTY }]
      if (!next.some((r) => r.responsavel_financeiro)) {
        next[0] = { ...next[0], responsavel_financeiro: true }
      }
      return next
    })
  }

  useEffect(() => {
    if (!isEdit) return

    api.get(`/alunos/${id}`)
      .then((r) => {
        const a = r.data
        const end = typeof a.endereco === 'string' ? JSON.parse(a.endereco || '{}') : (a.endereco || {})

        setForm({
          nome: a.nome || '',
          cpf: a.cpf || '',
          rg: a.rg || '',
          data_nascimento: a.data_nascimento || '',
          sexo: a.sexo || 'M',
          email: a.email || '',
          telefone: a.telefone || '',
          rua: end.rua || '',
          numero: end.numero || '',
          bairro: end.bairro || '',
          cidade: end.cidade || '',
          estado: end.estado || '',
          cep: end.cep || '',
        })

        const resp = (a.responsaveis || []).map((x) => ({
          id: x.id || null,
          nome: x.nome || '',
          cpf: x.cpf || '',
          email: x.email || '',
          telefone: x.telefone || '',
          parentesco: x.pivot?.parentesco || 'Responsavel',
          responsavel_financeiro: !!x.pivot?.responsavel_financeiro,
          contato_emergencia: !!x.pivot?.contato_emergencia,
        }))

        setResponsaveis(resp.length ? resp : [{ ...RESP_EMPTY }])
        setResponsavelProprio(resp.some((x) => (x.parentesco || '').toLowerCase() === 'proprio'))
      })
      .finally(() => setLoading(false))
  }, [id, isEdit])

  useEffect(() => {
    if (!isEdit && gerarAcesso && !emailLogin) setEmailLogin(form.email)
  }, [form.email, gerarAcesso, emailLogin, isEdit])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!isEdit && gerarAcesso) {
      if (!emailLogin) return setError('Informe o e-mail de acesso.')
      if (!senha || senha.length < 8) return setError('A senha deve ter no minimo 8 caracteres.')
    }

    const listaResponsaveis = responsaveis
      .filter((r) => r.id || r.nome.trim())
      .map((r) => ({
        ...(r.id ? { id: Number(r.id) } : {}),
        nome: r.nome.trim() || undefined,
        cpf: r.cpf.trim() || undefined,
        email: r.email.trim() || undefined,
        telefone: r.telefone.trim() || undefined,
        parentesco: (r.parentesco || 'Responsavel').trim(),
        responsavel_financeiro: !!r.responsavel_financeiro,
        contato_emergencia: !!r.contato_emergencia,
      }))

    const payload = {
      nome: form.nome,
      cpf: form.cpf,
      rg: form.rg,
      data_nascimento: form.data_nascimento,
      sexo: form.sexo,
      email: form.email,
      telefone: form.telefone,
      endereco: {
        rua: form.rua,
        numero: form.numero,
        bairro: form.bairro,
        cidade: form.cidade,
        estado: form.estado,
        cep: form.cep,
      },
      responsaveis: listaResponsaveis,
      responsavel_proprio: !!responsavelProprio,
    }

    if (!isEdit && gerarAcesso) {
      payload.gerar_acesso = true
      payload.email_login = emailLogin
      payload.senha = senha
      payload.trocar_senha = trocarSenha
    }

    setSaving(true)
    try {
      if (isEdit) {
        await api.put(`/alunos/${id}`, payload)
      } else {
        await api.post('/alunos', payload)
      }
      navigate('/alunos')
    } catch (err) {
      const detail = err.response?.data
      const message = detail?.message
        || (detail?.errors ? Object.values(detail.errors).flat().join('. ') : null)
        || 'Erro ao salvar aluno.'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">{isEdit ? 'Editar Aluno' : 'Novo Aluno'}</div>
          <div className="page-sub">Dados cadastrais e responsavel financeiro</div>
        </div>
        <Button variant="secondary" onClick={() => navigate('/alunos')}>Voltar</Button>
      </div>

      {error && <Alert variant="error" onClose={() => setError('')}>{error}</Alert>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Card title="Dados Pessoais">
          <div className="form-grid">
            <div className="form-group form-full">
              <label className="form-label">Nome *</label>
              <input className="form-control" required value={form.nome} onChange={(e) => setCampo('nome', e.target.value)} />
            </div>
            <div className="form-group"><label className="form-label">CPF</label><input className="form-control" value={form.cpf} onChange={(e) => setCampo('cpf', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">RG</label><input className="form-control" value={form.rg} onChange={(e) => setCampo('rg', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Nascimento *</label><input type="date" className="form-control" required value={form.data_nascimento} onChange={(e) => setCampo('data_nascimento', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Sexo</label><select className="form-control" value={form.sexo} onChange={(e) => setCampo('sexo', e.target.value)}><option value="M">Masculino</option><option value="F">Feminino</option><option value="O">Outro</option></select></div>
            <div className="form-group"><label className="form-label">E-mail</label><input type="email" className="form-control" value={form.email} onChange={(e) => setCampo('email', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Telefone</label><input className="form-control" value={form.telefone} onChange={(e) => setCampo('telefone', e.target.value)} /></div>
          </div>
        </Card>

        <Card title="Endereco">
          <div className="form-grid">
            <div className="form-group form-full"><label className="form-label">Rua</label><input className="form-control" value={form.rua} onChange={(e) => setCampo('rua', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Numero</label><input className="form-control" value={form.numero} onChange={(e) => setCampo('numero', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Bairro</label><input className="form-control" value={form.bairro} onChange={(e) => setCampo('bairro', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Cidade</label><input className="form-control" value={form.cidade} onChange={(e) => setCampo('cidade', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Estado</label><input className="form-control" maxLength={2} value={form.estado} onChange={(e) => setCampo('estado', e.target.value.toUpperCase())} /></div>
            <div className="form-group"><label className="form-label">CEP</label><input className="form-control" value={form.cep} onChange={(e) => setCampo('cep', e.target.value)} /></div>
          </div>
        </Card>

        <Card title="Aba Responsavel">
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={responsavelProprio}
                onChange={(e) => setResponsavelProprio(e.target.checked)}
              />
              Responsavel proprio (aluno responde por si mesmo)
            </label>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Quando marcado, o sistema vincula automaticamente o proprio aluno como responsavel financeiro.
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {responsaveis.map((resp, idx) => (
              <div key={`${resp.id || 'novo'}-${idx}`} style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius)', padding: 12 }}>
                <div className="form-grid">
                  <div className="form-group form-full"><label className="form-label">Nome *</label><input className="form-control" value={resp.nome} onChange={(e) => setResp(idx, 'nome', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">CPF</label><input className="form-control" value={resp.cpf} onChange={(e) => setResp(idx, 'cpf', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Parentesco</label><input className="form-control" value={resp.parentesco} onChange={(e) => setResp(idx, 'parentesco', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">E-mail</label><input type="email" className="form-control" value={resp.email} onChange={(e) => setResp(idx, 'email', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Telefone</label><input className="form-control" value={resp.telefone} onChange={(e) => setResp(idx, 'telefone', e.target.value)} /></div>
                </div>
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <input type="checkbox" checked={!!resp.responsavel_financeiro} onChange={() => marcarRespFinanceiro(idx)} />
                    Responsavel financeiro
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <input type="checkbox" checked={!!resp.contato_emergencia} onChange={(e) => setResp(idx, 'contato_emergencia', e.target.checked)} />
                    Contato de emergencia
                  </label>
                  <Button type="button" variant="ghost" onClick={() => removeResp(idx)}>Remover</Button>
                </div>
              </div>
            ))}
            <div><Button type="button" variant="secondary" onClick={addResp}>+ Adicionar responsavel</Button></div>
          </div>
        </Card>

        {!isEdit && (
          <Card title="Acesso ao Sistema">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: gerarAcesso ? 14 : 0 }}>
              <input
                type="checkbox"
                checked={gerarAcesso}
                onChange={(e) => {
                  setGerarAcesso(e.target.checked)
                  if (e.target.checked && !emailLogin) setEmailLogin(form.email)
                  if (e.target.checked && !senha) setSenha(gerarSenha())
                }}
              />
              Gerar acesso para o aluno
            </label>

            {gerarAcesso && (
              <div style={{ display: 'grid', gap: 14, borderTop: '1px solid var(--border-light)', paddingTop: 14 }}>
                <div className="form-group">
                  <label className="form-label">E-mail de acesso *</label>
                  <input type="email" className="form-control" value={emailLogin} onChange={(e) => setEmailLogin(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Senha temporaria *</label>
                  <CampoSenha value={senha} onChange={setSenha} onGerar={() => setSenha(gerarSenha())} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <input type="checkbox" checked={trocarSenha} onChange={(e) => setTrocarSenha(e.target.checked)} />
                  Obrigar troca de senha no primeiro acesso
                </label>
              </div>
            )}
          </Card>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button type="button" variant="secondary" onClick={() => navigate('/alunos')}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar aluno'}</Button>
        </div>
      </form>
    </div>
  )
}
