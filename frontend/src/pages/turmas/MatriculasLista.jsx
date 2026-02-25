import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { Alert, Badge, Button, EmptyState, Loading, Modal, Pagination } from '../../components/ui'
import { ICON_BUTTON_STYLE, EditIcon, PowerIcon } from '../../components/ui/actionIcons'

export default function MatriculasLista() {
  const [matriculas, setMatriculas] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [modalEdit, setModalEdit] = useState(false)
  const [matriculaEditando, setMatriculaEditando] = useState(null)
  const [saving, setSaving] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [alunos, setAlunos] = useState([])
  const [turmas, setTurmas] = useState([])
  const [anos, setAnos] = useState([])
  const [planos, setPlanos] = useState([])
  const [form, setForm] = useState({
    aluno_id: '',
    turma_ids: [],
    ano_letivo_id: '',
    data_matricula: new Date().toISOString().split('T')[0],
    financeiro_ativo: false,
    plano_id: '',
    valor_curso: '',
    entrada_valor: '',
    quantidade_parcelas: '12',
  })
  const [formEdit, setFormEdit] = useState({
    turma_id: '',
    situacao: 'ativa',
    observacoes: '',
    financeiro_ativo: false,
    plano_id: '',
    valor_curso: '',
    entrada_valor: '',
    quantidade_parcelas: '',
  })

  const fetch = async (p = 1) => {
    setLoading(true)
    try {
      const [m, a, t, al, pn] = await Promise.all([
        api.get('/matriculas', { params: { page: p } }),
        api.get('/alunos', { params: { per_page: 200 } }).catch(() => ({ data: { data: [] } })),
        api.get('/turmas').catch(() => ({ data: [] })),
        api.get('/anos-letivos').catch(() => ({ data: [] })),
        api.get('/financeiro/planos-disponiveis').catch(() => ({ data: [] })),
      ])

      setMatriculas(m.data.data || m.data)
      setMeta(m.data.meta || null)
      setAlunos(a.data.data || a.data || [])
      setTurmas(t.data.data || t.data || [])

      const anosData = (al.data.data || al.data || []).map((x) => ({ id: x.id, ano: x.ano || x.nome, ativo: x.ativo }))
      setAnos(anosData)
      setPlanos(pn.data?.data || pn.data || [])
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
    if (form.financeiro_ativo && !form.plano_id) {
      setError('Selecione um plano de pagamento para configurar o financeiro.')
      setSaving(false)
      return
    }
    if (form.financeiro_ativo && (!form.valor_curso || Number(form.valor_curso) <= 0)) {
      setError('Informe o valor do curso para lancar a venda.')
      setSaving(false)
      return
    }
    if (form.financeiro_ativo && (!form.quantidade_parcelas || Number(form.quantidade_parcelas) < 1)) {
      setError('Informe em quantas vezes a venda sera parcelada.')
      setSaving(false)
      return
    }
    if (form.financeiro_ativo && Number(form.entrada_valor || 0) < 0) {
      setError('A entrada nao pode ser negativa.')
      setSaving(false)
      return
    }
    if (form.financeiro_ativo && Number(form.entrada_valor || 0) > Number(form.valor_curso || 0)) {
      setError('A entrada nao pode ser maior que o valor do curso.')
      setSaving(false)
      return
    }

    try {
      const r = await api.post('/matriculas/lote', {
        aluno_id: Number(form.aluno_id),
        turma_ids: form.turma_ids.map(Number),
        ano_letivo_id: Number(form.ano_letivo_id),
        data_matricula: form.data_matricula,
        ...(form.financeiro_ativo ? {
          financeiro: {
            plano_id: Number(form.plano_id),
            valor_curso: Number(form.valor_curso),
            entrada_valor: Number(form.entrada_valor || 0),
            quantidade_parcelas: Number(form.quantidade_parcelas),
          },
        } : {}),
      })

      const criados = Number(r.data?.criados || 0)
      const erros = r.data?.erros || []
      const erroTexto = erros.length
        ? ` Falhas: ${erros.map((x) => `turma ${x.turma_id} (${x.message})`).join('; ')}`
        : ''

      setModal(false)
      setMsg(`${criados} matricula(s) criada(s).${erroTexto}`)
      setForm((f) => ({
        ...f,
        aluno_id: '',
        turma_ids: [],
        financeiro_ativo: false,
        plano_id: '',
        valor_curso: '',
        entrada_valor: '',
        quantidade_parcelas: '12',
      }))
      fetch(1)
    } catch (err) {
      const detail = err.response?.data
      const message = (detail?.errors ? Object.values(detail.errors).flat().join('. ') : null)
        || detail?.message
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

  const abrirEdicao = (m) => {
    const contrato = m?.contrato || null
    const mensal = Number(contrato?.valor_negociado || 0)
    const qtdParcelas = contrato?.data_inicio && contrato?.data_fim
      ? Math.max(1, ((new Date(contrato.data_fim).getFullYear() - new Date(contrato.data_inicio).getFullYear()) * 12) + (new Date(contrato.data_fim).getMonth() - new Date(contrato.data_inicio).getMonth()) + 1)
      : ''
    const valorCurso = mensal && qtdParcelas ? (mensal * qtdParcelas).toFixed(2) : ''
    setMatriculaEditando(m)
    setFormEdit({
      turma_id: String(m.turma_id || m.turma?.id || ''),
      situacao: m.situacao || 'ativa',
      observacoes: m.observacoes || '',
      financeiro_ativo: !!contrato,
      plano_id: contrato?.plano_id ? String(contrato.plano_id) : '',
      valor_curso: valorCurso,
      entrada_valor: '',
      quantidade_parcelas: qtdParcelas ? String(qtdParcelas) : '',
    })
    setModalEdit(true)
  }

  const salvarEdicao = async (e) => {
    e.preventDefault()
    if (!matriculaEditando?.id) return

    setSavingEdit(true)
    setError('')
    if (formEdit.financeiro_ativo && !formEdit.plano_id) {
      setError('Selecione um plano de pagamento no financeiro.')
      setSavingEdit(false)
      return
    }
    if (formEdit.financeiro_ativo && (!formEdit.valor_curso || Number(formEdit.valor_curso) <= 0)) {
      setError('Informe o valor do curso.')
      setSavingEdit(false)
      return
    }
    if (formEdit.financeiro_ativo && (!formEdit.quantidade_parcelas || Number(formEdit.quantidade_parcelas) < 1)) {
      setError('Informe a quantidade de parcelas.')
      setSavingEdit(false)
      return
    }
    if (formEdit.financeiro_ativo && Number(formEdit.entrada_valor || 0) > Number(formEdit.valor_curso || 0)) {
      setError('A entrada nao pode ser maior que o valor do curso.')
      setSavingEdit(false)
      return
    }
    try {
      await api.put(`/matriculas/${matriculaEditando.id}`, {
        turma_id: Number(formEdit.turma_id),
        situacao: formEdit.situacao,
        observacoes: formEdit.observacoes?.trim() || null,
        ...(formEdit.financeiro_ativo ? {
          financeiro: {
            plano_id: Number(formEdit.plano_id),
            valor_curso: Number(formEdit.valor_curso),
            entrada_valor: Number(formEdit.entrada_valor || 0),
            quantidade_parcelas: Number(formEdit.quantidade_parcelas),
          },
        } : {}),
      }, { skipConfirm: true })
      setMsg('Matricula atualizada com sucesso.')
      setModalEdit(false)
      setMatriculaEditando(null)
      fetch(page)
    } catch (err) {
      const detail = err.response?.data
      const message = (detail?.errors ? Object.values(detail.errors).flat().join('. ') : null)
        || detail?.message
        || 'Erro ao atualizar matricula.'
      setError(message)
    } finally {
      setSavingEdit(false)
    }
  }

  const statusFinanceiro = (m) => {
    const contrato = m?.contrato
    if (!contrato) return { texto: 'Sem plano', variante: 'secondary' }

    const mensalidades = contrato?.mensalidades || []
    const ultima = [...mensalidades].sort((a, b) => new Date(b.data_vencimento || b.competencia) - new Date(a.data_vencimento || a.competencia))[0]
    const situacao = ultima?.situacao || 'sem mensalidade'
    const plano = contrato?.plano?.nome || 'Plano'
    const mapa = {
      pago: 'success',
      parcial: 'warning',
      pendente: 'warning',
      isento: 'secondary',
      cancelado: 'secondary',
      'sem mensalidade': 'secondary',
    }
    return { texto: `${plano} - ${situacao}`, variante: mapa[situacao] || 'secondary' }
  }

  const resumoVenda = (f) => {
    const valorCurso = Number(f.valor_curso || 0)
    const entrada = Number(f.entrada_valor || 0)
    const parcelas = Number(f.quantidade_parcelas || 0)
    if (!valorCurso || !parcelas) return null
    const saldo = Math.max(valorCurso - entrada, 0)
    const mensal = saldo / parcelas
    return {
      saldo,
      mensal,
      parcelas,
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
                <thead><tr><th>N Matricula</th><th>Aluno</th><th>Turma</th><th>Data</th><th>Situacao</th><th>Financeiro</th><th></th></tr></thead>
                <tbody>{matriculas.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700 }}>{m.numero_matricula}</td>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{m.aluno?.nome || '-'}</td>
                    <td>{m.turma?.nome || '-'}</td>
                    <td style={{ fontSize: 12.5 }}>{m.data_matricula ? new Date(m.data_matricula).toLocaleDateString('pt-BR') : '-'}</td>
                    <td><Badge variant={m.situacao === 'ativa' ? 'success' : m.situacao === 'trancada' ? 'warning' : 'secondary'}>{m.situacao}</Badge></td>
                    <td>
                      <Badge variant={statusFinanceiro(m).variante}>
                        {statusFinanceiro(m).texto}
                      </Badge>
                    </td>
                    <td>
                      <Button variant="ghost" size="sm" onClick={() => abrirEdicao(m)} title="Editar matricula" style={ICON_BUTTON_STYLE}>
                        <EditIcon />
                      </Button>
                      {m.situacao === 'ativa' && (
                        <Button variant="ghost" size="sm" onClick={() => cancelar(m.id)} title="Cancelar matricula" style={ICON_BUTTON_STYLE}>
                          <PowerIcon />
                        </Button>
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

          <div className="form-group" style={{ borderTop: '1px solid var(--border-light)', paddingTop: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={form.financeiro_ativo}
                onChange={(e) => setForm((f) => ({ ...f, financeiro_ativo: e.target.checked }))}
              />
              Lancar venda da matricula
            </label>
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>
              Cria contrato financeiro e gera mensalidades mes a mes ate o fim do ano letivo.
            </div>
          </div>

          {form.financeiro_ativo && (
            <div style={{ display: 'grid', gap: 12, border: '1px solid var(--border-light)', borderRadius: 8, padding: 12, background: 'var(--bg-card)' }}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Plano de pagamento *</label>
                  <select
                    className="form-control"
                    required={form.financeiro_ativo}
                    value={form.plano_id}
                    onChange={(e) => setForm((f) => ({ ...f, plano_id: e.target.value }))}
                  >
                    <option value="">Selecione o plano...</option>
                    {planos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} - R$ {Number(p.valor_mensalidade || 0).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Valor do curso (R$) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-control"
                    required={form.financeiro_ativo}
                    value={form.valor_curso}
                    onChange={(e) => setForm((f) => ({ ...f, valor_curso: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Entrada (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-control"
                    value={form.entrada_valor}
                    onChange={(e) => setForm((f) => ({ ...f, entrada_valor: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Quantidade de parcelas *</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    className="form-control"
                    required={form.financeiro_ativo}
                    value={form.quantidade_parcelas}
                    onChange={(e) => setForm((f) => ({ ...f, quantidade_parcelas: e.target.value }))}
                  />
                </div>
              </div>
              {resumoVenda(form) && (
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                  Saldo: R$ {resumoVenda(form).saldo.toFixed(2)} | {resumoVenda(form).parcelas}x de R$ {resumoVenda(form).mensal.toFixed(2)}
                </div>
              )}
            </div>
          )}
        </form>
      </Modal>

      <Modal
        isOpen={modalEdit}
        onClose={() => setModalEdit(false)}
        title="Editar Matricula"
        footer={<><Button variant="secondary" onClick={() => setModalEdit(false)}>Cancelar</Button><Button type="submit" form="formEditMat" disabled={savingEdit}>{savingEdit ? 'Salvando...' : 'Salvar alteracoes'}</Button></>}
      >
        <form id="formEditMat" onSubmit={salvarEdicao} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Aluno</label>
            <input className="form-control" value={matriculaEditando?.aluno?.nome || '-'} disabled />
          </div>

          <div className="form-group">
            <label className="form-label">Turma *</label>
            <select
              className="form-control"
              required
              value={formEdit.turma_id}
              onChange={(e) => setFormEdit((f) => ({ ...f, turma_id: e.target.value }))}
            >
              <option value="">Selecione a turma...</option>
              {turmas.map((t) => <option key={t.id} value={t.id}>{t.nome}{t.curso ? ` - ${t.curso.nome}` : ''}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Situacao *</label>
            <select
              className="form-control"
              required
              value={formEdit.situacao}
              onChange={(e) => setFormEdit((f) => ({ ...f, situacao: e.target.value }))}
            >
              <option value="ativa">Ativa</option>
              <option value="trancada">Trancada</option>
              <option value="transferida">Transferida</option>
              <option value="concluida">Concluida</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Observacoes</label>
            <textarea
              className="form-control"
              rows={3}
              value={formEdit.observacoes}
              onChange={(e) => setFormEdit((f) => ({ ...f, observacoes: e.target.value }))}
              placeholder="Observacoes da matricula..."
            />
          </div>

          <div className="form-group" style={{ borderTop: '1px solid var(--border-light)', paddingTop: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={formEdit.financeiro_ativo}
                onChange={(e) => setFormEdit((f) => ({ ...f, financeiro_ativo: e.target.checked }))}
              />
              Editar financeiro desta matricula
            </label>
          </div>

          {formEdit.financeiro_ativo && (
            <div style={{ display: 'grid', gap: 12, border: '1px solid var(--border-light)', borderRadius: 8, padding: 12, background: 'var(--bg-card)' }}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Plano de pagamento *</label>
                  <select
                    className="form-control"
                    required={formEdit.financeiro_ativo}
                    value={formEdit.plano_id}
                    onChange={(e) => setFormEdit((f) => ({ ...f, plano_id: e.target.value }))}
                  >
                    <option value="">Selecione o plano...</option>
                    {planos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} - R$ {Number(p.valor_mensalidade || 0).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Valor do curso (R$) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-control"
                    required={formEdit.financeiro_ativo}
                    value={formEdit.valor_curso}
                    onChange={(e) => setFormEdit((f) => ({ ...f, valor_curso: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Entrada (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-control"
                    value={formEdit.entrada_valor}
                    onChange={(e) => setFormEdit((f) => ({ ...f, entrada_valor: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Quantidade de parcelas *</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    className="form-control"
                    required={formEdit.financeiro_ativo}
                    value={formEdit.quantidade_parcelas}
                    onChange={(e) => setFormEdit((f) => ({ ...f, quantidade_parcelas: e.target.value }))}
                  />
                </div>
              </div>
              {resumoVenda(formEdit) && (
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                  Saldo: R$ {resumoVenda(formEdit).saldo.toFixed(2)} | {resumoVenda(formEdit).parcelas}x de R$ {resumoVenda(formEdit).mensal.toFixed(2)}
                </div>
              )}
            </div>
          )}
        </form>
      </Modal>
    </div>
  )
}
