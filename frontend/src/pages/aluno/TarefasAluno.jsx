import React, { useState, useEffect, useRef } from 'react'
import api from '../../services/api'
import { Loading, Card, Badge, Button } from '../../components/ui'

/* ── Helpers ──────────────────────────────────────────────── */
function statusTarefa(tarefa) {
  if (tarefa.entrega?.entregue) return 'entregue'
  if (new Date(tarefa.data_entrega) < new Date(new Date().toDateString())) return 'atrasado'
  return 'pendente'
}

function badgeTarefa(status) {
  const map = {
    entregue: { variant: 'success',   label: '✓ Entregue' },
    atrasado: { variant: 'danger',    label: '⚠ Atrasado' },
    pendente: { variant: 'warning',   label: '⏳ Pendente' },
  }
  const { variant, label } = map[status] || map.pendente
  return <Badge variant={variant}>{label}</Badge>
}

function fmtData(d) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

function fmtDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-BR')
}

/* ── Card de tarefa individual ────────────────────────────── */
function CardTarefa({ tarefa, onEntregue }) {
  const status          = statusTarefa(tarefa)
  const [expandido, setExpandido] = useState(false)
  const [observacao, setObservacao] = useState('')
  const [arquivo, setArquivo]       = useState(null)
  const [salvando, setSalvando]     = useState(false)
  const [erro, setErro]             = useState('')
  const fileRef = useRef()

  const handleEntregar = async () => {
    setSalvando(true); setErro('')
    try {
      const fd = new FormData()
      if (observacao) fd.append('observacao', observacao)
      if (arquivo)    fd.append('arquivo', arquivo)

      const res = await api.post(`/aluno/tarefas/${tarefa.id}/entregar`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setExpandido(false)
      onEntregue(tarefa.id, res.data)
    } catch (err) {
      setErro(err.response?.data?.message || 'Erro ao entregar tarefa.')
    } finally { setSalvando(false) }
  }

  return (
    <div style={{ background: '#fff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '18px 20px', marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>
            {tarefa.titulo}
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12.5, color: 'var(--text-muted)' }}>
            {tarefa.disciplina && <span>📚 {tarefa.disciplina.nome}</span>}
            {tarefa.professor  && <span>👤 {tarefa.professor.nome}</span>}
            <span>📅 Entrega: <strong style={{ color: status === 'atrasado' ? 'var(--danger)' : 'var(--text-primary)' }}>{fmtData(tarefa.data_entrega)}</strong></span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {badgeTarefa(status)}
        </div>
      </div>

      {/* Descrição */}
      {tarefa.descricao && (
        <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)' }}>
          {tarefa.descricao}
        </div>
      )}

      {/* Ações */}
      <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Arquivo do professor */}
        {tarefa.arquivo_url && (
          <a href={tarefa.arquivo_url} target="_blank" rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-secondary)', fontSize: 12.5, textDecoration: 'none', fontWeight: 500 }}>
            📄 Material do professor
          </a>
        )}

        {/* Se entregue: mostrar info */}
        {status === 'entregue' && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12.5, color: 'var(--success)', fontWeight: 600 }}>
              ✓ Entregue em {fmtDateTime(tarefa.entrega.entregue_em)}
            </span>
            {tarefa.entrega.arquivo_url && (
              <a href={tarefa.entrega.arquivo_url} target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 'var(--radius)', border: '1px solid rgba(5,150,105,.3)', background: 'rgba(5,150,105,.06)', color: 'var(--success)', fontSize: 12, textDecoration: 'none' }}>
                📎 Minha entrega
              </a>
            )}
          </div>
        )}

        {/* Botão entregar (pendente ou atrasado) */}
        {status !== 'entregue' && (
          <Button variant="secondary" onClick={() => setExpandido(v => !v)} style={{ fontSize: 13, padding: '6px 14px' }}>
            {expandido ? '↑ Fechar' : '📤 Entregar'}
          </Button>
        )}
      </div>

      {/* Formulário de entrega */}
      {expandido && status !== 'entregue' && (
        <div style={{ marginTop: 14, padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Observação (opcional)</label>
            <textarea
              className="form-control"
              rows={3}
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              placeholder="Descreva sua resposta ou adicione observações..."
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Anexar arquivo (opcional — PDF, doc, imagem)</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="file"
                ref={fileRef}
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                style={{ display: 'none' }}
                onChange={e => setArquivo(e.target.files[0] || null)}
              />
              <button
                type="button"
                onClick={() => fileRef.current.click()}
                style={{ padding: '7px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}
              >
                📎 {arquivo ? arquivo.name : 'Escolher arquivo'}
              </button>
              {arquivo && (
                <button type="button" onClick={() => { setArquivo(null); fileRef.current.value = '' }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 13 }}>
                  × Remover
                </button>
              )}
            </div>
          </div>

          {erro && (
            <div style={{ padding: '8px 12px', background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.2)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--danger)' }}>
              ⚠ {erro}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setExpandido(false)}>Cancelar</Button>
            <Button onClick={handleEntregar} disabled={salvando}>
              {salvando ? '⏳ Enviando...' : '✓ Confirmar Entrega'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Componente principal ─────────────────────────────────── */
export default function TarefasAluno() {
  const [tarefas, setTarefas]   = useState([])
  const [filtro, setFiltro]     = useState('todas')
  const [loading, setLoading]   = useState(true)

  const carregar = (f) => {
    setLoading(true)
    api.get(`/aluno/tarefas?filtro=${f}`)
      .then(r => setTarefas(r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { carregar(filtro) }, [filtro])

  const handleEntregue = (tarefaId, dadosEntrega) => {
    setTarefas(ts => ts.map(t =>
      t.id === tarefaId
        ? { ...t, entrega: { entregue: true, entregue_em: dadosEntrega.entregue_em, arquivo_url: dadosEntrega.arquivo_url } }
        : t
    ))
  }

  const tabs = [
    { key: 'todas',     label: 'Todas' },
    { key: 'pendentes', label: 'Pendentes' },
    { key: 'encerradas',label: 'Encerradas' },
  ]

  const counts = {
    pendentes:  tarefas.filter(t => statusTarefa(t) === 'pendente').length,
    atrasadas:  tarefas.filter(t => statusTarefa(t) === 'atrasado').length,
    entregues:  tarefas.filter(t => statusTarefa(t) === 'entregue').length,
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Minhas Tarefas</div>
          <div className="page-sub">Tarefas atribuídas pela sua turma</div>
        </div>
      </div>

      {/* Resumo rápido */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Pendentes', value: counts.pendentes, color: '#d97706', bg: 'rgba(217,119,6,.08)' },
          { label: 'Atrasadas', value: counts.atrasadas, color: '#dc2626', bg: 'rgba(220,38,38,.08)' },
          { label: 'Entregues', value: counts.entregues, color: '#059669', bg: 'rgba(5,150,105,.08)' },
        ].map(c => (
          <div key={c.label} style={{ padding: '10px 18px', borderRadius: 10, background: c.bg, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--mono)', color: c.color }}>{c.value}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: c.color }}>{c.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        {tabs.map(t => (
          <button key={t.key} className={`tab-btn ${filtro === t.key ? 'active' : ''}`} onClick={() => setFiltro(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <Loading /> : (
        tarefas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>Nenhuma tarefa encontrada</div>
            <div style={{ fontSize: 13 }}>Não há tarefas para o filtro selecionado.</div>
          </div>
        ) : (
          <div>
            {tarefas.map(t => (
              <CardTarefa key={t.id} tarefa={t} onEntregue={handleEntregue} />
            ))}
          </div>
        )
      )}
    </div>
  )
}
