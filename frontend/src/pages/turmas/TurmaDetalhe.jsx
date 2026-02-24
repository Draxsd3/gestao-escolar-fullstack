import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'
import { Button, Badge, Loading, Card, Modal, Alert } from '../../components/ui'

const DIAS = [
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terca' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sabado' },
  { value: 0, label: 'Domingo' },
]

const DISC_FORM_INITIAL = { disciplina_id: '', aulas_semanais: 2 }
const HORARIO_FORM_INITIAL = { disciplina_id: '', professor_id: '', dia_semana: 1, horario_inicio: '07:00', horario_fim: '07:50' }

export default function TurmaDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [turma, setTurma] = useState(null)
  const [disciplinasCatalogo, setDisciplinasCatalogo] = useState([])
  const [professores, setProfessores] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('alunos')

  const [modalDisc, setModalDisc] = useState(false)
  const [editDisc, setEditDisc] = useState(null)
  const [discForm, setDiscForm] = useState(DISC_FORM_INITIAL)

  const [modalHorario, setModalHorario] = useState(false)
  const [editHorario, setEditHorario] = useState(null)
  const [horarioForm, setHorarioForm] = useState(HORARIO_FORM_INITIAL)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [turmaRes, disciplinasRes, professoresRes] = await Promise.all([
        api.get(`/turmas/${id}`),
        api.get('/disciplinas').catch(() => ({ data: [] })),
        api.get('/professores').catch(() => ({ data: [] })),
      ])
      setTurma(turmaRes.data || null)
      setDisciplinasCatalogo(disciplinasRes.data.data || disciplinasRes.data || [])
      setProfessores(professoresRes.data.data || professoresRes.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  const disciplinasIdsDaTurma = useMemo(
    () => new Set((turma?.disciplinas || []).map((d) => d.id)),
    [turma]
  )
  const cursoIdTurma = turma?.curso?.id

  const disciplinasDisponiveis = useMemo(
    () => disciplinasCatalogo.filter((d) => {
      const vinculadaAoCurso = Array.isArray(d.curso_ids)
        ? d.curso_ids.map(Number).includes(Number(cursoIdTurma))
        : true
      return vinculadaAoCurso && !disciplinasIdsDaTurma.has(d.id)
    }),
    [disciplinasCatalogo, disciplinasIdsDaTurma, cursoIdTurma]
  )

  const closeDiscModal = () => {
    setModalDisc(false)
    setEditDisc(null)
    setDiscForm(DISC_FORM_INITIAL)
    setError('')
  }

  const openNewDisc = () => {
    setDiscForm({
      disciplina_id: disciplinasDisponiveis[0]?.id || '',
      aulas_semanais: 2,
    })
    setEditDisc(null)
    setError('')
    setModalDisc(true)
  }

  const openEditDisc = (disciplina) => {
    setEditDisc(disciplina)
    setDiscForm({
      disciplina_id: disciplina.id,
      aulas_semanais: disciplina.pivot?.aulas_semanais || disciplina.carga_horaria_semanal || 2,
    })
    setError('')
    setModalDisc(true)
  }

  const saveDisc = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editDisc) {
        await api.put(`/turmas/${id}/disciplinas/${editDisc.id}`, {
          aulas_semanais: Number(discForm.aulas_semanais || 2),
        })
      } else {
        await api.post(`/turmas/${id}/disciplinas`, {
          disciplina_id: Number(discForm.disciplina_id),
          aulas_semanais: Number(discForm.aulas_semanais || 2),
        })
      }
      closeDiscModal()
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao salvar disciplina da turma.')
    } finally {
      setSaving(false)
    }
  }

  const removeDisc = async (disciplina) => {
    try {
      await api.delete(`/turmas/${id}/disciplinas/${disciplina.id}`)
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao remover disciplina.')
    }
  }

  const closeHorarioModal = () => {
    setModalHorario(false)
    setEditHorario(null)
    setHorarioForm(HORARIO_FORM_INITIAL)
    setError('')
  }

  const openNewHorario = () => {
    const primeiraDisciplina = turma?.disciplinas?.[0]
    const primeiroProfessor = professores[0]
    setHorarioForm({
      disciplina_id: primeiraDisciplina?.id || '',
      professor_id: primeiroProfessor?.id || '',
      dia_semana: 1,
      horario_inicio: '07:00',
      horario_fim: '07:50',
    })
    setEditHorario(null)
    setError('')
    setModalHorario(true)
  }

  const openEditHorario = (horario) => {
    setEditHorario(horario)
    setHorarioForm({
      disciplina_id: horario.disciplina_id,
      professor_id: horario.professor_id,
      dia_semana: horario.dia_semana,
      horario_inicio: String(horario.horario_inicio || '').slice(0, 5),
      horario_fim: String(horario.horario_fim || '').slice(0, 5),
    })
    setError('')
    setModalHorario(true)
  }

  const saveHorario = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        disciplina_id: Number(horarioForm.disciplina_id),
        professor_id: Number(horarioForm.professor_id),
        dia_semana: Number(horarioForm.dia_semana),
        horario_inicio: horarioForm.horario_inicio,
        horario_fim: horarioForm.horario_fim,
      }
      if (editHorario) {
        await api.put(`/turmas/${id}/horarios/${editHorario.id}`, payload)
      } else {
        await api.post(`/turmas/${id}/horarios`, payload)
      }
      closeHorarioModal()
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao salvar horario.')
    } finally {
      setSaving(false)
    }
  }

  const removeHorario = async (horario) => {
    try {
      await api.delete(`/turmas/${id}/horarios/${horario.id}`)
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao remover horario.')
    }
  }

  const diaLabel = (dia) => DIAS.find((d) => Number(d.value) === Number(dia))?.label || '-'

  if (loading) return <Loading />
  if (!turma) return <div style={{ color: 'var(--text-muted)', padding: 40, textAlign: 'center' }}>Turma nao encontrada.</div>

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Turma {turma.nome}</div>
          <div className="page-sub">{turma.curso?.nome || '-'} · {turma.ano_letivo?.ano} · Turno {turma.turno}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={() => navigate('/turmas')}>{'<-'} Voltar</Button>
        </div>
      </div>

      {error && <Alert variant="error" onClose={() => setError('')}>{error}</Alert>}

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        {[['Vagas Total', turma.vagas || '-', '[]'], ['Turno', turma.turno, '[]'], ['Sala', turma.sala || '-', '[]'], ['Status', turma.ativa !== false ? 'Ativa' : 'Inativa', '[]']].map(([l, v, ic]) => (
          <div key={l} className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--accent-soft)' }}>{ic}</div>
            <div className="stat-value" style={{ fontSize: 18 }}>{v}</div>
            <div className="stat-label">{l}</div>
          </div>
        ))}
      </div>

      <div className="tabs">
        {[['alunos', 'Alunos'], ['disciplinas', 'Disciplinas'], ['horarios', 'Horarios']].map(([k, l]) => (
          <button key={k} className={`tab-btn ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'alunos' && (
        <Card title="Alunos Matriculados" actions={<Button size="sm" onClick={() => navigate('/matriculas')}>+ Matricular</Button>}>
          {turma.matriculas?.length ? (
            <div className="table-wrap"><table>
              <thead><tr><th>Aluno</th><th>Matricula</th><th>Situacao</th></tr></thead>
              <tbody>{turma.matriculas.map((m) => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 500 }}>{m.aluno?.nome}</td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{m.numero_matricula}</td>
                  <td><Badge variant={m.situacao === 'ativa' ? 'success' : 'secondary'}>{m.situacao}</Badge></td>
                </tr>
              ))}</tbody>
            </table></div>
          ) : <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '10px 0' }}>Nenhum aluno matriculado.</div>}
        </Card>
      )}

      {tab === 'disciplinas' && (
        <Card title="Grade Curricular" actions={<Button size="sm" onClick={openNewDisc} disabled={disciplinasDisponiveis.length === 0}>+ Disciplina</Button>}>
          {turma.disciplinas?.length ? (
            <div className="table-wrap"><table>
              <thead><tr><th>Disciplina</th><th>Codigo</th><th>Aulas/Semana</th><th></th></tr></thead>
              <tbody>{turma.disciplinas.map((d) => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 500 }}>{d.nome}</td>
                  <td><Badge variant="secondary">{d.codigo || '-'}</Badge></td>
                  <td style={{ fontFamily: 'var(--mono)' }}>{d.pivot?.aulas_semanais || 2}</td>
                  <td style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <Button variant="ghost" size="sm" onClick={() => openEditDisc(d)} title="Editar" style={{ fontSize: 18, lineHeight: 1 }}>✎</Button>
                    <Button variant="ghost" size="sm" onClick={() => removeDisc(d)} title="Excluir" style={{ fontSize: 18, lineHeight: 1 }}>🗑</Button>
                  </td>
                </tr>
              ))}</tbody>
            </table></div>
          ) : <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '10px 0' }}>Nenhuma disciplina na grade.</div>}
        </Card>
      )}

      {tab === 'horarios' && (
        <Card
          title="Horarios de Aula"
          actions={<Button size="sm" onClick={openNewHorario} disabled={!turma.disciplinas?.length || !professores.length}>+ Horario</Button>}
        >
          {!turma.disciplinas?.length && <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 10 }}>Cadastre disciplinas da turma antes de lancar horarios.</div>}
          {!professores.length && <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 10 }}>Cadastre professores para lancar horarios.</div>}
          {turma.horarios?.length ? (
            <div className="table-wrap"><table>
              <thead><tr><th>Dia</th><th>Inicio</th><th>Fim</th><th>Disciplina</th><th>Professor</th><th></th></tr></thead>
              <tbody>{turma.horarios.map((h) => (
                <tr key={h.id}>
                  <td>{diaLabel(h.dia_semana)}</td>
                  <td style={{ fontFamily: 'var(--mono)' }}>{String(h.horario_inicio || '').slice(0, 5)}</td>
                  <td style={{ fontFamily: 'var(--mono)' }}>{String(h.horario_fim || '').slice(0, 5)}</td>
                  <td>{h.disciplina?.nome || '-'}</td>
                  <td>{h.professor?.usuario?.nome || h.professor?.nome || '-'}</td>
                  <td style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <Button variant="ghost" size="sm" onClick={() => openEditHorario(h)} title="Editar" style={{ fontSize: 18, lineHeight: 1 }}>✎</Button>
                    <Button variant="ghost" size="sm" onClick={() => removeHorario(h)} title="Excluir" style={{ fontSize: 18, lineHeight: 1 }}>🗑</Button>
                  </td>
                </tr>
              ))}</tbody>
            </table></div>
          ) : <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Nenhum horario cadastrado.</div>}
        </Card>
      )}

      <Modal isOpen={modalDisc} onClose={closeDiscModal} title={editDisc ? 'Editar Disciplina da Turma' : 'Adicionar Disciplina na Turma'}
        footer={<><Button variant="secondary" onClick={closeDiscModal}>Cancelar</Button><Button type="submit" form="formDiscTurma" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button></>}>
        {error && <Alert variant="error">{error}</Alert>}
        <form id="formDiscTurma" onSubmit={saveDisc} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group"><label className="form-label">Disciplina</label>
            {editDisc ? (
              <input className="form-control" disabled value={editDisc.nome} />
            ) : (
              <select className="form-control" required value={discForm.disciplina_id} onChange={(e) => setDiscForm((f) => ({ ...f, disciplina_id: e.target.value }))}>
                <option value="">Selecione...</option>
                {disciplinasDisponiveis.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
              </select>
            )}
          </div>
          <div className="form-group"><label className="form-label">Aulas por Semana</label>
            <input type="number" min={1} max={20} className="form-control" value={discForm.aulas_semanais} onChange={(e) => setDiscForm((f) => ({ ...f, aulas_semanais: e.target.value }))} />
          </div>
        </form>
      </Modal>

      <Modal isOpen={modalHorario} onClose={closeHorarioModal} title={editHorario ? 'Editar Horario' : 'Novo Horario'}
        footer={<><Button variant="secondary" onClick={closeHorarioModal}>Cancelar</Button><Button type="submit" form="formHorarioTurma" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button></>}>
        {error && <Alert variant="error">{error}</Alert>}
        <form id="formHorarioTurma" onSubmit={saveHorario} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group"><label className="form-label">Disciplina</label>
            <select className="form-control" required value={horarioForm.disciplina_id} onChange={(e) => setHorarioForm((f) => ({ ...f, disciplina_id: e.target.value }))}>
              <option value="">Selecione...</option>
              {(turma.disciplinas || []).map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Professor</label>
            <select className="form-control" required value={horarioForm.professor_id} onChange={(e) => setHorarioForm((f) => ({ ...f, professor_id: e.target.value }))}>
              <option value="">Selecione...</option>
              {professores.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Dia da Semana</label>
            <select className="form-control" required value={horarioForm.dia_semana} onChange={(e) => setHorarioForm((f) => ({ ...f, dia_semana: e.target.value }))}>
              {DIAS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="form-group" style={{ flex: 1 }}><label className="form-label">Inicio</label>
              <input className="form-control" type="time" required value={horarioForm.horario_inicio} onChange={(e) => setHorarioForm((f) => ({ ...f, horario_inicio: e.target.value }))} />
            </div>
            <div className="form-group" style={{ flex: 1 }}><label className="form-label">Fim</label>
              <input className="form-control" type="time" required value={horarioForm.horario_fim} onChange={(e) => setHorarioForm((f) => ({ ...f, horario_fim: e.target.value }))} />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
