import React, { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import { Button, Badge, Loading, EmptyState, Pagination, Modal, Alert } from '../../components/ui'

// ── Paleta por perfil ──────────────────────────────────────
const PERFIL_META = {
  admin:       { icon:'🛡️', color:'var(--accent-light)',  bg:'var(--accent-soft)',       badge:'primary'   },
  secretaria:  { icon:'📁', color:'var(--info)',           bg:'var(--info-soft)',         badge:'info'      },
  coordenacao: { icon:'🎯', color:'var(--warning)',        bg:'var(--warning-soft)',      badge:'warning'   },
  professor:   { icon:'📐', color:'var(--success)',        bg:'var(--success-soft)',      badge:'success'   },
  responsavel: { icon:'👨‍👩‍👧', color:'#f472b6',             bg:'rgba(244,114,182,0.1)',    badge:'secondary' },
  aluno:       { icon:'🎓', color:'var(--danger)',         bg:'var(--danger-soft)',       badge:'danger'    },
}

const CAMPOS_EXTRAS = {
  professor: [
    { key:'cpf',            label:'CPF',             placeholder:'000.000.000-00', required:false },
    { key:'formacao',       label:'Formação',        placeholder:'Ex: Lic. Matemática - USP', required:false },
    { key:'especializacao', label:'Especialização',  placeholder:'Ex: Mestrado em Educação', required:false },
  ],
  aluno: [
    { key:'cpf',              label:'CPF',              placeholder:'000.000.000-00', required:false },
    { key:'data_nascimento',  label:'Data de Nascimento', type:'date',               required:true  },
    { key:'sexo',             label:'Sexo',             type:'select',               required:false,
      options:[{v:'M',l:'Masculino'},{v:'F',l:'Feminino'},{v:'O',l:'Outro'}] },
  ],
  secretaria:  [{ key:'cpf', label:'CPF', placeholder:'000.000.000-00', required:false }],
  coordenacao: [{ key:'cpf', label:'CPF', placeholder:'000.000.000-00', required:false }],
  admin:       [],
  responsavel: [],
}

const FORM_VAZIO = { nome:'', email:'', senha:'', perfil_id:'', cpf:'', formacao:'', especializacao:'', data_nascimento:'', sexo:'M' }

export default function GestaoUsuarios() {
  const [usuarios, setUsuarios]     = useState([])
  const [meta, setMeta]             = useState(null)
  const [perfis, setPerfis]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [page, setPage]             = useState(1)
  const [busca, setBusca]           = useState('')
  const [filtroPerfil, setFiltroPerfil] = useState('')

  // Modais
  const [modalCriar, setModalCriar]     = useState(false)
  const [modalEditar, setModalEditar]   = useState(null)   // usuário selecionado
  const [modalSenha, setModalSenha]     = useState(null)   // usuário selecionado
  const [modalConfirm, setModalConfirm] = useState(null)   // {id, nome, ativo}

  const [form, setForm]           = useState(FORM_VAZIO)
  const [novaSenha, setNovaSenha] = useState('')
  const [saving, setSaving]       = useState(false)
  const [msg, setMsg]             = useState({ type:'', text:'' })

  // ── Fetch ──────────────────────────────────────────────────
  const fetch = useCallback(async (p=1) => {
    setLoading(true)
    try {
      const r = await api.get('/usuarios', { params:{ page:p, busca, perfil_id: filtroPerfil } })
      setUsuarios(r.data.data || r.data)
      setMeta(r.data.meta || null)
    } finally { setLoading(false) }
  }, [busca, filtroPerfil])

  useEffect(() => { api.get('/usuarios/perfis').then(r => setPerfis(r.data)).catch(()=>{}) }, [])
  useEffect(() => { setPage(1); fetch(1) }, [busca, filtroPerfil])
  useEffect(() => { fetch(page) }, [page])

  const toast = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg({ type:'', text:'' }), 4000) }
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // ── Perfil selecionado no form ─────────────────────────────
  const perfilSelecionado = perfis.find(p => String(p.id) === String(form.perfil_id))
  const camposExtras = CAMPOS_EXTRAS[perfilSelecionado?.nome] || []
  const metaPerfil = PERFIL_META[perfilSelecionado?.nome] || {}

  // ── Criar ──────────────────────────────────────────────────
  const handleCriar = async e => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/usuarios', form)
      toast('success', `✓ Usuário "${form.nome}" criado com sucesso!`)
      setModalCriar(false)
      setForm(FORM_VAZIO)
      fetch(1)
    } catch(err) {
      toast('error', err.response?.data?.message || 'Erro ao criar usuário.')
    } finally { setSaving(false) }
  }

  // ── Editar ─────────────────────────────────────────────────
  const abrirEditar = u => {
    setModalEditar(u)
    setForm({ nome: u.nome, email: u.email, perfil_id: u.perfil_id, senha:'', cpf:'', formacao:'', especializacao:'', data_nascimento:'', sexo:'M' })
  }

  const handleEditar = async e => {
    e.preventDefault(); setSaving(true)
    try {
      await api.put(`/usuarios/${modalEditar.id}`, { nome: form.nome, email: form.email, perfil_id: form.perfil_id })
      toast('success', '✓ Usuário atualizado.')
      setModalEditar(null)
      fetch(page)
    } catch(err) {
      toast('error', err.response?.data?.message || 'Erro ao atualizar.')
    } finally { setSaving(false) }
  }

  // ── Resetar senha ──────────────────────────────────────────
  const handleResetSenha = async e => {
    e.preventDefault(); setSaving(true)
    try {
      await api.patch(`/usuarios/${modalSenha.id}/senha`, { nova_senha: novaSenha })
      toast('success', `✓ Senha de "${modalSenha.nome}" resetada.`)
      setModalSenha(null)
      setNovaSenha('')
    } catch(err) {
      toast('error', err.response?.data?.message || 'Erro ao resetar senha.')
    } finally { setSaving(false) }
  }

  // ── Toggle ativo ───────────────────────────────────────────
  const handleToggle = async () => {
    try {
      await api.patch(`/usuarios/${modalConfirm.id}/toggle`)
      toast('success', `✓ Usuário ${modalConfirm.ativo ? 'desativado' : 'ativado'}.`)
      setModalConfirm(null)
      fetch(page)
    } catch { toast('error', 'Erro ao alterar status.') }
  }

  // ── Stats rápidas ──────────────────────────────────────────
  const totalPorPerfil = perfis.map(p => ({
    ...p,
    total: usuarios.filter(u => u.perfil_id === p.id).length
  }))

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Gestão de Usuários</div>
          <div className="page-sub">
            Crie e gerencie todos os usuários do sistema
            <span style={{ marginLeft:8, padding:'2px 8px', background:'rgba(244,63,94,.12)', color:'var(--danger)', borderRadius:99, fontSize:11, fontWeight:700, border:'1px solid rgba(244,63,94,.25)' }}>
              ⚠ Área de Homologação
            </span>
          </div>
        </div>
        <Button onClick={() => { setForm(FORM_VAZIO); setModalCriar(true) }}>
          + Criar Usuário
        </Button>
      </div>

      {/* Toast */}
      {msg.text && (
        <Alert variant={msg.type === 'success' ? 'success' : 'error'} onClose={() => setMsg({ type:'', text:'' })}>
          {msg.text}
        </Alert>
      )}

      {/* Chips de resumo por perfil */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
        {perfis.map(p => {
          const m = PERFIL_META[p.nome] || {}
          const total = meta?.total ? undefined : usuarios.filter(u => u.perfil_id === p.id).length
          return (
            <button
              key={p.id}
              onClick={() => setFiltroPerfil(filtroPerfil === String(p.id) ? '' : String(p.id))}
              style={{
                display:'flex', alignItems:'center', gap:6, padding:'6px 14px',
                borderRadius:99, border:'1px solid', cursor:'pointer',
                fontFamily:'var(--font)', fontSize:12, fontWeight:600,
                transition:'all .15s',
                background: filtroPerfil === String(p.id) ? m.bg : 'transparent',
                color: filtroPerfil === String(p.id) ? m.color : 'var(--text-muted)',
                borderColor: filtroPerfil === String(p.id) ? m.color : 'var(--border)',
              }}
            >
              {m.icon} {p.nome}
            </button>
          )
        })}
        {filtroPerfil && (
          <button onClick={() => setFiltroPerfil('')} style={{ padding:'6px 12px', borderRadius:99, border:'1px solid var(--border)', background:'transparent', color:'var(--text-muted)', cursor:'pointer', fontSize:12, fontFamily:'var(--font)' }}>
            ✕ Limpar filtro
          </button>
        )}
      </div>

      {/* Tabela */}
      <div className="card">
        <div className="filter-bar">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="form-control"
              placeholder="Buscar por nome ou e-mail..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>
        </div>

        {loading ? <Loading /> : usuarios.length === 0 ? (
          <EmptyState icon="👤" title="Nenhum usuário encontrado" message="Tente outra busca ou crie um novo usuário." />
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Usuário</th>
                    <th>E-mail</th>
                    <th>Perfil</th>
                    <th>Status</th>
                    <th>Último Login</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(u => {
                    const m = PERFIL_META[u.perfil?.nome] || {}
                    return (
                      <tr key={u.id}>
                        <td style={{ fontFamily:'var(--mono)', fontSize:11, color:'var(--text-muted)' }}>{u.id}</td>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{ width:34, height:34, borderRadius:'50%', background: m.bg||'var(--accent-soft)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0, border:`1px solid ${m.color||'var(--border)'}33` }}>
                              {m.icon || '👤'}
                            </div>
                            <div>
                              <div style={{ fontWeight:600, color:'var(--text-primary)', fontSize:13.5 }}>{u.nome}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize:13, color:'var(--text-secondary)' }}>{u.email}</td>
                        <td>
                          <Badge variant={m.badge || 'secondary'}>
                            {m.icon} {u.perfil?.nome || '—'}
                          </Badge>
                        </td>
                        <td>
                          <button
                            onClick={() => setModalConfirm({ id:u.id, nome:u.nome, ativo:u.ativo })}
                            style={{
                              background: u.ativo ? 'var(--success-soft)' : 'var(--danger-soft)',
                              color: u.ativo ? 'var(--success)' : 'var(--danger)',
                              border: `1px solid ${u.ativo ? 'rgba(34,211,165,.25)' : 'rgba(244,63,94,.25)'}`,
                              borderRadius:99, padding:'3px 10px', fontSize:11.5,
                              fontWeight:700, cursor:'pointer', fontFamily:'var(--font)',
                              transition:'all .14s',
                            }}
                            title="Clique para alterar status"
                          >
                            {u.ativo ? '● Ativo' : '○ Inativo'}
                          </button>
                        </td>
                        <td style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'var(--mono)' }}>
                          {u.ultimo_login ? new Date(u.ultimo_login).toLocaleDateString('pt-BR') : '—'}
                        </td>
                        <td>
                          <div style={{ display:'flex', gap:5 }}>
                            <Button variant="ghost" size="sm" onClick={() => abrirEditar(u)} title="Editar" style={{ fontSize: 18, lineHeight: 1 }}>✎</Button>
                            <Button variant="ghost" size="sm" onClick={() => { setModalSenha(u); setNovaSenha('') }} title="Resetar senha">🔑</Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Pagination meta={meta} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* ══ MODAL: Criar Usuário ══════════════════════════════ */}
      <Modal
        isOpen={modalCriar}
        onClose={() => setModalCriar(false)}
        title="Criar Novo Usuário"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalCriar(false)}>Cancelar</Button>
            <Button type="submit" form="formCriar" disabled={saving}>
              {saving ? '⏳ Criando...' : '✓ Criar Usuário'}
            </Button>
          </>
        }
      >
        <form id="formCriar" onSubmit={handleCriar} style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* Preview do perfil selecionado */}
          {perfilSelecionado && (
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background: metaPerfil.bg||'var(--accent-soft)', borderRadius:'var(--radius)', border:`1px solid ${metaPerfil.color||'var(--accent)'}33`, marginBottom:2 }}>
              <span style={{ fontSize:22 }}>{metaPerfil.icon}</span>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color: metaPerfil.color||'var(--text-primary)' }}>
                  {perfilSelecionado.nome}
                </div>
                <div style={{ fontSize:11.5, color:'var(--text-muted)' }}>{perfilSelecionado.descricao}</div>
              </div>
            </div>
          )}

          {/* Campos base */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div className="form-group" style={{ gridColumn:'1/-1' }}>
              <label className="form-label">Nome Completo *</label>
              <input className="form-control" required value={form.nome} onChange={e => setF('nome', e.target.value)} placeholder="Nome completo" />
            </div>
            <div className="form-group">
              <label className="form-label">E-mail *</label>
              <input type="email" className="form-control" required value={form.email} onChange={e => setF('email', e.target.value)} placeholder="email@escola.edu.br" />
            </div>
            <div className="form-group">
              <label className="form-label">Senha *</label>
              <input type="password" className="form-control" required minLength={6} value={form.senha} onChange={e => setF('senha', e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
            <div className="form-group" style={{ gridColumn:'1/-1' }}>
              <label className="form-label">Perfil de Acesso *</label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:4 }}>
                {perfis.map(p => {
                  const m = PERFIL_META[p.nome] || {}
                  const sel = String(form.perfil_id) === String(p.id)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setF('perfil_id', p.id)}
                      style={{
                        display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                        padding:'10px 8px', borderRadius:'var(--radius)', border:'1px solid',
                        cursor:'pointer', transition:'all .15s', fontFamily:'var(--font)',
                        background: sel ? m.bg||'var(--accent-soft)' : 'var(--bg-input)',
                        borderColor: sel ? m.color||'var(--accent)' : 'var(--border)',
                      }}
                    >
                      <span style={{ fontSize:20 }}>{m.icon}</span>
                      <span style={{ fontSize:11, fontWeight:700, color: sel ? m.color||'var(--accent-light)' : 'var(--text-muted)', textTransform:'capitalize' }}>{p.nome}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Campos extras por perfil */}
          {camposExtras.length > 0 && (
            <>
              <div style={{ borderTop:'1px solid var(--border)', paddingTop:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:'1.5px', textTransform:'uppercase', fontFamily:'var(--mono)', marginBottom:12 }}>
                  Dados de {perfilSelecionado?.nome}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  {camposExtras.map(c => (
                    <div key={c.key} className="form-group">
                      <label className="form-label">{c.label}{c.required ? ' *' : ''}</label>
                      {c.type === 'select' ? (
                        <select className="form-control" required={c.required} value={form[c.key]||''} onChange={e => setF(c.key, e.target.value)}>
                          {c.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                        </select>
                      ) : (
                        <input type={c.type||'text'} className="form-control" required={c.required}
                          placeholder={c.placeholder} value={form[c.key]||''}
                          onChange={e => setF(c.key, e.target.value)} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </form>
      </Modal>

      {/* ══ MODAL: Editar Usuário ═════════════════════════════ */}
      <Modal
        isOpen={!!modalEditar}
        onClose={() => setModalEditar(null)}
        title={`Editar — ${modalEditar?.nome}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalEditar(null)}>Cancelar</Button>
            <Button type="submit" form="formEditar" disabled={saving}>{saving ? '⏳ Salvando...' : '✓ Salvar'}</Button>
          </>
        }
      >
        <form id="formEditar" onSubmit={handleEditar} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="form-group">
            <label className="form-label">Nome</label>
            <input className="form-control" required value={form.nome} onChange={e => setF('nome', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">E-mail</label>
            <input type="email" className="form-control" required value={form.email} onChange={e => setF('email', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Perfil de Acesso</label>
            <select className="form-control" value={form.perfil_id} onChange={e => setF('perfil_id', e.target.value)}>
              {perfis.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
        </form>
      </Modal>

      {/* ══ MODAL: Resetar Senha ══════════════════════════════ */}
      <Modal
        isOpen={!!modalSenha}
        onClose={() => setModalSenha(null)}
        title={`Resetar Senha — ${modalSenha?.nome}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalSenha(null)}>Cancelar</Button>
            <Button type="submit" form="formSenha" disabled={saving || novaSenha.length < 6}>
              {saving ? '⏳...' : '🔑 Resetar'}
            </Button>
          </>
        }
      >
        <form id="formSenha" onSubmit={handleResetSenha} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ padding:'10px 14px', background:'var(--warning-soft)', border:'1px solid rgba(245,158,11,.25)', borderRadius:'var(--radius)', fontSize:13, color:'var(--warning)' }}>
            ⚠ A senha atual será substituída. O usuário precisará usar a nova senha no próximo login.
          </div>
          <div className="form-group">
            <label className="form-label">Nova Senha *</label>
            <input
              type="text"
              className="form-control"
              required
              minLength={6}
              value={novaSenha}
              onChange={e => setNovaSenha(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              style={{ fontFamily:'var(--mono)' }}
            />
          </div>
          {novaSenha.length >= 6 && (
            <div style={{ padding:'8px 12px', background:'var(--success-soft)', border:'1px solid rgba(34,211,165,.25)', borderRadius:'var(--radius)', fontSize:12, color:'var(--success)' }}>
              ✓ Senha válida ({novaSenha.length} caracteres)
            </div>
          )}
        </form>
      </Modal>

      {/* ══ MODAL: Confirmar Toggle ═══════════════════════════ */}
      <Modal
        isOpen={!!modalConfirm}
        onClose={() => setModalConfirm(null)}
        title={modalConfirm?.ativo ? 'Desativar Usuário' : 'Ativar Usuário'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalConfirm(null)}>Cancelar</Button>
            <Button
              variant={modalConfirm?.ativo ? 'danger' : 'success'}
              onClick={handleToggle}
            >
              {modalConfirm?.ativo ? '✕ Desativar' : '✓ Ativar'}
            </Button>
          </>
        }
      >
        <p style={{ fontSize:13.5, color:'var(--text-secondary)', lineHeight:1.7 }}>
          {modalConfirm?.ativo
            ? <>Deseja desativar o usuário <strong style={{ color:'var(--text-primary)' }}>{modalConfirm?.nome}</strong>? Ele não conseguirá mais fazer login.</>
            : <>Deseja reativar o usuário <strong style={{ color:'var(--text-primary)' }}>{modalConfirm?.nome}</strong>? O acesso será restaurado.</>
          }
        </p>
      </Modal>
    </div>
  )
}

