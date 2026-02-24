import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useAnoLetivo } from '../../context/AnoLetivoContext'
import { Button, Badge, Loading, EmptyState, Modal, Alert } from '../../components/ui'

const STATUS_LABEL = {
  configurando: { label: 'Configurando', color: '#f59e0b' },
  em_andamento: { label: 'Em Andamento', color: '#059669' },
  encerrado: { label: 'Encerrado', color: '#6b7280' },
}

export default function PeriodoLetivo() {
  const [anos, setAnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [modalAno, setModalAno] = useState(false)
  const [modalEdit, setModalEdit] = useState(false)
  const [modalFechar, setModalFechar] = useState(null)
  const [modalBoletins, setModalBoletins] = useState(null)
  const [boletins, setBoletins] = useState([])
  const [loadingBoletins, setLoadingBoletins] = useState(false)
  const [anoForm, setAnoForm] = useState({ ano: '', modelo_periodo: 'bimestral' })
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ nome: '', data_inicio: '', data_fim: '' })
  const { recarregar } = useAnoLetivo()
  const navigate = useNavigate()

  const fetchData = () => {
    setLoading(true)
    api.get('/anos-letivos', { skipSuccessMessage: true })
      .then(r => setAnos(r.data.data || r.data || []))
      .catch(() => setAnos([]))
      .finally(() => setLoading(false))
  }
  useEffect(() => fetchData(), [])

  const saveAno = async e => {
    e?.preventDefault(); setSaving(true); setError('')
    try {
      await api.post('/anos-letivos', { ano: Number(anoForm.ano), modelo_periodo: anoForm.modelo_periodo }, { skipConfirm: true })
      setModalAno(false); setAnoForm({ ano: '', modelo_periodo: 'bimestral' }); fetchData(); recarregar()
    } catch (err) { setError(err.response?.data?.message || 'Erro ao criar ano letivo.') }
    finally { setSaving(false) }
  }

  const ativarAno = async (id) => {
    try { await api.post(`/anos-letivos/${id}/ativar`, {}, { skipConfirm: true }); fetchData(); recarregar() }
    catch (err) { alert(err.response?.data?.message || 'Erro') }
  }

  const openEdit = p => { setEditItem(p); setForm({ nome: p.nome || '', data_inicio: p.data_inicio || '', data_fim: p.data_fim || '' }); setError(''); setModalEdit(true) }
  const saveEdit = async e => {
    e?.preventDefault(); setSaving(true); setError('')
    try {
      await api.put(`/periodos-avaliacao/${editItem.id}`, { nome: form.nome, data_inicio: form.data_inicio || null, data_fim: form.data_fim || null })
      setModalEdit(false); setEditItem(null); fetchData(); recarregar()
    } catch (err) { setError(err.response?.data?.message || 'Erro ao salvar.') }
    finally { setSaving(false) }
  }

  const confirmarFechar = async () => {
    if (!modalFechar) return; setSaving(true); setError('')
    try {
      await api.post(`/periodos-avaliacao/${modalFechar.id}/fechar`, {}, { skipConfirm: true })
      setModalFechar(null); fetchData(); recarregar()
    } catch (err) { setError(err.response?.data?.message || 'Erro ao fechar período.') }
    finally { setSaving(false) }
  }

  const verBoletins = async (p, anoLetivoId) => {
    setModalBoletins(p); setLoadingBoletins(true)
    try {
      const { data } = await api.get('/boletins', { params: { periodo_id: p.id, ano_letivo_id: anoLetivoId }, skipSuccessMessage: true })
      setBoletins(data.data || data || [])
    } catch { setBoletins([]) }
    finally { setLoadingBoletins(false) }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button onClick={() => navigate('/gestao-geral')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>← Gestão Geral</button>
          <div className="page-title">Ano Letivo e Períodos</div>
          <div className="page-sub">Configure o ano letivo, modelo de períodos (bimestral/semestral) e gerencie o fechamento</div>
        </div>
        <Button onClick={() => { setError(''); setModalAno(true) }}>+ Novo Ano Letivo</Button>
      </div>

      <div className="card">
        {loading ? <Loading /> : anos.length === 0 ? (
          <EmptyState icon="📋" title="Nenhum ano letivo" message="Crie um ano letivo para começar." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {anos.map(ano => {
              const st = STATUS_LABEL[ano.status] || STATUS_LABEL.configurando
              const periodoAtivo = (ano.periodos || []).find(p => !p.encerrado)
              return (
                <div key={ano.id} style={{ border: ano.ativo ? '2px solid rgba(26,109,212,0.3)' : '1px solid var(--muted-border)', background: ano.ativo ? 'rgba(26,109,212,0.02)' : 'transparent', padding: 16, borderRadius: 10 }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: 20 }}>{ano.ano}</span>
                      {ano.ativo && <span style={{ background: '#059669', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>ATIVO</span>}
                      <span style={{ background: ano.modelo_periodo === 'semestral' ? '#8b5cf6' : '#059669', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
                        {ano.modelo_periodo === 'semestral' ? 'SEMESTRAL' : 'BIMESTRAL'}
                      </span>
                      <span style={{ color: st.color, fontSize: 12, fontWeight: 600 }}>● {st.label}</span>
                    </div>
                    {!ano.ativo && ano.status !== 'encerrado' && <Button variant="ghost" size="sm" onClick={() => ativarAno(ano.id)}>Ativar</Button>}
                  </div>

                  {/* Período ativo destaque */}
                  {ano.ativo && periodoAtivo && (
                    <div style={{ background: 'linear-gradient(135deg, rgba(26,109,212,0.06), rgba(59,142,245,0.1))', border: '1px solid rgba(26,109,212,0.15)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Período Ativo Atual</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#1a6dd4' }}>{periodoAtivo.nome}</div>
                      </div>
                      <Button style={{ background: '#dc2626', color: '#fff', borderColor: '#dc2626' }} onClick={() => { setError(''); setModalFechar(periodoAtivo) }}>
                        🔒 Fechar Período
                      </Button>
                    </div>
                  )}
                  {ano.ativo && !periodoAtivo && ano.status !== 'encerrado' && (
                    <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
                      <span style={{ color: '#dc2626', fontSize: 13, fontWeight: 600 }}>Todos os períodos estão encerrados.</span>
                    </div>
                  )}

                  {/* Tabela de períodos */}
                  {(!ano.periodos || ano.periodos.length === 0) ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Nenhum período cadastrado.</div>
                  ) : (
                    <table style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left' }}>#</th>
                          <th style={{ textAlign: 'left' }}>Nome</th>
                          <th style={{ textAlign: 'left' }}>Início</th>
                          <th style={{ textAlign: 'left' }}>Fim</th>
                          <th style={{ textAlign: 'left' }}>Status</th>
                          <th style={{ textAlign: 'right' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ano.periodos.map(p => (
                          <tr key={p.id}>
                            <td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-muted)' }}>{p.ordem}</td>
                            <td style={{ fontWeight: 600 }}>{p.nome}</td>
                            <td style={{ color: 'var(--text-muted)' }}>{p.data_inicio || '—'}</td>
                            <td style={{ color: 'var(--text-muted)' }}>{p.data_fim || '—'}</td>
                            <td>
                              {p.encerrado ? (
                                <span style={{ color: '#6b7280', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                  🔒 Encerrado
                                  {p.encerrado_em && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>em {p.encerrado_em.split(' ')[0]}</span>}
                                </span>
                              ) : (
                                <span style={{ color: '#059669', fontSize: 12, fontWeight: 600 }}>✅ Aberto</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {!p.encerrado && (
                                <Button variant="ghost" size="sm" onClick={() => openEdit(p)} title="Editar" style={{ fontSize: 18, lineHeight: 1 }}>✎</Button>
                              )}
                              {p.encerrado && (
                                <Button variant="ghost" size="sm" onClick={() => verBoletins(p, ano.id)} title="Ver Boletins" style={{ fontSize: 12 }}>📋 Boletins</Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ═══ Modal: Novo Ano Letivo ═══ */}
      <Modal isOpen={modalAno} onClose={() => setModalAno(false)} title="Novo Ano Letivo"
        footer={<><Button variant="secondary" onClick={() => setModalAno(false)}>Cancelar</Button><Button type="submit" form="formAno" disabled={saving}>{saving ? 'Salvando...' : 'Criar Ano Letivo'}</Button></>}>
        {error && <Alert variant="error">{error}</Alert>}
        <form id="formAno" onSubmit={saveAno} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Ano *</label>
            <input className="form-control" required type="number" min="2020" max="2099" value={anoForm.ano} onChange={e => setAnoForm(f => ({ ...f, ano: e.target.value }))} placeholder="Ex: 2026" />
          </div>
          <div className="form-group">
            <label className="form-label">Modelo de Períodos *</label>
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              {[{ value: 'bimestral', label: 'Bimestral', desc: '4 bimestres', color: '#059669' }, { value: 'semestral', label: 'Semestral', desc: '2 semestres', color: '#8b5cf6' }].map(opt => (
                <button key={opt.value} type="button" onClick={() => setAnoForm(f => ({ ...f, modelo_periodo: opt.value }))}
                  style={{
                    flex: 1, padding: '14px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    border: anoForm.modelo_periodo === opt.value ? `2px solid ${opt.color}` : '2px solid var(--border)',
                    background: anoForm.modelo_periodo === opt.value ? `${opt.color}08` : '#fff',
                    transition: 'all .15s',
                  }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: anoForm.modelo_periodo === opt.value ? opt.color : 'var(--text-primary)' }}>{opt.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div style={{ background: 'rgba(26,109,212,0.06)', border: '1px solid rgba(26,109,212,0.12)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <strong>Os períodos serão criados automaticamente</strong> com datas padrão. Você poderá ajustar as datas depois.
            O ano letivo será ativado automaticamente ao ser criado.
          </div>
        </form>
      </Modal>

      {/* ═══ Modal: Editar Período ═══ */}
      <Modal isOpen={modalEdit} onClose={() => { setModalEdit(false); setEditItem(null) }} title="Editar Período"
        footer={<><Button variant="secondary" onClick={() => { setModalEdit(false); setEditItem(null) }}>Cancelar</Button><Button type="submit" form="formEdit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button></>}>
        {error && <Alert variant="error">{error}</Alert>}
        <form id="formEdit" onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="form-group"><label className="form-label">Nome *</label>
            <input className="form-control" required value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="form-group" style={{ flex: 1 }}><label className="form-label">Início</label>
              <input className="form-control" type="date" value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))} />
            </div>
            <div className="form-group" style={{ flex: 1 }}><label className="form-label">Fim</label>
              <input className="form-control" type="date" value={form.data_fim} onChange={e => setForm(f => ({ ...f, data_fim: e.target.value }))} />
            </div>
          </div>
        </form>
      </Modal>

      {/* ═══ Modal: Confirmar Fechamento de Período ═══ */}
      <Modal isOpen={!!modalFechar} onClose={() => setModalFechar(null)} title="Fechar Período"
        footer={<><Button variant="secondary" onClick={() => setModalFechar(null)}>Cancelar</Button><Button style={{ background: '#dc2626', color: '#fff', borderColor: '#dc2626' }} onClick={confirmarFechar} disabled={saving}>{saving ? 'Fechando...' : '🔒 Confirmar Fechamento'}</Button></>}>
        {error && <Alert variant="error">{error}</Alert>}
        <div style={{ lineHeight: 1.6, fontSize: 13.5 }}>
          <p>Você está prestes a <strong>fechar definitivamente</strong> o período:</p>
          <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, padding: '12px 14px', margin: '12px 0', fontSize: 16, fontWeight: 700, color: '#dc2626', textAlign: 'center' }}>
            {modalFechar?.nome}
          </div>
          <p>Esta ação irá:</p>
          <div style={{ paddingLeft: 8, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            • <strong>Bloquear</strong> novos lançamentos de notas e frequência neste período<br />
            • <strong>Calcular médias</strong> de todos os alunos automaticamente<br />
            • <strong>Gerar boletins</strong> consolidados para cada aluno<br />
            • O próximo período se tornará o período ativo
          </div>
          <p style={{ color: '#dc2626', fontWeight: 600, marginTop: 12 }}>Esta ação não pode ser desfeita.</p>
        </div>
      </Modal>

      {/* ═══ Modal: Boletins do Período ═══ */}
      <Modal isOpen={!!modalBoletins} onClose={() => { setModalBoletins(null); setBoletins([]) }} title={`Boletins — ${modalBoletins?.nome || ''}`}>
        {loadingBoletins ? <Loading /> : boletins.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>Nenhum boletim encontrado para este período.</div>
        ) : (
          <div style={{ maxHeight: 400, overflow: 'auto' }}>
            <table style={{ width: '100%' }}>
              <thead><tr><th style={{ textAlign: 'left' }}>Aluno</th><th style={{ textAlign: 'left' }}>Turma</th><th style={{ textAlign: 'right' }}>Disciplinas</th></tr></thead>
              <tbody>
                {boletins.map(b => {
                  const d = b.dados || {}
                  const discs = d.disciplinas || []
                  return (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 600 }}>{d.aluno || b.matricula?.aluno?.nome || '-'}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{d.turma || '-'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <details style={{ cursor: 'pointer' }}>
                          <summary style={{ fontSize: 12, color: '#1a6dd4', fontWeight: 600 }}>{discs.length} disciplina(s)</summary>
                          <div style={{ marginTop: 6, textAlign: 'left', fontSize: 12 }}>
                            {discs.map((disc, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid var(--muted-border)' }}>
                                <span>{disc.disciplina}</span>
                                <span style={{ fontWeight: 700, fontFamily: 'var(--mono)' }}>
                                  {disc.media != null ? Number(disc.media).toFixed(1) : '—'}
                                  <span style={{ fontSize: 10, marginLeft: 6, color: disc.situacao === 'aprovado' ? '#059669' : disc.situacao === 'reprovado' ? '#dc2626' : 'var(--text-muted)' }}>
                                    {disc.situacao === 'aprovado' ? '✓' : disc.situacao === 'reprovado' ? '✗' : ''}
                                  </span>
                                  <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 8 }}>
                                    Freq: {disc.frequencia_pct}%
                                  </span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </details>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  )
}
