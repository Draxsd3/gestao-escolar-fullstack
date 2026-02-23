import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import { Loading, Card, Badge, Button, EmptyState } from '../../components/ui'

export default function FrequenciaRelatorio() {
  const [turmas, setTurmas]     = useState([])
  const [turmaId, setTurmaId]   = useState('')
  const [relatorio, setRelatorio] = useState([])
  const [loading, setLoading]   = useState(false)

  useEffect(() => { api.get('/turmas').then(r=>setTurmas(r.data.data||r.data)).catch(()=>{}) }, [])

  const buscar = () => {
    if (!turmaId) return
    setLoading(true)
    api.get('/frequencia/relatorio', { params:{ turma_id:turmaId } })
      .then(r=>setRelatorio(r.data.data||r.data||[]))
      .catch(()=>setRelatorio([]))
      .finally(()=>setLoading(false))
  }

  const cor = pct => pct>=75?'var(--success)':pct>=60?'var(--warning)':'var(--danger)'

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Relatório de Frequência</div><div className="page-sub">Acompanhe a frequência por turma</div></div>
      </div>
      <Card title="Filtros" style={{ marginBottom:20 }}>
        <div style={{ display:'flex', gap:12, alignItems:'flex-end' }}>
          <div className="form-group" style={{ flex:1 }}><label className="form-label">Turma</label>
            <select className="form-control" value={turmaId} onChange={e=>setTurmaId(e.target.value)}>
              <option value="">Selecione a turma...</option>
              {turmas.map(t=><option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>
          <Button onClick={buscar} disabled={!turmaId||loading}>🔍 Gerar Relatório</Button>
        </div>
      </Card>
      {loading ? <Loading /> : relatorio.length > 0 ? (
        <Card title={`Resultado · ${relatorio.length} aluno(s)`}>
          <div className="table-wrap"><table>
            <thead><tr><th>Aluno</th><th>Aulas Dadas</th><th>Presências</th><th>Faltas</th><th>% Presença</th><th>Situação</th></tr></thead>
            <tbody>{relatorio.map((r,i) => (
              <tr key={i}>
                <td style={{ fontWeight:500, color:'var(--text-primary)' }}>{r.aluno}</td>
                <td style={{ fontFamily:'var(--mono)' }}>{r.total_aulas}</td>
                <td style={{ fontFamily:'var(--mono)', color:'var(--success)' }}>{r.presencas}</td>
                <td style={{ fontFamily:'var(--mono)', color:'var(--danger)' }}>{r.faltas}</td>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div className="progress-bar" style={{ width:60 }}>
                      <div className="progress-fill" style={{ width:`${r.percentual}%`, background:cor(r.percentual) }}/>
                    </div>
                    <span style={{ fontFamily:'var(--mono)', fontSize:12, fontWeight:700, color:cor(r.percentual) }}>{r.percentual}%</span>
                  </div>
                </td>
                <td><Badge variant={r.percentual>=75?'success':r.percentual>=60?'warning':'danger'}>{r.percentual>=75?'Regular':r.percentual>=60?'Atenção':'Crítico'}</Badge></td>
              </tr>
            ))}</tbody>
          </table></div>
        </Card>
      ) : turmaId && !loading ? <div className="card"><EmptyState icon="📊" title="Nenhum dado de frequência" message="Não há registros para esta turma." /></div> : null}
    </div>
  )
}
