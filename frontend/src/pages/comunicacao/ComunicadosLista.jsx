import React, { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Alert, Badge, Button, Card, EmptyState, Loading, Modal, Pagination } from '../../components/ui'

const FORM_INITIAL = {
  titulo: '',
  corpo: '',
  publico_alvo: 'todos',
  publicado: true,
}

const ALVO_LABEL = {
  todos: 'Todos',
  professores: 'Professores',
}

const ALVO_VARIANT = {
  todos: 'primary',
  professores: 'success',
}

function formatarData(data) {
  if (!data) return '-'
  return new Date(data).toLocaleString('pt-BR')
}

function labelDia(dataPtBr) {
  if (!dataPtBr || dataPtBr === 'Sem data') return dataPtBr
  const [dia, mes, ano] = dataPtBr.split('/')
  const d = new Date(`${ano}-${mes}-${dia}T00:00:00`)
  const hoje = new Date()
  const ontem = new Date()
  ontem.setDate(hoje.getDate() - 1)

  const mesmaData = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  if (mesmaData(d, hoje)) return `Hoje · ${dataPtBr}`
  if (mesmaData(d, ontem)) return `Ontem · ${dataPtBr}`
  return dataPtBr
}

function agruparPorDia(lista) {
  const map = new Map()
  lista.forEach((item) => {
    const key = item.publicado_em ? new Date(item.publicado_em).toLocaleDateString('pt-BR') : 'Sem data'
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(item)
  })
  return Array.from(map.entries()).map(([data, itens]) => ({ data, itens }))
}

export default function ComunicadosLista() {
  const { usuario } = useAuth()
  const podeCriar = usuario?.perfil === 'admin'
  const podeFiltrar = !['aluno', 'professor'].includes(usuario?.perfil)

  const [items, setItems] = useState([])
  const [meta, setMeta] = useState(null)

  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')

  const [page, setPage] = useState(1)
  const [busca, setBusca] = useState('')
  const [publico, setPublico] = useState('')
  const [form, setForm] = useState(FORM_INITIAL)

  const fetchComunicados = async (pagina = 1) => {
    setLoading(true)
    try {
      const params = { page: pagina }
      if (busca.trim()) params.busca = busca.trim()
      if (publico) params.publico_alvo = publico

      const r = await api.get('/comunicados', { params })
      const payload = r.data || {}
      setItems(payload.data || payload || [])
      setMeta(payload.meta || null)
    } catch {
      setItems([])
      setMeta(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComunicados(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const aplicarFiltros = () => {
    setPage(1)
    fetchComunicados(1)
  }

  const limparFiltros = () => {
    setBusca('')
    setPublico('')
    setPage(1)
    setTimeout(() => fetchComunicados(1), 0)
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setFeedback('')
    try {
      const payload = {
        titulo: form.titulo.trim(),
        corpo: form.corpo.trim(),
        publico_alvo: form.publico_alvo,
        publicado: true,
      }
      await api.post('/comunicados', payload)
      setModal(false)
      setForm(FORM_INITIAL)
      setFeedback('Comunicado publicado com sucesso.')
      setPage(1)
      fetchComunicados(1)
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao criar comunicado.')
    } finally {
      setSaving(false)
    }
  }

  const grupos = useMemo(() => agruparPorDia(items), [items])

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Linha do tempo de comunicados</div>
          <div className="page-sub">Atualizacoes oficiais para docentes, alunos e comunidade escolar</div>
        </div>
        {podeCriar && <Button onClick={() => setModal(true)}>+ Novo comunicado</Button>}
      </div>

      {feedback && <Alert variant="success" onClose={() => setFeedback('')}>{feedback}</Alert>}
      {error && <Alert variant="error" onClose={() => setError('')}>{error}</Alert>}

      {podeFiltrar && (
        <Card title="Filtros da timeline" style={{ marginBottom: 14 }}>
          <div className="form-grid cols-4">
            <div className="form-group">
              <label className="form-label">Buscar</label>
              <input
                className="form-control"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Titulo ou mensagem..."
              />
            </div>
            <div className="form-group">
              <label className="form-label">Publico</label>
              <select className="form-control" value={publico} onChange={(e) => setPublico(e.target.value)}>
                <option value="">Todos</option>
                <option value="todos">Todos</option>
                <option value="alunos">Alunos</option>
                <option value="responsaveis">Responsaveis</option>
                <option value="professores">Professores</option>
                <option value="funcionarios">Funcionarios</option>
                <option value="turma">Turma</option>
              </select>
            </div>
            <div className="form-group" style={{ alignSelf: 'end' }}>
              <Button variant="secondary" onClick={aplicarFiltros}>Aplicar</Button>
            </div>
            <div className="form-group" style={{ alignSelf: 'end' }}>
              <Button variant="ghost" onClick={limparFiltros}>Limpar</Button>
            </div>
          </div>
        </Card>
      )}

      {loading ? <Loading /> : (
        items.length === 0 ? (
          <div className="card">
            <EmptyState icon="[TL]" title="Timeline vazia" message="Nao ha comunicados para os filtros selecionados." />
          </div>
        ) : (
          <Card title="Eventos recentes">
            <div style={{ position: 'relative', paddingLeft: 24 }}>
              <div
                style={{
                  position: 'absolute',
                  left: 8,
                  top: 4,
                  bottom: 4,
                  width: 2,
                  borderRadius: 999,
                  background: 'var(--border-light)',
                }}
              />

              {grupos.map((grupo) => (
                <div key={grupo.data} style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: 'var(--accent)',
                        position: 'relative',
                        left: -20,
                        flexShrink: 0,
                      }}
                    />
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        fontWeight: 700,
                      }}
                    >
                      {labelDia(grupo.data)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginLeft: 4 }}>
                    {grupo.itens.map((c) => (
                      <article
                        key={c.id}
                        style={{
                          border: '1px solid var(--border-light)',
                          borderRadius: 10,
                          background: 'var(--bg-card)',
                          padding: '12px 14px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
                              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15 }}>{c.titulo}</div>
                              <Badge variant={ALVO_VARIANT[c.publico_alvo] || 'secondary'}>{ALVO_LABEL[c.publico_alvo] || c.publico_alvo}</Badge>
                            </div>
                            <div
                              style={{
                                color: 'var(--text-secondary)',
                                lineHeight: 1.6,
                                fontSize: 13.5,
                                whiteSpace: 'pre-wrap',
                                overflowWrap: 'anywhere',
                                wordBreak: 'break-word',
                              }}
                            >
                              {c.corpo}
                            </div>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                            <div>{formatarData(c.publicado_em)}</div>
                            <div>Por <strong style={{ color: 'var(--text-primary)' }}>{c.autor?.nome || '-'}</strong></div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )
      )}

      <Pagination meta={meta} onPageChange={setPage} />

      <Modal
        isOpen={modal}
        onClose={() => { setModal(false); setForm(FORM_INITIAL); setError('') }}
        title="Novo comunicado (Admin)"
        footer={(
          <>
            <Button variant="secondary" onClick={() => { setModal(false); setForm(FORM_INITIAL); setError('') }}>Cancelar</Button>
            <Button type="submit" form="formCom" disabled={saving}>{saving ? 'Publicando...' : 'Publicar'}</Button>
          </>
        )}
      >
        {error && <Alert variant="error">{error}</Alert>}
        <form id="formCom" onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Titulo</label>
            <input
              className="form-control"
              required
              value={form.titulo}
              onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Publico-alvo</label>
            <select
              className="form-control"
              value={form.publico_alvo}
              onChange={(e) => setForm((f) => ({ ...f, publico_alvo: e.target.value }))}
            >
              <option value="todos">Todos</option>
              <option value="professores">Professores</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Mensagem</label>
            <textarea
              className="form-control"
              rows={6}
              required
              value={form.corpo}
              onChange={(e) => setForm((f) => ({ ...f, corpo: e.target.value }))}
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}
