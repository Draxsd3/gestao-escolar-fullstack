import React, { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import { Loading, Card, Badge, Button, EmptyState } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'

const corPercentual = (pct) => (pct >= 75 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--danger)')
const statusPercentual = (pct) => (pct >= 75 ? 'Regular' : pct >= 60 ? 'Atencao' : 'Critico')
const badgePercentual = (pct) => (pct >= 75 ? 'success' : pct >= 60 ? 'warning' : 'danger')

function formatarData(dataISO) {
  if (!dataISO) return '-'
  const [ano, mes, dia] = String(dataISO).split('-')
  return `${dia}/${mes}/${ano}`
}

export default function FrequenciaRelatorio() {
  const { isPerfil } = useAuth()
  const isAdmin = isPerfil('admin')
  const [turmas, setTurmas] = useState([])
  const [disciplinasTurma, setDisciplinasTurma] = useState([])
  const [turmaId, setTurmaId] = useState('')
  const [disciplinaId, setDisciplinaId] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [loading, setLoading] = useState(false)
  const [historico, setHistorico] = useState(null)
  const [aulaAberta, setAulaAberta] = useState(null)

  useEffect(() => {
    api.get('/turmas')
      .then((r) => setTurmas(r.data.data || r.data || []))
      .catch(() => setTurmas([]))
  }, [])

  const turmaSelecionada = useMemo(
    () => turmas.find((t) => String(t.id) === String(turmaId)),
    [turmas, turmaId]
  )
  const disciplinas = disciplinasTurma

  useEffect(() => {
    if (!turmaId) {
      setDisciplinasTurma([])
      setDisciplinaId('')
      return
    }

    api.get(`/turmas/${turmaId}`)
      .then((r) => setDisciplinasTurma(r.data?.disciplinas || []))
      .catch(() => setDisciplinasTurma([]))
  }, [turmaId])

  const buscar = () => {
    if (!isAdmin && !turmaId) return
    setLoading(true)
    const params = {}
    if (turmaId) params.turma_id = turmaId
    if (disciplinaId) params.disciplina_id = disciplinaId
    if (dataInicio) params.data_inicio = dataInicio
    if (dataFim) params.data_fim = dataFim

    api.get('/frequencia/historico', { params })
      .then((r) => {
        const payload = r.data.data || r.data
        setHistorico(payload)
        setAulaAberta(payload?.aulas?.[0]?.aula_id || null)
      })
      .catch(() => {
        setHistorico(null)
        setAulaAberta(null)
      })
      .finally(() => setLoading(false))
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Historico de Frequencias</div>
          <div className="page-sub">Analise todo o historico de lancamentos por turma e sala</div>
        </div>
      </div>

      <Card title="Filtros" style={{ marginBottom: 20 }}>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Turma / Sala</label>
            <select className="form-control" value={turmaId} onChange={(e) => setTurmaId(e.target.value)}>
              <option value="">{isAdmin ? 'Todas as turmas' : 'Selecione...'}</option>
              {turmas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome} {t.sala ? `- Sala ${t.sala}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Disciplina (opcional)</label>
            <select className="form-control" value={disciplinaId} onChange={(e) => setDisciplinaId(e.target.value)} disabled={!turmaId}>
              <option value="">Todas</option>
              {disciplinas.map((d) => (
                <option key={d.id} value={d.id}>{d.nome}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Data inicio</label>
            <input type="date" className="form-control" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Data fim</label>
            <input type="date" className="form-control" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          </div>

          <div className="form-group" style={{ alignSelf: 'end' }}>
            <Button onClick={buscar} disabled={(!isAdmin && !turmaId) || loading}>Atualizar Historico</Button>
          </div>
        </div>
      </Card>

      {loading && <Loading message="Buscando historico de frequencia..." />}

      {!loading && historico?.resumo && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
          <Card>
            <div className="stat-label">Turma</div>
            <div className="stat-value" style={{ fontSize: 20 }}>{historico?.turma?.nome || 'Todas as turmas'}</div>
            <div className="stat-sub">
              {historico?.turma?.sala ? `Sala ${historico.turma.sala}` : (historico?.turma ? 'Sem sala' : 'Visao administrativa geral')}
            </div>
          </Card>
          <Card>
            <div className="stat-label">Aulas lancadas</div>
            <div className="stat-value" style={{ fontSize: 20 }}>{historico.resumo.total_aulas}</div>
          </Card>
          <Card>
            <div className="stat-label">Aulas dadas (slots)</div>
            <div className="stat-value" style={{ fontSize: 20 }}>{historico.resumo.total_aulas_lancadas ?? '-'}</div>
          </Card>
          <Card>
            <div className="stat-label">Registros</div>
            <div className="stat-value" style={{ fontSize: 20 }}>{historico.resumo.total_registros}</div>
          </Card>
          <Card>
            <div className="stat-label">% Presenca geral</div>
            <div className="stat-value" style={{ fontSize: 20, color: corPercentual(historico.resumo.percentual_geral) }}>
              {historico.resumo.percentual_geral}%
            </div>
          </Card>
        </div>
      )}

      {!loading && historico?.aulas?.length > 0 && (
        <Card title={`Linha do tempo das aulas (${historico.aulas.length})`} style={{ marginBottom: 20 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  {!historico?.turma && <th>Turma / Sala</th>}
                  <th>Disciplina</th>
                  <th>Presencas (aulas)</th>
                  <th>Faltas (aulas)</th>
                  <th>% Presenca</th>
                  <th>Detalhe</th>
                </tr>
              </thead>
              <tbody>
                {historico.aulas.map((aula) => (
                  <tr key={aula.aula_id}>
                    <td>{formatarData(aula.data_aula)}</td>
                    {!historico?.turma && <td>{aula.turma || '-'} {aula.sala ? `- Sala ${aula.sala}` : ''}</td>}
                    <td>{aula.disciplina || '-'}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 700 }}>{aula.presencas}</td>
                    <td style={{ color: 'var(--danger)', fontWeight: 700 }}>{aula.faltas}</td>
                    <td>
                      <span style={{ color: corPercentual(aula.percentual), fontWeight: 700 }}>{aula.percentual}%</span>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm"
                        onClick={() => setAulaAberta((prev) => (prev === aula.aula_id ? null : aula.aula_id))}
                      >
                        {aulaAberta === aula.aula_id ? 'Ocultar' : 'Ver'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!loading && historico?.aulas?.map((aula) => (
        aulaAberta === aula.aula_id && (
          <Card key={aula.aula_id} title={`Aula de ${formatarData(aula.data_aula)} - ${aula.disciplina || '-'}`} style={{ marginBottom: 20 }}>
            {aula.conteudo ? (
              <div style={{ marginBottom: 12, fontSize: 13 }}>
                <strong>Conteudo:</strong> {aula.conteudo}
              </div>
            ) : null}
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Aluno</th>
                    <th>Status</th>
                    <th>Frequencia</th>
                    <th>Justificativa</th>
                  </tr>
                </thead>
                <tbody>
                  {aula.registros.map((registro) => (
                    <tr key={`${aula.aula_id}-${registro.aluno_id}`}>
                      <td>{registro.aluno}</td>
                      <td>
                        <Badge variant={registro.status === 'presente' ? 'success' : (registro.status === 'parcial' ? 'warning' : 'danger')}>
                          {registro.status === 'presente' ? 'Presente' : (registro.status === 'parcial' ? 'Parcial' : 'Falta')}
                        </Badge>
                      </td>
                      <td style={{ fontFamily: 'var(--mono)' }}>
                        {registro.presencas_aula ?? (registro.presente ? 1 : 0)}/{registro.numero_aulas ?? 1}
                      </td>
                      <td>{registro.justificativa || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      ))}

      {!loading && historico?.alunos?.length > 0 && (
        <Card title="Consolidado por aluno">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Aulas</th>
                  <th>Presencas</th>
                  <th>Faltas</th>
                  <th>%</th>
                  <th>Situacao</th>
                </tr>
              </thead>
              <tbody>
                {historico.alunos.map((aluno) => (
                  <tr key={aluno.aluno_id}>
                    <td>{aluno.aluno}</td>
                    <td>{aluno.total_aulas}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 700 }}>{aluno.presencas}</td>
                    <td style={{ color: 'var(--danger)', fontWeight: 700 }}>{aluno.faltas}</td>
                    <td style={{ color: corPercentual(aluno.percentual), fontWeight: 700 }}>{aluno.percentual}%</td>
                    <td>
                      <Badge variant={badgePercentual(aluno.percentual)}>{statusPercentual(aluno.percentual)}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!loading && (turmaId || isAdmin) && (!historico || !historico?.aulas?.length) && (
        <div className="card">
          <EmptyState
            icon="📘"
            title="Sem historico para os filtros"
            message="Nenhuma frequencia lancada foi encontrada para essa turma/sala no periodo informado."
          />
        </div>
      )}
    </div>
  )
}
