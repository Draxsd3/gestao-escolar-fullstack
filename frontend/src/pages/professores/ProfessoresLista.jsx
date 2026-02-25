import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { Button, Badge, Loading, EmptyState, Pagination, Alert, Modal } from '../../components/ui'
import { ICON_BUTTON_STYLE, KeyIcon, PowerIcon } from '../../components/ui/actionIcons'

const PLATAFORMAS_LABELS = {
  dashboard:           'Dashboard',
  notas:               'Notas',
  frequencia:          'Frequência',
  relatorio_frequencia:'Rel. Frequência',
  boletins:            'Boletins',
  comunicados:         'Comunicados',
  mensagens:           'Mensagens',
}

export default function ProfessoresLista() {
  const navigate = useNavigate()
  const [professores, setProfessores] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalCredencial, setModalCredencial] = useState(null)
  const [novaSenha, setNovaSenha] = useState('')
  const [senhaGerada, setSenhaGerada] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState('')

  const carregar = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/professores', {
        params: { page, busca: busca || undefined },
      })
      setProfessores(data.data || [])
      setMeta(data.meta || null)
    } catch {
      setError('Erro ao carregar professores.')
    } finally {
      setLoading(false)
    }
  }, [page, busca])

  useEffect(() => { carregar() }, [carregar])

  // Debounce busca
  useEffect(() => {
    const t = setTimeout(() => carregar(), 350)
    return () => clearTimeout(t)
  }, [busca]) // eslint-disable-line

  const toggleAtivo = async (prof) => {
    try {
      await api.patch(`/professores/${prof.id}/toggle`)
      carregar()
    } catch {
      setError('Erro ao alterar status.')
    }
  }

  const gerarSenhaAleatoria = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$'
    let s = ''
    s += 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 23)]
    s += 'abcdefghijkmnpqrstuvwxyz'[Math.floor(Math.random() * 23)]
    s += '23456789'[Math.floor(Math.random() * 8)]
    s += '!@#$'[Math.floor(Math.random() * 4)]
    for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)]
    return s.split('').sort(() => Math.random() - 0.5).join('')
  }

  const abrirModalCredencial = (prof) => {
    const senha = gerarSenhaAleatoria()
    setSenhaGerada(senha)
    setNovaSenha(senha)
    setModalCredencial(prof)
  }

  const reenviarCredenciais = async () => {
    if (!novaSenha || novaSenha.length < 8) return
    setSalvando(true)
    try {
      await api.patch(`/professores/${modalCredencial.id}/credenciais`, { nova_senha: novaSenha })
      setFeedbackMsg(`Senha redefinida para ${modalCredencial.usuario?.nome}. Anote e repasse ao professor.`)
      setModalCredencial(null)
    } catch {
      setError('Erro ao redefinir senha.')
    } finally {
      setSalvando(false)
    }
  }

  const copiar = (texto) => {
    navigator.clipboard.writeText(texto).catch(() => {})
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Professores</div>
          <div className="page-sub">Gerencie o corpo docente e seus acessos</div>
        </div>
        <Button onClick={() => navigate('/professores/novo')}>
          + Cadastrar Professor
        </Button>
      </div>

      {error  && <Alert variant="error"   onClose={() => setError('')}>{error}</Alert>}
      {feedbackMsg && <Alert variant="success" onClose={() => setFeedbackMsg('')}>{feedbackMsg}</Alert>}

      {/* Filtros */}
      <div style={{ display:'flex', gap:10, marginBottom:16 }}>
        <input
          className="form-control"
          style={{ maxWidth:320 }}
          placeholder="Buscar por nome, e-mail ou CPF..."
          value={busca}
          onChange={e => { setBusca(e.target.value); setPage(1) }}
        />
      </div>

      {loading ? <Loading /> : professores.length === 0 ? (
        <EmptyState
          icon="👨‍🏫"
          title="Nenhum professor encontrado"
          message={busca ? 'Tente outro termo de busca.' : 'Clique em "Cadastrar Professor" para adicionar o primeiro docente.'}
        />
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Professor</th>
                  <th>CPF</th>
                  <th>Formação / Área</th>
                  <th>Unidade</th>
                  <th>Plataformas</th>
                  <th>Status</th>
                  <th style={{ textAlign:'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {professores.map(prof => (
                  <tr key={prof.id}>
                    <td>
                      <div style={{ fontWeight:600, color:'var(--text-primary)', fontSize:13.5 }}>
                        {prof.usuario?.nome}
                      </div>
                      <div style={{ fontSize:12, color:'var(--text-muted)' }}>{prof.usuario?.email}</div>
                      {prof.unidade && (
                        <div style={{ fontSize:11, color:'var(--text-muted)' }}>{prof.unidade}</div>
                      )}
                    </td>
                    <td style={{ fontSize:13, color:'var(--text-secondary)', fontFamily:'var(--mono)' }}>
                      {prof.cpf || '—'}
                    </td>
                    <td>
                      <div style={{ fontSize:13, color:'var(--text-primary)' }}>{prof.formacao || '—'}</div>
                      {prof.area_atuacao && (
                        <div style={{ fontSize:11, color:'var(--text-muted)' }}>{prof.area_atuacao}</div>
                      )}
                    </td>
                    <td style={{ fontSize:13, color:'var(--text-secondary)' }}>{prof.unidade || '—'}</td>
                    <td>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
                        {(prof.permissoes || []).slice(0, 3).map(p => (
                          <span key={p} style={{
                            fontSize:10, padding:'2px 6px', borderRadius:4,
                            background:'rgba(26,109,212,.08)', color:'#1a6dd4',
                            border:'1px solid rgba(26,109,212,.15)', fontWeight:600,
                          }}>
                            {PLATAFORMAS_LABELS[p] || p}
                          </span>
                        ))}
                        {(prof.permissoes || []).length > 3 && (
                          <span style={{ fontSize:10, color:'var(--text-muted)', padding:'2px 4px' }}>
                            +{(prof.permissoes || []).length - 3}
                          </span>
                        )}
                        {(prof.permissoes || []).length === 0 && (
                          <span style={{ fontSize:11, color:'var(--text-muted)' }}>Sem permissões</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge variant={prof.ativo ? 'success' : 'secondary'}>
                        {prof.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Redefinir senha / Credenciais"
                          onClick={() => abrirModalCredencial(prof)}
                          style={ICON_BUTTON_STYLE}
                        >
                          <KeyIcon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title={prof.ativo ? 'Desativar acesso' : 'Ativar acesso'}
                          onClick={() => toggleAtivo(prof)}
                          style={ICON_BUTTON_STYLE}
                        >
                          <PowerIcon size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} onPageChange={setPage} />
        </>
      )}

      {/* Modal redefinir credenciais */}
      <Modal
        isOpen={!!modalCredencial}
        onClose={() => setModalCredencial(null)}
        title="Redefinir Credenciais"
        footer={
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <Button variant="secondary" onClick={() => setModalCredencial(null)}>Cancelar</Button>
            <Button onClick={reenviarCredenciais} disabled={salvando || novaSenha.length < 8}>
              {salvando ? 'Salvando...' : 'Confirmar nova senha'}
            </Button>
          </div>
        }
      >
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ fontSize:13, color:'var(--text-secondary)' }}>
            Professor: <strong>{modalCredencial?.usuario?.nome}</strong><br/>
            E-mail: <strong>{modalCredencial?.usuario?.email}</strong>
          </div>
          <div className="form-group">
            <label className="form-label">Nova senha temporária</label>
            <div style={{ display:'flex', gap:6 }}>
              <input
                className="form-control"
                value={novaSenha}
                onChange={e => setNovaSenha(e.target.value)}
                style={{ fontFamily:'var(--mono)', fontWeight:600, letterSpacing:1 }}
              />
              <button
                onClick={() => copiar(novaSenha)}
                style={{ padding:'0 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-surface)', cursor:'pointer', fontSize:14 }}
                title="Copiar senha"
              >
                📋
              </button>
              <button
                onClick={() => { const s = gerarSenhaAleatoria(); setSenhaGerada(s); setNovaSenha(s) }}
                style={{ padding:'0 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-surface)', cursor:'pointer', fontSize:12, whiteSpace:'nowrap' }}
              >
                Gerar nova
              </button>
            </div>
            {novaSenha.length < 8 && novaSenha.length > 0 && (
              <div style={{ fontSize:11, color:'var(--danger)', marginTop:4 }}>Mínimo 8 caracteres</div>
            )}
          </div>
          <div style={{
            padding:10, borderRadius:8, background:'rgba(245,158,11,.07)',
            border:'1px solid rgba(245,158,11,.2)', fontSize:12, color:'#92400e',
          }}>
            O professor será obrigado a trocar a senha no próximo acesso.
            Anote e repasse as credenciais com segurança.
          </div>
        </div>
      </Modal>
    </div>
  )
}

