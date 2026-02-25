import React, { useState, useEffect, useRef } from 'react'
import api from '../../services/api'
import { Loading, Card, Badge, Button, Alert } from '../../components/ui'

/* ── Modal base ───────────────────────────────────────────── */
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
      <div style={{ background:'var(--bg-card)', borderRadius:'var(--radius-lg)', padding:28, width:'100%', maxWidth:540, boxShadow:'0 20px 60px rgba(0,0,0,.25)', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>{title}</div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'var(--text-muted)', lineHeight:1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ── Modal de entregas (alunos que entregaram) ────────────── */
function ModalEntregas({ tarefa, onClose }) {
  const [entregas, setEntregas] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    api.get(`/tarefas/${tarefa.id}`)
      .then(r => setEntregas(r.data.entregas || []))
      .finally(() => setLoading(false))
  }, [tarefa.id])

  return (
    <Modal title={`Entregas — ${tarefa.titulo}`} onClose={onClose}>
      {loading ? <Loading /> : (
        entregas.length === 0 ? (
          <div style={{ textAlign:'center', padding:'30px 0', color:'var(--text-muted)', fontSize:13 }}>
            Nenhum aluno entregou esta tarefa ainda.
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {entregas.map(e => (
              <div key={e.id} style={{ padding:'12px 14px', background:'var(--bg-input)', borderRadius:'var(--radius)', border:'1px solid var(--border-light)', display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:34, height:34, borderRadius:'50%', background:'rgba(26,109,212,.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>👤</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:13, color:'var(--text-primary)' }}>{e.aluno?.nome || `Aluno #${e.aluno_id}`}</div>
                  {e.entregue_em && <div style={{ fontSize:11.5, color:'var(--text-muted)' }}>Entregue em: {new Date(e.entregue_em).toLocaleString('pt-BR')}</div>}
                  {e.observacao  && <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:3 }}>{e.observacao}</div>}
                </div>
                <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                  <Badge variant="success">Entregue</Badge>
                  {e.arquivo_url && (
                    <a href={e.arquivo_url} target="_blank" rel="noreferrer"
                      style={{ padding:'4px 10px', borderRadius:6, background:'rgba(26,109,212,.1)', color:'var(--accent)', fontSize:12, textDecoration:'none', fontWeight:500 }}>
                      📎 Arquivo
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </Modal>
  )
}

/* ── Componente principal ─────────────────────────────────── */
export default function TarefasProfessor() {
  const [tarefas, setTarefas]   = useState([])
  const [turmas, setTurmas]     = useState([])
  const [disciplinas, setDiscs] = useState([])
  const [loading, setLoading]   = useState(true)
  const [modalNova, setModalNova]       = useState(false)
  const [tarefaEntregas, setTarefaEnt] = useState(null)
  const [erro, setErro]         = useState('')
  const [salvando, setSalvando] = useState(false)
  const fileRef = useRef()

  const [form, setForm] = useState({
    titulo: '', descricao: '', turma_id: '', disciplina_id: '', data_entrega: ''
  })
  const [arquivo, setArquivo] = useState(null)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    Promise.all([
      api.get('/tarefas'),
      api.get('/turmas'),
      api.get('/disciplinas'),
    ]).then(([t, tu, d]) => {
      setTarefas(t.data)
      setTurmas(tu.data?.data || tu.data || [])
      setDiscs(d.data || [])
    }).finally(() => setLoading(false))
  }, [])

  const abrirNova = () => {
    setForm({ titulo: '', descricao: '', turma_id: '', disciplina_id: '', data_entrega: '' })
    setArquivo(null)
    setErro('')
    setModalNova(true)
  }

  const handleSalvar = async () => {
    if (!form.titulo || !form.turma_id || !form.data_entrega) {
      setErro('Preencha os campos obrigatórios: título, turma e data de entrega.')
      return
    }
    setSalvando(true); setErro('')
    try {
      const fd = new FormData()
      fd.append('titulo', form.titulo)
      if (form.descricao)     fd.append('descricao', form.descricao)
      fd.append('turma_id',   form.turma_id)
      if (form.disciplina_id) fd.append('disciplina_id', form.disciplina_id)
      fd.append('data_entrega', form.data_entrega)
      if (arquivo)            fd.append('arquivo', arquivo)

      const res = await api.post('/tarefas', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setTarefas(ts => [res.data, ...ts])
      setModalNova(false)
    } catch (err) {
      const detail = err.response?.data
      setErro(detail?.message || (detail?.errors ? Object.values(detail.errors).flat().join('. ') : 'Erro ao criar tarefa.'))
    } finally { setSalvando(false) }
  }

  if (loading) return <Loading />

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Tarefas</div>
          <div className="page-sub">Crie e gerencie tarefas para suas turmas</div>
        </div>
        <Button onClick={abrirNova}>+ Nova Tarefa</Button>
      </div>

      {tarefas.length === 0 ? (
        <Card>
          <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-muted)' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
            <div style={{ fontWeight:600, fontSize:14, color:'var(--text-secondary)', marginBottom:6 }}>Nenhuma tarefa criada</div>
            <div style={{ fontSize:13, marginBottom:20 }}>Clique em "Nova Tarefa" para começar.</div>
            <Button onClick={abrirNova}>+ Nova Tarefa</Button>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ textAlign:'left' }}>Título</th>
                  <th>Turma</th>
                  <th>Disciplina</th>
                  <th>Entrega</th>
                  <th>Entregas</th>
                  <th>Material</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tarefas.map(t => {
                  const vencida = new Date(t.data_entrega) < new Date(new Date().toDateString())
                  return (
                    <tr key={t.id}>
                      <td style={{ fontWeight:600, color:'var(--text-primary)' }}>{t.titulo}</td>
                      <td style={{ fontSize:13, color:'var(--text-secondary)' }}>{t.turma?.nome || '—'}</td>
                      <td style={{ fontSize:13, color:'var(--text-secondary)' }}>{t.disciplina?.nome || '—'}</td>
                      <td style={{ fontFamily:'var(--mono)', fontSize:13, color: vencida ? 'var(--danger)' : 'var(--text-primary)' }}>
                        {t.data_entrega ? new Date(t.data_entrega + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td style={{ textAlign:'center' }}>
                        <Badge variant={t.entregas_count > 0 ? 'success' : 'secondary'}>
                          {t.entregas_count ?? 0}
                        </Badge>
                      </td>
                      <td style={{ textAlign:'center' }}>
                        {t.arquivo_url
                          ? <a href={t.arquivo_url} target="_blank" rel="noreferrer" style={{ color:'var(--accent)', fontSize:13 }}>📄 PDF</a>
                          : <span style={{ color:'var(--text-muted)', fontSize:12 }}>—</span>}
                      </td>
                      <td>
                        <button onClick={() => setTarefaEnt(t)}
                          style={{ padding:'5px 12px', borderRadius:'var(--radius)', border:'1px solid var(--border)', background:'var(--bg-input)', cursor:'pointer', fontSize:12.5, color:'var(--text-secondary)' }}>
                          Ver entregas
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal: Nova Tarefa */}
      {modalNova && (
        <Modal title="Nova Tarefa" onClose={() => setModalNova(false)}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="form-group">
              <label className="form-label">Título *</label>
              <input className="form-control" value={form.titulo} onChange={set('titulo')} placeholder="Ex: Exercícios de álgebra" />
            </div>

            <div className="form-group">
              <label className="form-label">Descrição</label>
              <textarea className="form-control" rows={3} value={form.descricao} onChange={set('descricao')} placeholder="Instruções, referências..." style={{ resize:'vertical' }} />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div className="form-group">
                <label className="form-label">Turma *</label>
                <select className="form-control" value={form.turma_id} onChange={set('turma_id')}>
                  <option value="">Selecione</option>
                  {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Disciplina</label>
                <select className="form-control" value={form.disciplina_id} onChange={set('disciplina_id')}>
                  <option value="">Todas / nenhuma</option>
                  {disciplinas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Data de entrega *</label>
              <input type="date" className="form-control" value={form.data_entrega} onChange={set('data_entrega')} />
            </div>

            <div className="form-group">
              <label className="form-label">Anexar material (PDF, doc, imagem — opcional)</label>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <input type="file" ref={fileRef} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" style={{ display:'none' }} onChange={e => setArquivo(e.target.files[0] || null)} />
                <button type="button" onClick={() => fileRef.current.click()}
                  style={{ padding:'7px 14px', borderRadius:'var(--radius)', border:'1px solid var(--border)', background:'var(--bg-input)', cursor:'pointer', fontSize:13, color:'var(--text-secondary)' }}>
                  📎 {arquivo ? arquivo.name : 'Escolher arquivo'}
                </button>
                {arquivo && (
                  <button type="button" onClick={() => { setArquivo(null); fileRef.current.value = '' }}
                    style={{ background:'none', border:'none', cursor:'pointer', color:'var(--danger)', fontSize:13 }}>
                    × Remover
                  </button>
                )}
              </div>
            </div>

            {erro && (
              <div style={{ padding:'10px 12px', background:'rgba(220,38,38,.08)', border:'1px solid rgba(220,38,38,.2)', borderRadius:'var(--radius)', fontSize:13, color:'var(--danger)' }}>
                ⚠ {erro}
              </div>
            )}

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
              <Button variant="secondary" onClick={() => setModalNova(false)}>Cancelar</Button>
              <Button onClick={handleSalvar} disabled={salvando}>
                {salvando ? '⏳ Salvando...' : '✓ Criar Tarefa'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Ver Entregas */}
      {tarefaEntregas && (
        <ModalEntregas tarefa={tarefaEntregas} onClose={() => setTarefaEnt(null)} />
      )}
    </div>
  )
}
