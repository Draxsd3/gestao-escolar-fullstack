import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import { Loading, Card, Badge, EmptyState } from '../../components/ui'

export default function Inadimplentes() {
  const [data, setData]   = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { api.get('/financeiro/inadimplentes').then(r=>setData(r.data.data||r.data||[])).finally(()=>setLoading(false)) }, [])
  const fmt = v => `R$ ${Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}`
  return (
    <div>
      <div className="page-header"><div><div className="page-title">Inadimplentes</div><div className="page-sub">Alunos com mensalidades em atraso</div></div></div>
      <Card>
        {loading ? <Loading /> : data.length===0 ? <EmptyState icon="✅" title="Nenhum inadimplente" message="Todos os alunos estão em dia!" /> : (
          <div className="table-wrap"><table>
            <thead><tr><th>Aluno</th><th>Responsável</th><th>Meses em Atraso</th><th>Valor Total</th><th>Vencimento Mais Antigo</th></tr></thead>
            <tbody>{data.map((item,i)=>(
              <tr key={i}>
                <td style={{ fontWeight:600, color:'var(--text-primary)' }}>{item.aluno}</td>
                <td>{item.responsavel||'—'}</td>
                <td><Badge variant={item.meses>=3?'danger':'warning'}>{item.meses} {item.meses===1?'mês':'meses'}</Badge></td>
                <td style={{ fontFamily:'var(--mono)', fontWeight:700, color:'var(--danger)' }}>{fmt(item.valor_total)}</td>
                <td style={{ fontSize:12.5 }}>{item.vencimento_mais_antigo ? new Date(item.vencimento_mais_antigo).toLocaleDateString('pt-BR') : '—'}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </Card>
    </div>
  )
}
