import React, { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import { Loading, Card, Badge, Button, Alert } from '../../components/ui'

function fmtNota(v) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return '—'
  return Number(v).toFixed(1)
}

function fmtFreq(total, presentes) {
  if (!total) return '—'
  return `${Math.round((presentes / total) * 100)}%`
}

function variantSituacao(s) {
  if (s === 'aprovado') return 'success'
  if (s === 'reprovado') return 'danger'
  if (s === 'recuperacao') return 'warning'
  return 'secondary'
}

function StatCard({ label, value }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border-light)', borderRadius: 12, padding: '12px 14px' }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--mono)' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
    </div>
  )
}

export default function BoletimAluno() {
  const [dados, setDados] = useState(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [baixandoPeriodoId, setBaixandoPeriodoId] = useState(null)

  useEffect(() => {
    api.get('/aluno/boletim', { skipSuccessMessage: true })
      .then((r) => setDados(r.data))
      .catch((e) => setErro(e?.response?.data?.message || 'Erro ao carregar boletim.'))
      .finally(() => setLoading(false))
  }, [])

  const baixarPdfPeriodo = async (periodo) => {
    if (!periodo?.id) return
    setBaixandoPeriodoId(periodo.id)
    setErro('')
    try {
      const r = await api.get('/aluno/boletim/pdf', {
        params: { periodo_id: periodo.id },
        responseType: 'blob',
        skipErrorMessage: true,
      })

      const blob = new Blob([r.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `boletim-${periodo.nome || 'periodo'}-${dados?.matricula?.numero_matricula || 'aluno'}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      setErro(e?.response?.data?.message || 'Erro ao gerar PDF do boletim.')
    } finally {
      setBaixandoPeriodoId(null)
    }
  }

  const { matricula, frequencias } = dados || {}

  const { disciplinas, periodos, periodosMeta, aprovadas, recuperacao, reprovadas, freqGeral } = useMemo(() => {
    const disciplinasMap = {}
    const mapaPeriodos = new Map()

    matricula?.medias_anuais?.forEach((ma) => {
      const discId = ma.disciplina_id
      if (!disciplinasMap[discId]) {
        disciplinasMap[discId] = {
          nome: ma.disciplina?.nome || `Disciplina ${discId}`,
          periodos: {},
          mediaFinal: null,
          situacao: null,
          freqTotal: 0,
          freqPresente: 0,
        }
      }
      disciplinasMap[discId].mediaFinal = ma.media_final
      disciplinasMap[discId].situacao = ma.situacao
    })

    matricula?.medias_periodo?.forEach((mp) => {
      const discId = mp.disciplina_id
      if (!disciplinasMap[discId]) {
        disciplinasMap[discId] = {
          nome: mp.disciplina?.nome || `Disciplina ${discId}`,
          periodos: {},
          mediaFinal: null,
          situacao: null,
          freqTotal: 0,
          freqPresente: 0,
        }
      }
      const periodoNome = mp.periodo?.nome || `P${mp.periodo_id}`
      disciplinasMap[discId].periodos[periodoNome] = mp.media
      if (mp.periodo?.id) mapaPeriodos.set(Number(mp.periodo.id), periodoNome)
    })

    matricula?.notas?.forEach((nota) => {
      const discId = nota.disciplina_id
      if (!disciplinasMap[discId]) {
        disciplinasMap[discId] = {
          nome: nota.disciplina?.nome || `Disciplina ${discId}`,
          periodos: {},
          mediaFinal: null,
          situacao: null,
          freqTotal: 0,
          freqPresente: 0,
        }
      }
      const periodoNome = nota.periodo?.nome || `P${nota.periodo_id}`
      if (!disciplinasMap[discId].periodos[periodoNome]) {
        disciplinasMap[discId].periodos[periodoNome] = nota.valor
      }
      if (nota.periodo?.id) mapaPeriodos.set(Number(nota.periodo.id), periodoNome)
    })

    Object.entries(frequencias || {}).forEach(([discId, freq]) => {
      if (disciplinasMap[discId]) {
        disciplinasMap[discId].freqTotal = freq.total
        disciplinasMap[discId].freqPresente = freq.presentes
      }
    })

    const disciplinasLista = Object.values(disciplinasMap)
    const periodosLista = [...new Set(disciplinasLista.flatMap((d) => Object.keys(d.periodos)))].sort()
    const periodosListaMeta = [...mapaPeriodos.entries()]
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.id - b.id)

    const totalAulas = Object.values(frequencias || {}).reduce((s, f) => s + (f.total || 0), 0)
    const totalPresent = Object.values(frequencias || {}).reduce((s, f) => s + (f.presentes || 0), 0)

    return {
      disciplinas: disciplinasLista,
      periodos: periodosLista,
      periodosMeta: periodosListaMeta,
      aprovadas: disciplinasLista.filter((d) => d.situacao === 'aprovado').length,
      recuperacao: disciplinasLista.filter((d) => d.situacao === 'recuperacao').length,
      reprovadas: disciplinasLista.filter((d) => d.situacao === 'reprovado').length,
      freqGeral: totalAulas ? `${Math.round((totalPresent / totalAulas) * 100)}%` : '—',
    }
  }, [matricula, frequencias])

  if (loading) return <Loading />

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Meu Boletim</div>
          <div className="page-sub">
            {matricula ? `${matricula.turma?.nome || '-'} · ${matricula.turma?.serie?.nivel?.nome || '-'} · ${matricula.ano_letivo?.ano || '-'}` : 'Acompanhe suas notas e frequencia'}
          </div>
        </div>
      </div>

      {erro && <Alert variant="error" onClose={() => setErro('')}>{erro}</Alert>}

      {!matricula ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
            Nenhuma matricula ativa para exibir boletim.
          </div>
        </Card>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 16 }}>
            <StatCard label="Frequencia geral" value={freqGeral} />
            <StatCard label="Aprovadas" value={aprovadas} />
            <StatCard label="Recuperacao" value={recuperacao} />
            <StatCard label="Reprovadas" value={reprovadas} />
          </div>

          <Card title="Notas por disciplina">
            {disciplinas.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 0' }}>Nenhuma nota lancada ainda.</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Disciplina</th>
                      {periodos.map((p) => {
                        const periodo = periodosMeta.find((x) => x.nome === p)
                        return (
                          <th key={p} style={{ minWidth: 120 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                              <span>{p}</span>
                              {periodo && (
                                <button
                                  type="button"
                                  onClick={() => baixarPdfPeriodo(periodo)}
                                  title={`Baixar PDF do ${p}`}
                                  disabled={baixandoPeriodoId === periodo.id}
                                  style={{
                                    border: '1px solid var(--border)',
                                    borderRadius: 6,
                                    padding: '2px 6px',
                                    background: '#fff',
                                    cursor: 'pointer',
                                    fontSize: 11,
                                  }}
                                >
                                  {baixandoPeriodoId === periodo.id ? '...' : 'PDF'}
                                </button>
                              )}
                            </div>
                          </th>
                        )
                      })}
                      <th>Media Final</th>
                      <th>Frequencia</th>
                      <th>Situacao</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disciplinas.map((disc) => (
                      <tr key={disc.nome}>
                        <td style={{ fontWeight: 600 }}>{disc.nome}</td>
                        {periodos.map((p) => (
                          <td key={p} style={{ textAlign: 'center', fontFamily: 'var(--mono)' }}>{fmtNota(disc.periodos[p])}</td>
                        ))}
                        <td style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontWeight: 700 }}>{fmtNota(disc.mediaFinal)}</td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--mono)' }}>{fmtFreq(disc.freqTotal, disc.freqPresente)}</td>
                        <td style={{ textAlign: 'center' }}>
                          {disc.situacao ? <Badge variant={variantSituacao(disc.situacao)}>{disc.situacao}</Badge> : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
