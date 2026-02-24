import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { Alert, Badge, Button, EmptyState, Loading, Modal } from '../../components/ui'

const FORM_INITIAL = { nome: '', codigo: '', carga_horaria_semanal: 2, ativa: true, curso_ids: [] }

function formatApiError(err, fallback) {
  const data = err.response?.data || {}
  const message = data.message || fallback
  const hint = data.hint ? ` ${data.hint}` : ''
  return `${message}${hint}`
}

export default function Disciplinas() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalNew, setModalNew] = useState(false)
  const [modalEdit, setModalEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(FORM_INITIAL)
  const [editItem, setEditItem] = useState(null)
  const [cursos, setCursos] = useState([])
  const navigate = useNavigate()

  const fetch = async () => {
    setLoading(true)
    try {
      const [disciplinasRes, cursosRes] = await Promise.all([
        api.get('/disciplinas'),
        api.get('/cursos').catch(() => ({ data: [] })),
      ])
      setItems(disciplinasRes.data.data || disciplinasRes.data || [])
      setCursos(cursosRes.data.data || cursosRes.data || [])
    } catch {
      setItems([])
      setCursos([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  const onCloseNew = () => {
    setModalNew(false)
    setForm(FORM_INITIAL)
    setError('')
  }

  const onCloseEdit = () => {
    setModalEdit(false)
    setEditItem(null)
    setForm(FORM_INITIAL)
    setError('')
  }

  const saveNew = async (e) => {
    e.preventDefault()
    if (!form.curso_ids || form.curso_ids.length === 0) {
      setError('Selecione ao menos um curso para vincular a disciplina.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await api.post('/disciplinas', {
        nome: form.nome,
        codigo: form.codigo || null,
        carga_horaria_semanal: Number(form.carga_horaria_semanal || 2),
        curso_ids: form.curso_ids.map(Number),
      })
      onCloseNew()
      fetch()
    } catch (err) {
      setError(formatApiError(err, 'Erro ao salvar disciplina.'))
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (item) => {
    setEditItem(item)
    setForm({
      nome: item.nome || '',
      codigo: item.codigo || '',
      carga_horaria_semanal: item.carga_horaria_semanal || 2,
      ativa: item.ativa !== false,
      curso_ids: (item.curso_ids || item.cursos?.map((c) => c.id) || []).map(Number),
    })
    setError('')
    setModalEdit(true)
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    if (!editItem) return
    if (!form.curso_ids || form.curso_ids.length === 0) {
      setError('Selecione ao menos um curso para vincular a disciplina.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await api.put(`/disciplinas/${editItem.id}`, {
        nome: form.nome,
        codigo: form.codigo || null,
        carga_horaria_semanal: Number(form.carga_horaria_semanal || 2),
        ativa: !!form.ativa,
        curso_ids: form.curso_ids.map(Number),
      })
      onCloseEdit()
      fetch()
    } catch (err) {
      setError(formatApiError(err, 'Erro ao salvar disciplina.'))
    } finally {
      setSaving(false)
    }
  }

  const removeItem = async (item) => {
    setError('')
    try {
      await api.delete(`/disciplinas/${item.id}`)
      fetch()
    } catch (err) {
      setError(formatApiError(err, 'Erro ao excluir disciplina.'))
    }
  }

  const toggleCurso = (cursoId) => {
    setForm((prev) => {
      const id = Number(cursoId)
      const set = new Set((prev.curso_ids || []).map(Number))
      if (set.has(id)) set.delete(id)
      else set.add(id)
      return { ...prev, curso_ids: Array.from(set) }
    })
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button onClick={() => navigate('/gestao-geral')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
            {'<-'} Gestao Geral
          </button>
          <div className="page-title">Disciplinas</div>
        </div>
        <Button onClick={() => setModalNew(true)}>+ Nova</Button>
      </div>

      {error && <Alert variant="error" onClose={() => setError('')}>{error}</Alert>}

      <div className="card">
        {loading ? <Loading /> : items.length === 0 ? (
          <EmptyState icon="[]" title="Nenhuma disciplina encontrada" message="Clique em + Nova para adicionar." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>Nome</th><th>Codigo</th><th>Carga</th><th>Cursos</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-muted)' }}>{item.id}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.nome || '-'}</td>
                    <td><Badge variant="secondary">{item.codigo || '-'}</Badge></td>
                    <td style={{ fontFamily: 'var(--mono)' }}>{item.carga_horaria_semanal || 2}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      {(item.cursos || []).length
                        ? item.cursos.map((c) => c.nome).join(', ')
                        : '-'}
                    </td>
                    <td><Badge variant={item.ativo !== false ? 'success' : 'secondary'}>{item.ativo !== false ? 'Ativo' : 'Inativo'}</Badge></td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(item)} title="Editar" style={{ fontSize: 18, lineHeight: 1 }}>✎</Button>
                      <Button variant="ghost" size="sm" onClick={() => removeItem(item)} title="Excluir" style={{ fontSize: 18, lineHeight: 1 }}>🗑</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalNew} onClose={onCloseNew} title="Nova Disciplina"
        footer={<><Button variant="secondary" onClick={onCloseNew}>Cancelar</Button><Button type="submit" form="formDiscNew" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button></>}>
        <form id="formDiscNew" onSubmit={saveNew} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group"><label className="form-label">Nome *</label>
            <input className="form-control" required value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} placeholder="Nome" />
          </div>
          <div className="form-group"><label className="form-label">Codigo</label>
            <input className="form-control" value={form.codigo} onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))} placeholder="Ex: MAT" />
          </div>
          <div className="form-group"><label className="form-label">Carga Horaria Semanal</label>
            <input type="number" min={1} max={20} className="form-control" value={form.carga_horaria_semanal} onChange={(e) => setForm((f) => ({ ...f, carga_horaria_semanal: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Cursos vinculados *</label>
            <div style={{ display: 'grid', gap: 8 }}>
              {cursos.map((curso) => (
                <label key={curso.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={(form.curso_ids || []).map(Number).includes(Number(curso.id))}
                    onChange={() => toggleCurso(curso.id)}
                  />
                  {curso.nome}
                </label>
              ))}
            </div>
            {(!form.curso_ids || form.curso_ids.length === 0) && (
              <small style={{ color: 'var(--danger)' }}>Selecione pelo menos um curso.</small>
            )}
          </div>
        </form>
      </Modal>

      <Modal isOpen={modalEdit} onClose={onCloseEdit} title="Editar Disciplina"
        footer={<><Button variant="secondary" onClick={onCloseEdit}>Cancelar</Button><Button type="submit" form="formDiscEdit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button></>}>
        <form id="formDiscEdit" onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group"><label className="form-label">Nome *</label>
            <input className="form-control" required value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} placeholder="Nome" />
          </div>
          <div className="form-group"><label className="form-label">Codigo</label>
            <input className="form-control" value={form.codigo} onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))} placeholder="Ex: MAT" />
          </div>
          <div className="form-group"><label className="form-label">Carga Horaria Semanal</label>
            <input type="number" min={1} max={20} className="form-control" value={form.carga_horaria_semanal} onChange={(e) => setForm((f) => ({ ...f, carga_horaria_semanal: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Cursos vinculados *</label>
            <div style={{ display: 'grid', gap: 8 }}>
              {cursos.map((curso) => (
                <label key={curso.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={(form.curso_ids || []).map(Number).includes(Number(curso.id))}
                    onChange={() => toggleCurso(curso.id)}
                  />
                  {curso.nome}
                </label>
              ))}
            </div>
            {(!form.curso_ids || form.curso_ids.length === 0) && (
              <small style={{ color: 'var(--danger)' }}>Selecione pelo menos um curso.</small>
            )}
          </div>
          <div className="form-group"><label className="form-label">Status</label>
            <select className="form-control" value={form.ativa ? '1' : '0'} onChange={(e) => setForm((f) => ({ ...f, ativa: e.target.value === '1' }))}>
              <option value="1">Ativo</option>
              <option value="0">Inativo</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  )
}
