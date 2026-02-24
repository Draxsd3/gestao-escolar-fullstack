import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'
import { Button, Alert, Loading, Card } from '../../components/ui'

export default function AlunoForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [form, setForm] = useState({
    nome:'', cpf:'', rg:'', data_nascimento:'', sexo:'M', email:'', telefone:'',
    rua:'', numero:'', bairro:'', cidade:'', estado:'', cep:''
  })

  useEffect(() => {
    if (!isEdit) return
    api.get(`/alunos/${id}`).then(r => {
      const a = r.data
      const end = typeof a.endereco === 'string' ? JSON.parse(a.endereco||'{}') : a.endereco||{}
      setForm({ nome:a.nome||'', cpf:a.cpf||'', rg:a.rg||'', data_nascimento:a.data_nascimento||'', sexo:a.sexo||'M', email:a.email||'', telefone:a.telefone||'', ...end })
    }).finally(() => setLoading(false))
  }, [id])

  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setSaving(true)
    const payload = {
      nome:form.nome, cpf:form.cpf, rg:form.rg, data_nascimento:form.data_nascimento,
      sexo:form.sexo, email:form.email, telefone:form.telefone,
      endereco: { rua:form.rua, numero:form.numero, bairro:form.bairro, cidade:form.cidade, estado:form.estado, cep:form.cep }
    }
    try {
      if (isEdit) await api.put(`/alunos/${id}`, payload)
      else await api.post('/alunos', payload)
      navigate('/alunos')
    } catch(err) {
      const detail = err.response?.data
      const message = detail?.message
        || (detail?.errors ? Object.values(detail.errors).flat().join('. ') : null)
        || 'Erro ao salvar. Verifique os campos obrigatórios.'
      setError(message)
    } finally { setSaving(false) }
  }

  if (loading) return <Loading />

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">{isEdit ? 'Editar Aluno' : 'Novo Aluno'}</div>
          <div className="page-sub">{isEdit ? 'Atualize os dados do aluno' : 'Preencha os dados para cadastrar um novo aluno'}</div>
        </div>
        <Button variant="secondary" onClick={() => navigate('/alunos')}>← Cancelar</Button>
      </div>

      {error && <Alert variant="error" onClose={()=>setError('')}>{error}</Alert>}

      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
        <Card title="Dados Pessoais">
          <div className="form-grid">
            <div className="form-group form-full">
              <label className="form-label">Nome Completo *</label>
              <input className="form-control" required value={form.nome} onChange={e=>set('nome',e.target.value)} placeholder="Nome completo do aluno" />
            </div>
            <div className="form-group">
              <label className="form-label">CPF</label>
              <input className="form-control" value={form.cpf} onChange={e=>set('cpf',e.target.value)} placeholder="000.000.000-00" />
            </div>
            <div className="form-group">
              <label className="form-label">RG</label>
              <input className="form-control" value={form.rg} onChange={e=>set('rg',e.target.value)} placeholder="00.000.000-0" />
            </div>
            <div className="form-group">
              <label className="form-label">Data de Nascimento *</label>
              <input type="date" className="form-control" required value={form.data_nascimento} onChange={e=>set('data_nascimento',e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Sexo</label>
              <select className="form-control" value={form.sexo} onChange={e=>set('sexo',e.target.value)}>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="O">Outro</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input type="email" className="form-control" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Telefone</label>
              <input className="form-control" value={form.telefone} onChange={e=>set('telefone',e.target.value)} placeholder="(11) 99999-0000" />
            </div>
          </div>
        </Card>

        <Card title="Endereço">
          <div className="form-grid">
            <div className="form-group form-full">
              <label className="form-label">Rua</label>
              <input className="form-control" value={form.rua} onChange={e=>set('rua',e.target.value)} placeholder="Rua, Avenida..." />
            </div>
            <div className="form-group">
              <label className="form-label">Número</label>
              <input className="form-control" value={form.numero} onChange={e=>set('numero',e.target.value)} placeholder="123" />
            </div>
            <div className="form-group">
              <label className="form-label">Bairro</label>
              <input className="form-control" value={form.bairro} onChange={e=>set('bairro',e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Cidade</label>
              <input className="form-control" value={form.cidade} onChange={e=>set('cidade',e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Estado</label>
              <input className="form-control" maxLength={2} value={form.estado} onChange={e=>set('estado',e.target.value.toUpperCase())} placeholder="SP" />
            </div>
            <div className="form-group">
              <label className="form-label">CEP</label>
              <input className="form-control" value={form.cep} onChange={e=>set('cep',e.target.value)} placeholder="00000-000" />
            </div>
          </div>
        </Card>

        <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
          <Button variant="secondary" type="button" onClick={()=>navigate('/alunos')}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? '⏳ Salvando...' : '✓ Salvar Aluno'}</Button>
        </div>
      </form>
    </div>
  )
}
