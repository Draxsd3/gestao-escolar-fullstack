import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { Loading, Card, Badge } from '../../components/ui'

function StatBox({ label, value, icon, color, bg }) {
  return (
    <div style={{ background:'#fff', border:'1px solid rgba(26,109,212,.09)', borderRadius:14, padding:'20px 22px', boxShadow:'0 1px 4px rgba(26,109,212,.06)', display:'flex', alignItems:'center', gap:16, transition:'all .16s' }}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 6px 20px rgba(26,109,212,.1)'}}
      onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 1px 4px rgba(26,109,212,.06)'}}>
      <div style={{ width:46, height:46, borderRadius:12, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize:24, fontWeight:800, color:'var(--text-primary)', letterSpacing:'-1px', fontFamily:'var(--mono)' }}>{value ?? '—'}</div>
        <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.8px', marginTop:2 }}>{label}</div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { usuario } = useAuth()
  const navigate    = useNavigate()
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const perfil = usuario?.perfil

  useEffect(() => {
    const ep = ['admin','secretaria','coordenacao'].includes(perfil) ? '/dashboard/admin'
             : perfil === 'professor' ? '/dashboard/professor'
             : perfil === 'responsavel' ? '/dashboard/responsavel' : '/dashboard/admin'
    api.get(ep).then(r => {
      const d = r.data
      setData({
        totalAlunos: d.total_alunos ?? d.totalAlunos ?? 0,
        totalMatriculas: d.total_matriculas ?? d.totalMatriculas ?? 0,
        totalTurmas: d.total_turmas ?? d.totalTurmas ?? 0,
        totalProfessores: d.total_professores ?? d.totalProfessores ?? 0,
        recebidoMes: d.recebido_mes ?? d.recebidoMes ?? 0,
        inadimplentes: d.inadimplentes ?? 0,
        comunicados: d.comunicados_recentes ?? d.comunicados ?? [],
        turmas: d.turmas_disciplinas ?? d.turmas ?? [],
        ...d,
      })
    }).catch(()=>setData({})).finally(()=>setLoading(false))
  }, [])

  if (loading) return <Loading />

  const fmt = v => v ? `R$ ${Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2})}` : 'R$ 0,00'

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-sub">Bom dia, <strong>{usuario?.nome?.split(' ')[0]}</strong>! Aqui está o resumo do sistema.</div>
        </div>
        <div style={{ padding:'6px 14px', background:'var(--blue-100)', borderRadius:99, fontSize:12, fontWeight:700, color:'var(--accent)', border:'1px solid var(--accent-border)' }}>
          {perfil}
        </div>
      </div>

      {/* Stats — admin/secretaria */}
      {['admin','secretaria'].includes(perfil) && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:16, marginBottom:28 }}>
            <StatBox label="Alunos Ativos"   value={data?.totalAlunos}      color="#1a6dd4" bg="rgba(26,109,212,.08)" icon={<IcoAlunos />} />
            <StatBox label="Matrículas"       value={data?.totalMatriculas}  color="#0284c7" bg="rgba(2,132,199,.08)"  icon={<IcoMatriculas />} />
            <StatBox label="Turmas Ativas"    value={data?.totalTurmas}      color="#059669" bg="rgba(5,150,105,.08)"  icon={<IcoTurmas />} />
            <StatBox label="Professores"      value={data?.totalProfessores} color="#d97706" bg="rgba(217,119,6,.08)"  icon={<IcoProfessores />} />
            <StatBox label="Recebido no Mês"  value={fmt(data?.recebidoMes)} color="#059669" bg="rgba(5,150,105,.08)"  icon={<IcoReceita />} />
            <StatBox label="Inadimplentes"    value={data?.inadimplentes}    color="#dc2626" bg="rgba(220,38,38,.08)"  icon={<IcoAlerta />} />
          </div>

          {/* Acesso rápido */}
          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', letterSpacing:'1.5px', textTransform:'uppercase', fontFamily:'var(--mono)', marginBottom:14 }}>Acesso Rápido</div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {[
                { label:'Matricular Aluno',    to:'/matriculas',   color:'#1a6dd4' },
                { label:'Lançar Notas',        to:'/notas',        color:'#d97706' },
                { label:'Frequência',          to:'/frequencia',   color:'#059669' },
                { label:'Mensalidades',        to:'/financeiro/mensalidades', color:'#0284c7' },
                { label:'Gestão Geral',        to:'/gestao-geral', color:'#1a6dd4' },
              ].map(a => (
                <button key={a.to} onClick={() => navigate(a.to)}
                  style={{ padding:'8px 18px', borderRadius:99, background:'#fff', border:`1px solid ${a.color}30`, color:a.color, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'var(--font)', transition:'all .14s', boxShadow:'0 1px 3px rgba(0,0,0,.05)' }}
                  onMouseEnter={e=>{e.currentTarget.style.background=a.color;e.currentTarget.style.color='#fff'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='#fff';e.currentTarget.style.color=a.color}}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Comunicados */}
          {data?.comunicados?.length > 0 && (
            <Card title="Comunicados Recentes">
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {data.comunicados.map(c => (
                  <div key={c.id} style={{ padding:'12px 16px', background:'var(--bg-base)', borderRadius:10, display:'flex', gap:12, alignItems:'center', border:'1px solid var(--border-light)' }}>
                    <div style={{ width:36, height:36, borderRadius:9, background:'var(--blue-100)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--accent)', flexShrink:0 }}>
                      <IcoComunicado />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, color:'var(--text-primary)', fontSize:13.5 }}>{c.titulo}</div>
                      <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>
                        Para: {c.publico_alvo} · {c.publicado_em ? new Date(c.publicado_em).toLocaleDateString('pt-BR') : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Professor */}
      {perfil === 'professor' && (
        <Card title="Minhas Turmas">
          {data?.turmas?.length ? (
            <div className="table-wrap"><table>
              <thead><tr><th>Turma</th><th>Curso</th><th>Disciplina</th></tr></thead>
              <tbody>{data.turmas.map((t,i)=>(
                <tr key={i}><td style={{fontWeight:600}}>{t.turma}</td><td>{t.curso}</td><td>{t.disciplina}</td></tr>
              ))}</tbody>
            </table></div>
          ) : <div style={{color:'var(--text-muted)',fontSize:13,padding:'12px 0'}}>Nenhuma turma atribuída.</div>}
        </Card>
      )}

      {/* Aluno */}
      {perfil === 'aluno' && (
        <Card title="Minha Matrícula">
          {data?.matriculaAtiva ? (
            <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
              {[['Turma',data.matriculaAtiva.turma?.nome],['Curso',data.matriculaAtiva.turma?.curso?.nome]].map(([k,v])=>(
                <div key={k}>
                  <div style={{fontSize:11,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:4,fontFamily:'var(--mono)'}}>{k}</div>
                  <div style={{fontWeight:700,color:'var(--text-primary)',fontSize:15}}>{v||'—'}</div>
                </div>
              ))}
              <div>
                <div style={{fontSize:11,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:4,fontFamily:'var(--mono)'}}>Situação</div>
                <Badge variant="success">{data.matriculaAtiva.situacao}</Badge>
              </div>
            </div>
          ) : <div style={{color:'var(--text-muted)',fontSize:13}}>Nenhuma matrícula ativa.</div>}
        </Card>
      )}
    </div>
  )
}

function IcoAlunos()     { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> }
function IcoMatriculas() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg> }
function IcoTurmas()     { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> }
function IcoProfessores(){ return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> }
function IcoReceita()    { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> }
function IcoAlerta()     { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> }
function IcoComunicado() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> }
