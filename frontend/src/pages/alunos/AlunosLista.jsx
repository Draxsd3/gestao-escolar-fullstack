import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { Button, Badge, Loading, EmptyState, Pagination, Alert } from '../../components/ui'

export default function AlunosLista() {
  const [alunos, setAlunos]   = useState([])
  const [meta, setMeta]       = useState(null)
  const [page, setPage]       = useState(1)
  const [busca, setBusca]     = useState('')
  const [loading, setLoading] = useState(true)
  const [msg, setMsg]         = useState('')
  const [confirmDel, setConfirmDel] = useState(null)
  const navigate = useNavigate()

  const fetchAlunos = async (p = 1) => {
    setLoading(true)
    try {
      const r = await api.get('/alunos', { params: { page: p, busca } })
      setAlunos(r.data.data || r.data)
      setMeta(r.data.meta || null)
    } catch (err) {
      console.error('Erro ao carregar alunos:', err)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchAlunos(page) }, [page])
  useEffect(() => { setPage(1); fetchAlunos(1) }, [busca])

  const desativar = async (id) => {
    try {
      await api.delete(`/alunos/${id}`)
      setMsg('Aluno desativado com sucesso.')
      setConfirmDel(null)
      fetchAlunos(page)
    } catch (err) {
      setMsg('Erro ao desativar: ' + (err.response?.data?.message || 'erro desconhecido'))
      setConfirmDel(null)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Alunos</div>
          <div className="page-sub">Gerenciar cadastros e informações dos alunos</div>
        </div>
        <Button onClick={() => navigate('/alunos/novo')}>+ Novo Aluno</Button>
      </div>

      {msg && <Alert variant="success" onClose={() => setMsg('')}>{msg}</Alert>}

      {confirmDel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '28px 24px', maxWidth: 400, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Confirmar Desativação</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Deseja desativar o aluno <strong>{confirmDel.nome}</strong>? O registro não será excluído permanentemente.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setConfirmDel(null)}>Cancelar</Button>
              <Button variant="danger" onClick={() => desativar(confirmDel.id)}>Desativar</Button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="filter-bar">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input className="form-control" placeholder="Buscar por nome, CPF ou e-mail..." value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
        </div>

        {loading ? <Loading /> : alunos.length === 0 ? (
          <EmptyState icon="🎓" title="Nenhum aluno encontrado" message="Tente uma busca diferente ou cadastre um novo aluno." />
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Nome</th><th>CPF</th><th>E-mail</th><th>Situação</th><th></th></tr></thead>
                <tbody>
                  {alunos.map(a => (
                    <tr key={a.id}>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-muted)' }}>{a.id}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--accent-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                            {a.nome?.[0] || '?'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13.5 }}>{a.nome}</div>
                            {a.data_nascimento && <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{new Date(a.data_nascimento).toLocaleDateString('pt-BR')}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{a.cpf || '—'}</td>
                      <td style={{ fontSize: 13 }}>{a.email || '—'}</td>
                      <td><Badge variant={a.ativo !== false ? 'success' : 'secondary'}>{a.ativo !== false ? 'Ativo' : 'Inativo'}</Badge></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/alunos/${a.id}`)}>👁 Ver</Button>
                          <Button variant="secondary" size="sm" onClick={() => navigate(`/alunos/${a.id}/editar`)} title="Editar" style={{ fontSize: 18, lineHeight: 1 }}>✎</Button>
                          <Button variant="danger" size="sm" onClick={() => setConfirmDel(a)} title="Excluir" style={{ fontSize: 18, lineHeight: 1 }}>🗑</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination meta={meta} onPageChange={p => setPage(p)} />
          </>
        )}
      </div>
    </div>
  )
}

