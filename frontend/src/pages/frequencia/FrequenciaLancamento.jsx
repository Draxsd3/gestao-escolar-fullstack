import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import { useAnoLetivo } from '../../context/AnoLetivoContext'
import { Button, Alert, Loading, Card, Badge } from '../../components/ui'

export default function FrequenciaLancamento() {
  const { labelVigente, periodoAtivo } = useAnoLetivo()
  const [turmas, setTurmas]     = useState([])
  const [turmaId, setTurmaId]   = useState('')
  const [disciplinas, setDisciplinas] = useState([])
  const [disciplinaId, setDisciplinaId] = useState('')
  const [data, setData]         = useState(new Date().toISOString().split('T')[0])
  const [alunos, setAlunos]     = useState([])
  const [presenca, setPresenca] = useState({})
  const [loading, setLoading]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState('')
  const [err, setErr]           = useState('')

  useEffect(() => { api.get('/turmas').then(r=>setTurmas(r.data.data||r.data)).catch(()=>{}) }, [])
  useEffect(() => {
    if (!turmaId) { setDisciplinas([]); return }
    const t = turmas.find(t=>String(t.id)===String(turmaId))
    setDisciplinas(t?.disciplinas||[])
  }, [turmaId, turmas])

  const buscarAlunos = () => {
    if (!turmaId) return
    setLoading(true)
    api.get('/alunos', { params:{ turma_id:turmaId, per_page:200 } })
      .then(r => {
        const list = r.data.data||r.data||[]
        setAlunos(list)
        const p = {}
        list.forEach(a => { p[a.id] = true })
        setPresenca(p)
      }).catch(()=>setAlunos([])).finally(()=>setLoading(false))
  }

  const toggleAll = val => {
    const p = {}; alunos.forEach(a=>{ p[a.id]=val }); setPresenca(p)
  }

  const handleSave = async () => {
    setSaving(true); setMsg(''); setErr('')
    try {
      const frequencias = Object.entries(presenca).map(([aid, pres]) => ({
        aluno_id: Number(aid), presente: !!pres, justificativa: null
      }))
      await api.post('/frequencia/lancar', {
        turma_id: Number(turmaId),
        disciplina_id: disciplinaId ? Number(disciplinaId) : 1,
        data_aula: data,
        numero_aulas: 1,
        conteudo: null,
        frequencias,
      })
      setMsg('Frequência salva com sucesso!')
    } catch(e) { setErr(e.response?.data?.message || 'Erro ao salvar frequência.') }
    finally { setSaving(false) }
  }

  const total = Object.values(presenca).length
  const presentes = Object.values(presenca).filter(Boolean).length

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Lançamento de Frequência</div><div className="page-sub">Registre a presença dos alunos — <strong>{labelVigente}</strong></div></div>
      </div>

      {!periodoAtivo && (
        <Alert variant="error">Nenhum período letivo ativo. Não é possível lançar frequências. Verifique a configuração do ano letivo.</Alert>
      )}

      <Card title="Filtros" style={{ marginBottom:20 }}>
        <div className="form-grid">
          <div className="form-group"><label className="form-label">Turma</label>
            <select className="form-control" value={turmaId} onChange={e=>setTurmaId(e.target.value)}>
              <option value="">Selecione a turma...</option>
              {turmas.map(t=><option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Disciplina (opcional)</label>
            <select className="form-control" value={disciplinaId} onChange={e=>setDisciplinaId(e.target.value)}>
              <option value="">Todas as disciplinas</option>
              {disciplinas.map(d=><option key={d.id} value={d.id}>{d.nome}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Data da Aula</label>
            <input type="date" className="form-control" value={data} onChange={e=>setData(e.target.value)} />
          </div>
          <div className="form-group" style={{ justifyContent:'flex-end' }}>
            <label className="form-label" style={{ opacity:0 }}>.</label>
            <Button onClick={buscarAlunos} disabled={!turmaId||loading}>🔍 Carregar Alunos</Button>
          </div>
        </div>
      </Card>

      {msg && <Alert variant="success" onClose={()=>setMsg('')}>{msg}</Alert>}
      {err && <Alert variant="error" onClose={()=>setErr('')}>{err}</Alert>}

      {loading ? <Loading /> : alunos.length > 0 && (
        <Card title={`Frequência · ${presentes}/${total} presentes`}
          actions={
            <div style={{ display:'flex', gap:8 }}>
              <Button variant="success" size="sm" onClick={()=>toggleAll(true)}>✓ Todos Presentes</Button>
              <Button variant="danger"  size="sm" onClick={()=>toggleAll(false)}>✕ Todos Ausentes</Button>
              <Button onClick={handleSave} disabled={saving}>{saving?'⏳ Salvando...':'💾 Salvar'}</Button>
            </div>
          }>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {alunos.map(a => (
              <div key={a.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:presenca[a.id]?'rgba(34,211,165,.06)':'rgba(244,63,94,.06)', borderRadius:'var(--radius)', border:`1px solid ${presenca[a.id]?'rgba(34,211,165,.2)':'rgba(244,63,94,.2)'}`, transition:'all .15s' }}>
                <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,var(--accent),var(--accent-light))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 }}>{a.nome[0]}</div>
                <span style={{ flex:1, fontWeight:500, color:'var(--text-primary)', fontSize:13.5 }}>{a.nome}</span>
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={()=>setPresenca(p=>({...p,[a.id]:true}))} style={{ padding:'5px 14px', borderRadius:'var(--radius-sm)', border:'1px solid', cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'var(--font)', transition:'all .14s', background:presenca[a.id]?'var(--success)':'transparent', color:presenca[a.id]?'#0a0a12':'var(--success)', borderColor:presenca[a.id]?'var(--success)':'rgba(34,211,165,.4)' }}>✓ Presente</button>
                  <button onClick={()=>setPresenca(p=>({...p,[a.id]:false}))} style={{ padding:'5px 14px', borderRadius:'var(--radius-sm)', border:'1px solid', cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'var(--font)', transition:'all .14s', background:!presenca[a.id]?'var(--danger)':'transparent', color:!presenca[a.id]?'#fff':'var(--danger)', borderColor:!presenca[a.id]?'var(--danger)':'rgba(244,63,94,.4)' }}>✕ Faltou</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:12, padding:'10px 14px', background:'var(--accent-soft)', border:'1px solid var(--accent-border)', borderRadius:'var(--radius)', display:'flex', justifyContent:'space-between', fontSize:12.5 }}>
            <span style={{ color:'var(--text-secondary)' }}>Total: {total} alunos</span>
            <span style={{ color:'var(--success)' }}>✓ {presentes} presentes</span>
            <span style={{ color:'var(--danger)' }}>✕ {total-presentes} faltas</span>
            <span style={{ color:'var(--accent-light)', fontWeight:700 }}>{total>0?Math.round(presentes/total*100):0}% presença</span>
          </div>
        </Card>
      )}
    </div>
  )
}
