import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { Alert, Badge, Button, EmptyState, Loading, Modal, Pagination } from '../../components/ui'
import { ICON_BUTTON_STYLE, ViewIcon } from '../../components/ui/actionIcons'

export default function Mensalidades() {
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [situacao, setSituacao] = useState('')
  const [modal, setModal] = useState(null)
  const [contaModal, setContaModal] = useState(null)
  const [historicoConta, setHistoricoConta] = useState([])
  const [saving, setSaving] = useState(false)
  const [loadingComprovante, setLoadingComprovante] = useState(false)
  const [loadingHistorico, setLoadingHistorico] = useState(false)
  const [msg, setMsg] = useState('')
  const [comprovanteUrl, setComprovanteUrl] = useState('')
  const [comprovanteNome, setComprovanteNome] = useState('comprovante-recebimento.pdf')
  const [pay, setPay] = useState({
    valor: '',
    forma_pagamento: 'pix',
    data_recebimento: new Date().toISOString().split('T')[0],
  })

  const recebimentosAtivos = (conta) => (conta?.recebimentos || []).filter((r) => !r.estornado_em)
  const totalRecebidoAtivo = (conta) => recebimentosAtivos(conta).reduce((s, r) => s + Number(r.valor || 0), 0)
  const ultimoRecebimentoAtivoId = (conta) => recebimentosAtivos(conta)[0]?.id || null

  const fetch = async (p = 1) => {
    setLoading(true)
    try {
      const r = await api.get('/financeiro/mensalidades', { params: { page: p, situacao } })
      setItems(r.data.data || r.data)
      setMeta(r.data.meta || null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
    fetch(1)
  }, [situacao])

  useEffect(() => {
    fetch(page)
  }, [page])

  const baixarComprovante = (blob, nome = 'comprovante-recebimento.pdf') => {
    const blobUrl = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = blobUrl
    link.setAttribute('download', nome)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(blobUrl)
  }

  const carregarComprovante = async (recebimentoId) => {
    setLoadingComprovante(true)
    try {
      const pdf = await api.get(`/financeiro/recebimentos/${recebimentoId}/comprovante`, {
        responseType: 'blob',
        skipErrorMessage: true,
      })
      const nome = `comprovante-recebimento-${recebimentoId}.pdf`
      const url = window.URL.createObjectURL(new Blob([pdf.data], { type: 'application/pdf' }))
      if (comprovanteUrl) {
        window.URL.revokeObjectURL(comprovanteUrl)
      }
      setComprovanteUrl(url)
      setComprovanteNome(nome)
      return { data: pdf.data, nome, url }
    } finally {
      setLoadingComprovante(false)
    }
  }

  const abrirResumoConta = async (m) => {
    let baseConta = m
    setLoadingHistorico(true)
    try {
      const r = await api.get(`/financeiro/mensalidades/${m.id}/historico`, { skipErrorMessage: true })
      const mensalidade = r.data?.mensalidade || m
      const historico = r.data?.historico || []
      setContaModal(mensalidade)
      setHistoricoConta(historico)
      baseConta = mensalidade
    } catch {
      setContaModal(m)
      setHistoricoConta([])
    } finally {
      setLoadingHistorico(false)
    }

    const recebimentoId = ultimoRecebimentoAtivoId(baseConta)
    if (recebimentoId) {
      try {
        await carregarComprovante(recebimentoId)
      } catch {
        setMsg('Nao foi possivel carregar o comprovante desta conta.')
      }
    } else {
      if (comprovanteUrl) {
        window.URL.revokeObjectURL(comprovanteUrl)
      }
      setComprovanteUrl('')
      setComprovanteNome('comprovante-recebimento.pdf')
    }
  }

  const estornarRecebimento = async (rec) => {
    if (!rec?.id) return
    const motivo = window.prompt('Motivo do estorno (opcional):', '') || ''
    try {
      const r = await api.post(`/financeiro/recebimentos/${rec.id}/estornar`, { motivo }, { skipConfirm: true })
      const mensalidade = r.data?.mensalidade
      if (mensalidade) {
        setContaModal(mensalidade)
      }
      const hr = await api.get(`/financeiro/mensalidades/${contaModal?.id || mensalidade?.id}/historico`, { skipErrorMessage: true })
      setHistoricoConta(hr.data?.historico || [])
      if (comprovanteUrl) {
        window.URL.revokeObjectURL(comprovanteUrl)
      }
      setComprovanteUrl('')
      setComprovanteNome('comprovante-recebimento.pdf')
      fetch(page)
      setMsg('Pagamento estornado com sucesso.')
    } catch {
      setMsg('Erro ao estornar pagamento.')
    }
  }

  const imprimirResumo = () => {
    if (!contaModal) return
    const w = window.open('', '_blank', 'width=900,height=700')
    if (!w) return
    const aluno = contaModal.contrato?.matricula?.aluno?.nome || '-'
    const responsavel = contaModal.contrato?.responsavel?.nome || '-'
    const plano = contaModal.contrato?.plano?.nome || '-'
    const competencia = contaModal.competencia ? new Date(contaModal.competencia).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' }) : '-'
    const vencimento = contaModal.data_vencimento ? new Date(contaModal.data_vencimento).toLocaleDateString('pt-BR') : '-'
    const recebido = Number(totalRecebidoAtivo(contaModal))
    const html = `
      <html><head><title>Resumo da Conta</title></head>
      <body style="font-family: Arial, sans-serif; padding: 24px;">
        <h2>Resumo da Conta</h2>
        <p><b>Aluno:</b> ${aluno}</p>
        <p><b>Responsavel:</b> ${responsavel}</p>
        <p><b>Plano:</b> ${plano}</p>
        <p><b>Competencia:</b> ${competencia}</p>
        <p><b>Vencimento:</b> ${vencimento}</p>
        <p><b>Valor da conta:</b> ${fmt(contaModal.valor_final)}</p>
        <p><b>Total recebido:</b> ${fmt(recebido)}</p>
        <p><b>Situacao:</b> ${contaModal.situacao}</p>
      </body></html>
    `
    w.document.write(html)
    w.document.close()
    w.focus()
    w.print()
  }

  const exportarComprovante = async () => {
    const recebimentoId = ultimoRecebimentoAtivoId(contaModal)
    if (!recebimentoId) {
      setMsg('Esta conta ainda nao possui comprovante para exportar.')
      return
    }
    try {
      const loaded = await carregarComprovante(recebimentoId)
      baixarComprovante(loaded.data, loaded.nome)
    } catch {
      setMsg('Erro ao exportar comprovante.')
    }
  }

  const pagar = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const r = await api.post('/financeiro/recebimento', {
        mensalidade_id: modal.id,
        valor: Number(pay.valor),
        forma_pagamento: pay.forma_pagamento,
        data_recebimento: pay.data_recebimento,
      })

      const recebimentoId = r?.data?.recebimento_id
      if (recebimentoId) {
        await carregarComprovante(recebimentoId)
      }

      setModal(null)
      if (r?.data?.mensalidade) {
        setContaModal(r.data.mensalidade)
        const hr = await api.get(`/financeiro/mensalidades/${r.data.mensalidade.id}/historico`, { skipErrorMessage: true })
        setHistoricoConta(hr.data?.historico || [])
      }
      fetch(page)
      setMsg('Pagamento registrado.')
    } catch {
      setMsg('Erro ao registrar pagamento ou gerar comprovante.')
    } finally {
      setSaving(false)
    }
  }

  const fmt = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  const situVar = { pago: 'success', pendente: 'warning', parcial: 'info', cancelado: 'secondary', isento: 'secondary' }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Mensalidades</div>
          <div className="page-sub">Mensalidades geradas a partir da venda da matricula</div>
        </div>
      </div>

      {msg && <Alert variant="success" onClose={() => setMsg('')}>{msg}</Alert>}

      <div className="card">
        <div className="filter-bar">
          <select className="form-control" style={{ maxWidth: 180 }} value={situacao} onChange={(e) => setSituacao(e.target.value)}>
            <option value="">Todas</option>
            <option value="pendente">Pendente</option>
            <option value="pago">Pago</option>
            <option value="parcial">Parcial</option>
          </select>
        </div>

        {loading ? <Loading /> : items.length === 0 ? (
          <EmptyState icon="[R$]" title="Nenhuma mensalidade" />
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Aluno</th>
                    <th>Origem</th>
                    <th>Plano</th>
                    <th>Responsavel financeiro</th>
                    <th>Competencia</th>
                    <th>Vencimento</th>
                    <th>Valor</th>
                    <th>Situacao</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((m) => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{m.contrato?.matricula?.aluno?.nome || '-'}</td>
                      <td style={{ fontSize: 12.5 }}>
                        {m.contrato?.matricula?.numero_matricula ? `Venda MAT-${m.contrato.matricula.numero_matricula}` : 'Venda de matricula'}
                      </td>
                      <td>{m.contrato?.plano?.nome || '-'}</td>
                      <td>{m.contrato?.responsavel?.nome || '-'}</td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>
                        {m.competencia ? new Date(m.competencia).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td style={{ fontSize: 12.5 }}>
                        {m.data_vencimento ? new Date(m.data_vencimento).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td style={{ fontFamily: 'var(--mono)', fontWeight: 700 }}>{fmt(m.valor_final)}</td>
                      <td><Badge variant={situVar[m.situacao] || 'secondary'}>{m.situacao}</Badge></td>
                      <td>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => abrirResumoConta(m)}
                          title="Ver resumo da conta"
                          aria-label="Ver resumo da conta"
                          style={ICON_BUTTON_STYLE}
                        >
                          <ViewIcon />
                        </Button>
                        {m.situacao === 'pendente' && (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => {
                              setModal(m)
                              setPay((p) => ({ ...p, valor: m.valor_final }))
                            }}
                          >
                            Pagar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination meta={meta} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        title="Registrar Pagamento"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
            <Button type="submit" form="formPag" disabled={saving}>{saving ? 'Salvando...' : 'Confirmar pagamento'}</Button>
          </>
        }
      >
        <form id="formPag" onSubmit={pagar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Responsavel financeiro</label>
            <input className="form-control" value={modal?.contrato?.responsavel?.nome || '-'} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">Valor pago (R$)</label>
            <input type="number" step="0.01" className="form-control" required value={pay.valor} onChange={(e) => setPay((p) => ({ ...p, valor: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Forma de pagamento</label>
            <select className="form-control" value={pay.forma_pagamento} onChange={(e) => setPay((p) => ({ ...p, forma_pagamento: e.target.value }))}>
              <option value="pix">PIX</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="boleto">Boleto</option>
              <option value="cartao_credito">Cartao de credito</option>
              <option value="cartao_debito">Cartao de debito</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Data do recebimento</label>
            <input type="date" className="form-control" required value={pay.data_recebimento} onChange={(e) => setPay((p) => ({ ...p, data_recebimento: e.target.value }))} />
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!contaModal}
        onClose={() => setContaModal(null)}
        title="Resumo da conta"
        footer={
          <>
            <Button variant="secondary" onClick={() => setContaModal(null)}>Fechar</Button>
            <Button variant="secondary" onClick={imprimirResumo}>Imprimir</Button>
            <Button onClick={exportarComprovante} disabled={!ultimoRecebimentoAtivoId(contaModal) || loadingComprovante}>
              {loadingComprovante ? 'Gerando...' : 'Exportar PDF'}
            </Button>
          </>
        }
      >
        {contaModal && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div className="form-grid">
              <div><label className="form-label">Aluno</label><div>{contaModal.contrato?.matricula?.aluno?.nome || '-'}</div></div>
              <div><label className="form-label">Responsavel</label><div>{contaModal.contrato?.responsavel?.nome || '-'}</div></div>
              <div><label className="form-label">Plano</label><div>{contaModal.contrato?.plano?.nome || '-'}</div></div>
              <div><label className="form-label">Competencia</label><div>{contaModal.competencia ? new Date(contaModal.competencia).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' }) : '-'}</div></div>
              <div><label className="form-label">Vencimento</label><div>{contaModal.data_vencimento ? new Date(contaModal.data_vencimento).toLocaleDateString('pt-BR') : '-'}</div></div>
              <div><label className="form-label">Situacao</label><div><Badge variant={situVar[contaModal.situacao] || 'secondary'}>{contaModal.situacao}</Badge></div></div>
              <div><label className="form-label">Valor da conta</label><div style={{ fontWeight: 700 }}>{fmt(contaModal.valor_final)}</div></div>
              <div><label className="form-label">Total recebido</label><div style={{ fontWeight: 700 }}>{fmt(totalRecebidoAtivo(contaModal))}</div></div>
            </div>

            {!!contaModal?.recebimentos?.length && (
              <div>
                <label className="form-label">Recebimentos</label>
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                  <table>
                    <thead>
                      <tr><th>ID</th><th>Data</th><th>Forma</th><th>Valor</th><th>Status</th><th></th></tr>
                    </thead>
                    <tbody>
                      {contaModal.recebimentos.map((rec) => (
                        <tr key={rec.id}>
                          <td>#{rec.id}</td>
                          <td>{rec.data_recebimento ? new Date(rec.data_recebimento).toLocaleDateString('pt-BR') : '-'}</td>
                          <td>{String(rec.forma_pagamento || '-').replace('_', ' ')}</td>
                          <td style={{ fontWeight: 700 }}>{fmt(rec.valor)}</td>
                          <td>
                            {rec.estornado_em
                              ? <Badge variant="danger">Estornado</Badge>
                              : <Badge variant="success">Ativo</Badge>}
                          </td>
                          <td>
                            {!rec.estornado_em && (
                              <Button size="sm" variant="danger" onClick={() => estornarRecebimento(rec)}>
                                Estornar
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div>
              <label className="form-label">Historico da conta</label>
              {loadingHistorico ? (
                <Loading />
              ) : historicoConta.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Nenhum evento registrado.</div>
              ) : (
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 10, maxHeight: 180, overflow: 'auto', display: 'grid', gap: 8 }}>
                  {historicoConta.map((h, idx) => (
                    <div key={`${h.tipo}-${h.recebimento_id}-${idx}`} style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: 6 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{h.descricao}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {h.data ? new Date(h.data).toLocaleString('pt-BR') : '-'} | {h.usuario || '-'}
                        {h.valor ? ` | ${fmt(h.valor)}` : ''}
                        {h.motivo ? ` | Motivo: ${h.motivo}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {comprovanteUrl && (
              <div>
                <label className="form-label">Visualizacao do comprovante</label>
                <iframe
                  src={comprovanteUrl}
                  title="Comprovante em tela"
                  style={{ width: '100%', height: 420, border: '1px solid var(--border)', borderRadius: 8, background: '#fff' }}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
