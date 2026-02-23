import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import { Button, Alert, Loading, Card, Badge } from '../../components/ui'

export default function NotasLancamento() {
  const [turmas, setTurmas]   = useState([])
  const [turmaId, setTurmaId] = useState('')
  const [disciplinas, setDisciplinas] = useState([])
  const [disciplinaId, setDisciplinaId] = useState('')
  const [periodos, setPeriodos] = useState([])
  const [periodoId, setPeriodoId] = useState('')
  const [alunos, setAlunos]   = useState([])
  const [notas, setNotas]     = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState('')
  const [err, setErr]         = useState('')

  useEffect(() => {
    api.get('/turmas').then(r=>setTurmas(r.data.data||r.data)).catch(()=>{})
    api.get('/periodos-avaliacao').then(r=>setPeriodos(r.data.data||r.data)).catch(()=>{})
  }, [])

  useEffect(() => {
    if (!turmaId) { setDisciplinas([]); return }
    const t = turmas.find(t=>String(t.id)===String(turmaId))
    setDisciplinas(t?.disciplinas||[])
  }, [turmaId, turmas])

  useEffect(() => {
    if (!turmaId||!disciplinaId||!periodoId) { setAlunos([]); return }
    setLoading(true)
    api.get('/notas', { params:{ turma_id:turmaId, disciplina_id:disciplinaId, periodo_id:periodoId } })
      .then(r => {
        const data = r.data.alunos||r.data||[]
        setAlunos(data)
        const n = {}
        data.forEach(a => { n[a.id] = a.nota?.valor ?? '' })
        setNotas(n)
      }).catch(()=>setAlunos([])).finally(()=>setLoading(false))
  }, [turmaId, disciplinaId, periodoId])

  const handleSave = async () => {
    setSaving(true); setMsg(''); setErr('')
    try {
      await api.post('/notas/lancar', { turma_id:turmaId, disciplina_id:disciplinaId, periodo_id:periodoId, notas })
      setMsg('Notas salvas com sucesso!')
    } catch { setErr('Erro ao salvar notas.') }
    finally { setSaving(false) }
  }

  const getColor = v => { const n=parseFloat(v); if(isNaN(n)) return 'var(--text-muted)'; return n>=7?'var(--success)':n>=5?'var(--warning)':'var(--danger)' }

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Lançamento de Notas</div><div className="page-sub">Selecione turma, disciplina e período para lançar</div></div>
      </div>

      <Card title="Filtros" style={{ marginBottom:20 }}>
        <div className="form-grid cols-3">
          <div className="form-group"><label className="form-label">Turma</label>
            <select className="form-control" value={turmaId} onChange={e=>setTurmaId(e.target.value)}>
              <option value="">Selecione a turma...</option>
              {turmas.map(t=><option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Disciplina</label>
            <select className="form-control" value={disciplinaId} onChange={e=>setDisciplinaId(e.target.value)} disabled={!turmaId||!disciplinas.length}>
              <option value="">Selecione a disciplina...</option>
              {disciplinas.map(d=><option key={d.id} value={d.id}>{d.nome}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Período</label>
            <select className="form-control" value={periodoId} onChange={e=>setPeriodoId(e.target.value)}>
              <option value="">Selecione o período...</option>
              {periodos.map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {msg && <Alert variant="success" onClose={()=>setMsg('')}>{msg}</Alert>}
      {err && <Alert variant="error" onClose={()=>setErr('')}>{err}</Alert>}

      {loading ? <Loading /> : alunos.length > 0 && (
        <Card title={`Notas · ${alunos.length} aluno(s)`} actions={<Button onClick={handleSave} disabled={saving}>{saving?'⏳ Salvando...':'💾 Salvar'}</Button>}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>Aluno</th><th>Nota (0–10)</th><th>Status</th></tr></thead>
              <tbody>{alunos.map(a => (
                <tr key={a.id}>
                  <td style={{ fontFamily:'var(--mono)', fontSize:12, color:'var(--text-muted)' }}>{a.id}</td>
                  <td style={{ fontWeight:500, color:'var(--text-primary)' }}>{a.nome}</td>
                  <td>
                    <input
                      type="number" min="0" max="10" step="0.1"
                      className="form-control"
                      style={{ maxWidth:90, textAlign:'center', fontFamily:'var(--mono)', fontWeight:700, fontSize:15, color: getColor(notas[a.id]) }}
                      value={notas[a.id]??''}
                      onChange={e => setNotas(n=>({...n,[a.id]:e.target.value}))}
                      placeholder="—"
                    />
                  </td>
                  <td>
                    {notas[a.id]!=='' && notas[a.id]!==undefined && (
                      <Badge variant={parseFloat(notas[a.id])>=7?'success':parseFloat(notas[a.id])>=5?'warning':'danger'}>
                        {parseFloat(notas[a.id])>=7?'Aprovado':parseFloat(notas[a.id])>=5?'Recuperação':'Reprovado'}
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Card>
      )}
      {!loading && turmaId && disciplinaId && periodoId && alunos.length===0 && (
        <div className="card" style={{ textAlign:'center', color:'var(--text-muted)', padding:40 }}>Nenhum aluno encontrado para esta seleção.</div>
      )}
    </div>
  )
}
