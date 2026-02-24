import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { Button, Badge, Loading, EmptyState, Modal, Alert } from '../../components/ui'

export default function Planos() {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(false)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [form, setForm]       = useState({ nome: '', descricao: '' })
  const navigate = useNavigate()

  const fetch = () => {
    setLoading(true)
    api.get('/planos').then(r => setItems(r.data.data || r.data || [])).catch(()=>setItems([])).finally(()=>setLoading(false))
  }
  useEffect(()=>fetch(),[])

  const save = async e => {
    e.preventDefault(); setSaving(true); setError('')
    try { await api.post('/planos', form); setModal(false); setForm({nome:'',descricao:''}); fetch() }
    catch(err) { setError(err.response?.data?.message || 'Erro ao salvar.') }
    finally { setSaving(false) }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button onClick={()=>navigate('/gestao-geral')} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:13,fontFamily:'var(--font)',marginBottom:6,display:'flex',alignItems:'center',gap:4,padding:0}}>
            ← Gestão Geral
          </button>
          <div className="page-title">Planos de Pagamento</div>
        </div>
        <Button onClick={()=>setModal(true)}>+ Novo</Button>
      </div>

      <div className="card">
        {loading ? <Loading /> : items.length===0 ? (
          <EmptyState icon="📋" title="Nenhum registro encontrado" message="Clique em + Novo para adicionar." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>Nome</th><th>Descrição</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td style={{fontFamily:'var(--mono)',fontSize:12,color:'var(--text-muted)'}}>{item.id}</td>
                    <td style={{fontWeight:600,color:'var(--text-primary)'}}>{item.nome||item.ano||'—'}</td>
                    <td style={{color:'var(--text-muted)',fontSize:13}}>{item.descricao||item.observacao||'—'}</td>
                    <td><Badge variant={item.ativo!==false?'success':'secondary'}>{item.ativo!==false?'Ativo':'Inativo'}</Badge></td>
                    <td><Button variant="ghost" size="sm" title="Editar" style={{ fontSize: 18, lineHeight: 1 }}>✎</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modal} onClose={()=>setModal(false)} title="Novo Registro"
        footer={<><Button variant="secondary" onClick={()=>setModal(false)}>Cancelar</Button><Button type="submit" form="formNew" disabled={saving}>{saving?'Salvando...':'Salvar'}</Button></>}>
        {error && <Alert variant="error">{error}</Alert>}
        <form id="formNew" onSubmit={save} style={{display:'flex',flexDirection:'column',gap:14}}>
          <div className="form-group"><label className="form-label">Nome *</label>
            <input className="form-control" required value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} placeholder="Nome" />
          </div>
          <div className="form-group"><label className="form-label">Descrição</label>
            <textarea className="form-control" rows={3} value={form.descricao} onChange={e=>setForm(f=>({...f,descricao:e.target.value}))} placeholder="Descrição opcional" />
          </div>
        </form>
      </Modal>
    </div>
  )
}
