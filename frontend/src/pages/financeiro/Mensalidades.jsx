import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import { Button, Badge, Loading, EmptyState, Pagination, Modal, Alert } from '../../components/ui'

export default function Mensalidades() {
  const [items, setItems] = useState([])
  const [meta, setMeta]   = useState(null)
  const [page, setPage]   = useState(1)
  const [loading, setLoading] = useState(true)
  const [situacao, setSituacao] = useState('')
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg]     = useState('')
  const [pay, setPay]     = useState({ valor:'', forma_pagamento:'pix', data_recebimento: new Date().toISOString().split('T')[0] })

  const fetch = async (p=1) => {
    setLoading(true)
    try {
      const r = await api.get('/financeiro/mensalidades', { params:{ page:p, situacao } })
      setItems(r.data.data||r.data); setMeta(r.data.meta||null)
    } finally { setLoading(false) }
  }
  useEffect(()=>{ setPage(1); fetch(1) }, [situacao])
  useEffect(()=>{ fetch(page) }, [page])

  const pagar = async e => {
    e.preventDefault(); setSaving(true)
    try { await api.post('/financeiro/recebimento', { mensalidade_id: modal.id, valor: Number(pay.valor), forma_pagamento: pay.forma_pagamento, data_recebimento: pay.data_recebimento }); setModal(null); fetch(page); setMsg('Pagamento registrado!') }
    catch { setMsg('Erro ao registrar.') }
    finally { setSaving(false) }
  }

  const fmt = v => `R$ ${Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}`
  const situVar = { pago:'success', pendente:'warning', parcial:'info', cancelado:'secondary', isento:'secondary' }

  return (
    <div>
      <div className="page-header"><div><div className="page-title">Mensalidades</div><div className="page-sub">Controle de mensalidades e recebimentos</div></div></div>
      {msg && <Alert variant="success" onClose={()=>setMsg('')}>{msg}</Alert>}
      <div className="card">
        <div className="filter-bar">
          <select className="form-control" style={{ maxWidth:180 }} value={situacao} onChange={e=>setSituacao(e.target.value)}>
            <option value="">Todas</option><option value="pendente">Pendente</option><option value="pago">Pago</option><option value="parcial">Parcial</option>
          </select>
        </div>
        {loading ? <Loading /> : items.length===0 ? <EmptyState icon="💳" title="Nenhuma mensalidade" /> : (
          <>
            <div className="table-wrap"><table>
              <thead><tr><th>Aluno</th><th>Competência</th><th>Vencimento</th><th>Valor</th><th>Situação</th><th></th></tr></thead>
              <tbody>{items.map(m=>(
                <tr key={m.id}>
                  <td style={{ fontWeight:500, color:'var(--text-primary)' }}>{m.contrato?.matricula?.aluno?.nome||'—'}</td>
                  <td style={{ fontFamily:'var(--mono)', fontSize:12 }}>{m.competencia ? new Date(m.competencia).toLocaleDateString('pt-BR',{month:'short',year:'numeric'}) : '—'}</td>
                  <td style={{ fontSize:12.5 }}>{m.data_vencimento ? new Date(m.data_vencimento).toLocaleDateString('pt-BR') : '—'}</td>
                  <td style={{ fontFamily:'var(--mono)', fontWeight:700 }}>{fmt(m.valor_final)}</td>
                  <td><Badge variant={situVar[m.situacao]||'secondary'}>{m.situacao}</Badge></td>
                  <td>{m.situacao==='pendente'&&<Button size="sm" variant="success" onClick={()=>{ setModal(m); setPay(p=>({...p,valor:m.valor_final})) }}>💳 Pagar</Button>}</td>
                </tr>
              ))}</tbody>
            </table></div>
            <Pagination meta={meta} onPageChange={setPage} />
          </>
        )}
      </div>
      <Modal isOpen={!!modal} onClose={()=>setModal(null)} title="Registrar Pagamento"
        footer={<><Button variant="secondary" onClick={()=>setModal(null)}>Cancelar</Button><Button type="submit" form="formPag" disabled={saving}>{saving?'Salvando...':'Confirmar Pagamento'}</Button></>}>
        <form id="formPag" onSubmit={pagar} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="form-group"><label className="form-label">Valor Pago (R$)</label>
            <input type="number" step="0.01" className="form-control" required value={pay.valor} onChange={e=>setPay(p=>({...p,valor:e.target.value}))} />
          </div>
          <div className="form-group"><label className="form-label">Forma de Pagamento</label>
            <select className="form-control" value={pay.forma_pagamento} onChange={e=>setPay(p=>({...p,forma_pagamento:e.target.value}))}>
              <option value="pix">PIX</option><option value="dinheiro">Dinheiro</option><option value="boleto">Boleto</option><option value="cartao_credito">Cartão de Crédito</option><option value="cartao_debito">Cartão de Débito</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">Data do Recebimento</label>
            <input type="date" className="form-control" required value={pay.data_recebimento} onChange={e=>setPay(p=>({...p,data_recebimento:e.target.value}))} />
          </div>
        </form>
      </Modal>
    </div>
  )
}
