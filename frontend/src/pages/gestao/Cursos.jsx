import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { Alert, Badge, Button, EmptyState, Loading, Modal } from '../../components/ui'
import { ICON_BUTTON_STYLE, EditIcon, ViewIcon, PowerIcon, DeleteIcon } from '../../components/ui/actionIcons'

const FORM_INITIAL = { nome: '', descricao: '' }

function formatApiError(err, fallback) {
  const data = err.response?.data || {}
  const message = data.message || fallback
  const hint = data.hint ? ` ${data.hint}` : ''
  return `${message}${hint}`
}

export default function Cursos() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalNew, setModalNew] = useState(false)
  const [modalEdit, setModalEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(FORM_INITIAL)
  const [editItem, setEditItem] = useState(null)
  const navigate = useNavigate()

  const fetch = () => {
    setLoading(true)
    api.get('/cursos')
      .then((r) => setItems(r.data.data || r.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
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
      await api.post('/cursos', {
        nome: form.nome,
        descricao: form.descricao || null,
      })
      closeNew()
      fetch()
    } catch (err) {
      setError(formatApiError(err, 'Erro ao salvar curso.'))
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (item) => {
    setEditItem(item)
    setForm({
      nome: item.nome || '',
      descricao: item.descricao || '',
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
      await api.put(`/cursos/${editItem.id}`, {
        nome: form.nome,
        descricao: form.descricao || null,
      })
      closeEdit()
      fetch()
    } catch (err) {
      setError(formatApiError(err, 'Erro ao salvar curso.'))
    } finally {
      setSaving(false)
    }
  }

  const removeItem = async (item) => {
    setError('')
    try {
      await api.delete(`/cursos/${item.id}`)
      fetch()
    } catch (err) {
      setError(formatApiError(err, 'Erro ao excluir curso.'))
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button onClick={() => navigate('/gestao-geral')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
            {'<-'} Gestao Geral
          </button>
          <div className="page-title">Cursos</div>
        </div>
        <Button onClick={() => setModalNew(true)}>+ Novo</Button>
      </div>

      {error && <Alert variant="error" onClose={() => setError('')}>{error}</Alert>}

      <div className="card">
        {loading ? <Loading /> : items.length === 0 ? (
          <EmptyState icon="[]" title="Nenhum curso encontrado" message="Clique em + Novo para adicionar." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>Nome</th><th>Descricao</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-muted)' }}>{item.id}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.nome || '-'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{item.descricao || '-'}</td>
                    <td><Badge variant={item.ativo !== false ? 'success' : 'secondary'}>{item.ativo !== false ? 'Ativo' : 'Inativo'}</Badge></td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(item)} title="Editar" style={ICON_BUTTON_STYLE}><EditIcon /></Button>
                      <Button variant="ghost" size="sm" onClick={() => removeItem(item)} title="Excluir" style={ICON_BUTTON_STYLE}><DeleteIcon /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalNew} onClose={closeNew} title="Novo Curso"
        footer={<><Button variant="secondary" onClick={closeNew}>Cancelar</Button><Button type="submit" form="formCursoNew" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button></>}>
        <form id="formCursoNew" onSubmit={saveNew} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group"><label className="form-label">Nome *</label>
            <input className="form-control" required value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} placeholder="Nome do curso" />
          </div>
          <div className="form-group"><label className="form-label">Descricao</label>
            <textarea className="form-control" rows={3} value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} placeholder="Descricao opcional" />
          </div>
        </form>
      </Modal>

      <Modal isOpen={modalEdit} onClose={closeEdit} title="Editar Curso"
        footer={<><Button variant="secondary" onClick={closeEdit}>Cancelar</Button><Button type="submit" form="formCursoEdit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button></>}>
        <form id="formCursoEdit" onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group"><label className="form-label">Nome *</label>
            <input className="form-control" required value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} placeholder="Nome do curso" />
          </div>
          <div className="form-group"><label className="form-label">Descricao</label>
            <textarea className="form-control" rows={3} value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} placeholder="Descricao opcional" />
          </div>
        </form>
      </Modal>
    </div>
  )
}
