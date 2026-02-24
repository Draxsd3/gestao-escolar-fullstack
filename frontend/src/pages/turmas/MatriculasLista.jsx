import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { Alert, Badge, Button, EmptyState, Loading, Modal, Pagination } from '../../components/ui'

export default function MatriculasLista() {
  const [matriculas, setMatriculas] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [alunos, setAlunos] = useState([])
  const [turmas, setTurmas] = useState([])
  const [anos, setAnos] = useState([])
  const [form, setForm] = useState({
    aluno_id: '',
    turma_ids: [],
    ano_letivo_id: '',
    data_matricula: new Date().toISOString().split('T')[0],
  })

  const fetch = async (p = 1) => {
    setLoading(true)
    try {
      const [m, a, t, al] = await Promise.all([
        api.get('/matriculas', { params: { page: p } }),
        api.get('/alunos', { params: { per_page: 200 } }).catch(() => ({ data: { data: [] } })),
        api.get('/turmas').catch(() => ({ data: [] })),
        api.get('/anos-letivos').catch(() => ({ data: [] })),
      ])

      setMatriculas(m.data.data || m.data)
      setMeta(m.data.meta || null)
      setAlunos(a.data.data || a.data || [])
      setTurmas(t.data.data || t.data || [])

      const anosData = (al.data.data || al.data || []).map((x) => ({ id: x.id, ano: x.ano || x.nome, ativo: x.ativo }))
      setAnos(anosData)
      const ativo = anosData.find((x) => x.ativo)
      if (ativo && !form.ano_letivo_id) {
        setForm((f) => ({ ...f, ano_letivo_id: String(ativo.id) }))
      }
    } catch (err) {
      console.error('Erro ao carregar matriculas:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch(page) }, [page])

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    if (!form.aluno_id || form.turma_ids.length === 0 || !form.ano_letivo_id) {
      setError('Preencha todos os campos obrigatorios.')
      setSaving(false)
      return
    }

    try {
      const r = await api.post('/matriculas/lote', {
        aluno_id: Number(form.aluno_id),
        turma_ids: form.turma_ids.map(Number),
        ano_letivo_id: Number(form.ano_letivo_id),
        data_matricula: form.data_matricula,
      })

      const criados = Number(r.data?.criados || 0)
      const erros = r.data?.erros || []
      const erroTexto = erros.length
        ? ` Falhas: ${erros.map((x) => `turma ${x.turma_id} (${x.message})`).join('; ')}`
        : ''

      setModal(false)
      setMsg(`${criados} matricula(s) criada(s).${erroTexto}`)
      setForm((f) => ({ ...f, aluno_id: '', turma_ids: [] }))
      fetch(1)
    } catch (err) {
      const detail = err.response?.data
      const message = detail?.message
        || (detail?.errors ? Object.values(detail.errors).flat().join('. ') : null)
        || 'Erro ao criar matriculas. Verifique os dados.'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const cancelar = async (id) => {
    try {
      await api.put(`/matriculas/${id}`, { situacao: 'cancelada' })
      setMsg('Matricula cancelada.')
      fetch(page)
    } catch (err) {
      setMsg(`Erro ao cancelar: ${err.response?.data?.message || 'erro desconhecido'}`)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Matriculas</div><div className="page-sub">Gerenciar matriculas dos alunos</div></div>
        <Button onClick={() => setModal(true)}>+ Nova Matricula</Button>
      </div>

      {msg && <Alert variant="success" onClose={() => setMsg('')}>{msg}</Alert>}
      {error && <Alert variant="error" onClose={() => setError('')}>{error}</Alert>}

      <div className="card">
        {loading ? <Loading /> : matriculas.length === 0 ? <EmptyState icon="[]" title="Nenhuma matricula encontrada" message="Clique em + Nova Matricula para comecar." /> : (
          <>
            <div className="table-wrap">
              <table>
                <thead><tr><th>N Matricula</th><th>Aluno</th><th>Turma</th><th>Data</th><th>Situacao</th><th></th></tr></thead>
                <tbody>{matriculas.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700 }}>{m.numero_matricula}</td>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{m.aluno?.nome || '-'}</td>
                    <td>{m.turma?.nome || '-'}</td>
                    <td style={{ fontSize: 12.5 }}>{m.data_matricula ? new Date(m.data_matricula).toLocaleDateString('pt-BR') : '-'}</td>
                    <td><Badge variant={m.situacao === 'ativa' ? 'success' : m.situacao === 'trancada' ? 'warning' : 'secondary'}>{m.situacao}</Badge></td>
                    <td>
                      {m.situacao === 'ativa' && (
                        <Button variant="danger" size="sm" onClick={() => cancelar(m.id)}>Cancelar</Button>
                      )}
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <Pagination meta={meta} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title="Nova Matricula em Lote"
        footer={<><Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button><Button type="submit" form="formMat" disabled={saving}>{saving ? 'Salvando...' : 'Matricular'}</Button></>}
      >
        <form id="formMat" onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group"><label className="form-label">Aluno *</label>
            <select className="form-control" required value={form.aluno_id} onChange={(e) => setForm((f) => ({ ...f, aluno_id: e.target.value }))}>
              <option value="">Selecione o aluno...</option>
              {alunos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </div>

          <div className="form-group"><label className="form-label">Turmas/Cursos *</label>
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 10, maxHeight: 220, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {turmas.map((t) => {
                const checked = form.turma_ids.includes(String(t.id))
                return (
                  <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-primary)' }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => setForm((f) => ({
                        ...f,
                        turma_ids: e.target.checked
                          ? [...f.turma_ids, String(t.id)]
                          : f.turma_ids.filter((x) => x !== String(t.id)),
                      }))}
                    />
                    <span>{t.nome}{t.curso ? ` - ${t.curso.nome}` : ''}</span>
                  </label>
                )
              })}
              {turmas.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Nenhuma turma disponivel.</div>}
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>Selecionadas: {form.turma_ids.length}</div>
          </div>

          <div className="form-group"><label className="form-label">Ano Letivo *</label>
            <select className="form-control" required value={form.ano_letivo_id} onChange={(e) => setForm((f) => ({ ...f, ano_letivo_id: e.target.value }))}>
              <option value="">Selecione o ano letivo...</option>
              {anos.map((a) => <option key={a.id} value={a.id}>{a.ano}{a.ativo ? ' (ativo)' : ''}</option>)}
            </select>
          </div>

          <div className="form-group"><label className="form-label">Data da Matricula *</label>
            <input type="date" className="form-control" required value={form.data_matricula} onChange={(e) => setForm((f) => ({ ...f, data_matricula: e.target.value }))} />
          </div>
        </form>
      </Modal>
    </div>
  )
}
