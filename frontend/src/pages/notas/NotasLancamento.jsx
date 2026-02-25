import React, { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import { useAnoLetivo } from '../../context/AnoLetivoContext'
import { Alert, Badge, Button, Card, EmptyState, Loading } from '../../components/ui'
import { useSearchParams } from 'react-router-dom'

function statusNota(valor) {
  const n = Number(valor)
  if (!Number.isFinite(n)) return null
  if (n >= 7) return { label: 'Aprovado', variant: 'success' }
  if (n >= 5) return { label: 'Recuperacao', variant: 'warning' }
  return { label: 'Reprovado', variant: 'danger' }
}

function erroApiDetalhado(error, fallback) {
  const payload = error?.response?.data || {}
  const errors = payload?.errors || {}
  const primeiraChave = Object.keys(errors)[0]
  const primeiraMensagem = primeiraChave && Array.isArray(errors[primeiraChave])
    ? errors[primeiraChave][0]
    : null

  return primeiraMensagem || payload?.message || fallback
}

export default function NotasLancamento() {
  const { labelVigente } = useAnoLetivo()
  const [searchParams] = useSearchParams()
  const turmaIdInicial = searchParams.get('turma_id') || ''
  const disciplinaIdInicial = searchParams.get('disciplina_id') || ''

  const [loadingContexto, setLoadingContexto] = useState(true)
  const [loadingNotas, setLoadingNotas] = useState(false)
  const [saving, setSaving] = useState(false)

  const [dadosPortal, setDadosPortal] = useState(null)
  const [cursoSelecionado, setCursoSelecionado] = useState('')
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState(null)

  const [turma, setTurma] = useState(null)
  const [periodos, setPeriodos] = useState([])
  const [periodoId, setPeriodoId] = useState('')

  const [registros, setRegistros] = useState([])
  const [notas, setNotas] = useState({})
  const [err, setErr] = useState('')

  const disciplinasDaEsteira = useMemo(() => {
    if (!cursoSelecionado) return []
    const turmasCurso = (dadosPortal?.turmas || []).filter((t) => t.curso === cursoSelecionado)
    const itens = []

    turmasCurso.forEach((t) => {
      ;(t.disciplinas || []).forEach((d) => {
        itens.push({
          chave: `${t.id}-${d.id}`,
          turma_id: t.id,
          turma_nome: t.nome,
          sala: t.sala,
          curso: t.curso,
          disciplina_id: d.id,
          disciplina_nome: d.nome,
        })
      })
    })

    return itens
  }, [dadosPortal, cursoSelecionado])

  const cursos = dadosPortal?.cursos || []
  const alunosDaDisciplinaSelecionada = useMemo(() => {
    if (!disciplinaSelecionada) return []
    const turmaSelecionada = (dadosPortal?.turmas || []).find((t) => Number(t.id) === Number(disciplinaSelecionada.turma_id))
    return turmaSelecionada?.alunos || []
  }, [dadosPortal, disciplinaSelecionada])

  useEffect(() => {
    let ativo = true
    setLoadingContexto(true)
    api.get('/professores/meu-portal', { skipSuccessMessage: true })
      .then((r) => {
        if (!ativo) return
        const payload = r.data || {}
        setDadosPortal(payload)

        const listaCursos = payload.cursos || []
        const cursoInicial = listaCursos[0]?.nome || ''
        setCursoSelecionado(cursoInicial)

        if (turmaIdInicial && disciplinaIdInicial) {
          const turmas = payload.turmas || []
          const match = turmas
            .flatMap((t) => (t.disciplinas || []).map((d) => ({ t, d })))
            .find((x) => String(x.t.id) === String(turmaIdInicial) && String(x.d.id) === String(disciplinaIdInicial))

          if (match) {
            setCursoSelecionado(match.t.curso || cursoInicial)
            setDisciplinaSelecionada({
              chave: `${match.t.id}-${match.d.id}`,
              turma_id: match.t.id,
              turma_nome: match.t.nome,
              sala: match.t.sala,
              curso: match.t.curso,
              disciplina_id: match.d.id,
              disciplina_nome: match.d.nome,
            })
          }
        }
      })
      .catch((e) => {
        if (!ativo) return
        setErr(e?.response?.data?.message || 'Erro ao carregar esteira de notas.')
      })
      .finally(() => {
        if (ativo) setLoadingContexto(false)
      })

    return () => { ativo = false }
  }, [turmaIdInicial, disciplinaIdInicial])

  useEffect(() => {
    if (!cursoSelecionado) {
      setDisciplinaSelecionada(null)
      return
    }

    if (!disciplinaSelecionada) return
    if (disciplinaSelecionada.curso !== cursoSelecionado) {
      setDisciplinaSelecionada(null)
    }
  }, [cursoSelecionado, disciplinaSelecionada])

  useEffect(() => {
    if (!disciplinaSelecionada?.turma_id) {
      setTurma(null)
      setPeriodos([])
      setPeriodoId('')
      setRegistros([])
      setNotas({})
      return
    }

    setLoadingContexto(true)
    api.get('/notas/contexto', {
      params: { turma_id: disciplinaSelecionada.turma_id },
      skipSuccessMessage: true,
    })
      .then((r) => {
        const p = r.data?.data || r.data || {}
        const novosPeriodos = p.periodos || []
        setTurma(p.turma || null)
        setPeriodos(novosPeriodos)

        const periodoAtivoId = p.periodo_ativo?.id ? String(p.periodo_ativo.id) : ''
        setPeriodoId((prev) => {
          if (periodoAtivoId && novosPeriodos.some((x) => String(x.id) === periodoAtivoId)) return periodoAtivoId
          if (novosPeriodos.some((x) => String(x.id) === String(prev))) return prev
          const aberto = novosPeriodos.find((x) => !x.encerrado)
          return aberto ? String(aberto.id) : (novosPeriodos[0] ? String(novosPeriodos[0].id) : '')
        })
      })
      .catch(() => {
        setTurma(null)
        setPeriodos([])
        setPeriodoId('')
      })
      .finally(() => setLoadingContexto(false))
  }, [disciplinaSelecionada])

  useEffect(() => {
    if (!disciplinaSelecionada?.turma_id || !disciplinaSelecionada?.disciplina_id || !periodoId) {
      setRegistros([])
      setNotas({})
      return
    }

    setLoadingNotas(true)
    api.get('/notas', {
      params: {
        turma_id: disciplinaSelecionada.turma_id,
        disciplina_id: disciplinaSelecionada.disciplina_id,
        periodo_id: periodoId,
      },
      skipSuccessMessage: true,
    })
      .then((r) => {
        const data = r.data?.data || r.data || []
        setRegistros(data)
        const mapa = {}
        data.forEach((item) => {
          mapa[item.matricula_id] = item.nota ?? ''
        })
        setNotas(mapa)
      })
      .catch(() => {
        setRegistros([])
        setNotas({})
      })
      .finally(() => setLoadingNotas(false))
  }, [disciplinaSelecionada, periodoId])

  const periodoSelecionado = periodos.find((p) => String(p.id) === String(periodoId))
  const periodoEncerrado = periodoSelecionado?.encerrado === true
  const totalPreenchidas = useMemo(
    () => Object.values(notas).filter((v) => `${v}`.trim() !== '').length,
    [notas]
  )

  const salvar = async () => {
    if (!disciplinaSelecionada) return

    setErr('')

    if (periodoEncerrado) {
      setErr('Este periodo esta encerrado. Nao e possivel lancar notas.')
      return
    }

    const payloadNotas = Object.entries(notas)
      .filter(([, v]) => `${v}`.trim() !== '')
      .map(([mid, v]) => ({ matricula_id: Number(mid), valor: Number(v) }))

    if (!payloadNotas.length) {
      setErr('Informe ao menos uma nota.')
      return
    }

    if (payloadNotas.some((n) => !Number.isFinite(n.valor) || n.valor < 0 || n.valor > 10)) {
      setErr('Notas invalidas. Use valores entre 0 e 10.')
      return
    }

    setSaving(true)
    try {
      await api.post('/notas/lancar', {
        turma_id: Number(disciplinaSelecionada.turma_id),
        disciplina_id: Number(disciplinaSelecionada.disciplina_id),
        periodo_id: Number(periodoId),
        notas: payloadNotas,
      }, { skipSuccessMessage: true })
    } catch (e) {
      setErr(erroApiDetalhado(e, 'Erro ao salvar notas.'))
    } finally {
      setSaving(false)
    }
  }

  if (loadingContexto && !dadosPortal) {
    return <Loading />
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Lancamento de Notas</div>
          <div className="page-sub">Modelo esteira: curso, disciplina e notas dos alunos - {labelVigente}</div>
        </div>
      </div>

      {err && <Alert variant="error" onClose={() => setErr('')}>{err}</Alert>}

      <Card
        title="Esteira de ensino"
        style={{ marginBottom: 16 }}
        actions={(
          <div style={{ display: 'flex', gap: 8 }}>
            {!!cursoSelecionado && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setCursoSelecionado('')
                  setDisciplinaSelecionada(null)
                  setPeriodoId('')
                  setRegistros([])
                  setNotas({})
                }}
              >
                Reiniciar
              </Button>
            )}
          </div>
        )}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr auto 1.2fr',
            gap: 10,
            alignItems: 'stretch',
          }}
        >
          <div style={{ border: '1px solid var(--border-light)', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-light)', fontWeight: 700, color: 'var(--text-primary)' }}>
              1. Cursos ({cursos.length})
            </div>
            <div style={{ maxHeight: 350, overflow: 'auto', padding: 8, display: 'grid', gap: 6 }}>
              {cursos.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: 8 }}>Nenhum curso encontrado.</div>
              ) : cursos.map((c) => {
                const ativo = cursoSelecionado === c.nome
                return (
                  <button
                    key={c.nome}
                    onClick={() => setCursoSelecionado(c.nome)}
                    style={{
                      textAlign: 'left',
                      border: ativo ? '1px solid #1a6dd4' : '1px solid var(--border-light)',
                      background: ativo ? 'rgba(26,109,212,.08)' : '#fff',
                      borderRadius: 10,
                      padding: '10px 10px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.nome}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{(c.turmas || []).length} turma(s)</div>
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'grid', placeItems: 'center', color: 'var(--text-muted)', fontWeight: 700 }}>→</div>

          <div style={{ border: '1px solid var(--border-light)', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-light)', fontWeight: 700, color: 'var(--text-primary)' }}>
              2. Disciplinas ({disciplinasDaEsteira.length})
            </div>
            <div style={{ maxHeight: 350, overflow: 'auto', padding: 8, display: 'grid', gap: 6 }}>
              {!cursoSelecionado ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: 8 }}>Selecione um curso.</div>
              ) : disciplinasDaEsteira.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: 8 }}>Nenhuma disciplina nesse curso.</div>
              ) : disciplinasDaEsteira.map((d) => {
                const ativo = disciplinaSelecionada?.chave === d.chave
                return (
                  <button
                    key={d.chave}
                    onClick={() => setDisciplinaSelecionada(d)}
                    style={{
                      textAlign: 'left',
                      border: ativo ? '1px solid #1a6dd4' : '1px solid var(--border-light)',
                      background: ativo ? 'rgba(26,109,212,.08)' : '#fff',
                      borderRadius: 10,
                      padding: '10px 10px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{d.disciplina_nome}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                      Turma {d.turma_nome} · Sala {d.sala || '-'}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'grid', placeItems: 'center', color: 'var(--text-muted)', fontWeight: 700 }}>→</div>

          <div style={{ border: '1px solid var(--border-light)', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-light)', fontWeight: 700, color: 'var(--text-primary)' }}>
              3. Alunos ({alunosDaDisciplinaSelecionada.length})
            </div>
            {!disciplinaSelecionada ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: 12 }}>Selecione uma disciplina para ver os alunos.</div>
            ) : (
              <div style={{ padding: 10 }}>
                <div style={{ marginBottom: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  {disciplinaSelecionada.curso} · Turma {disciplinaSelecionada.turma_nome} · Sala {disciplinaSelecionada.sala || '-'}
                </div>
                <div className="form-group" style={{ margin: '8px 0 10px' }}>
                  <label className="form-label">Periodo</label>
                  <select className="form-control" value={periodoId} onChange={(e) => setPeriodoId(e.target.value)}>
                    <option value="">Selecione...</option>
                    {periodos.map((p) => (
                      <option key={p.id} value={p.id}>{p.encerrado ? '[Fechado] ' : ''}{p.nome}</option>
                    ))}
                  </select>
                </div>
                {periodoEncerrado && <Badge variant="danger">Periodo encerrado</Badge>}
                {(alunosDaDisciplinaSelecionada || []).length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 10 }}>Sem alunos ativos.</div>
                ) : (
                  <div className="table-wrap" style={{ marginTop: 10 }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Matricula</th>
                          <th>Aluno</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(alunosDaDisciplinaSelecionada || []).map((a) => (
                          <tr key={`${disciplinaSelecionada.chave}-${a.matricula_id}`}>
                            <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{a.numero_matricula || '-'}</td>
                            <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{a.nome}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {!cursoSelecionado && (
        <EmptyState icon="[1]" title="Escolha um curso" message="Comece pela primeira coluna da esteira." />
      )}

      {disciplinaSelecionada && (loadingNotas ? <Loading message="Carregando grade de notas..." /> : (
        <Card
          title={`Notas - ${turma?.nome || disciplinaSelecionada.turma_nome} - ${periodoSelecionado?.nome || '-'}`}
          actions={(
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {totalPreenchidas} de {registros.length} aluno(s) com nota
              </span>
              {!periodoEncerrado && (
                <Button onClick={salvar} disabled={saving || !periodoId}>{saving ? 'Salvando...' : 'Salvar notas'}</Button>
              )}
            </div>
          )}
        >
          {registros.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>
              Nenhum aluno ativo encontrado nesta turma/disciplina.
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Aluno</th>
                    <th style={{ width: 150 }}>Nota</th>
                    <th style={{ width: 140 }}>Situacao</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map((item) => {
                    const valorAtual = notas[item.matricula_id]
                    const status = statusNota(valorAtual)
                    return (
                      <tr key={item.matricula_id}>
                        <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item.aluno?.nome || '-'}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            className="form-control"
                            value={valorAtual ?? ''}
                            disabled={periodoEncerrado}
                            onChange={(e) => setNotas((prev) => ({ ...prev, [item.matricula_id]: e.target.value }))}
                            style={{ maxWidth: 110, textAlign: 'center', fontFamily: 'var(--mono)', fontWeight: 700 }}
                            placeholder="-"
                          />
                        </td>
                        <td>{status ? <Badge variant={status.variant}>{status.label}</Badge> : '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}
