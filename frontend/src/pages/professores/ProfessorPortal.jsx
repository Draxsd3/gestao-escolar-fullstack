import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { Button, Card, EmptyState, Loading } from '../../components/ui'

export default function ProfessorPortal() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState('')
  const [cursoSelecionado, setCursoSelecionado] = useState(null)
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState(null)

  useEffect(() => {
    let ativo = true
    setLoading(true)
    api.get('/professores/meu-portal')
      .then((r) => {
        if (!ativo) return
        setDados(r.data || {})
      })
      .catch((e) => {
        if (!ativo) return
        setErro(e?.response?.data?.message || 'Erro ao carregar portal docente.')
      })
      .finally(() => {
        if (ativo) setLoading(false)
      })

    return () => { ativo = false }
  }, [])

  const turmasFiltradas = useMemo(() => dados?.turmas || [], [dados?.turmas])
  const cursosFiltrados = useMemo(() => dados?.cursos || [], [dados?.cursos])

  const disciplinasDoCurso = useMemo(() => {
    if (!cursoSelecionado) return []
    const turmasCurso = turmasFiltradas.filter((t) => t.curso === cursoSelecionado)
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
          alunos: t.alunos || [],
        })
      })
    })
    return itens
  }, [cursoSelecionado, turmasFiltradas])

  const abrirFrequencia = () => {
    if (!disciplinaSelecionada) return
    navigate(`/frequencia?turma_id=${disciplinaSelecionada.turma_id}&disciplina_id=${disciplinaSelecionada.disciplina_id}`)
  }

  const abrirHistoricoFrequencia = () => {
    if (!disciplinaSelecionada) return
    navigate(`/frequencia?turma_id=${disciplinaSelecionada.turma_id}&disciplina_id=${disciplinaSelecionada.disciplina_id}&show_history=1`)
  }

  const abrirNotas = () => {
    if (!disciplinaSelecionada) return
    navigate(`/notas?turma_id=${disciplinaSelecionada.turma_id}&disciplina_id=${disciplinaSelecionada.disciplina_id}`)
  }

  if (loading) return <Loading />
  if (erro) return <div className="card" style={{ color: 'var(--danger)' }}>{erro}</div>

  const cursosCount = cursosFiltrados.length
  const disciplinasCount = disciplinasDoCurso.length
  const alunosCount = (disciplinaSelecionada?.alunos || []).length

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Meu Portal Docente</div>
          <div className="page-sub">
            Esteira visual de cursos, disciplinas e alunos por turma
            {dados?.ano_letivo?.ano ? ` · Ano letivo ${dados.ano_letivo.ano}` : ''}
          </div>
        </div>
      </div>

      <Card
        title="Esteira de ensino"
        actions={(
          <div style={{ display: 'flex', gap: 8 }}>
            {!!cursoSelecionado && <Button variant="secondary" size="sm" onClick={() => { setCursoSelecionado(null); setDisciplinaSelecionada(null) }}>Reiniciar</Button>}
            {!!disciplinaSelecionada && <Button variant="secondary" onClick={abrirHistoricoFrequencia}>Ver histórico</Button>}
            {!!disciplinaSelecionada && <Button variant="secondary" onClick={abrirNotas}>Lançar notas</Button>}
            {!!disciplinaSelecionada && <Button onClick={abrirFrequencia}>Contabilizar presença</Button>}
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
              1. Cursos ({cursosCount})
            </div>
            <div style={{ maxHeight: 350, overflow: 'auto', padding: 8, display: 'grid', gap: 6 }}>
              {cursosFiltrados.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: 8 }}>Nenhum curso encontrado.</div>
              ) : cursosFiltrados.map((c) => {
                const ativo = cursoSelecionado === c.nome
                return (
                  <button
                    key={c.nome}
                    onClick={() => { setCursoSelecionado(c.nome); setDisciplinaSelecionada(null) }}
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
              2. Disciplinas ({disciplinasCount})
            </div>
            <div style={{ maxHeight: 350, overflow: 'auto', padding: 8, display: 'grid', gap: 6 }}>
              {!cursoSelecionado ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: 8 }}>Selecione um curso.</div>
              ) : disciplinasDoCurso.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: 8 }}>Nenhuma disciplina nesse curso.</div>
              ) : disciplinasDoCurso.map((d) => {
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
              3. Alunos ({alunosCount})
            </div>
            {!disciplinaSelecionada ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: 12 }}>Selecione uma disciplina para ver os alunos.</div>
            ) : (
              <div style={{ padding: 10 }}>
                <div style={{ marginBottom: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  {disciplinaSelecionada.curso} · Turma {disciplinaSelecionada.turma_nome} · Sala {disciplinaSelecionada.sala || '-'}
                </div>
                {(disciplinaSelecionada.alunos || []).length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Sem alunos ativos.</div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Matricula</th>
                          <th>Aluno</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(disciplinaSelecionada.alunos || []).map((a) => (
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

      <div style={{ marginTop: 12 }}>
        {!cursoSelecionado && <EmptyState icon="[1]" title="Escolha um curso" message="Comece pela primeira coluna da esteira." />}
      </div>
    </div>
  )
}
