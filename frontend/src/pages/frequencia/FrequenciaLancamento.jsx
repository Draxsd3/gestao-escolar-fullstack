import React, { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import { useAnoLetivo } from '../../context/AnoLetivoContext'
import { Alert, Badge, Button, Card, Loading } from '../../components/ui'
import { useSearchParams } from 'react-router-dom'

const MAX_AULAS_DIA = 8

function diaSemana(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`)
  // JS: 0=domingo ... 6=sabado (mesmo padrao usado no backend)
  return d.getDay()
}

function clampAulas(valor) {
  const n = Number(valor)
  if (!Number.isFinite(n)) return 1
  return Math.min(MAX_AULAS_DIA, Math.max(1, Math.round(n)))
}

function buildSlots(qtd, fill = true) {
  return Array.from({ length: qtd }, () => !!fill)
}

function countPresentes(slots) {
  return slots.reduce((acc, ok) => acc + (ok ? 1 : 0), 0)
}

function renderAlunoInicial(nome) {
  return (nome || '?').trim().charAt(0).toUpperCase()
}

function formatarData(dataISO) {
  if (!dataISO) return '-'
  const [ano, mes, dia] = String(dataISO).split('-')
  return `${dia}/${mes}/${ano}`
}

export default function FrequenciaLancamento() {
  const { labelVigente, periodoAtivo } = useAnoLetivo()
  const [searchParams] = useSearchParams()
  const turmaIdInicial = searchParams.get('turma_id') || ''
  const disciplinaIdInicial = searchParams.get('disciplina_id') || ''
  const abrirHistoricoInicial = searchParams.get('show_history') === '1'

  const [turmas, setTurmas] = useState([])
  const [disciplinas, setDisciplinas] = useState([])
  const [turmaDetalhe, setTurmaDetalhe] = useState(null)

  const [turmaId, setTurmaId] = useState('')
  const [disciplinaId, setDisciplinaId] = useState('')
  const [dataAula, setDataAula] = useState(new Date().toISOString().split('T')[0])

  const [alunos, setAlunos] = useState([])
  const [slotsPorAluno, setSlotsPorAluno] = useState({})
  const [numeroAulas, setNumeroAulas] = useState(1)
  const [periodoEncerrado, setPeriodoEncerrado] = useState(false)

  const [loadingContexto, setLoadingContexto] = useState(true)
  const [loadingLista, setLoadingLista] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [autoCarregarFeito, setAutoCarregarFeito] = useState(false)
  const [historicoAberto, setHistoricoAberto] = useState(abrirHistoricoInicial)
  const [historicoLoading, setHistoricoLoading] = useState(false)
  const [historico, setHistorico] = useState(null)
  const [aulaAberta, setAulaAberta] = useState(null)

  useEffect(() => {
    setLoadingContexto(true)
    api.get('/notas/contexto', { skipSuccessMessage: true })
      .then((r) => {
        const payload = r.data?.data || r.data || {}
        setTurmas(payload.turmas || [])
      })
      .catch(() => setTurmas([]))
      .finally(() => setLoadingContexto(false))
  }, [])

  useEffect(() => {
    if (!turmaId && turmaIdInicial) {
      setTurmaId(String(turmaIdInicial))
    }
  }, [turmaIdInicial, turmaId])

  useEffect(() => {
    if (!turmaId) {
      setDisciplinas([])
      setTurmaDetalhe(null)
      setDisciplinaId('')
      setAlunos([])
      setSlotsPorAluno({})
      setNumeroAulas(1)
      return
    }

    setLoadingContexto(true)
    Promise.all([
      api.get('/notas/contexto', { params: { turma_id: turmaId }, skipSuccessMessage: true }),
      api.get(`/turmas/${turmaId}`, { skipSuccessMessage: true }),
    ])
      .then(([ctx, turmaResp]) => {
        const payload = ctx.data?.data || ctx.data || {}
        setDisciplinas(payload.disciplinas || [])
        setTurmaDetalhe(turmaResp.data || null)
        setDisciplinaId((prev) => {
          const desejada = disciplinaIdInicial ? String(disciplinaIdInicial) : String(prev || '')
          const existe = (payload.disciplinas || []).some((d) => String(d.id) === desejada)
          if (existe) return desejada
          return (payload.disciplinas || []).some((d) => String(d.id) === String(prev)) ? prev : ''
        })
      })
      .catch(() => {
        setDisciplinas([])
        setTurmaDetalhe(null)
      })
      .finally(() => setLoadingContexto(false))
  }, [turmaId])

  const aulasSugeridas = useMemo(() => {
    if (!turmaDetalhe || !disciplinaId || !dataAula) return 1
    const dia = diaSemana(dataAula)
    const disciplinaIdNum = Number(disciplinaId)

    const horarios = (turmaDetalhe.horarios || []).filter((h) =>
      Number(h.disciplina_id) === disciplinaIdNum && Number(h.dia_semana) === dia
    )

    if (horarios.length > 0) {
      return clampAulas(horarios.length)
    }

    const disciplinaTurma = (turmaDetalhe.disciplinas || []).find((d) => Number(d.id) === disciplinaIdNum)
    return clampAulas(disciplinaTurma?.pivot?.aulas_semanais || 1)
  }, [turmaDetalhe, disciplinaId, dataAula])

  const carregarChamada = async () => {
    setMsg('')
    setErr('')
    setLoadingLista(true)
    try {
      const resp = await api.get('/frequencia', {
        params: {
          turma_id: Number(turmaId),
          disciplina_id: Number(disciplinaId),
          data_aula: dataAula,
        },
      })

      const payload = resp.data || {}
      const frequencias = payload.frequencias || []
      const qtd = clampAulas(payload.aula?.numero_aulas || aulasSugeridas)
      const mapa = {}

      frequencias.forEach((item) => {
        if (item.presente === true) {
          mapa[item.aluno_id] = buildSlots(qtd, true)
          return
        }
        if (item.presente === false) {
          mapa[item.aluno_id] = buildSlots(qtd, false)
          return
        }
        mapa[item.aluno_id] = buildSlots(qtd, true)
      })

      setNumeroAulas(qtd)
      setPeriodoEncerrado(!!payload.periodo_encerrado)
      setAlunos(frequencias.map((f) => ({ id: f.aluno_id, nome: f.nome })))
      setSlotsPorAluno(mapa)
    } catch (e) {
      setAlunos([])
      setSlotsPorAluno({})
      setErr(e.response?.data?.message || 'Erro ao carregar chamada.')
    } finally {
      setLoadingLista(false)
    }
  }

  const carregarHistorico = async () => {
    if (!turmaId || !disciplinaId) return
    setHistoricoLoading(true)
    try {
      const r = await api.get('/frequencia/historico', {
        params: {
          turma_id: Number(turmaId),
          disciplina_id: Number(disciplinaId),
        },
        skipSuccessMessage: true,
      })
      const payload = r.data?.data || r.data || null
      setHistorico(payload)
      setAulaAberta(payload?.aulas?.[0]?.aula_id || null)
    } catch {
      setHistorico(null)
    } finally {
      setHistoricoLoading(false)
    }
  }

  useEffect(() => {
    if (autoCarregarFeito) return
    if (!turmaIdInicial || !disciplinaIdInicial) return
    if (!turmaId || !disciplinaId) return
    if (String(turmaId) !== String(turmaIdInicial) || String(disciplinaId) !== String(disciplinaIdInicial)) return
    setAutoCarregarFeito(true)
    carregarChamada()
  }, [autoCarregarFeito, turmaIdInicial, disciplinaIdInicial, turmaId, disciplinaId])

  useEffect(() => {
    if (!historicoAberto) return
    if (!turmaId || !disciplinaId) return
    carregarHistorico()
  }, [historicoAberto, turmaId, disciplinaId])

  const toggleSlot = (alunoId, idx) => {
    setSlotsPorAluno((prev) => {
      const atual = prev[alunoId] || buildSlots(numeroAulas, true)
      const next = [...atual]
      next[idx] = !next[idx]
      return { ...prev, [alunoId]: next }
    })
  }

  const marcarTodos = (valor) => {
    const next = {}
    alunos.forEach((a) => { next[a.id] = buildSlots(numeroAulas, valor) })
    setSlotsPorAluno(next)
  }

  const presentesCheios = useMemo(() => (
    alunos.filter((a) => (slotsPorAluno[a.id] || []).every(Boolean)).length
  ), [alunos, slotsPorAluno])

  const presencasTotais = useMemo(() => (
    alunos.reduce((acc, a) => acc + countPresentes(slotsPorAluno[a.id] || []), 0)
  ), [alunos, slotsPorAluno])

  const totalSlots = alunos.length * numeroAulas
  const percentualSlots = totalSlots > 0 ? Math.round((presencasTotais / totalSlots) * 100) : 0

  const salvar = async () => {
    setMsg('')
    setErr('')
    setSaving(true)

    try {
      const frequencias = alunos.map((aluno) => {
        const slots = slotsPorAluno[aluno.id] || buildSlots(numeroAulas, true)
        const presencas = countPresentes(slots)
        const presente = slots.every(Boolean)
        const justificativa = presencas === numeroAulas
          ? null
          : `Presenca parcial: ${presencas}/${numeroAulas} aulas`

        return {
          aluno_id: Number(aluno.id),
          presente,
          justificativa,
        }
      })

      await api.post('/frequencia/lancar', {
        turma_id: Number(turmaId),
        disciplina_id: Number(disciplinaId),
        data_aula: dataAula,
        numero_aulas: numeroAulas,
        conteudo: null,
        frequencias,
      })

      setMsg('Chamada salva com sucesso.')
    } catch (e) {
      setErr(e.response?.data?.message || 'Erro ao salvar chamada.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Chamada</div>
          <div className="page-sub">Lancamento simples de presenca por aula - <strong>{labelVigente}</strong></div>
        </div>
      </div>

      {!periodoAtivo && (
        <Alert variant="error">
          Nao ha periodo letivo ativo. Nao e possivel lancar frequencias.
        </Alert>
      )}

      {msg && <Alert variant="success" onClose={() => setMsg('')}>{msg}</Alert>}
      {err && <Alert variant="error" onClose={() => setErr('')}>{err}</Alert>}

      <Card title="Filtro da chamada" style={{ marginBottom: 16 }}>
        {loadingContexto ? <Loading message="Carregando contexto..." /> : (
          <div className="form-grid cols-4">
            <div className="form-group">
              <label className="form-label">Turma</label>
              <select className="form-control" value={turmaId} onChange={(e) => setTurmaId(e.target.value)}>
                <option value="">Selecione...</option>
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>{t.nome}{t.sala ? ` - Sala ${t.sala}` : ''}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Disciplina</label>
              <select
                className="form-control"
                value={disciplinaId}
                onChange={(e) => setDisciplinaId(e.target.value)}
                disabled={!turmaId}
              >
                <option value="">Selecione...</option>
                {disciplinas.map((d) => (
                  <option key={d.id} value={d.id}>{d.nome}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Data</label>
              <input
                type="date"
                className="form-control"
                value={dataAula}
                onChange={(e) => setDataAula(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ justifyContent: 'flex-end' }}>
              <label className="form-label" style={{ opacity: 0 }}>acao</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="secondary" onClick={() => setHistoricoAberto((x) => !x)} disabled={!turmaId || !disciplinaId}>
                  {historicoAberto ? 'Ocultar histórico' : 'Ver histórico'}
                </Button>
                <Button onClick={carregarChamada} disabled={!turmaId || !disciplinaId || loadingLista}>
                  {loadingLista ? 'Carregando...' : 'Carregar chamada'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {historicoAberto && (
        <Card title="Histórico de frequência (nesta turma/disciplina)" style={{ marginBottom: 16 }}>
          {historicoLoading ? <Loading message="Carregando histórico..." /> : !historico?.aulas?.length ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sem histórico para esta turma/disciplina.</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="badge badge-secondary">Aulas: {historico?.resumo?.total_aulas ?? 0}</span>
                <span className="badge badge-secondary">Registros: {historico?.resumo?.total_registros ?? 0}</span>
                <span className="badge badge-primary">Presença geral: {historico?.resumo?.percentual_geral ?? 0}%</span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Presenças</th>
                      <th>Faltas</th>
                      <th>%</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {historico.aulas.map((aula) => (
                      <tr key={aula.aula_id}>
                        <td>{formatarData(aula.data_aula)}</td>
                        <td style={{ color: 'var(--success)', fontWeight: 700 }}>{aula.presencas}</td>
                        <td style={{ color: 'var(--danger)', fontWeight: 700 }}>{aula.faltas}</td>
                        <td style={{ fontWeight: 700 }}>{aula.percentual}%</td>
                        <td>
                          <Button size="sm" variant="secondary" onClick={() => setAulaAberta((prev) => prev === aula.aula_id ? null : aula.aula_id)}>
                            {aulaAberta === aula.aula_id ? 'Ocultar' : 'Detalhar'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {historico.aulas.map((aula) => (
                aulaAberta === aula.aula_id ? (
                  <div key={`det-${aula.aula_id}`} style={{ border: '1px solid var(--border-light)', borderRadius: 8, padding: 10 }}>
                    <div style={{ marginBottom: 8, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {formatarData(aula.data_aula)} · {aula.disciplina || '-'}
                    </div>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Aluno</th>
                            <th>Status</th>
                            <th>Frequência</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(aula.registros || []).map((r) => (
                            <tr key={`${aula.aula_id}-${r.aluno_id}`}>
                              <td>{r.aluno}</td>
                              <td>
                                <Badge variant={r.status === 'presente' ? 'success' : (r.status === 'parcial' ? 'warning' : 'danger')}>
                                  {r.status}
                                </Badge>
                              </td>
                              <td style={{ fontFamily: 'var(--mono)' }}>{r.presencas_aula ?? 0}/{r.numero_aulas ?? 1}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null
              ))}
            </div>
          )}
        </Card>
      )}

      {alunos.length > 0 && (
        <Card
          title={`Lista de chamada - ${alunos.length} alunos`}
          actions={(
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button variant="secondary" size="sm" onClick={() => marcarTodos(true)} disabled={periodoEncerrado}>Todos presentes</Button>
              <Button variant="secondary" size="sm" onClick={() => marcarTodos(false)} disabled={periodoEncerrado}>Todos ausentes</Button>
              <Button onClick={salvar} disabled={saving || periodoEncerrado}>
                {saving ? 'Salvando...' : 'Salvar chamada'}
              </Button>
            </div>
          )}
        >
          <div style={{ marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Quadrados por aluno: <strong>{numeroAulas}</strong>
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Presentes completos: <strong>{presentesCheios}/{alunos.length}</strong>
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Presenca por aula: <strong>{presencasTotais}/{totalSlots} ({percentualSlots}%)</strong>
            </span>
            {periodoEncerrado && (
              <span style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600 }}>
                Periodo encerrado: modo leitura
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alunos.map((a) => {
              const slots = slotsPorAluno[a.id] || buildSlots(numeroAulas, true)
              const presencas = countPresentes(slots)
              const completo = presencas === numeroAulas

              return (
                <div
                  key={a.id}
                  style={{
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius)',
                    padding: '10px 12px',
                    display: 'grid',
                    gridTemplateColumns: 'minmax(220px, 1fr) auto auto',
                    gap: 12,
                    alignItems: 'center',
                    background: completo ? 'rgba(34,197,94,.06)' : 'rgba(245,158,11,.06)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: 'var(--accent-soft)',
                        border: '1px solid var(--accent-border)',
                        color: 'var(--accent)',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {renderAlunoInicial(a.nome)}
                    </div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {a.nome}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    {slots.map((ok, idx) => (
                      <button
                        key={`${a.id}-${idx}`}
                        type="button"
                        title={`Aula ${idx + 1}`}
                        aria-label={`Aula ${idx + 1} ${ok ? 'presente' : 'ausente'}`}
                        disabled={periodoEncerrado}
                        onClick={() => toggleSlot(a.id, idx)}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          border: `1px solid ${ok ? 'rgba(34,197,94,.45)' : 'rgba(239,68,68,.35)'}`,
                          background: ok ? 'rgba(34,197,94,.2)' : 'rgba(239,68,68,.12)',
                          cursor: periodoEncerrado ? 'default' : 'pointer',
                        }}
                      />
                    ))}
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 64, textAlign: 'right' }}>
                    {presencas}/{numeroAulas}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
