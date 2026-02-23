import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import { Button, Badge, Loading, EmptyState, Pagination, Modal, Alert } from '../../components/ui'

export default function MatriculasLista() {
  const [matriculas, setMatriculas] = useState([])
  const [meta, setMeta]   = useState(null)
  const [page, setPage]   = useState(1)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [alunos, setAlunos] = useState([])
  const [turmas, setTurmas] = useState([])
  const [form, setForm] = useState({ aluno_id:'', turma_id:'', data_matricula: new Date().toISOString().split('T')[0] })

  const fetch = async (p=1) => {
    setLoading(true)
    try {
      const [m,a,t] = await Promise.all([api.get('/matriculas',{params:{page:p}}), api.get('/alunos',{params:{per_page:200}}).catch(()=>({data:{data:[]}})), api.get('/turmas').catch(()=>({data:[]}))])
      setMatriculas(m.data.data||m.data); setMeta(m.data.meta||null)
      setAlunos(a.data.data||a.data); setTurmas(t.data.data||t.data)
    } finally { setLoading(false) }
  }
  useEffect(() => { fetch(page) }, [page])

  const save = async e => {
    e.preventDefault(); setSaving(true); setError('')
    try { await api.post('/matriculas', form); setModal(false); fetch(1) }
    catch(err) { setError(err.response?.data?.message||'Erro ao criar matrícula') }
    finally { setSaving(false) }
  }

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Matrículas</div><div className="page-sub">Gerenciar matrículas dos alunos</div></div>
        <Button onClick={()=>setModal(true)}>+ Nova Matrícula</Button>
      </div>
      <div className="card">
        {loading ? <Loading /> : matriculas.length===0 ? <EmptyState icon="📋" title="Nenhuma matrícula encontrada" /> : (
          <>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Nº Matrícula</th><th>Aluno</th><th>Turma</th><th>Data</th><th>Situação</th></tr></thead>
                <tbody>{matriculas.map(m=>(
                  <tr key={m.id}>
                    <td style={{ fontFamily:'var(--mono)', fontSize:12, fontWeight:700 }}>{m.numero_matricula}</td>
                    <td style={{ fontWeight:500, color:'var(--text-primary)' }}>{m.aluno?.nome||'—'}</td>
                    <td>{m.turma?.nome||'—'}</td>
                    <td style={{ fontSize:12.5 }}>{m.data_matricula ? new Date(m.data_matricula).toLocaleDateString('pt-BR') : '—'}</td>
                    <td><Badge variant={m.situacao==='ativa'?'success':m.situacao==='trancada'?'warning':'secondary'}>{m.situacao}</Badge></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <Pagination meta={meta} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal isOpen={modal} onClose={()=>setModal(false)} title="Nova Matrícula"
        footer={<><Button variant="secondary" onClick={()=>setModal(false)}>Cancelar</Button><Button type="submit" form="formMat" disabled={saving}>{saving?'Salvando...':'Matricular'}</Button></>}>
        {error && <Alert variant="error">{error}</Alert>}
        <form id="formMat" onSubmit={save} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="form-group"><label className="form-label">Aluno</label>
            <select className="form-control" required value={form.aluno_id} onChange={e=>setForm(f=>({...f,aluno_id:e.target.value}))}>
              <option value="">Selecione o aluno...</option>
              {alunos.map(a=><option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Turma</label>
            <select className="form-control" required value={form.turma_id} onChange={e=>setForm(f=>({...f,turma_id:e.target.value}))}>
              <option value="">Selecione a turma...</option>
              {turmas.map(t=><option key={t.id} value={t.id}>{t.nome} — {t.serie?.nome||''}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Data da Matrícula</label>
            <input type="date" className="form-control" required value={form.data_matricula} onChange={e=>setForm(f=>({...f,data_matricula:e.target.value}))} />
          </div>
        </form>
      </Modal>
    </div>
  )
}
