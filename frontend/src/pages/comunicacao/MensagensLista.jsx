import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { Button, Loading, EmptyState, Modal } from '../../components/ui'

export default function MensagensLista() {
  const { usuario } = useAuth()
  const [msgs, setMsgs]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm]   = useState({ destinatario_id:'', assunto:'', corpo:'' })
  const [users, setUsers] = useState([])

  const fetch = () => { setLoading(true); api.get('/mensagens').then(r=>setMsgs(r.data.data||r.data||[])).finally(()=>setLoading(false)) }
  useEffect(()=>{ fetch(); api.get('/usuarios-lista').catch(()=>({data:[]})).then(r=>setUsers(r.data.data||r.data||[])) },[])

  const marcarLida = async id => { await api.patch(`/mensagens/${id}/lida`).catch(()=>{}); fetch() }

  const save = async e => {
    e.preventDefault(); setSaving(true)
    try { await api.post('/mensagens', form); setModal(false); fetch() }
    catch {} finally { setSaving(false) }
  }

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Mensagens</div><div className="page-sub">Caixa de entrada e envio de mensagens</div></div>
        <Button onClick={()=>setModal(true)}>+ Nova Mensagem</Button>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {loading ? <Loading /> : msgs.length===0 ? <div className="card"><EmptyState icon="💬" title="Caixa vazia" message="Nenhuma mensagem recebida." /></div> : (
          msgs.map(m=>(
            <div key={m.id} onClick={()=>!m.lida&&marcarLida(m.id)} className="card" style={{ display:'flex', gap:14, alignItems:'flex-start', cursor:!m.lida?'pointer':'default', borderColor: !m.lida?'var(--accent-border)':'var(--border)', opacity: m.lida?.8:1 }}>
              <div style={{ width:38, height:38, borderRadius:'50%', background:`linear-gradient(135deg,var(--accent),var(--accent-light))`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#fff', flexShrink:0 }}>{m.remetente?.nome?.[0]||'?'}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:2 }}>
                  <span style={{ fontWeight: m.lida?500:700, color:'var(--text-primary)', fontSize:13.5 }}>{m.assunto}</span>
                  <span style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--mono)' }}>{m.criado_em ? new Date(m.criado_em).toLocaleDateString('pt-BR') : ''}</span>
                </div>
                <div style={{ fontSize:12.5, color:'var(--text-muted)', marginBottom:2 }}>De: {m.remetente?.nome||'—'}</div>
                <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.5 }}>{m.corpo?.substring(0,120)}{m.corpo?.length>120?'...':''}</p>
              </div>
              {!m.lida && <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--accent)', flexShrink:0, marginTop:6 }}/>}
            </div>
          ))
        )}
      </div>
      <Modal isOpen={modal} onClose={()=>setModal(false)} title="Nova Mensagem"
        footer={<><Button variant="secondary" onClick={()=>setModal(false)}>Cancelar</Button><Button type="submit" form="formMsg" disabled={saving}>{saving?'Enviando...':'✉ Enviar'}</Button></>}>
        <form id="formMsg" onSubmit={save} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="form-group"><label className="form-label">Para</label>
            <select className="form-control" required value={form.destinatario_id} onChange={e=>setForm(f=>({...f,destinatario_id:e.target.value}))}>
              <option value="">Selecione...</option>
              {users.filter(u=>u.id!==usuario?.id).map(u=><option key={u.id} value={u.id}>{u.nome}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Assunto</label>
            <input className="form-control" required value={form.assunto} onChange={e=>setForm(f=>({...f,assunto:e.target.value}))} />
          </div>
          <div className="form-group"><label className="form-label">Mensagem</label>
            <textarea className="form-control" required rows={5} value={form.corpo} onChange={e=>setForm(f=>({...f,corpo:e.target.value}))} />
          </div>
        </form>
      </Modal>
    </div>
  )
}
