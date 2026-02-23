import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import { Button, Badge, Loading, EmptyState, Modal, Alert } from '../../components/ui'

export default function ComunicadosLista() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ titulo:'', corpo:'', publico_alvo:'todos', publicado:true })

  const fetch = () => { setLoading(true); api.get('/comunicados').then(r=>setItems(r.data.data||r.data||[])).finally(()=>setLoading(false)) }
  useEffect(()=>fetch(),[])

  const save = async e => {
    e.preventDefault(); setSaving(true); setError('')
    try { await api.post('/comunicados', form); setModal(false); fetch() }
    catch(err) { setError(err.response?.data?.message||'Erro ao criar comunicado') }
    finally { setSaving(false) }
  }

  const ALVO_VAR = { todos:'primary', alunos:'info', responsaveis:'warning', professores:'success', funcionarios:'secondary' }

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Comunicados</div><div className="page-sub">Publicar e gerenciar comunicados</div></div>
        <Button onClick={()=>setModal(true)}>+ Novo Comunicado</Button>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {loading ? <Loading /> : items.length===0 ? <div className="card"><EmptyState icon="📢" title="Nenhum comunicado" /></div> : (
          items.map(c=>(
            <div key={c.id} className="card" style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
              <div style={{ width:44, height:44, borderRadius:'var(--radius)', background:'var(--accent-soft)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>📢</div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                  <span style={{ fontWeight:700, color:'var(--text-primary)', fontSize:14.5 }}>{c.titulo}</span>
                  <Badge variant={ALVO_VAR[c.publico_alvo]||'secondary'}>{c.publico_alvo}</Badge>
                  <Badge variant={c.publicado?'success':'secondary'}>{c.publicado?'Publicado':'Rascunho'}</Badge>
                </div>
                <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6, marginBottom:4 }}>{c.corpo}</p>
                <span style={{ fontSize:11.5, color:'var(--text-muted)', fontFamily:'var(--mono)' }}>{c.publicado_em ? new Date(c.publicado_em).toLocaleString('pt-BR') : '—'} · por {c.autor?.nome||'—'}</span>
              </div>
            </div>
          ))
        )}
      </div>
      <Modal isOpen={modal} onClose={()=>setModal(false)} title="Novo Comunicado"
        footer={<><Button variant="secondary" onClick={()=>setModal(false)}>Cancelar</Button><Button type="submit" form="formCom" disabled={saving}>{saving?'Publicando...':'📢 Publicar'}</Button></>}>
        {error && <Alert variant="error">{error}</Alert>}
        <form id="formCom" onSubmit={save} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="form-group"><label className="form-label">Título</label>
            <input className="form-control" required value={form.titulo} onChange={e=>setForm(f=>({...f,titulo:e.target.value}))} placeholder="Título do comunicado" />
          </div>
          <div className="form-group"><label className="form-label">Público-alvo</label>
            <select className="form-control" value={form.publico_alvo} onChange={e=>setForm(f=>({...f,publico_alvo:e.target.value}))}>
              <option value="todos">Todos</option><option value="alunos">Alunos</option><option value="responsaveis">Responsáveis</option><option value="professores">Professores</option><option value="funcionarios">Funcionários</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">Mensagem</label>
            <textarea className="form-control" required rows={5} value={form.corpo} onChange={e=>setForm(f=>({...f,corpo:e.target.value}))} placeholder="Digite o conteúdo do comunicado..." />
          </div>
        </form>
      </Modal>
    </div>
  )
}
