import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { Button, Badge, Loading, EmptyState, Modal, Alert } from '../../components/ui'

export default function TurmasLista() {
  const [turmas, setTurmas]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(false)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [series, setSeries]   = useState([])
  const [anos, setAnos]       = useState([])
  const [form, setForm] = useState({ serie_id:'', ano_letivo_id:'', nome:'', turno:'manha', vagas:35, sala:'' })
  const navigate = useNavigate()

  const fetch = async () => {
    setLoading(true)
    try {
      const [t,s,a] = await Promise.all([api.get('/turmas'), api.get('/series').catch(()=>({data:[]})), api.get('/anos-letivos').catch(()=>({data:[]}))])
      setTurmas(t.data.data||t.data)
      setSeries(s.data.data||s.data)
      setAnos(a.data.data||a.data)
    } finally { setLoading(false) }
  }
  useEffect(() => { fetch() }, [])

  const save = async e => {
    e.preventDefault(); setSaving(true); setError('')
    try { await api.post('/turmas', form); setModal(false); fetch() }
    catch(err) { setError(err.response?.data?.message||'Erro ao criar turma') }
    finally { setSaving(false) }
  }

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Turmas</div><div className="page-sub">Gerenciar turmas e grade curricular</div></div>
        <Button onClick={()=>setModal(true)}>+ Nova Turma</Button>
      </div>

      {loading ? <Loading /> : turmas.length===0 ? <div className="card"><EmptyState icon="🏫" title="Nenhuma turma cadastrada" /></div> : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Turma</th><th>Série</th><th>Turno</th><th>Vagas</th><th>Sala</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {turmas.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontWeight:700, color:'var(--text-primary)', fontFamily:'var(--mono)' }}>{t.nome}</td>
                    <td>{t.serie?.nome||'—'}</td>
                    <td><Badge variant="info">{t.turno}</Badge></td>
                    <td style={{ fontFamily:'var(--mono)' }}>{t.vagas}</td>
                    <td>{t.sala||'—'}</td>
                    <td><Badge variant={t.ativa!==false?'success':'secondary'}>{t.ativa!==false?'Ativa':'Inativa'}</Badge></td>
                    <td><Button variant="ghost" size="sm" onClick={()=>navigate(`/turmas/${t.id}`)}>👁 Ver</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modal} onClose={()=>setModal(false)} title="Nova Turma"
        footer={<><Button variant="secondary" onClick={()=>setModal(false)}>Cancelar</Button><Button type="submit" form="formTurma" disabled={saving}>{saving?'Salvando...':'Criar Turma'}</Button></>}>
        {error && <Alert variant="error">{error}</Alert>}
        <form id="formTurma" onSubmit={save} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">Série</label>
              <select className="form-control" required value={form.serie_id} onChange={e=>setForm(f=>({...f,serie_id:e.target.value}))}>
                <option value="">Selecione...</option>
                {series.map(s=><option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Ano Letivo</label>
              <select className="form-control" required value={form.ano_letivo_id} onChange={e=>setForm(f=>({...f,ano_letivo_id:e.target.value}))}>
                <option value="">Selecione...</option>
                {anos.map(a=><option key={a.id} value={a.id}>{a.ano}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Nome da Turma</label>
              <input className="form-control" required value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} placeholder="Ex: 6A" />
            </div>
            <div className="form-group"><label className="form-label">Turno</label>
              <select className="form-control" value={form.turno} onChange={e=>setForm(f=>({...f,turno:e.target.value}))}>
                <option value="manha">Manhã</option><option value="tarde">Tarde</option><option value="noite">Noite</option>
              </select>
            </div>
            <div className="form-group"><label className="form-label">Vagas</label>
              <input type="number" className="form-control" value={form.vagas} onChange={e=>setForm(f=>({...f,vagas:e.target.value}))} />
            </div>
            <div className="form-group"><label className="form-label">Sala</label>
              <input className="form-control" value={form.sala} onChange={e=>setForm(f=>({...f,sala:e.target.value}))} placeholder="Ex: Sala 101" />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
