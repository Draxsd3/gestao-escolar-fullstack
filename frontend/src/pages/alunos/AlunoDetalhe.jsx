import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { Button, Badge, Loading, Card } from '../../components/ui'

export default function AlunoDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [aluno, setAluno]   = useState(null)
  const [tab, setTab]       = useState('dados')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/alunos/${id}`).then(r=>setAluno(r.data)).finally(()=>setLoading(false))
  }, [id])

  if (loading) return <Loading />
  if (!aluno)  return <div style={{ color:'var(--text-muted)', padding:40, textAlign:'center' }}>Aluno não encontrado.</div>

  const end = typeof aluno.endereco === 'string' ? JSON.parse(aluno.endereco||'{}') : aluno.endereco||{}

  return (
    <div>
      <div className="page-header">
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,var(--accent),var(--accent-light))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:800, color:'#fff', flexShrink:0 }}>{aluno.nome[0]}</div>
          <div>
            <div className="page-title">{aluno.nome}</div>
            <div className="page-sub">ID #{aluno.id} · {aluno.cpf||'Sem CPF'}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Button variant="secondary" onClick={() => navigate('/alunos')}>← Voltar</Button>
          <Button onClick={() => navigate(`/alunos/${id}/editar`)}>✏ Editar</Button>
        </div>
      </div>

      <div className="tabs">
        {[['dados','👤 Dados'],['boletim','📊 Boletim'],['frequencia','✅ Frequência'],['responsaveis','👨‍👩‍👧 Responsáveis']].map(([k,l]) => (
          <button key={k} className={`tab-btn ${tab===k?'active':''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'dados' && (
        <div className="grid-2">
          <Card title="Informações Pessoais">
            {[['Nome',aluno.nome],['CPF',aluno.cpf],['RG',aluno.rg],['Nascimento',aluno.data_nascimento && new Date(aluno.data_nascimento).toLocaleDateString('pt-BR')],['Sexo',aluno.sexo==='M'?'Masculino':aluno.sexo==='F'?'Feminino':'Outro'],['E-mail',aluno.email],['Telefone',aluno.telefone]].map(([k,v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid var(--border-light)' }}>
                <span style={{ fontSize:12.5, color:'var(--text-muted)' }}>{k}</span>
                <span style={{ fontSize:13, fontWeight:500, color:'var(--text-primary)' }}>{v||'—'}</span>
              </div>
            ))}
          </Card>
          <Card title="Endereço">
            {[['Rua',end.rua],['Número',end.numero],['Bairro',end.bairro],['Cidade',end.cidade],['Estado',end.estado],['CEP',end.cep]].map(([k,v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid var(--border-light)' }}>
                <span style={{ fontSize:12.5, color:'var(--text-muted)' }}>{k}</span>
                <span style={{ fontSize:13, fontWeight:500, color:'var(--text-primary)' }}>{v||'—'}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab === 'boletim' && (
        <Card title="Boletim Escolar">
          {aluno.matriculas?.length ? aluno.matriculas.map(m => (
            <div key={m.id} style={{ marginBottom:20 }}>
              <div style={{ fontWeight:700, color:'var(--text-primary)', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
                <span>Turma {m.turma?.nome}</span>
                <Badge variant={m.situacao==='ativa'?'success':'secondary'}>{m.situacao}</Badge>
              </div>
              {m.medias_anuais?.length ? (
                <div className="table-wrap"><table>
                  <thead><tr><th>Disciplina</th><th>Média Final</th><th>Frequência</th><th>Situação</th></tr></thead>
                  <tbody>{m.medias_anuais.map((ma,i) => (
                    <tr key={i}>
                      <td style={{ fontWeight:500 }}>{ma.disciplina?.nome}</td>
                      <td style={{ fontFamily:'var(--mono)', fontWeight:700, color: ma.media_final>=7?'var(--success)':ma.media_final>=5?'var(--warning)':'var(--danger)' }}>{ma.media_final}</td>
                      <td>{ma.frequencia_pct}%</td>
                      <td><Badge variant={ma.situacao==='aprovado'?'success':ma.situacao==='reprovado'?'danger':'warning'}>{ma.situacao}</Badge></td>
                    </tr>
                  ))}</tbody>
                </table></div>
              ) : <div style={{ color:'var(--text-muted)', fontSize:13 }}>Sem médias lançadas.</div>}
            </div>
          )) : <div style={{ color:'var(--text-muted)', fontSize:13 }}>Nenhuma matrícula ativa.</div>}
        </Card>
      )}

      {tab === 'frequencia' && (
        <Card title="Frequência por Disciplina">
          <div style={{ color:'var(--text-muted)', fontSize:13 }}>Dados de frequência serão exibidos aqui.</div>
        </Card>
      )}

      {tab === 'responsaveis' && (
        <Card title="Responsáveis">
          {aluno.responsaveis?.length ? aluno.responsaveis.map(r => (
            <div key={r.id} style={{ padding:'12px 14px', background:'var(--bg-input)', borderRadius:'var(--radius)', marginBottom:8, border:'1px solid var(--border-light)', display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(26,109,212,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>👤</div>
              <div>
                <div style={{ fontWeight:600, color:'var(--text-primary)' }}>{r.nome}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>{r.pivot?.parentesco} · {r.telefone}</div>
              </div>
              {r.pivot?.responsavel_financeiro && <Badge variant="primary" style={{ marginLeft:'auto' }}>Financeiro</Badge>}
            </div>
          )) : <div style={{ color:'var(--text-muted)', fontSize:13 }}>Nenhum responsável cadastrado.</div>}
        </Card>
      )}
    </div>
  )
}
