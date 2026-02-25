import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { Button, Badge, Loading, Card } from '../../components/ui'
import { ICON_BUTTON_STYLE, EditIcon, ViewIcon, PowerIcon, DeleteIcon } from '../../components/ui/actionIcons'

/* ── Utilitários de senha ─────────────────────────────────── */
function gerarSenha() {
  const upper   = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower   = 'abcdefghjkmnpqrstuvwxyz'
  const digits  = '23456789'
  const special = '!@#$%&*'
  const all     = upper + lower + digits + special
  let senha = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ]
  for (let i = 4; i < 10; i++) {
    senha.push(all[Math.floor(Math.random() * all.length)])
  }
  return senha.sort(() => Math.random() - 0.5).join('')
}

function CampoSenha({ value, onChange, onGerar }) {
  const [mostrar, setMostrar] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const copiar = () => {
    if (!value) return
    navigator.clipboard.writeText(value).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    })
  }

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <div style={{ position: 'relative', flex: 1 }}>
        <input
          className="form-control"
          type={mostrar ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Senha de acesso"
          style={{ paddingRight: 36, fontFamily: 'var(--mono)' }}
        />
        <button
          type="button"
          onClick={() => setMostrar(s => !s)}
          title={mostrar ? 'Ocultar' : 'Mostrar'}
          style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 15, lineHeight: 1 }}
        >
          {mostrar ? '🙈' : '👁'}
        </button>
      </div>
      <button
        type="button"
        onClick={onGerar}
        title="Gerar senha aleatória"
        style={{ padding: '0 10px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-input)', cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}
      >
        ⟳ Gerar
      </button>
      <button
        type="button"
        onClick={copiar}
        disabled={!value}
        title="Copiar senha"
        style={{ padding: '0 10px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: copiado ? 'var(--success)' : 'var(--bg-input)', cursor: value ? 'pointer' : 'not-allowed', fontSize: 13, color: copiado ? '#fff' : 'var(--text-secondary)', transition: 'all .2s' }}
      >
        {copiado ? '✓ Copiado' : '⎘ Copiar'}
      </button>
    </div>
  )
}

/* ── Modal base ───────────────────────────────────────────── */
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
      <div style={{ background:'var(--bg-card)', borderRadius:'var(--radius-lg)', padding:28, width:'100%', maxWidth:480, boxShadow:'0 20px 60px rgba(0,0,0,.25)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>{title}</div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'var(--text-muted)', lineHeight:1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ── Componente principal ─────────────────────────────────── */
export default function AlunoDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [aluno, setAluno]     = useState(null)
  const [tab, setTab]         = useState('dados')
  const [loading, setLoading] = useState(true)

  // Estados dos modais de acesso
  const [modalGerar, setModalGerar]   = useState(false)
  const [modalSenha, setModalSenha]   = useState(false)
  const [emailAcesso, setEmailAcesso] = useState('')
  const [senhaAcesso, setSenhaAcesso] = useState('')
  const [trocarSenha, setTrocarSenha] = useState(true)
  const [novaSenha, setNovaSenha]     = useState('')
  const [salvando, setSalvando]       = useState(false)
  const [erroAcesso, setErroAcesso]   = useState('')

  const recarregar = useCallback(() => {
    setLoading(true)
    api.get(`/alunos/${id}`).then(r => setAluno(r.data)).finally(() => setLoading(false))
  }, [id])

  useEffect(() => { recarregar() }, [recarregar])

  const abrirModalGerar = () => {
    setEmailAcesso(aluno?.email || '')
    setSenhaAcesso(gerarSenha())
    setTrocarSenha(true)
    setErroAcesso('')
    setModalGerar(true)
  }

  const abrirModalSenha = () => {
    setNovaSenha(gerarSenha())
    setErroAcesso('')
    setModalSenha(true)
  }

  const confirmarGerarAcesso = async () => {
    if (!emailAcesso) { setErroAcesso('Informe o e-mail de acesso.'); return }
    if (!senhaAcesso || senhaAcesso.length < 8) { setErroAcesso('Senha deve ter no mínimo 8 caracteres.'); return }
    setSalvando(true); setErroAcesso('')
    try {
      await api.post(`/alunos/${id}/acesso`, {
        email: emailAcesso,
        senha: senhaAcesso,
        trocar_senha: trocarSenha,
      })
      setModalGerar(false)
      alert(`✅ Acesso gerado!\n\nE-mail: ${emailAcesso}\nSenha: ${senhaAcesso}\n\n⚠️ Guarde a senha — ela não será exibida novamente.`)
      recarregar()
    } catch (err) {
      setErroAcesso(err.response?.data?.message || 'Erro ao gerar acesso.')
    } finally { setSalvando(false) }
  }

  const confirmarRedefinirSenha = async () => {
    if (!novaSenha || novaSenha.length < 8) { setErroAcesso('Senha deve ter no mínimo 8 caracteres.'); return }
    setSalvando(true); setErroAcesso('')
    try {
      await api.patch(`/alunos/${id}/credenciais`, { nova_senha: novaSenha })
      setModalSenha(false)
      alert(`✅ Senha redefinida!\n\nNova senha: ${novaSenha}\n\n⚠️ Guarde a senha — ela não será exibida novamente.`)
    } catch (err) {
      setErroAcesso(err.response?.data?.message || 'Erro ao redefinir senha.')
    } finally { setSalvando(false) }
  }

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
          <Button onClick={() => navigate(`/alunos/${id}/editar`)} title="Editar" style={ICON_BUTTON_STYLE}><EditIcon /></Button>
        </div>
      </div>

      <div className="tabs">
        {[['dados','👤 Dados'],['boletim','📊 Boletim'],['frequencia','✅ Frequência'],['responsaveis','👨‍👩‍👧 Responsáveis'],['acesso','🔑 Acesso']].map(([k,l]) => (
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

      {/* ── Aba Acesso ── */}
      {tab === 'acesso' && (
        <div style={{ maxWidth: 560 }}>
          {aluno.usuario ? (
            <Card title="Acesso ao Portal">
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, padding:'12px 14px', background:'rgba(16,185,129,.08)', borderRadius:'var(--radius)', border:'1px solid rgba(16,185,129,.25)' }}>
                <span style={{ fontSize:20 }}>✅</span>
                <div>
                  <div style={{ fontWeight:600, color:'var(--success)', fontSize:13.5 }}>Acesso Ativo</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>O aluno pode fazer login no portal.</div>
                </div>
              </div>

              {[
                ['E-mail de acesso', aluno.usuario.email],
                ['Perfil', 'Aluno'],
                ['Último login', aluno.usuario.ultimo_login
                  ? new Date(aluno.usuario.ultimo_login).toLocaleString('pt-BR')
                  : 'Nunca acessou'],
              ].map(([k, v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid var(--border-light)' }}>
                  <span style={{ fontSize:12.5, color:'var(--text-muted)' }}>{k}</span>
                  <span style={{ fontSize:13, fontWeight:500, color:'var(--text-primary)', fontFamily: k === 'E-mail de acesso' ? 'var(--mono)' : undefined }}>{v}</span>
                </div>
              ))}

              <div style={{ marginTop:20 }}>
                <Button variant="secondary" onClick={abrirModalSenha}>
                  🔑 Redefinir Senha
                </Button>
              </div>
            </Card>
          ) : (
            <Card title="Acesso ao Portal">
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, padding:'12px 14px', background:'rgba(100,116,139,.08)', borderRadius:'var(--radius)', border:'1px solid rgba(100,116,139,.2)' }}>
                <span style={{ fontSize:20 }}>🔓</span>
                <div>
                  <div style={{ fontWeight:600, color:'var(--text-secondary)', fontSize:13.5 }}>Sem acesso ao sistema</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>Este aluno ainda não possui login no portal.</div>
                </div>
              </div>
              <Button onClick={abrirModalGerar}>
                Gerar Acesso ao Portal
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* ── Modal: Gerar Acesso ── */}
      {modalGerar && (
        <Modal title="Gerar Acesso ao Portal" onClose={() => setModalGerar(false)}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="form-group">
              <label className="form-label">E-mail de acesso *</label>
              <input
                type="email"
                className="form-control"
                value={emailAcesso}
                onChange={e => setEmailAcesso(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Senha temporária *</label>
              <CampoSenha
                value={senhaAcesso}
                onChange={setSenhaAcesso}
                onGerar={() => setSenhaAcesso(gerarSenha())}
              />
              <div style={{ fontSize:11.5, color:'var(--text-muted)', marginTop:4 }}>
                Copie a senha antes de confirmar — ela não será exibida novamente.
              </div>
            </div>

            <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', userSelect:'none' }}>
              <input
                type="checkbox"
                checked={trocarSenha}
                onChange={e => setTrocarSenha(e.target.checked)}
                style={{ width:16, height:16, accentColor:'var(--accent)', cursor:'pointer' }}
              />
              <span style={{ fontSize:13, color:'var(--text-secondary)' }}>
                Obrigar troca de senha no primeiro acesso
              </span>
            </label>

            {erroAcesso && (
              <div style={{ padding:'10px 12px', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.25)', borderRadius:'var(--radius)', fontSize:13, color:'var(--danger)' }}>
                ⚠ {erroAcesso}
              </div>
            )}

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
              <Button variant="secondary" onClick={() => setModalGerar(false)}>Cancelar</Button>
              <Button onClick={confirmarGerarAcesso} disabled={salvando}>
                {salvando ? '⏳ Gerando...' : '✓ Confirmar'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modal: Redefinir Senha ── */}
      {modalSenha && (
        <Modal title="Redefinir Senha do Aluno" onClose={() => setModalSenha(false)}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ fontSize:13, color:'var(--text-muted)', padding:'10px 12px', background:'var(--bg-input)', borderRadius:'var(--radius)', border:'1px solid var(--border-light)' }}>
              Aluno: <strong style={{ color:'var(--text-primary)' }}>{aluno.nome}</strong><br/>
              E-mail: <span style={{ fontFamily:'var(--mono)' }}>{aluno.usuario?.email}</span>
            </div>

            <div className="form-group">
              <label className="form-label">Nova senha *</label>
              <CampoSenha
                value={novaSenha}
                onChange={setNovaSenha}
                onGerar={() => setNovaSenha(gerarSenha())}
              />
              <div style={{ fontSize:11.5, color:'var(--text-muted)', marginTop:4 }}>
                Copie a senha antes de confirmar — ela não será exibida novamente.
              </div>
            </div>

            {erroAcesso && (
              <div style={{ padding:'10px 12px', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.25)', borderRadius:'var(--radius)', fontSize:13, color:'var(--danger)' }}>
                ⚠ {erroAcesso}
              </div>
            )}

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
              <Button variant="secondary" onClick={() => setModalSenha(false)}>Cancelar</Button>
              <Button onClick={confirmarRedefinirSenha} disabled={salvando}>
                {salvando ? '⏳ Salvando...' : '🔑 Redefinir Senha'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
