import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import { StatCard, Loading, Card } from '../../components/ui'

export default function FinanceiroDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { api.get('/financeiro/resumo').then(r=>{
    const d = r.data
    setData({
      recebido_mes: d.total_recebido ?? d.recebido_mes ?? 0,
      a_receber: d.total_a_receber ?? d.a_receber ?? 0,
      inadimplente: d.total_inadimplencia ?? d.inadimplente ?? 0,
      total_contratos: d.qtd_inadimplentes ?? d.total_contratos ?? 0,
      ...d,
    })
  }).catch(()=>setData({})).finally(()=>setLoading(false)) }, [])
  if (loading) return <Loading />
  const fmt = v => v ? `R$ ${Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2})}` : 'R$ 0,00'
  return (
    <div>
      <div className="page-header"><div><div className="page-title">Financeiro</div><div className="page-sub">Resumo financeiro do mês atual</div></div></div>
      <div className="stat-grid">
        <StatCard label="Recebido no Mês"  value={fmt(data?.recebido_mes)}    icon="💰" iconBg="rgba(34,211,165,.15)"  color="var(--success)" />
        <StatCard label="A Receber"         value={fmt(data?.a_receber)}       icon="📅" iconBg="rgba(56,189,248,.15)"  color="var(--info)" />
        <StatCard label="Inadimplente"      value={fmt(data?.inadimplente)}    icon="⚠️" iconBg="rgba(244,63,94,.15)"  color="var(--danger)" />
        <StatCard label="Total Contratos"   value={data?.total_contratos||0}   icon="📋" iconBg="rgba(26,109,212,.15)" />
      </div>
      {data?.inadimplentes_lista?.length > 0 && (
        <Card title="Maiores Inadimplentes">
          <div className="table-wrap"><table>
            <thead><tr><th>Aluno</th><th>Meses em Atraso</th><th>Valor Total</th></tr></thead>
            <tbody>{data.inadimplentes_lista.map((item,i)=>(
              <tr key={i}>
                <td style={{ fontWeight:500, color:'var(--text-primary)' }}>{item.aluno}</td>
                <td style={{ fontFamily:'var(--mono)', color:'var(--warning)' }}>{item.meses}</td>
                <td style={{ fontFamily:'var(--mono)', fontWeight:700, color:'var(--danger)' }}>{fmt(item.valor)}</td>
              </tr>
            ))}</tbody>
          </table></div>
        </Card>
      )}
    </div>
  )
}
