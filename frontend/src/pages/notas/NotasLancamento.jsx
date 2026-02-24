import React, { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import { useAnoLetivo } from '../../context/AnoLetivoContext'
import { Alert, Badge, Button, Card, Loading } from '../../components/ui'

function statusNota(valor) {
  const n = Number(valor)
  if (!Number.isFinite(n)) return null
  if (n >= 7) return { label: 'Aprovado', variant: 'success' }
  if (n >= 5) return { label: 'Recuperacao', variant: 'warning' }
  return { label: 'Reprovado', variant: 'danger' }
}

export default function NotasLancamento() {
  const { labelVigente } = useAnoLetivo()

  const [loadingContexto, setLoadingContexto] = useState(true)
  const [loadingNotas, setLoadingNotas] = useState(false)
  const [saving, setSaving] = useState(false)

  const [turmas, setTurmas] = useState([])
  const [turma, setTurma] = useState(null)
  const [disciplinas, setDisciplinas] = useState([])
  const [periodos, setPeriodos] = useState([])
  const [registros, setRegistros] = useState([])

  const [turmaId, setTurmaId] = useState('')
  const [disciplinaId, setDisciplinaId] = useState('')
  const [periodoId, setPeriodoId] = useState('')
  const [buscaAluno, setBuscaAluno] = useState('')
  const [notaLote, setNotaLote] = useState('')
  const [notas, setNotas] = useState({})
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')

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
    if (!turmaId) {
      setTurma(null)
      setDisciplinas([])
      setPeriodos([])
      setDisciplinaId('')
      setPeriodoId('')
      setNotas({})
      setRegistros([])
      return
    }

    setLoadingContexto(true)
    api.get('/notas/contexto', { params: { turma_id: turmaId }, skipSuccessMessage: true })
      .then((r) => {
        const p = r.data?.data || r.data || {}
        const novasDisciplinas = p.disciplinas || []
        const novosPeriodos = p.periodos || []

        setTurma(p.turma || null)
        setTurmas(p.turmas || [])
        setDisciplinas(novasDisciplinas)
        setPeriodos(novosPeriodos)

        setDisciplinaId((prev) => (novasDisciplinas.some((d) => String(d.id) === String(prev)) ? prev : ''))
        if (p.periodo_ativo?.id) {
          setPeriodoId(String(p.periodo_ativo.id))
        } else {
          setPeriodoId((prev) => (novosPeriodos.some((x) => String(x.id) === String(prev)) ? prev : ''))
        }
      })
      .catch(() => {
        setTurma(null)
        setDisciplinas([])
        setPeriodos([])
      })
      .finally(() => setLoadingContexto(false))
  }, [turmaId])

  useEffect(() => {
    if (!turmaId || !disciplinaId || !periodoId) {
      setRegistros([])
      setNotas({})
      return
    }

    setLoadingNotas(true)
    api.get('/notas', {
      params: { turma_id: turmaId, disciplina_id: disciplinaId, periodo_id: periodoId },
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
  }, [turmaId, disciplinaId, periodoId])

  const periodoSelecionado = periodos.find((p) => String(p.id) === String(periodoId))
  const periodoEncerrado = periodoSelecionado?.encerrado === true
  const disciplinaAtiva = disciplinas.find((d) => String(d.id) === String(disciplinaId))

  const linhasVisiveis = useMemo(() => {
    if (!buscaAluno.trim()) return registros
    const termo = buscaAluno.trim().toLowerCase()
    return registros.filter((r) => (r.aluno?.nome || '').toLowerCase().includes(termo))
  }, [registros, buscaAluno])

  const totalPreenchidas = useMemo(
    () => Object.values(notas).filter((v) => `${v}`.trim() !== '').length,
    [notas]
  )
  const mediaParcial = useMemo(() => {
    const valores = Object.values(notas).map((v) => Number(v)).filter((n) => Number.isFinite(n))
    if (!valores.length) return '-'
    const media = valores.reduce((acc, n) => acc + n, 0) / valores.length
    return media.toFixed(2)
  }, [notas])

  const aplicarNotaEmLote = () => {
    const n = Number(notaLote)
    if (!Number.isFinite(n) || n < 0 || n > 10) {
      setErr('Informe uma nota valida entre 0 e 10 para aplicar em lote.')
      return
    }
    setErr('')
    setNotas((prev) => {
      const next = { ...prev }
      registros.forEach((r) => { next[r.matricula_id] = String(n) })
      return next
    })
  }

  const limparNotas = () => {
    setNotas((prev) => {
      const next = { ...prev }
      registros.forEach((r) => { next[r.matricula_id] = '' })
      return next
    })
  }

  const salvar = async () => {
    setErr('')
    setMsg('')

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
        turma_id: Number(turmaId),
        disciplina_id: Number(disciplinaId),
        periodo_id: Number(periodoId),
        notas: payloadNotas,
      })
      setMsg('Lancamento salvo com sucesso.')
    } catch (e) {
      setErr(e.response?.data?.message || 'Erro ao salvar notas.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Lancamento de Notas</div>
          <div className="page-sub">Registre as notas por turma, disciplina e periodo - {labelVigente}</div>
        </div>
      </div>

      {msg && <Alert variant="success" onClose={() => setMsg('')}>{msg}</Alert>}
      {err && <Alert variant="error" onClose={() => setErr('')}>{err}</Alert>}

      <Card title="Contexto do Lancamento" style={{ marginBottom: 16 }}>
        {loadingContexto ? <Loading message="Carregando contexto..." /> : (
          <div className="form-grid cols-3">
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
              <select className="form-control" value={disciplinaId} onChange={(e) => setDisciplinaId(e.target.value)} disabled={!turmaId}>
                <option value="">Selecione...</option>
                {disciplinas.map((d) => (
                  <option key={d.id} value={d.id}>{d.nome}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Periodo</label>
              <select className="form-control" value={periodoId} onChange={(e) => setPeriodoId(e.target.value)} disabled={!turmaId}>
                <option value="">Selecione...</option>
                {periodos.map((p) => (
                  <option key={p.id} value={p.id}>{p.encerrado ? '[Fechado] ' : ''}{p.nome}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </Card>

      {(turmaId && disciplinaId && periodoId) && (
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 16 }}>
          <Card>
            <div className="stat-label">Turma</div>
            <div className="stat-value" style={{ fontSize: 18 }}>{turma?.nome || '-'}</div>
            <div className="stat-sub">{disciplinaAtiva?.nome || '-'}</div>
          </Card>
          <Card>
            <div className="stat-label">Periodo</div>
            <div className="stat-value" style={{ fontSize: 18 }}>{periodoSelecionado?.nome || '-'}</div>
            <div className="stat-sub">{periodoEncerrado ? 'Fechado (somente leitura)' : 'Aberto para lancamento'}</div>
          </Card>
          <Card>
            <div className="stat-label">Notas Preenchidas</div>
            <div className="stat-value" style={{ fontSize: 18 }}>{totalPreenchidas}</div>
            <div className="stat-sub">de {registros.length} alunos</div>
          </Card>
          <Card>
            <div className="stat-label">Media Parcial</div>
            <div className="stat-value" style={{ fontSize: 18 }}>{mediaParcial}</div>
            <div className="stat-sub">considerando notas preenchidas</div>
          </Card>
        </div>
      )}

      {loadingNotas ? <Loading message="Carregando grade de notas..." /> : (
        turmaId && disciplinaId && periodoId && (
          <Card
            title="Grade de Lancamento"
            actions={(
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  className="form-control"
                  style={{ width: 220 }}
                  placeholder="Buscar aluno..."
                  value={buscaAluno}
                  onChange={(e) => setBuscaAluno(e.target.value)}
                />
                {!periodoEncerrado && (
                  <>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      className="form-control"
                      style={{ width: 120 }}
                      placeholder="Nota lote"
                      value={notaLote}
                      onChange={(e) => setNotaLote(e.target.value)}
                    />
                    <Button variant="secondary" onClick={aplicarNotaEmLote}>Aplicar em Todos</Button>
                    <Button variant="secondary" onClick={limparNotas}>Limpar</Button>
                    <Button onClick={salvar} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Lancamento'}</Button>
                  </>
                )}
                {periodoEncerrado && <Badge variant="danger">Periodo encerrado</Badge>}
              </div>
            )}
          >
            {linhasVisiveis.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>
                Nenhum aluno encontrado para os filtros atuais.
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Matricula</th>
                      <th>Aluno</th>
                      <th>Nota</th>
                      <th>Situacao</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhasVisiveis.map((item) => {
                      const valorAtual = notas[item.matricula_id]
                      const status = statusNota(valorAtual)
                      return (
                        <tr key={item.matricula_id}>
                          <td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-muted)' }}>{item.matricula_id}</td>
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
                              style={{ maxWidth: 120, textAlign: 'center', fontFamily: 'var(--mono)', fontWeight: 700 }}
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
        )
      )}
    </div>
  )
}
