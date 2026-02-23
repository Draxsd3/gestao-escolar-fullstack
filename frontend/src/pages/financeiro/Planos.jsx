import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import { Button, Badge, Loading, EmptyState, Modal, Alert } from '../../components/ui'

export default function Planos() {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(false)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [form, setForm]       = useState({ nome: '', descricao: '', valor: '', dia_vencimento: 10 })

  const fetch = () => {
    setLoading(true)
    api.get('/planos-pagamento').then(r => setItems(r.data || [])).catch(() => setItems([])).finally(() => setLoading(false))
  }
  useEffect(() => fetch(), [])

  const save = async e => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await api.post('/planos-pagamento', form)
      setModal(false)
      setForm({ nome: '', descricao: '', valor: '', dia_vencimento: 10 })
      fetch()
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao salvar.')
    } finally { setSaving(false) }
  }

  const fmt = v => v ? `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Planos de Pagamento</div>
          <div className="page-sub">Configure mensalidades e condições de pagamento</div>
        </div>
        <Button onClick={() => setModal(true)}>+ Novo Plano</Button>
      </div>

      <div className="card">
        {loading ? <Loading /> : items.length === 0 ? (
          <EmptyState icon="💳" title="Nenhum plano cadastrado" message="Clique em + Novo Plano para criar." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nome</th>
                  <th>Valor Mensal</th>
                  <th>Vencimento</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-muted)' }}>{item.id}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.nome}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--text-primary)' }}>{fmt(item.valor)}</td>
                    <td style={{ color: 'var(--text-muted)' }}>Dia {item.dia_vencimento || '—'}</td>
                    <td><Badge variant={item.ativo !== false ? 'success' : 'secondary'}>{item.ativo !== false ? 'Ativo' : 'Inativo'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Novo Plano de Pagamento"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
            <Button type="submit" form="formPlano" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </>
        }>
        {error && <Alert variant="error">{error}</Alert>}
        <form id="formPlano" onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Nome *</label>
            <input className="form-control" required value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Plano Anual 10x" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Valor Mensal (R$) *</label>
              <input type="number" step="0.01" className="form-control" required value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} placeholder="0,00" />
            </div>
            <div className="form-group">
              <label className="form-label">Dia de Vencimento</label>
              <input type="number" min="1" max="31" className="form-control" value={form.dia_vencimento} onChange={e => setForm(f => ({ ...f, dia_vencimento: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Descrição</label>
            <textarea className="form-control" rows={2} value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Descrição opcional" />
          </div>
        </form>
      </Modal>
    </div>
  )
}
