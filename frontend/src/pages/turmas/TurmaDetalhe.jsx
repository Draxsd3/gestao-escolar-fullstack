import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { Button, Badge, Loading, Card } from '../../components/ui'

export default function TurmaDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [turma, setTurma]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]       = useState('alunos')

  useEffect(() => {
    api.get(`/turmas/${id}`).then(r=>setTurma(r.data)).finally(()=>setLoading(false))
  }, [id])

  if (loading) return <Loading />
  if (!turma) return <div style={{ color:'var(--text-muted)', padding:40, textAlign:'center' }}>Turma não encontrada.</div>

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Turma {turma.nome}</div>
          <div className="page-sub">{turma.serie?.nome} · {turma.ano_letivo?.ano} · Turno {turma.turno}</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Button variant="secondary" onClick={()=>navigate('/turmas')}>← Voltar</Button>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom:20 }}>
        {[['Vagas Total',turma.vagas||'—','🪑'],['Turno',turma.turno,'🕐'],['Sala',turma.sala||'—','🚪'],['Status',turma.ativa!==false?'Ativa':'Inativa','⬡']].map(([l,v,ic]) => (
          <div key={l} className="stat-card">
            <div className="stat-icon" style={{ background:'var(--accent-soft)' }}>{ic}</div>
            <div className="stat-value" style={{ fontSize:18 }}>{v}</div>
            <div className="stat-label">{l}</div>
          </div>
        ))}
      </div>

      <div className="tabs">
        {[['alunos','🎓 Alunos'],['disciplinas','📚 Disciplinas'],['horarios','🕐 Horários']].map(([k,l]) => (
          <button key={k} className={`tab-btn ${tab===k?'active':''}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {tab==='alunos' && (
        <Card title="Alunos Matriculados" actions={<Button size="sm" onClick={()=>navigate('/matriculas')}>+ Matricular</Button>}>
          {turma.matriculas?.length ? (
            <div className="table-wrap"><table>
              <thead><tr><th>Aluno</th><th>Matrícula</th><th>Situação</th></tr></thead>
              <tbody>{turma.matriculas.map(m=>(
                <tr key={m.id}>
                  <td style={{ fontWeight:500 }}>{m.aluno?.nome}</td>
                  <td style={{ fontFamily:'var(--mono)', fontSize:12 }}>{m.numero_matricula}</td>
                  <td><Badge variant={m.situacao==='ativa'?'success':'secondary'}>{m.situacao}</Badge></td>
                </tr>
              ))}</tbody>
            </table></div>
          ) : <div style={{ color:'var(--text-muted)', fontSize:13, padding:'10px 0' }}>Nenhum aluno matriculado.</div>}
        </Card>
      )}
      {tab==='disciplinas' && (
        <Card title="Grade Curricular">
          {turma.disciplinas?.length ? (
            <div className="table-wrap"><table>
              <thead><tr><th>Disciplina</th><th>Código</th><th>Aulas/Semana</th></tr></thead>
              <tbody>{turma.disciplinas.map(d=>(
                <tr key={d.id}>
                  <td style={{ fontWeight:500 }}>{d.nome}</td>
                  <td><Badge variant="secondary">{d.codigo}</Badge></td>
                  <td style={{ fontFamily:'var(--mono)' }}>{d.pivot?.aulas_semanais||'—'}</td>
                </tr>
              ))}</tbody>
            </table></div>
          ) : <div style={{ color:'var(--text-muted)', fontSize:13, padding:'10px 0' }}>Nenhuma disciplina na grade.</div>}
        </Card>
      )}
      {tab==='horarios' && (
        <Card title="Horários de Aula">
          <div style={{ color:'var(--text-muted)', fontSize:13 }}>Horários serão exibidos aqui.</div>
        </Card>
      )}
    </div>
  )
}
