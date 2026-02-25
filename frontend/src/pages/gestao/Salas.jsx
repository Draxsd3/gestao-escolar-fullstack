import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { Alert, Badge, Button, EmptyState, Loading, Modal } from '../../components/ui'
import { ICON_BUTTON_STYLE, EditIcon, ViewIcon, PowerIcon, DeleteIcon } from '../../components/ui/actionIcons'

const FORM_INITIAL = { nome: '', descricao: '', ativo: true }

function formatApiError(err, fallback) {
  const data = err.response?.data || {}
  const message = data.message || fallback
  const hint = data.hint ? ` ${data.hint}` : ''
  return `${message}${hint}`
}

export default function Salas() {
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
    api.get('/salas')
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
      await api.post('/salas', {
        nome: form.nome,
        descricao: form.descricao || null,
      })
      closeNew()
      fetch()
    } catch (err) {
      setError(formatApiError(err, 'Erro ao salvar sala.'))
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (item) => {
    setEditItem(item)
    setForm({
      nome: item.nome || '',
      descricao: item.descricao || '',
      ativo: item.ativo !== false,
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
      await api.put(`/salas/${editItem.id}`, {
        nome: form.nome,
        descricao: form.descricao || null,
        ativo: !!form.ativo,
      })
      closeEdit()
      fetch()
    } catch (err) {
      setError(formatApiError(err, 'Erro ao salvar sala.'))
    } finally {
      setSaving(false)
    }
  }

  const removeItem = async (item) => {
    setError('')
    try {
      await api.delete(`/salas/${item.id}`)
      fetch()
    } catch (err) {
      setError(formatApiError(err, 'Erro ao excluir sala.'))
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button onClick={() => navigate('/gestao-geral')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
            {'<-'} Gestao Geral
          </button>
          <div className="page-title">Salas</div>
        </div>
        <Button onClick={() => setModalNew(true)}>+ Nova</Button>
      </div>

      {error && <Alert variant="error" onClose={() => setError('')}>{error}</Alert>}

      <div className="card">
        {loading ? <Loading /> : items.length === 0 ? (
          <EmptyState icon="[]" title="Nenhuma sala encontrada" message="Clique em + Nova para adicionar." />
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

      <Modal isOpen={modalNew} onClose={closeNew} title="Nova Sala"
        footer={<><Button variant="secondary" onClick={closeNew}>Cancelar</Button><Button type="submit" form="formSalaNew" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button></>}>
        <form id="formSalaNew" onSubmit={saveNew} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group"><label className="form-label">Nome *</label>
            <input className="form-control" required value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} placeholder="Ex: Sala 101" />
          </div>
          <div className="form-group"><label className="form-label">Descricao</label>
            <textarea className="form-control" rows={3} value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} placeholder="Opcional" />
          </div>
        </form>
      </Modal>

      <Modal isOpen={modalEdit} onClose={closeEdit} title="Editar Sala"
        footer={<><Button variant="secondary" onClick={closeEdit}>Cancelar</Button><Button type="submit" form="formSalaEdit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button></>}>
        <form id="formSalaEdit" onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group"><label className="form-label">Nome *</label>
            <input className="form-control" required value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} placeholder="Ex: Sala 101" />
          </div>
          <div className="form-group"><label className="form-label">Descricao</label>
            <textarea className="form-control" rows={3} value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} placeholder="Opcional" />
          </div>
          <div className="form-group"><label className="form-label">Status</label>
            <select className="form-control" value={form.ativo ? '1' : '0'} onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.value === '1' }))}>
              <option value="1">Ativo</option>
              <option value="0">Inativo</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  )
}
