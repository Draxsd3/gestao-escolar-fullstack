import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { Alert, Button, Card, EmptyState, Loading } from '../../components/ui'

function formatarHora(data) {
  if (!data) return ''
  return new Date(data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatarDataLonga(data) {
  if (!data) return ''
  return new Date(data).toLocaleDateString('pt-BR')
}

function inicial(nome) {
  return (nome || '?').trim().charAt(0).toUpperCase()
}

function AvatarUsuario({ nome, fotoUrl, size = 32 }) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'var(--accent-soft)',
      border: '1px solid var(--accent-border)',
      display: 'grid',
      placeItems: 'center',
      fontWeight: 700,
      color: 'var(--accent)',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {fotoUrl ? (
        <img src={fotoUrl} alt={nome || 'Usuario'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : inicial(nome)}
    </div>
  )
}

export default function MensagensLista() {
  const { usuario } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const [recebidas, setRecebidas] = useState([])
  const [enviadas, setEnviadas] = useState([])
  const [users, setUsers] = useState([])
  const [busca, setBusca] = useState('')

  const [conversaAtivaId, setConversaAtivaId] = useState(null)
  const [destinatarioId, setDestinatarioId] = useState('')
  const [assunto, setAssunto] = useState('')
  const [texto, setTexto] = useState('')

  const carregarTudo = async ({ silent = false, incluirUsuarios = false } = {}) => {
    if (!silent) setLoading(true)
    try {
      const requisicoes = [
        api.get('/mensagens', { params: { tipo: 'recebidas' } }),
        api.get('/mensagens', { params: { tipo: 'enviadas' } }),
      ]
      if (incluirUsuarios) {
        requisicoes.push(api.get('/usuarios-lista').catch(() => ({ data: [] })))
      }

      const [rRec, rEnv, rUsers] = await Promise.all(requisicoes)
      setRecebidas(rRec.data?.data || rRec.data || [])
      setEnviadas(rEnv.data?.data || rEnv.data || [])
      if (incluirUsuarios) {
        setUsers(rUsers?.data?.data || rUsers?.data || [])
      }
    } catch {
      if (!silent) {
        setRecebidas([])
        setEnviadas([])
        if (incluirUsuarios) setUsers([])
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    carregarTudo({ incluirUsuarios: true })
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      carregarTudo({ silent: true })
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const conversas = useMemo(() => {
    const mapa = new Map()
    const todas = [
      ...recebidas.map((m) => ({ ...m, _tipo: 'recebida' })),
      ...enviadas.map((m) => ({ ...m, _tipo: 'enviada' })),
    ]

    todas.forEach((m) => {
      const outro = m._tipo === 'recebida' ? m.remetente : m.destinatario
      if (!outro?.id) return
      if (!mapa.has(outro.id)) {
        mapa.set(outro.id, {
          userId: outro.id,
          nome: outro.nome || 'Usuario',
          fotoUrl: outro.foto_url || null,
          mensagens: [],
          naoLidas: 0,
          ultimoTimestamp: null,
        })
      }

      const conv = mapa.get(outro.id)
      if (!conv.fotoUrl && outro.foto_url) conv.fotoUrl = outro.foto_url
      conv.mensagens.push(m)
      if (m._tipo === 'recebida' && !m.lida) conv.naoLidas += 1
      const stamp = new Date(m.criado_em).getTime()
      if (!conv.ultimoTimestamp || stamp > conv.ultimoTimestamp) conv.ultimoTimestamp = stamp
    })

    const termo = busca.trim().toLowerCase()
    return Array.from(mapa.values())
      .map((conv) => ({
        ...conv,
        fotoUrl: conv.fotoUrl || null,
        mensagens: conv.mensagens.sort((a, b) => new Date(a.criado_em) - new Date(b.criado_em)),
      }))
      .filter((conv) => !termo || conv.nome.toLowerCase().includes(termo))
      .sort((a, b) => (b.ultimoTimestamp || 0) - (a.ultimoTimestamp || 0))
  }, [recebidas, enviadas, busca])

  useEffect(() => {
    const selecionado = Number(destinatarioId || 0)
    if (
      conversaAtivaId &&
      (conversas.some((c) => c.userId === conversaAtivaId) || conversaAtivaId === selecionado)
    ) return
    setConversaAtivaId(conversas[0]?.userId || null)
  }, [conversas, conversaAtivaId, destinatarioId])

  const conversaAtiva = useMemo(() => {
    const existente = conversas.find((c) => c.userId === conversaAtivaId)
    if (existente) return existente

    const selecionado = users.find((u) => u.id === conversaAtivaId)
    if (!selecionado) return null

    return {
      userId: selecionado.id,
      nome: selecionado.nome || 'Usuario',
      fotoUrl: selecionado.foto_url || null,
      mensagens: [],
      naoLidas: 0,
      ultimoTimestamp: null,
    }
  }, [conversas, conversaAtivaId, users])

  useEffect(() => {
    if (!conversaAtiva) return
    const naoLidas = conversaAtiva.mensagens.filter((m) => m._tipo === 'recebida' && !m.lida)
    if (naoLidas.length === 0) return

    Promise.all(naoLidas.map((m) => api.patch(
      `/mensagens/${m.id}/lida`,
      {},
      { skipConfirm: true, skipSuccessMessage: true, skipErrorMessage: true }
    ).catch(() => null))).then(() => {
      setRecebidas((prev) => prev.map((m) => (
        naoLidas.some((x) => x.id === m.id) ? { ...m, lida: true } : m
      )))
    })
  }, [conversaAtiva])

  const iniciarComUsuario = (id) => {
    const userId = Number(id)
    if (!userId) return
    setConversaAtivaId(userId)
    setDestinatarioId(String(userId))
  }

  const enviar = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErr('')

    const destino = conversaAtivaId || Number(destinatarioId)
    if (!destino) {
      setErr('Selecione um destinatario para enviar a mensagem.')
      setSaving(false)
      return
    }

    try {
      const { data } = await api.post(
        '/mensagens',
        {
          destinatario_id: Number(destino),
          assunto: (assunto || 'Mensagem interna').trim(),
          corpo: texto.trim(),
        },
        { skipSuccessMessage: true }
      )

      setEnviadas((prev) => [data, ...prev])
      setTexto('')
      setAssunto('')
      setConversaAtivaId(Number(destino))
      setDestinatarioId(String(destino))
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Erro ao enviar mensagem.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {err && <Alert variant="error" onClose={() => setErr('')}>{err}</Alert>}

      {loading ? <Loading /> : (
        <Card style={{ padding: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', minHeight: 560 }}>
            <div style={{ borderRight: '1px solid var(--border-light)', background: 'var(--bg-card)' }}>
              <div style={{ padding: 12, borderBottom: '1px solid var(--border-light)' }}>
                <input
                  className="form-control"
                  placeholder="Buscar conversa..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>

              <div style={{ maxHeight: 500, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {conversas.length === 0 ? (
                  <EmptyState icon="[chat]" title="Sem conversas" message="Envie a primeira mensagem." />
                ) : conversas.map((c) => {
                  const ultima = c.mensagens[c.mensagens.length - 1]
                  const ativa = conversaAtivaId === c.userId
                  return (
                    <button
                      key={c.userId}
                      type="button"
                      onClick={() => setConversaAtivaId(c.userId)}
                      style={{
                        border: `1px solid ${ativa ? 'var(--accent-border)' : 'var(--border-light)'}`,
                        borderRadius: 'var(--radius)',
                        background: ativa ? 'var(--accent-soft)' : 'var(--bg-card)',
                        padding: '10px 12px',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <AvatarUsuario nome={c.nome} fotoUrl={c.fotoUrl} size={34} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nome}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{formatarHora(ultima?.criado_em)}</div>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            {(ultima?.corpo || '').slice(0, 42)}{(ultima?.corpo || '').length > 42 ? '...' : ''}
                          </div>
                        </div>
                      </div>
                      {c.naoLidas > 0 && (
                        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--accent)', fontWeight: 700 }}>
                          {c.naoLidas} nova(s)
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
              <div style={{ padding: 12, borderBottom: '1px solid var(--border-light)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AvatarUsuario nome={conversaAtiva?.nome} fotoUrl={conversaAtiva?.fotoUrl} size={32} />
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {conversaAtiva?.nome || 'Selecione ou inicie uma conversa'}
                  </div>
                </div>
                <div style={{ minWidth: 220 }}>
                  <select className="form-control" value={destinatarioId} onChange={(e) => iniciarComUsuario(e.target.value)}>
                    <option value="">Nova conversa com...</option>
                    {users.filter((u) => u.id !== usuario?.id).map((u) => (
                      <option key={u.id} value={u.id}>{u.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {!conversaAtiva ? (
                  <EmptyState icon="[...]" title="Sem conversa ativa" message="Selecione um contato ao lado." />
                ) : conversaAtiva.mensagens.map((m) => {
                  const minha = m._tipo === 'enviada'
                  return (
                    <div key={`${m._tipo}-${m.id}`} style={{ alignSelf: minha ? 'flex-end' : 'flex-start', maxWidth: '74%' }}>
                      <div
                        style={{
                          background: minha ? '#d9fdd3' : '#ffffff',
                          border: '1px solid rgba(0,0,0,.06)',
                          borderRadius: 12,
                          padding: '8px 10px',
                          boxShadow: '0 1px 1px rgba(0,0,0,.04)',
                        }}
                      >
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                          {m.assunto || 'Mensagem interna'}
                        </div>
                        <div style={{ color: 'var(--text-primary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                          {m.corpo}
                        </div>
                        <div style={{ marginTop: 6, fontSize: 10.5, color: 'var(--text-muted)', textAlign: 'right' }}>
                          {formatarHora(m.criado_em)} · {formatarDataLonga(m.criado_em)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <form onSubmit={enviar} style={{ borderTop: '1px solid var(--border-light)', background: 'var(--bg-card)', padding: 10, display: 'grid', gridTemplateColumns: '220px 1fr auto', gap: 8 }}>
                <input
                  className="form-control"
                  value={assunto}
                  onChange={(e) => setAssunto(e.target.value)}
                  placeholder="Assunto (opcional)"
                />
                <input
                  className="form-control"
                  required
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="Digite uma mensagem..."
                />
                <Button type="submit" disabled={saving || !texto.trim()}>
                  {saving ? 'Enviando...' : 'Enviar'}
                </Button>
              </form>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
