import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { Button, Alert, Card } from '../../components/ui'

/* ═══════════════════════════════════════════════════════════════
   CONFIGURAÇÃO DAS PLATAFORMAS DISPONÍVEIS
═══════════════════════════════════════════════════════════════ */
const PLATAFORMAS = [
  {
    id: 'dashboard',
    label: 'Dashboard do Professor',
    desc: 'Painel inicial com turmas atribuídas, próximas aulas e avisos gerais.',
    icon: '📊',
  },
  {
    id: 'notas',
    label: 'Lançamento de Notas',
    desc: 'Registrar, editar e consultar notas dos alunos por período letivo.',
    icon: '⭐',
  },
  {
    id: 'frequencia',
    label: 'Controle de Frequência',
    desc: 'Lançar presença e falta dos alunos por aula e turma.',
    icon: '✅',
  },
  {
    id: 'relatorio_frequencia',
    label: 'Relatório de Frequência',
    desc: 'Visualizar histórico consolidado e gerar relatórios de frequência.',
    icon: '📋',
  },
  {
    id: 'boletins',
    label: 'Boletins',
    desc: 'Acessar boletins, médias e desempenho geral dos alunos.',
    icon: '📄',
  },
  {
    id: 'comunicados',
    label: 'Comunicados',
    desc: 'Visualizar e publicar comunicados para alunos e responsáveis.',
    icon: '📢',
  },
  {
    id: 'mensagens',
    label: 'Mensagens Internas',
    desc: 'Enviar e receber mensagens internas com alunos, responsáveis e equipe.',
    icon: '💬',
  },
]

const PERFIS_PRONTOS = [
  {
    id: 'basico',
    label: 'Professor Básico',
    desc: 'Notas, frequência e comunicados. Acesso essencial para docência.',
    cor: '#059669',
    plataformas: ['dashboard', 'notas', 'frequencia', 'comunicados'],
  },
  {
    id: 'completo',
    label: 'Professor Completo',
    desc: 'Acesso total a todas as funcionalidades de ensino e acompanhamento.',
    cor: '#1a6dd4',
    plataformas: ['dashboard', 'notas', 'frequencia', 'relatorio_frequencia', 'boletins', 'comunicados', 'mensagens'],
  },
  {
    id: 'coordenador',
    label: 'Prof. Coordenador',
    desc: 'Perfil ampliado com relatórios e boletins para funções de coordenação.',
    cor: '#7c3aed',
    plataformas: ['dashboard', 'notas', 'frequencia', 'relatorio_frequencia', 'boletins', 'comunicados', 'mensagens'],
  },
]

const STEPS = [
  { id: 1, label: 'Dados Pessoais',       icon: '👤', desc: 'Informações pessoais e profissionais' },
  { id: 2, label: 'Acesso e Login',       icon: '🔑', desc: 'Credenciais de acesso ao sistema' },
  { id: 3, label: 'Plataformas',          icon: '🧩', desc: 'Módulos e permissões de acesso' },
  { id: 4, label: 'Resumo',               icon: '✅', desc: 'Revisão final e confirmação' },
]

/* ═══════════════════════════════════════════════════════════════
   UTILITÁRIOS
═══════════════════════════════════════════════════════════════ */
function formatarCPF(v) {
  v = v.replace(/\D/g, '').slice(0, 11)
  if (v.length <= 3) return v
  if (v.length <= 6) return v.slice(0, 3) + '.' + v.slice(3)
  if (v.length <= 9) return v.slice(0, 3) + '.' + v.slice(3, 6) + '.' + v.slice(6)
  return v.slice(0, 3) + '.' + v.slice(3, 6) + '.' + v.slice(6, 9) + '-' + v.slice(9)
}

function formatarTelefone(v) {
  v = v.replace(/\D/g, '').slice(0, 11)
  if (v.length <= 2) return v
  if (v.length <= 7) return '(' + v.slice(0, 2) + ') ' + v.slice(2)
  if (v.length <= 10) return '(' + v.slice(0, 2) + ') ' + v.slice(2, 6) + '-' + v.slice(6)
  return '(' + v.slice(0, 2) + ') ' + v.slice(2, 7) + '-' + v.slice(7)
}

function formatarCEP(v) {
  v = v.replace(/\D/g, '').slice(0, 8)
  if (v.length > 5) return v.slice(0, 5) + '-' + v.slice(5)
  return v
}

function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, '')
  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i)
  let rest = (sum * 10) % 11
  if (rest === 10 || rest === 11) rest = 0
  if (rest !== parseInt(cpf[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i)
  rest = (sum * 10) % 11
  if (rest === 10 || rest === 11) rest = 0
  return rest === parseInt(cpf[10])
}

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function gerarSenha() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnpqrstuvwxyz'
  const digits = '23456789'
  const special = '!@#$'
  const all = upper + lower + digits + special
  let s = ''
  s += upper[Math.floor(Math.random() * upper.length)]
  s += lower[Math.floor(Math.random() * lower.length)]
  s += digits[Math.floor(Math.random() * digits.length)]
  s += special[Math.floor(Math.random() * special.length)]
  for (let i = 0; i < 6; i++) s += all[Math.floor(Math.random() * all.length)]
  return s.split('').sort(() => Math.random() - 0.5).join('')
}

function gerarUsername(nome, email) {
  const emailPrefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
  if (emailPrefix) return emailPrefix
  const parts = nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(' ')
  return (parts[0] + (parts[1] ? parts[1][0] : '')).replace(/[^a-z0-9]/g, '')
}

const STORAGE_KEY = 'babel_professor_wizard'

function salvarRascunho(dados) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dados)) } catch { /* noop */ }
}

function carregarRascunho() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function limparRascunho() {
  try { sessionStorage.removeItem(STORAGE_KEY) } catch { /* noop */ }
}

/* ═══════════════════════════════════════════════════════════════
   ESTADO INICIAL DO FORMULÁRIO
═══════════════════════════════════════════════════════════════ */
const FORM_INICIAL = {
  // Dados pessoais
  nome: '', cpf: '', rg: '', data_nascimento: '', sexo: 'M',
  email: '', telefone: '',
  rua: '', numero: '', bairro: '', cidade: '', estado: '', cep: '',
  // Informações profissionais
  formacao: '', especializacao: '', area_atuacao: '',
  matricula_interna: '', unidade: '', registro_mec: '',
  // Login
  username: '',
  senha: '',
  trocar_senha: true,
  // Plataformas
  permissoes: [],
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL — WIZARD
═══════════════════════════════════════════════════════════════ */
export default function ProfessorWizard() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(() => {
    const rascunho = carregarRascunho()
    return rascunho ? { ...FORM_INICIAL, ...rascunho } : { ...FORM_INICIAL, senha: gerarSenha() }
  })
  const [erros, setErros] = useState({})
  const [checking, setChecking] = useState({})
  const [senhaVisivel, setSenhaVisivel] = useState(false)
  const [senhaCopiar, setSenhaCopiar] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erroGlobal, setErroGlobal] = useState('')
  const [concluido, setConcluido] = useState(null)
  const checkTimer = useRef({})

  // Salvar rascunho sempre que o form mudar
  useEffect(() => {
    salvarRascunho({ ...form, senha: '' })
  }, [form])

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    if (erros[k]) setErros(e => { const n = { ...e }; delete n[k]; return n })
  }

  const setMany = (obj) => setForm(f => ({ ...f, ...obj }))

  /* ── Validações por step ─────────────────────────────────── */
  function validarStep1() {
    const e = {}
    if (!form.nome.trim() || form.nome.trim().length < 3)
      e.nome = 'Nome completo é obrigatório (mínimo 3 caracteres).'
    if (!form.cpf) e.cpf = 'CPF é obrigatório.'
    else if (!validarCPF(form.cpf)) e.cpf = 'CPF inválido.'
    if (!form.data_nascimento) e.data_nascimento = 'Data de nascimento é obrigatória.'
    if (!form.email) e.email = 'E-mail é obrigatório.'
    else if (!validarEmail(form.email)) e.email = 'E-mail inválido.'
    if (!form.telefone || form.telefone.replace(/\D/g, '').length < 10)
      e.telefone = 'Telefone inválido (DDD + número).'
    if (!form.formacao.trim()) e.formacao = 'Formação é obrigatória.'
    return e
  }

  function validarStep2() {
    const e = {}
    if (!form.senha || form.senha.length < 8)
      e.senha = 'A senha deve ter pelo menos 8 caracteres.'
    if (!/[A-Z]/.test(form.senha)) e.senha = 'A senha precisa de ao menos uma letra maiúscula.'
    if (!/[0-9]/.test(form.senha)) e.senha = 'A senha precisa de ao menos um número.'
    return e
  }

  function validarStep3() {
    const e = {}
    if (form.permissoes.length === 0)
      e.permissoes = 'Selecione pelo menos uma plataforma de acesso.'
    return e
  }

  function validarStepAtual() {
    if (step === 1) return validarStep1()
    if (step === 2) return validarStep2()
    if (step === 3) return validarStep3()
    return {}
  }

  /* ── Verificar duplicidade via API ───────────────────────── */
  const verificarDuplicidade = (campo, valor) => {
    if (checkTimer.current[campo]) clearTimeout(checkTimer.current[campo])
    checkTimer.current[campo] = setTimeout(async () => {
      if (!valor) return
      setChecking(c => ({ ...c, [campo]: true }))
      try {
        const { data } = await api.get('/professores/verificar', { params: { [campo]: valor } })
        if (campo === 'email' && !data.email_disponivel) {
          setErros(e => ({ ...e, email: 'Este e-mail já está cadastrado no sistema.' }))
        }
        if (campo === 'cpf' && !data.cpf_disponivel) {
          setErros(e => ({ ...e, cpf: 'Este CPF já está cadastrado.' }))
        }
      } catch { /* noop */ } finally {
        setChecking(c => ({ ...c, [campo]: false }))
      }
    }, 600)
  }

  /* ── Avançar step ─────────────────────────────────────────── */
  const avancar = () => {
    const e = validarStepAtual()
    setErros(e)
    if (Object.keys(e).length === 0) {
      // Se passou no step 1, gerar username automaticamente
      if (step === 1 && !form.username) {
        setMany({ username: gerarUsername(form.nome, form.email) })
      }
      setStep(s => s + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const voltar = () => {
    setErros({})
    setStep(s => s - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const irPara = (s) => {
    if (s < step) {
      setErros({})
      setStep(s)
    }
  }

  /* ── Concluir cadastro ───────────────────────────────────── */
  const concluir = async () => {
    setEnviando(true)
    setErroGlobal('')
    try {
      const payload = {
        nome:             form.nome.trim(),
        cpf:              form.cpf,
        rg:               form.rg || undefined,
        data_nascimento:  form.data_nascimento,
        sexo:             form.sexo,
        email:            form.email.trim(),
        telefone:         form.telefone,
        formacao:         form.formacao.trim(),
        especializacao:   form.especializacao || undefined,
        area_atuacao:     form.area_atuacao || undefined,
        matricula_interna:form.matricula_interna || undefined,
        unidade:          form.unidade || undefined,
        registro_mec:     form.registro_mec || undefined,
        endereco: {
          rua:    form.rua,
          numero: form.numero,
          bairro: form.bairro,
          cidade: form.cidade,
          estado: form.estado,
          cep:    form.cep,
        },
        senha:      form.senha,
        trocar_senha: form.trocar_senha,
        permissoes: form.permissoes,
      }

      const { data } = await api.post('/professores', payload)
      limparRascunho()
      setConcluido({
        professor: data.professor,
        usuario:   data.usuario,
        login:     data.usuario.email,
        permissoes: form.permissoes,
        senha:     form.senha,
      })
    } catch (err) {
      const detail = err.response?.data
      const msg = detail?.message
        || (detail?.errors ? Object.values(detail.errors).flat().join('. ') : null)
        || 'Erro ao cadastrar professor. Verifique os dados e tente novamente.'
      setErroGlobal(msg)
    } finally {
      setEnviando(false)
    }
  }

  /* ── Tela de sucesso ─────────────────────────────────────── */
  if (concluido) {
    return <TelaSucesso concluido={concluido} navigate={navigate} />
  }

  return (
    <div style={{ maxWidth:860, margin:'0 auto' }}>
      <div className="page-header">
        <div>
          <div className="page-title">Cadastro de Professor</div>
          <div className="page-sub">Siga as etapas para registrar o docente e configurar seu acesso</div>
        </div>
        <Button variant="secondary" onClick={() => navigate('/professores')}>← Cancelar</Button>
      </div>

      {erroGlobal && (
        <Alert variant="error" onClose={() => setErroGlobal('')}>{erroGlobal}</Alert>
      )}

      {/* ── Indicador de etapas ─────────────────────────────── */}
      <StepIndicator steps={STEPS} currentStep={step} onStepClick={irPara} />

      {/* ── Conteúdo de cada etapa ──────────────────────────── */}
      <div style={{ marginTop:20 }}>
        {step === 1 && (
          <StepDadosPessoais
            form={form} set={set} erros={erros} checking={checking}
            onVerificarEmail={v => verificarDuplicidade('email', v)}
            onVerificarCPF={v => verificarDuplicidade('cpf', v)}
          />
        )}
        {step === 2 && (
          <StepLogin
            form={form} set={set} setMany={setMany} erros={erros}
            senhaVisivel={senhaVisivel} setSenhaVisivel={setSenhaVisivel}
            senhaCopiar={senhaCopiar} setSenhaCopiar={setSenhaCopiar}
          />
        )}
        {step === 3 && (
          <StepPlataformas
            form={form} setMany={setMany} erros={erros}
          />
        )}
        {step === 4 && (
          <StepResumo
            form={form} irPara={irPara}
          />
        )}
      </div>

      {/* ── Navegação ───────────────────────────────────────── */}
      <div style={{
        display:'flex', justifyContent:'space-between', alignItems:'center',
        marginTop:24, padding:'16px 0',
        borderTop:'1px solid var(--border)',
      }}>
        <div>
          {step > 1 && (
            <Button variant="secondary" onClick={voltar} disabled={enviando}>
              ← Voltar
            </Button>
          )}
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <span style={{ fontSize:12, color:'var(--text-muted)' }}>
            Etapa {step} de {STEPS.length}
          </span>
          {step < 4 ? (
            <Button onClick={avancar}>
              Continuar →
            </Button>
          ) : (
            <Button onClick={concluir} disabled={enviando} style={{ minWidth:160 }}>
              {enviando ? '⏳ Cadastrando...' : '✓ Concluir Cadastro'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   INDICADOR DE ETAPAS
═══════════════════════════════════════════════════════════════ */
function StepIndicator({ steps, currentStep, onStepClick }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:0,
      background:'var(--bg-surface)', borderRadius:12,
      border:'1px solid var(--border)', padding:'4px',
      overflowX:'auto',
    }}>
      {steps.map((s, i) => {
        const done = currentStep > s.id
        const active = currentStep === s.id
        const clickable = s.id < currentStep

        return (
          <React.Fragment key={s.id}>
            <div
              onClick={() => clickable && onStepClick(s.id)}
              style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'10px 16px', borderRadius:9, flexShrink:0,
                background: active ? '#1a6dd4' : done ? 'rgba(5,150,105,.07)' : 'transparent',
                cursor: clickable ? 'pointer' : 'default',
                transition:'all .15s',
              }}
            >
              <div style={{
                width:30, height:30, borderRadius:'50%', flexShrink:0,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:14, fontWeight:700,
                background: active ? 'rgba(255,255,255,.15)' : done ? '#059669' : 'var(--bg-base)',
                color: active ? '#fff' : done ? '#fff' : 'var(--text-muted)',
                border: active ? '2px solid rgba(255,255,255,.3)' : done ? 'none' : '2px solid var(--border)',
              }}>
                {done ? '✓' : s.icon}
              </div>
              <div>
                <div style={{
                  fontSize:12.5, fontWeight:700,
                  color: active ? '#fff' : done ? '#059669' : 'var(--text-secondary)',
                }}>
                  {s.label}
                </div>
                <div style={{
                  fontSize:11, color: active ? 'rgba(255,255,255,.7)' : 'var(--text-muted)',
                }}>
                  {s.desc}
                </div>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                width:20, height:2, flexShrink:0,
                background: currentStep > s.id ? '#059669' : 'var(--border)',
                borderRadius:2,
              }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   STEP 1 — DADOS PESSOAIS
═══════════════════════════════════════════════════════════════ */
function StepDadosPessoais({ form, set, erros, checking, onVerificarEmail, onVerificarCPF }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <Card title="Dados Pessoais">
        <div className="form-grid">
          {/* Nome */}
          <div className="form-group form-full">
            <label className="form-label">Nome Completo *</label>
            <input
              className={`form-control${erros.nome ? ' input-error' : ''}`}
              value={form.nome}
              onChange={e => set('nome', e.target.value)}
              placeholder="Nome completo do professor"
            />
            {erros.nome && <FieldError>{erros.nome}</FieldError>}
          </div>

          {/* CPF */}
          <div className="form-group">
            <label className="form-label">CPF *</label>
            <div style={{ position:'relative' }}>
              <input
                className={`form-control${erros.cpf ? ' input-error' : ''}`}
                value={form.cpf}
                onChange={e => {
                  const v = formatarCPF(e.target.value)
                  set('cpf', v)
                  if (v.replace(/\D/g,'').length === 11) onVerificarCPF(v)
                }}
                placeholder="000.000.000-00"
                maxLength={14}
              />
              {checking.cpf && <CheckingSpinner />}
            </div>
            {erros.cpf && <FieldError>{erros.cpf}</FieldError>}
          </div>

          {/* RG */}
          <div className="form-group">
            <label className="form-label">RG</label>
            <input
              className="form-control"
              value={form.rg}
              onChange={e => set('rg', e.target.value)}
              placeholder="00.000.000-0"
            />
          </div>

          {/* Data de nascimento */}
          <div className="form-group">
            <label className="form-label">Data de Nascimento *</label>
            <input
              type="date"
              className={`form-control${erros.data_nascimento ? ' input-error' : ''}`}
              value={form.data_nascimento}
              onChange={e => set('data_nascimento', e.target.value)}
            />
            {erros.data_nascimento && <FieldError>{erros.data_nascimento}</FieldError>}
          </div>

          {/* Sexo */}
          <div className="form-group">
            <label className="form-label">Sexo</label>
            <select className="form-control" value={form.sexo} onChange={e => set('sexo', e.target.value)}>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
              <option value="O">Outro / Prefiro não informar</option>
            </select>
          </div>

          {/* E-mail */}
          <div className="form-group">
            <label className="form-label">E-mail *</label>
            <div style={{ position:'relative' }}>
              <input
                type="email"
                className={`form-control${erros.email ? ' input-error' : ''}`}
                value={form.email}
                onChange={e => {
                  set('email', e.target.value)
                  if (validarEmail(e.target.value)) onVerificarEmail(e.target.value)
                }}
                placeholder="email@escola.edu.br"
              />
              {checking.email && <CheckingSpinner />}
            </div>
            {erros.email && <FieldError>{erros.email}</FieldError>}
          </div>

          {/* Telefone */}
          <div className="form-group">
            <label className="form-label">Telefone *</label>
            <input
              className={`form-control${erros.telefone ? ' input-error' : ''}`}
              value={form.telefone}
              onChange={e => set('telefone', formatarTelefone(e.target.value))}
              placeholder="(11) 99999-0000"
            />
            {erros.telefone && <FieldError>{erros.telefone}</FieldError>}
          </div>
        </div>
      </Card>

      <Card title="Endereço">
        <div className="form-grid">
          <div className="form-group form-full">
            <label className="form-label">Rua / Logradouro</label>
            <input className="form-control" value={form.rua}
              onChange={e => set('rua', e.target.value)} placeholder="Rua, Avenida, Travessa..." />
          </div>
          <div className="form-group">
            <label className="form-label">Número</label>
            <input className="form-control" value={form.numero}
              onChange={e => set('numero', e.target.value)} placeholder="123" />
          </div>
          <div className="form-group">
            <label className="form-label">Bairro</label>
            <input className="form-control" value={form.bairro}
              onChange={e => set('bairro', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Cidade</label>
            <input className="form-control" value={form.cidade}
              onChange={e => set('cidade', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Estado</label>
            <input className="form-control" maxLength={2} value={form.estado}
              onChange={e => set('estado', e.target.value.toUpperCase())} placeholder="SP" />
          </div>
          <div className="form-group">
            <label className="form-label">CEP</label>
            <input className="form-control" value={form.cep}
              onChange={e => set('cep', formatarCEP(e.target.value))} placeholder="00000-000" />
          </div>
        </div>
      </Card>

      <Card title="Informações Profissionais">
        <div className="form-grid">
          <div className="form-group form-full">
            <label className="form-label">Formação Acadêmica *</label>
            <input
              className={`form-control${erros.formacao ? ' input-error' : ''}`}
              value={form.formacao}
              onChange={e => set('formacao', e.target.value)}
              placeholder="Ex: Licenciatura em Matemática — UNESP"
            />
            {erros.formacao && <FieldError>{erros.formacao}</FieldError>}
          </div>
          <div className="form-group form-full">
            <label className="form-label">Especialização / Pós-graduação</label>
            <input className="form-control" value={form.especializacao}
              onChange={e => set('especializacao', e.target.value)}
              placeholder="Ex: Especialização em Gestão Educacional" />
          </div>
          <div className="form-group">
            <label className="form-label">Área de Atuação</label>
            <input className="form-control" value={form.area_atuacao}
              onChange={e => set('area_atuacao', e.target.value)}
              placeholder="Ex: Exatas, Humanas, Linguagens..." />
          </div>
          <div className="form-group">
            <label className="form-label">Matrícula Interna</label>
            <input className="form-control" value={form.matricula_interna}
              onChange={e => set('matricula_interna', e.target.value)}
              placeholder="Número de matrícula da instituição" />
          </div>
          <div className="form-group">
            <label className="form-label">Unidade / Campus</label>
            <input className="form-control" value={form.unidade}
              onChange={e => set('unidade', e.target.value)}
              placeholder="Ex: Campus Centro, Unidade Norte..." />
          </div>
          <div className="form-group">
            <label className="form-label">Registro MEC</label>
            <input className="form-control" value={form.registro_mec}
              onChange={e => set('registro_mec', e.target.value)}
              placeholder="Registro no MEC (se houver)" />
          </div>
        </div>
      </Card>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   STEP 2 — ACESSO E LOGIN
═══════════════════════════════════════════════════════════════ */
function StepLogin({ form, set, setMany, erros, senhaVisivel, setSenhaVisivel, senhaCopiar, setSenhaCopiar }) {
  const copiarSenha = () => {
    navigator.clipboard.writeText(form.senha).then(() => {
      setSenhaCopiar(true)
      setTimeout(() => setSenhaCopiar(false), 2000)
    }).catch(() => {})
  }

  const regenerarSenha = () => {
    const nova = gerarSenha()
    setMany({ senha: nova })
  }

  const regenerarUsername = () => {
    setMany({ username: gerarUsername(form.nome, form.email) })
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <Card title="Identificação de Acesso">
        <div className="form-grid">
          {/* E-mail (read-only) */}
          <div className="form-group form-full">
            <label className="form-label">E-mail de acesso (login principal)</label>
            <div style={{ position:'relative' }}>
              <input
                className="form-control"
                value={form.email}
                readOnly
                style={{ background:'var(--bg-base)', color:'var(--text-secondary)', cursor:'default' }}
              />
              <div style={{
                position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                fontSize:11, background:'rgba(26,109,212,.08)',
                borderRadius:4, padding:'2px 6px', fontWeight:600, color:'#1a6dd4',
              }}>
                Identificador principal
              </div>
            </div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>
              O professor usará este e-mail para entrar no sistema.
            </div>
          </div>

          {/* Nome de usuário */}
          <div className="form-group form-full">
            <label className="form-label">Nome de usuário (interno)</label>
            <div style={{ display:'flex', gap:8 }}>
              <input
                className="form-control"
                value={form.username}
                onChange={e => set('username', e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                placeholder="usuario.sistema"
                style={{ fontFamily:'var(--mono)' }}
              />
              <button
                type="button"
                onClick={regenerarUsername}
                style={btnSecondary}
                title="Gerar nome de usuário automaticamente"
              >
                ↺ Gerar
              </button>
            </div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>
              Gerado automaticamente a partir do e-mail. Pode ser alterado.
            </div>
          </div>
        </div>
      </Card>

      <Card title="Senha Inicial">
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Aviso importante */}
          <div style={{
            padding:12, borderRadius:8, background:'rgba(245,158,11,.07)',
            border:'1px solid rgba(245,158,11,.2)', display:'flex', gap:10, alignItems:'flex-start',
          }}>
            <span style={{ fontSize:18, flexShrink:0 }}>⚠️</span>
            <div style={{ fontSize:12.5, color:'#92400e', lineHeight:1.6 }}>
              <strong>Atenção:</strong> Esta senha é gerada automaticamente e exibida <strong>apenas uma vez</strong>.
              Copie e repasse ao professor com segurança. Após sair desta tela, a senha não poderá ser recuperada —
              apenas redefinida.
            </div>
          </div>

          {/* Campo senha */}
          <div>
            <label className="form-label">Senha temporária gerada</label>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <div style={{ position:'relative', flex:1 }}>
                <input
                  className={`form-control${erros.senha ? ' input-error' : ''}`}
                  type={senhaVisivel ? 'text' : 'password'}
                  value={form.senha}
                  onChange={e => set('senha', e.target.value)}
                  style={{ fontFamily:'var(--mono)', fontWeight:600, letterSpacing: senhaVisivel ? 1 : 3, paddingRight:44 }}
                />
                <button
                  type="button"
                  onClick={() => setSenhaVisivel(v => !v)}
                  style={{
                    position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                    background:'none', border:'none', cursor:'pointer', fontSize:16, color:'var(--text-muted)',
                  }}
                  title={senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {senhaVisivel ? '🙈' : '👁️'}
                </button>
              </div>
              <button type="button" onClick={copiarSenha} style={{ ...btnSecondary, minWidth:90 }}>
                {senhaCopiar ? '✓ Copiado' : '📋 Copiar'}
              </button>
              <button type="button" onClick={regenerarSenha} style={{ ...btnSecondary, minWidth:90 }}>
                ↺ Nova senha
              </button>
            </div>
            {erros.senha && <FieldError>{erros.senha}</FieldError>}
          </div>

          {/* Indicador de força */}
          <SenhaForca senha={form.senha} />

          {/* Regras */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
            <RegraCheck ok={form.senha.length >= 8}>Mínimo 8 caracteres</RegraCheck>
            <RegraCheck ok={/[A-Z]/.test(form.senha)}>Letra maiúscula</RegraCheck>
            <RegraCheck ok={/[a-z]/.test(form.senha)}>Letra minúscula</RegraCheck>
            <RegraCheck ok={/[0-9]/.test(form.senha)}>Número</RegraCheck>
            <RegraCheck ok={/[!@#$%^&*]/.test(form.senha)}>Caractere especial</RegraCheck>
          </div>
        </div>
      </Card>

      <Card title="Configurações de Acesso">
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Trocar senha */}
          <label style={{ display:'flex', alignItems:'flex-start', gap:12, cursor:'pointer', padding:'12px 14px', borderRadius:8, border:'1px solid var(--border)', background: form.trocar_senha ? 'rgba(26,109,212,.04)' : 'transparent' }}>
            <input
              type="checkbox"
              checked={form.trocar_senha}
              onChange={e => set('trocar_senha', e.target.checked)}
              style={{ marginTop:2, width:16, height:16, accentColor:'#1a6dd4', flexShrink:0 }}
            />
            <div>
              <div style={{ fontSize:13.5, fontWeight:600, color:'var(--text-primary)' }}>
                Obrigar troca de senha no primeiro acesso
              </div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:3 }}>
                Recomendado. O professor será redirecionado para definir uma nova senha segura ao entrar pela primeira vez.
              </div>
            </div>
          </label>

          {/* Info adicional */}
          <div style={{
            padding:12, borderRadius:8, background:'rgba(26,109,212,.05)',
            border:'1px solid rgba(26,109,212,.12)', fontSize:12.5, color:'var(--text-secondary)', lineHeight:1.6,
          }}>
            <strong>Credenciais de acesso:</strong><br/>
            Login: <code style={{ fontFamily:'var(--mono)', fontWeight:700, color:'#1a6dd4' }}>{form.email}</code><br/>
            URL de acesso: <code style={{ fontFamily:'var(--mono)' }}>sistema.babel.edu.br/login</code>
          </div>
        </div>
      </Card>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   STEP 3 — PLATAFORMAS E PERMISSÕES
═══════════════════════════════════════════════════════════════ */
function StepPlataformas({ form, setMany, erros }) {
  const toggle = (id) => {
    const atual = form.permissoes || []
    const novas = atual.includes(id) ? atual.filter(p => p !== id) : [...atual, id]
    setMany({ permissoes: novas })
  }

  const aplicarPerfil = (perfil) => {
    setMany({ permissoes: [...perfil.plataformas] })
  }

  const selecionarTodas = () => setMany({ permissoes: PLATAFORMAS.map(p => p.id) })
  const limparTodas = () => setMany({ permissoes: [] })

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      {/* Perfis prontos */}
      <Card title="Perfis Prontos">
        <div style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:12 }}>
          Selecione um perfil para preencher automaticamente as permissões. Você poderá ajustar individualmente depois.
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:10 }}>
          {PERFIS_PRONTOS.map(perfil => {
            const isAtivo = JSON.stringify([...form.permissoes].sort()) === JSON.stringify([...perfil.plataformas].sort())
            return (
              <button
                key={perfil.id}
                type="button"
                onClick={() => aplicarPerfil(perfil)}
                style={{
                  padding:'12px 14px', borderRadius:10, cursor:'pointer', textAlign:'left',
                  border: isAtivo ? `2px solid ${perfil.cor}` : '1px solid var(--border)',
                  background: isAtivo ? `${perfil.cor}10` : 'var(--bg-surface)',
                  transition:'all .15s',
                }}
              >
                <div style={{ fontSize:13.5, fontWeight:700, color: isAtivo ? perfil.cor : 'var(--text-primary)', marginBottom:4 }}>
                  {perfil.label}
                </div>
                <div style={{ fontSize:11.5, color:'var(--text-muted)', lineHeight:1.5 }}>{perfil.desc}</div>
                <div style={{ marginTop:8, display:'flex', flexWrap:'wrap', gap:3 }}>
                  {perfil.plataformas.map(p => (
                    <span key={p} style={{
                      fontSize:10, padding:'1px 5px', borderRadius:3,
                      background: `${perfil.cor}18`, color: perfil.cor, fontWeight:600,
                    }}>
                      {PLATAFORMAS.find(pl => pl.id === p)?.label || p}
                    </span>
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Seleção individual */}
      <Card title="Selecionar Plataformas Individualmente">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontSize:13, color:'var(--text-secondary)' }}>
            {form.permissoes.length} de {PLATAFORMAS.length} plataformas selecionadas
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button type="button" onClick={selecionarTodas} style={btnSecondary}>Selecionar todas</button>
            <button type="button" onClick={limparTodas} style={btnSecondary}>Limpar</button>
          </div>
        </div>

        {erros.permissoes && <Alert variant="error">{erros.permissoes}</Alert>}

        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {PLATAFORMAS.map(plat => {
            const ativo = form.permissoes.includes(plat.id)
            return (
              <label
                key={plat.id}
                style={{
                  display:'flex', alignItems:'center', gap:14, cursor:'pointer',
                  padding:'12px 14px', borderRadius:9,
                  border: ativo ? '1px solid rgba(26,109,212,.3)' : '1px solid var(--border)',
                  background: ativo ? 'rgba(26,109,212,.04)' : 'var(--bg-surface)',
                  transition:'all .13s',
                }}
              >
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={() => toggle(plat.id)}
                  style={{ width:17, height:17, accentColor:'#1a6dd4', flexShrink:0 }}
                />
                <div style={{ fontSize:18, flexShrink:0 }}>{plat.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13.5, fontWeight:ativo ? 700 : 500, color: ativo ? '#1a6dd4' : 'var(--text-primary)' }}>
                    {plat.label}
                  </div>
                  <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{plat.desc}</div>
                </div>
                {ativo && (
                  <div style={{
                    fontSize:11, padding:'3px 8px', borderRadius:6,
                    background:'rgba(26,109,212,.1)', color:'#1a6dd4', fontWeight:700, flexShrink:0,
                  }}>
                    Liberado
                  </div>
                )}
              </label>
            )
          })}
        </div>
      </Card>

      {/* Resumo visual do que está sendo concedido */}
      {form.permissoes.length > 0 && (
        <div style={{
          padding:14, borderRadius:10,
          background:'rgba(5,150,105,.05)', border:'1px solid rgba(5,150,105,.2)',
        }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#065f46', marginBottom:8 }}>
            ✓ Plataformas que serão liberadas para este professor:
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {form.permissoes.map(id => {
              const plat = PLATAFORMAS.find(p => p.id === id)
              return plat ? (
                <span key={id} style={{
                  display:'flex', alignItems:'center', gap:5,
                  padding:'4px 10px', borderRadius:6,
                  background:'rgba(5,150,105,.1)', color:'#065f46', fontWeight:600, fontSize:12.5,
                  border:'1px solid rgba(5,150,105,.2)',
                }}>
                  {plat.icon} {plat.label}
                </span>
              ) : null
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   STEP 4 — RESUMO FINAL
═══════════════════════════════════════════════════════════════ */
function StepResumo({ form, irPara }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Banner de confirmação */}
      <div style={{
        padding:'16px 20px', borderRadius:10,
        background:'linear-gradient(135deg, rgba(26,109,212,.08), rgba(59,142,245,.05))',
        border:'1px solid rgba(26,109,212,.2)',
        display:'flex', gap:14, alignItems:'center',
      }}>
        <div style={{ fontSize:36 }}>📋</div>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>
            Revise os dados antes de confirmar
          </div>
          <div style={{ fontSize:12.5, color:'var(--text-secondary)', marginTop:2 }}>
            Após concluir, o professor será criado e poderá acessar o sistema imediatamente com as permissões configuradas.
          </div>
        </div>
      </div>

      {/* Dados pessoais */}
      <ResumoSection title="Dados Pessoais" onEdit={() => irPara(1)}>
        <ResumoGrid>
          <ResumoItem label="Nome" value={form.nome} />
          <ResumoItem label="CPF" value={form.cpf} mono />
          <ResumoItem label="RG" value={form.rg || '—'} mono />
          <ResumoItem label="Data de Nascimento" value={form.data_nascimento || '—'} />
          <ResumoItem label="Sexo" value={{ M:'Masculino', F:'Feminino', O:'Outro' }[form.sexo]} />
          <ResumoItem label="E-mail" value={form.email} />
          <ResumoItem label="Telefone" value={form.telefone || '—'} />
        </ResumoGrid>
        {(form.rua || form.cidade) && (
          <>
            <Divisor />
            <ResumoGrid>
              <ResumoItem label="Endereço" value={[form.rua, form.numero].filter(Boolean).join(', ') || '—'} span />
              <ResumoItem label="Bairro" value={form.bairro || '—'} />
              <ResumoItem label="Cidade / Estado" value={[form.cidade, form.estado].filter(Boolean).join(' / ') || '—'} />
              <ResumoItem label="CEP" value={form.cep || '—'} mono />
            </ResumoGrid>
          </>
        )}
      </ResumoSection>

      {/* Dados profissionais */}
      <ResumoSection title="Informações Profissionais" onEdit={() => irPara(1)}>
        <ResumoGrid>
          <ResumoItem label="Formação" value={form.formacao} span />
          <ResumoItem label="Especialização" value={form.especializacao || '—'} span />
          <ResumoItem label="Área de Atuação" value={form.area_atuacao || '—'} />
          <ResumoItem label="Unidade / Campus" value={form.unidade || '—'} />
          <ResumoItem label="Matrícula Interna" value={form.matricula_interna || '—'} mono />
          <ResumoItem label="Registro MEC" value={form.registro_mec || '—'} mono />
        </ResumoGrid>
      </ResumoSection>

      {/* Login */}
      <ResumoSection title="Acesso e Login" onEdit={() => irPara(2)}>
        <ResumoGrid>
          <ResumoItem label="Login (e-mail)" value={form.email} />
          <ResumoItem label="Nome de usuário" value={form.username || '—'} mono />
          <ResumoItem label="Senha inicial" value="••••••••  (definida na etapa 2)" />
          <ResumoItem
            label="Trocar senha no 1º acesso"
            value={form.trocar_senha ? '✓ Sim — obrigatório' : '✗ Não'}
          />
        </ResumoGrid>
      </ResumoSection>

      {/* Plataformas */}
      <ResumoSection title="Plataformas e Permissões" onEdit={() => irPara(3)}>
        {form.permissoes.length === 0 ? (
          <div style={{ color:'var(--danger)', fontSize:13 }}>Nenhuma plataforma selecionada!</div>
        ) : (
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {form.permissoes.map(id => {
              const plat = PLATAFORMAS.find(p => p.id === id)
              return plat ? (
                <span key={id} style={{
                  display:'flex', alignItems:'center', gap:6,
                  padding:'6px 12px', borderRadius:8,
                  background:'rgba(5,150,105,.08)', color:'#065f46',
                  border:'1px solid rgba(5,150,105,.2)', fontSize:13, fontWeight:600,
                }}>
                  {plat.icon} {plat.label}
                </span>
              ) : null
            })}
          </div>
        )}
      </ResumoSection>

      {/* Aviso auditoria */}
      <div style={{
        padding:12, borderRadius:8,
        background:'rgba(15,36,64,.04)', border:'1px solid var(--border)',
        fontSize:12, color:'var(--text-muted)', lineHeight:1.6,
      }}>
        Ao clicar em <strong>Concluir Cadastro</strong>, o sistema irá: criar o usuário de acesso,
        vincular as permissões selecionadas e registrar um <strong>histórico de auditoria</strong>
        com data, hora e responsável pela criação.
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TELA DE SUCESSO
═══════════════════════════════════════════════════════════════ */
function TelaSucesso({ concluido, navigate }) {
  const [senhaCopiar, setSenhaCopiar] = useState(false)
  const [senhaOculta, setSenhaOculta] = useState(true)

  const copiarSenha = () => {
    navigator.clipboard.writeText(concluido.senha).then(() => {
      setSenhaCopiar(true)
      setTimeout(() => setSenhaCopiar(false), 2500)
    })
  }

  return (
    <div style={{ maxWidth:700, margin:'0 auto' }}>
      {/* Banner de sucesso */}
      <div style={{
        textAlign:'center', padding:'40px 24px 30px',
        background:'linear-gradient(135deg, rgba(5,150,105,.08), rgba(16,185,129,.05))',
        border:'1px solid rgba(5,150,105,.25)', borderRadius:16, marginBottom:20,
      }}>
        <div style={{ fontSize:56, marginBottom:12 }}>🎉</div>
        <div style={{ fontSize:22, fontWeight:800, color:'#065f46', marginBottom:6 }}>
          Professor cadastrado com sucesso!
        </div>
        <div style={{ fontSize:14, color:'var(--text-secondary)' }}>
          O docente já pode acessar o sistema com as credenciais configuradas.
        </div>
      </div>

      {/* Card de credenciais */}
      <Card title="Credenciais de Acesso">
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, marginBottom:4, textTransform:'uppercase', letterSpacing:.5 }}>
                Professor
              </div>
              <div style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>
                {concluido.professor?.usuario?.nome}
              </div>
            </div>
            <div>
              <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, marginBottom:4, textTransform:'uppercase', letterSpacing:.5 }}>
                ID do sistema
              </div>
              <div style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)', fontFamily:'var(--mono)' }}>
                #{concluido.professor?.id}
              </div>
            </div>
            <div>
              <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, marginBottom:4, textTransform:'uppercase', letterSpacing:.5 }}>
                Login (e-mail)
              </div>
              <div style={{ fontSize:13.5, fontWeight:600, color:'#1a6dd4', fontFamily:'var(--mono)' }}>
                {concluido.login}
              </div>
            </div>
            <div>
              <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, marginBottom:4, textTransform:'uppercase', letterSpacing:.5 }}>
                Status
              </div>
              <span style={{
                fontSize:12, padding:'3px 10px', borderRadius:6,
                background:'rgba(5,150,105,.1)', color:'#065f46', fontWeight:700,
              }}>
                ✓ Ativo
              </span>
            </div>
          </div>

          {/* Senha — exibida apenas uma vez */}
          <div style={{
            padding:14, borderRadius:10,
            background:'rgba(245,158,11,.06)', border:'1px solid rgba(245,158,11,.25)',
          }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#92400e', marginBottom:8 }}>
              ⚠️ Senha inicial — copie agora (não será exibida novamente)
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <input
                type={senhaOculta ? 'password' : 'text'}
                value={concluido.senha}
                readOnly
                style={{
                  flex:1, padding:'8px 12px', borderRadius:8,
                  border:'1px solid rgba(245,158,11,.3)', background:'#fff',
                  fontFamily:'var(--mono)', fontWeight:700, fontSize:15,
                  letterSpacing: senhaOculta ? 3 : 1,
                }}
              />
              <button
                onClick={() => setSenhaOculta(v => !v)}
                style={{ ...btnSecondary, minWidth:36 }}
                title="Mostrar/ocultar"
              >
                {senhaOculta ? '👁️' : '🙈'}
              </button>
              <button onClick={copiarSenha} style={{ ...btnSecondary, minWidth:90 }}>
                {senhaCopiar ? '✓ Copiado!' : '📋 Copiar'}
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Plataformas liberadas */}
      <Card title="Plataformas Liberadas" style={{ marginTop:16 }}>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {concluido.permissoes.map(id => {
            const plat = PLATAFORMAS.find(p => p.id === id)
            return plat ? (
              <span key={id} style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'6px 12px', borderRadius:8,
                background:'rgba(26,109,212,.07)', color:'#1a6dd4',
                border:'1px solid rgba(26,109,212,.18)', fontSize:13, fontWeight:600,
              }}>
                {plat.icon} {plat.label}
              </span>
            ) : null
          })}
          {concluido.permissoes.length === 0 && (
            <span style={{ fontSize:13, color:'var(--text-muted)' }}>Nenhuma plataforma liberada.</span>
          )}
        </div>
      </Card>

      {/* Ações rápidas */}
      <div style={{
        display:'flex', flexWrap:'wrap', gap:10, justifyContent:'center',
        marginTop:24, padding:'20px 0',
        borderTop:'1px solid var(--border)',
      }}>
        <Button onClick={() => navigate('/professores')}>
          📋 Ver lista de professores
        </Button>
        <Button variant="secondary" onClick={() => {
          window.location.href = '/professores/novo'
        }}>
          + Cadastrar outro professor
        </Button>
        <Button variant="secondary" onClick={() => navigate('/')}>
          🏠 Ir para o Dashboard
        </Button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENTES AUXILIARES
═══════════════════════════════════════════════════════════════ */
function FieldError({ children }) {
  return (
    <div style={{ fontSize:11.5, color:'var(--danger)', marginTop:4, display:'flex', alignItems:'center', gap:4 }}>
      <span>⚠</span> {children}
    </div>
  )
}

function CheckingSpinner() {
  return (
    <div style={{
      position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
      width:14, height:14, borderRadius:'50%',
      border:'2px solid rgba(26,109,212,.3)', borderTopColor:'#1a6dd4',
      animation:'spin .6s linear infinite',
    }} />
  )
}

function SenhaForca({ senha }) {
  let score = 0
  if (senha.length >= 8) score++
  if (/[A-Z]/.test(senha)) score++
  if (/[a-z]/.test(senha)) score++
  if (/[0-9]/.test(senha)) score++
  if (/[!@#$%^&*]/.test(senha)) score++

  const info = [
    null,
    { label:'Muito fraca', color:'#ef4444' },
    { label:'Fraca', color:'#f97316' },
    { label:'Razoável', color:'#f59e0b' },
    { label:'Boa', color:'#10b981' },
    { label:'Forte', color:'#059669' },
  ][score] || { label:'—', color:'var(--border)' }

  return (
    <div>
      <div style={{ display:'flex', gap:4, marginBottom:4 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{
            flex:1, height:4, borderRadius:2,
            background: i <= score ? info.color : 'var(--border)',
            transition:'background .2s',
          }} />
        ))}
      </div>
      <div style={{ fontSize:11, color:info.color, fontWeight:600 }}>{info.label}</div>
    </div>
  )
}

function RegraCheck({ ok, children }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color: ok ? '#059669' : 'var(--text-muted)' }}>
      <span style={{
        width:16, height:16, borderRadius:'50%', flexShrink:0, fontSize:10,
        display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700,
        background: ok ? '#059669' : 'var(--border)', color:'#fff',
      }}>
        {ok ? '✓' : ''}
      </span>
      {children}
    </div>
  )
}

function ResumoSection({ title, onEdit, children }) {
  return (
    <div style={{ border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
      <div style={{
        display:'flex', justifyContent:'space-between', alignItems:'center',
        padding:'10px 14px', background:'var(--bg-base)',
        borderBottom:'1px solid var(--border)',
      }}>
        <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>{title}</div>
        <button
          type="button"
          onClick={onEdit}
          style={{
            fontSize:12, color:'#1a6dd4', background:'none', border:'none',
            cursor:'pointer', fontWeight:600, padding:'2px 6px',
          }}
        >
          ✏️ Editar
        </button>
      </div>
      <div style={{ padding:14 }}>{children}</div>
    </div>
  )
}

function ResumoGrid({ children }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:10 }}>
      {children}
    </div>
  )
}

function ResumoItem({ label, value, mono, span }) {
  return (
    <div style={{ gridColumn: span ? '1/-1' : undefined }}>
      <div style={{ fontSize:10.5, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:.5, marginBottom:2 }}>
        {label}
      </div>
      <div style={{
        fontSize:13.5, color:'var(--text-primary)', fontWeight:500,
        fontFamily: mono ? 'var(--mono)' : 'inherit',
      }}>
        {value || '—'}
      </div>
    </div>
  )
}

function Divisor() {
  return <div style={{ height:1, background:'var(--border)', margin:'10px 0' }} />
}

/* ── Estilos reutilizáveis ────────────────────────────────── */
const btnSecondary = {
  padding:'8px 12px', borderRadius:8,
  border:'1px solid var(--border)',
  background:'var(--bg-surface)',
  color:'var(--text-secondary)',
  cursor:'pointer', fontSize:12.5, fontWeight:600,
  whiteSpace:'nowrap',
  transition:'all .13s',
}
