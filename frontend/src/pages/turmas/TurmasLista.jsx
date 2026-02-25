import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { Button, Badge, Loading, EmptyState, Modal, Alert } from '../../components/ui'
import { ICON_BUTTON_STYLE, EditIcon, ViewIcon, PowerIcon, DeleteIcon } from '../../components/ui/actionIcons'

const FORM_INITIAL = { curso_id: '', ano_letivo_id: '', nome: '', turno: 'manha', vagas: 35, sala: '', ativa: true }

export default function TurmasLista() {
  const [turmas, setTurmas] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalNew, setModalNew] = useState(false)
  const [modalEdit, setModalEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [cursos, setCursos] = useState([])
  const [anos, setAnos] = useState([])
  const [salas, setSalas] = useState([])
  const [form, setForm] = useState(FORM_INITIAL)
  const [editItem, setEditItem] = useState(null)
  const navigate = useNavigate()

  const fetch = async () => {
    setLoading(true)
    try {
      const [t, c, a, sl] = await Promise.all([
        api.get('/turmas', { params: { incluir_inativas: 1 } }),
        api.get('/cursos-disponiveis').catch(() => ({ data: [] })),
        api.get('/anos-letivos').catch(() => ({ data: [] })),
        api.get('/salas').catch(() => ({ data: [] })),
      ])
      setTurmas(t.data.data || t.data || [])
      setCursos(c.data.data || c.data || [])
      setAnos(a.data.data || a.data || [])
      setSalas(sl.data.data || sl.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  const closeNew = () => {
    setModalNew(false)
    setForm(FORM_INITIAL)
    setError('')
  }

  const closeEdit = () => {
    setModalEdit(false)
    setEditItem(null)
    setForm(FORM_INITIAL)
    setError('')
  }

  const saveNew = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/turmas', {
        curso_id: Number(form.curso_id),
        ano_letivo_id: Number(form.ano_letivo_id),
        nome: form.nome,
        turno: form.turno,
        vagas: Number(form.vagas || 35),
        sala: form.sala,
      })
      closeNew()
      fetch()
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao criar turma.')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (turma) => {
    setEditItem(turma)
    setForm({
      curso_id: turma.curso?.id || '',
      ano_letivo_id: turma.ano_letivo_id || turma.ano_letivo?.id || '',
      nome: turma.nome || '',
      turno: turma.turno || 'manha',
      vagas: turma.vagas || 35,
      sala: turma.sala || '',
      ativa: turma.ativa !== false,
    })
    setError('')
    setModalEdit(true)
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    if (!editItem) return
    setSaving(true)
    setError('')
    try {
      await api.put(`/turmas/${editItem.id}`, {
        curso_id: Number(form.curso_id),
        ano_letivo_id: Number(form.ano_letivo_id),
        nome: form.nome,
        turno: form.turno,
        vagas: Number(form.vagas || 35),
        sala: form.sala,
        ativa: !!form.ativa,
      })
      closeEdit()
      fetch()
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao editar turma.')
    } finally {
      setSaving(false)
    }
  }

  const encerrarTurma = async (turma) => {
    try {
      await api.patch(`/turmas/${turma.id}/encerrar`, {}, { confirmTarget: `a turma ${turma.nome}` })
      fetch()
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao encerrar turma.')
    }
  }

  const excluirTurma = async (turma) => {
    try {
      await api.delete(`/turmas/${turma.id}`, { confirmTarget: `a turma ${turma.nome}` })
      fetch()
    } catch (err) {
      const msg = err.response?.data?.message || 'Erro ao excluir turma.'
      const deps = err.response?.data?.dependencies
      if (Array.isArray(deps) && deps.length > 0) {
        const detalhes = deps.map((d) => `${d.type}: ${d.count}`).join(' | ')
        setError(`${msg} (${detalhes})`)
      } else {
        setError(msg)
      }
    }
  }

  const formBody = (
    <div className="form-grid">
      <div className="form-group"><label className="form-label">Curso</label>
        <select className="form-control" required value={form.curso_id} onChange={(e) => setForm((f) => ({ ...f, curso_id: e.target.value }))}>
          <option value="">Selecione...</option>
          {cursos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>
      <div className="form-group"><label className="form-label">Ano Letivo</label>
        <select className="form-control" required value={form.ano_letivo_id} onChange={(e) => setForm((f) => ({ ...f, ano_letivo_id: e.target.value }))}>
          <option value="">Selecione...</option>
          {anos.map((a) => <option key={a.id} value={a.id}>{a.ano}</option>)}
        </select>
      </div>
      <div className="form-group"><label className="form-label">Nome da Turma</label>
        <input className="form-control" required value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} placeholder="Ex: TI-A22" />
      </div>
      <div className="form-group"><label className="form-label">Turno</label>
        <select className="form-control" value={form.turno} onChange={(e) => setForm((f) => ({ ...f, turno: e.target.value }))}>
          <option value="manha">Manha</option>
          <option value="tarde">Tarde</option>
          <option value="noite">Noite</option>
          <option value="integral">Integral</option>
        </select>
      </div>
      <div className="form-group"><label className="form-label">Vagas</label>
        <input type="number" min={1} max={60} className="form-control" value={form.vagas} onChange={(e) => setForm((f) => ({ ...f, vagas: e.target.value }))} />
      </div>
      <div className="form-group"><label className="form-label">Sala</label>
        <select className="form-control" required value={form.sala} onChange={(e) => setForm((f) => ({ ...f, sala: e.target.value }))}>
          <option value="">Selecione...</option>
          {salas.map((sala) => <option key={sala.id} value={sala.nome}>{sala.nome}</option>)}
        </select>
      </div>
      {modalEdit && (
        <div className="form-group"><label className="form-label">Status</label>
          <select className="form-control" value={form.ativa ? '1' : '0'} onChange={(e) => setForm((f) => ({ ...f, ativa: e.target.value === '1' }))}>
            <option value="1">Ativa</option>
            <option value="0">Inativa</option>
          </select>
        </div>
      )}
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Turmas</div><div className="page-sub">Gerenciar turmas, disciplinas e horarios</div></div>
        <Button onClick={() => setModalNew(true)}>+ Nova Turma</Button>
      </div>

      {loading ? <Loading /> : turmas.length === 0 ? <div className="card"><EmptyState icon="[]" title="Nenhuma turma cadastrada" /></div> : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Turma</th><th>Curso</th><th>Turno</th><th>Vagas</th><th>Sala</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {turmas.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--mono)' }}>{t.nome}</td>
                    <td>{t.curso?.nome || '-'}</td>
                    <td><Badge variant="info">{t.turno}</Badge></td>
                    <td style={{ fontFamily: 'var(--mono)' }}>{t.vagas}</td>
                    <td>{t.sala || '-'}</td>
                    <td><Badge variant={t.ativa !== false ? 'success' : 'secondary'}>{t.ativa !== false ? 'Ativa' : 'Inativa'}</Badge></td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(t)} title="Editar" style={ICON_BUTTON_STYLE}><EditIcon /></Button>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/turmas/${t.id}`)} title="Ver" style={ICON_BUTTON_STYLE}><ViewIcon /></Button>
                      {t.ativa !== false && (
                        <Button variant="ghost" size="sm" onClick={() => encerrarTurma(t)} title="Encerrar" style={ICON_BUTTON_STYLE}><PowerIcon /></Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => excluirTurma(t)} title="Excluir" style={ICON_BUTTON_STYLE}><DeleteIcon /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modalNew} onClose={closeNew} title="Nova Turma"
        footer={<><Button variant="secondary" onClick={closeNew}>Cancelar</Button><Button type="submit" form="formTurmaNew" disabled={saving}>{saving ? 'Salvando...' : 'Criar Turma'}</Button></>}>
        {error && <Alert variant="error">{error}</Alert>}
        <form id="formTurmaNew" onSubmit={saveNew} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {formBody}
        </form>
      </Modal>

      <Modal isOpen={modalEdit} onClose={closeEdit} title="Editar Turma"
        footer={<><Button variant="secondary" onClick={closeEdit}>Cancelar</Button><Button type="submit" form="formTurmaEdit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button></>}>
        {error && <Alert variant="error">{error}</Alert>}
        <form id="formTurmaEdit" onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {formBody}
        </form>
      </Modal>
    </div>
  )
}
