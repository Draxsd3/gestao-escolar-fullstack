import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import logoLarge from '../../assets/logo-large.png'
import adminPortalImg from '../../assets/admin-portal.png'
import professorPortalImg from '../../assets/professor-portal.png'
import alunoPortalImg from '../../assets/aluno-portal.png'

/* ══════════════════════════════════════════════════════════
   CORES — inspiradas no Exitus: fundo azul-marinho,
   cards claros, botão teal/ciano
══════════════════════════════════════════════════════════ */
const C = {
  bg:       '#012a4a',
  bgLight:  '#013a63',
  card:     'rgba(220,230,240,0.88)',
  cardHov:  'rgba(230,238,248,0.95)',
  teal:     '#00d8c3',
  tealHov:  '#00c4b0',
  dark:     '#091954',
  textCard: '#3a3f50',
  textMuted:'#6a7085',
  white:    '#ffffff',
  border:   'rgba(255,255,255,0.12)',
  danger:   '#ef4444',
}

const FONT = "'Inter', sans-serif"
const MONO = "'JetBrains Mono', monospace"

const PORTAIS = [
  { key:'admin',     label:'Admin',   Illu: IlluAdmin,     img: adminPortalImg },
  { key:'professor', label:'Docente', Illu: IlluProfessor, img: professorPortalImg },
  { key:'aluno',     label:'Aluno',   Illu: IlluAluno,     img: alunoPortalImg },
]

/* ══════════════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════════════ */
export default function LoginPage() {
  const [tela, setTela]     = useState('portais')
  const [portal, setPortal] = useState(null)

  if (tela === 'login' && portal)
    return <FormLogin portal={portal} onVoltar={() => setTela('portais')} />
  if (tela === 'admin')
    return <FormAdmin onVoltar={() => setTela('portais')} />

  return (
    <SelecaoPortal
      onSelect={p => { setPortal(p); setTela('login') }}
      onAdmin={() => setTela('admin')}
    />
  )
}

/* ══════════════════════════════════════════════════════════
   TELA 1 — Seleção de portais (estilo Exitus)
══════════════════════════════════════════════════════════ */
function SelecaoPortal({ onSelect, onAdmin }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(170deg, ${C.bg} 0%, ${C.bgLight} 50%, ${C.bg} 100%)`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', fontFamily: FONT,
    }}>
      {/* Logo */}
      <img src={logoLarge} alt="Babel" style={{
        height: 90, width: 'auto', objectFit: 'contain',
        filter: 'brightness(0) invert(1)', marginBottom: 28,
      }}/>

      {/* Subtítulo */}
      <p style={{
        fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,.75)',
        letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 40,
        textAlign: 'center',
      }}>
        Bem-vindo ao Babel, escolha seu tipo de acesso:
      </p>

      {/* Cards — 3 colunas */}
      <div style={{
        display: 'flex', gap: 28, flexWrap: 'wrap',
        justifyContent: 'center', marginBottom: 40, maxWidth: 1080,
      }}>
        {PORTAIS.map(p => (
          <PortalCard key={p.key} portal={p} onSelect={() => onSelect(p)} />
        ))}
      </div>

      {/* Link criar admin */}
      <button onClick={onAdmin} style={{
        background: 'none', border: `1px solid ${C.border}`,
        borderRadius: 8, padding: '8px 20px',
        color: 'rgba(255,255,255,.45)', fontSize: 12.5, fontWeight: 500,
        cursor: 'pointer', fontFamily: FONT,
        transition: 'all .2s', marginBottom: 28,
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.color = C.teal }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = 'rgba(255,255,255,.45)' }}
      >
        Criar conta de administrador
      </button>

      {/* Copyright */}
      <p style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,.3)' }}>
        Copyright © {new Date().getFullYear()} | Todos os Direitos Reservados
      </p>
    </div>
  )
}

/* ── Card de Portal ─────────────────────────────────────── */
function PortalCard({ portal, onSelect }) {
  const [hov, setHov] = useState(false)
  const { Illu } = portal

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onSelect}
      style={{
        width: 300, minHeight: 370,
        background: hov ? C.cardHov : C.card,
        backdropFilter: 'blur(10px)',
        borderRadius: 14,
        border: `1px solid ${hov ? 'rgba(0,216,195,.35)' : 'rgba(255,255,255,.15)'}`,
        padding: '22px 20px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        cursor: 'pointer',
        transition: 'all .3s ease',
        transform: hov ? 'translateY(-6px)' : 'none',
        boxShadow: hov
          ? '0 16px 40px rgba(0,0,0,.25)'
          : '0 4px 16px rgba(0,0,0,.15)',
        position: 'relative',
      }}
    >
      {/* Label */}
      <div style={{
        fontSize: 13, fontWeight: 700, letterSpacing: '1.5px',
        color: C.textCard, textTransform: 'uppercase',
        marginBottom: 6, textAlign: 'center',
      }}>
        {portal.label}
      </div>

      {/* Linha teal abaixo do label */}
      <div style={{
        width: 70, height: 3, borderRadius: 99,
        background: C.teal, marginBottom: 22,
      }}/>

      {/* Ilustração */}
      <div style={{
        flex: 1, width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 18,
      }}>
        {portal.img ? (
          <img src={portal.img} alt="ilustração" style={{ maxWidth: '90%', height: 200, objectFit: 'contain' }} />
        ) : (
          <Illu size={180} />
        )}
      </div>

      {/* Botão Acessar */}
      <button
        onClick={e => { e.stopPropagation(); onSelect() }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '10px 28px', borderRadius: 8,
          background: hov ? C.tealHov : C.teal,
          border: 'none', color: C.dark,
          fontSize: 13, fontWeight: 700, cursor: 'pointer',
          fontFamily: FONT,
          transition: 'all .2s',
          boxShadow: hov ? '0 4px 14px rgba(0,216,195,.35)' : 'none',
        }}
      >
        <IcoLogin /> Acessar
      </button>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   TELA 2 — Login com formulário
══════════════════════════════════════════════════════════ */
function FormLogin({ portal, onVoltar }) {
  const [email, setEmail]     = useState('')
  const [senha, setSenha]     = useState('')
  const [show, setShow]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const { login }             = useAuth()
  const { Illu }              = portal

  const submit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, senha)
    } catch (err) {
      const status = err.response?.status
      const msg    = err.response?.data?.message
      const errors = err.response?.data?.errors
      if (errors) {
        const first = Object.values(errors).flat()[0]
        setError(first || 'Credenciais inválidas.')
      } else if (status === 401 || status === 422) {
        setError('E-mail ou senha inválidos.')
      } else if (status === 403) {
        setError('Usuário inativo. Contate o administrador.')
      } else if (!err.response) {
        setError('Sem conexão com o servidor. Verifique se o backend está rodando.')
      } else {
        setError(msg || 'Erro inesperado. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(170deg, ${C.bg} 0%, ${C.bgLight} 50%, ${C.bg} 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', fontFamily: FONT,
    }}>
      <div style={{
        background: C.white, borderRadius: 18,
        width: '100%', maxWidth: 440,
        padding: '40px 36px',
        boxShadow: '0 20px 60px rgba(0,0,0,.25)',
        border: '1px solid rgba(255,255,255,.15)',
      }}>
        {/* Logo pequena */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <img src={logoLarge} alt="" style={{ height: 36, objectFit: 'contain' }}/>
        </div>

        {/* Tipo do portal */}
        <div style={{ textAlign: 'center', marginBottom: 6 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '2px',
            color: C.textMuted, textTransform: 'uppercase',
          }}>
            {portal.label}
          </span>
          <div style={{ width: 50, height: 3, borderRadius: 99, background: C.teal, margin: '6px auto 0' }}/>
        </div>

        {/* Ilustração pequena */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '18px 0 22px' }}>
          <Illu size={120} />
        </div>

        <h2 style={{
          fontSize: 18, fontWeight: 700, color: C.dark,
          textAlign: 'center', marginBottom: 4,
        }}>
          Bem-vindo de volta
        </h2>
        <p style={{
          fontSize: 13, color: C.textMuted, textAlign: 'center', marginBottom: 22,
        }}>
          Entre com suas credenciais
        </p>

        {/* Erro */}
        {error && (
          <div style={{
            padding: '10px 14px', background: '#fef2f2',
            border: '1px solid #fecaca', borderRadius: 8,
            fontSize: 13, color: C.danger, marginBottom: 16,
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <span style={{ flexShrink: 0 }}>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <InputField label="E-mail" value={email} onChange={e => setEmail(e.target.value)} type="email" ph="seu@email.com" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={labelStyle}>Senha</label>
            <div style={{ position: 'relative' }}>
              <input
                type={show ? 'text' : 'password'} required
                value={senha} onChange={e => setSenha(e.target.value)}
                placeholder="••••••••" style={{ ...inputStyle, paddingRight: 42 }}
              />
              <button type="button" onClick={() => setShow(s => !s)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: C.textMuted, display: 'flex', padding: 2,
              }}>
                {show ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>

          {/* Botão entrar */}
          <button type="submit" disabled={loading} style={{
            padding: '12px', borderRadius: 8, border: 'none',
            background: loading ? '#99f6e4' : C.teal,
            color: C.dark, fontSize: 14, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: FONT,
            transition: 'all .2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = C.tealHov }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = C.teal }}
          >
            {loading ? <><Spinner /> Entrando...</> : <><IcoLogin /> Entrar</>}
          </button>
        </form>

        {/* Voltar */}
        <button onClick={onVoltar} style={{
          marginTop: 18, width: '100%', background: 'none', border: 'none',
          cursor: 'pointer', color: C.textMuted,
          fontSize: 13, fontFamily: FONT, transition: 'color .2s',
          textAlign: 'center',
        }}
          onMouseEnter={e => e.currentTarget.style.color = C.dark}
          onMouseLeave={e => e.currentTarget.style.color = C.textMuted}
        >
          ← Voltar à seleção de portais
        </button>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   TELA 3 — Criar admin
══════════════════════════════════════════════════════════ */
function FormAdmin({ onVoltar }) {
  const [form, setForm]       = useState({ nome: '', email: '', senha: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [done, setDone]       = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await api.post('/auth/registrar-admin', form)
      setDone(true)
    } catch (err) {
      const d = err.response?.data
      const msgs = d?.errors ? Object.values(d.errors).flat() : []
      setError(msgs[0] || d?.message || 'Erro ao criar administrador.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(170deg, ${C.bg} 0%, ${C.bgLight} 50%, ${C.bg} 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', fontFamily: FONT,
    }}>
      <div style={{
        background: C.white, borderRadius: 18,
        width: '100%', maxWidth: 420,
        padding: '36px 32px',
        boxShadow: '0 20px 60px rgba(0,0,0,.25)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src={logoLarge} alt="" style={{ height: 36, objectFit: 'contain' }}/>
        </div>

        {!done ? (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: C.dark, textAlign: 'center', marginBottom: 4 }}>
              Criar Administrador
            </h2>
            <p style={{ fontSize: 13, color: C.textMuted, textAlign: 'center', marginBottom: 22 }}>
              Configuração inicial do sistema
            </p>

            {error && (
              <div style={{
                padding: '10px 14px', background: '#fef2f2',
                border: '1px solid #fecaca', borderRadius: 8,
                fontSize: 13, color: C.danger, marginBottom: 16,
              }}>
                ⚠ {error}
              </div>
            )}

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <InputField label="Nome completo" value={form.nome}  onChange={set('nome')}  type="text"  ph="Ex: João Silva" />
              <InputField label="E-mail"        value={form.email} onChange={set('email')} type="email" ph="admin@escola.edu.br" />
              <InputField label="Senha"         value={form.senha} onChange={set('senha')} type="text"  ph="Mínimo 6 caracteres" mono />

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={onVoltar} style={{
                  flex: 1, padding: '11px', borderRadius: 8,
                  background: '#f1f5f9', border: '1px solid #e2e8f0',
                  color: C.textMuted, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: FONT, transition: 'all .2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9' }}
                >
                  Cancelar
                </button>
                <button type="submit" disabled={loading} style={{
                  flex: 2, padding: '11px', borderRadius: 8,
                  background: loading ? '#99f6e4' : C.teal,
                  border: 'none', color: C.dark, fontSize: 13, fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: FONT,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  {loading ? <><Spinner /> Criando...</> : 'Criar Admin'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center', paddingTop: 8 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: '#ecfdf5', border: '2px solid #10b981',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, color: '#10b981', margin: '0 auto 16px',
            }}>✓</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.dark, marginBottom: 6 }}>Admin criado!</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 22 }}>
              Faça login com<br/>
              <span style={{ color: '#0d9488', fontFamily: MONO, fontWeight: 600 }}>{form.email}</span>
            </div>
            <button onClick={onVoltar} style={{
              width: '100%', padding: '11px', borderRadius: 8,
              background: C.teal, border: 'none', color: C.dark,
              fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
            }}>
              Ir para o Login →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   COMPONENTES FORM
══════════════════════════════════════════════════════════ */
const labelStyle = {
  fontSize: 12.5, fontWeight: 600, color: '#475569',
}

const inputStyle = {
  background: '#f8fafc',
  border: '1.5px solid #e2e8f0',
  borderRadius: 8, padding: '10px 13px',
  fontFamily: FONT, fontSize: 14, color: '#0f172a',
  outline: 'none', width: '100%',
  transition: 'border-color .15s, box-shadow .15s',
}

function InputField({ label, value, onChange, type, ph, mono }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={labelStyle}>{label}</label>
      <input
        type={type} required value={value} onChange={onChange} placeholder={ph}
        style={{
          ...inputStyle,
          fontFamily: mono ? MONO : FONT,
        }}
        onFocus={e => { e.target.style.borderColor = C.teal; e.target.style.boxShadow = '0 0 0 3px rgba(0,216,195,.12)' }}
        onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }}
      />
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   UTILITÁRIOS
══════════════════════════════════════════════════════════ */
function Spinner() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: 'spin .7s linear infinite' }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </svg>
  )
}
function IcoLogin() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
      <polyline points="10 17 15 12 10 7"/>
      <line x1="15" y1="12" x2="3" y2="12"/>
    </svg>
  )
}
function Eye() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
}
function EyeOff() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
}

/* ══════════════════════════════════════════════════════════
   ILUSTRAÇÕES SVG — Estilo flat limpo
   Cores: azul-marinho, teal, cinza neutro
══════════════════════════════════════════════════════════ */
function IlluAdmin({ size = 200 }) {
  const s = size, h = s * 0.85
  return (
    <svg width={s} height={h} viewBox="0 0 260 220" fill="none">
      {/* Mesa */}
      <rect x="30" y="155" width="200" height="8" rx="4" fill="#1e3a5f"/>
      <rect x="55" y="163" width="8" height="32" rx="3" fill="#16324d"/>
      <rect x="197" y="163" width="8" height="32" rx="3" fill="#16324d"/>
      {/* Monitor */}
      <rect x="60" y="72" width="120" height="84" rx="8" fill="#0f2440" stroke="#00d8c3" strokeWidth="1.5" strokeOpacity=".5"/>
      <rect x="68" y="80" width="104" height="60" rx="4" fill="#091929"/>
      {/* Tela conteúdo */}
      <rect x="76" y="90" width="50" height="4" rx="2" fill="rgba(0,216,195,.6)"/>
      <rect x="76" y="99" width="35" height="3" rx="2" fill="rgba(0,216,195,.35)"/>
      <rect x="76" y="107" width="42" height="3" rx="2" fill="rgba(0,216,195,.4)"/>
      <rect x="76" y="115" width="28" height="3" rx="2" fill="rgba(0,216,195,.25)"/>
      {/* Mini janela */}
      <rect x="136" y="88" width="30" height="22" rx="3" fill="rgba(0,216,195,.18)" stroke="rgba(0,216,195,.35)" strokeWidth="1"/>
      <rect x="139" y="92" width="24" height="2" rx="1" fill="rgba(0,216,195,.4)"/>
      <rect x="139" y="97" width="18" height="2" rx="1" fill="rgba(0,216,195,.25)"/>
      {/* Suporte monitor */}
      <rect x="112" y="156" width="16" height="6" rx="2" fill="#1e3a5f"/>
      {/* Teclado */}
      <rect x="80" y="158" width="80" height="10" rx="3" fill="#16324d" stroke="rgba(255,255,255,.06)" strokeWidth="1"/>
      {[85,95,105,115,125,135,145].map((x,i) => <rect key={i} x={x} y={160} width="7" height="5" rx="1.5" fill="rgba(255,255,255,.08)"/>)}
      {/* Caneca */}
      <rect x="175" y="142" width="14" height="16" rx="3" fill="#00d8c3" fillOpacity=".25"/>
      <path d="M189 147 Q194 147 194 152 Q194 157 189 157" stroke="#00d8c3" strokeWidth="1.5" fill="none" strokeOpacity=".4"/>
      {/* Pessoa sentada */}
      <circle cx="120" cy="46" r="16" fill="#1e3a5f"/>
      <path d="M104 68 Q120 56 136 68 L140 155 H100 Z" fill="#1e3a5f"/>
      <path d="M104 85 Q90 100 78 110" stroke="#1e3a5f" strokeWidth="8" strokeLinecap="round" fill="none"/>
      <path d="M136 85 Q150 100 160 108" stroke="#1e3a5f" strokeWidth="8" strokeLinecap="round" fill="none"/>
      {/* Planta */}
      <rect x="20" y="155" width="16" height="18" rx="3" fill="#16324d"/>
      <ellipse cx="28" cy="148" rx="10" ry="12" fill="#0a4d3a"/>
      <ellipse cx="22" cy="152" rx="7" ry="9" fill="#0a4d3a" transform="rotate(-20 22 152)"/>
      <ellipse cx="34" cy="150" rx="7" ry="9" fill="#0a4d3a" transform="rotate(20 34 150)"/>
    </svg>
  )
}

function IlluProfessor({ size = 200 }) {
  const s = size, h = s * 0.85
  return (
    <svg width={s} height={h} viewBox="0 0 260 220" fill="none">
      {/* Quadro */}
      <rect x="20" y="20" width="160" height="115" rx="6" fill="#0f2440" stroke="#00d8c3" strokeWidth="1.5" strokeOpacity=".4"/>
      <rect x="28" y="28" width="144" height="99" rx="4" fill="#091929"/>
      {/* Conteúdo do quadro */}
      <line x1="38" y1="48" x2="130" y2="48" stroke="rgba(0,216,195,.45)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="38" y1="60" x2="100" y2="60" stroke="rgba(0,216,195,.25)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="38" y1="72" x2="115" y2="72" stroke="rgba(0,216,195,.3)" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Gráfico */}
      <line x1="38" y1="115" x2="38" y2="82" stroke="rgba(0,216,195,.3)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="38" y1="115" x2="155" y2="115" stroke="rgba(0,216,195,.3)" strokeWidth="1.5" strokeLinecap="round"/>
      <polyline points="46,112 65,104 84,108 103,94 122,84 145,88" stroke="#00d8c3" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      {[[46,112],[65,104],[84,108],[103,94],[122,84],[145,88]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="#00d8c3" fillOpacity=".7"/>
      ))}
      {/* Suporte do quadro */}
      <line x1="48" y1="135" x2="40" y2="185" stroke="#16324d" strokeWidth="4" strokeLinecap="round"/>
      <line x1="152" y1="135" x2="160" y2="185" stroke="#16324d" strokeWidth="4" strokeLinecap="round"/>
      {/* Professor */}
      <circle cx="215" cy="60" r="18" fill="#1e3a5f"/>
      <path d="M198 86 Q215 74 232 86 L236 175 H194 Z" fill="#1e3a5f"/>
      <path d="M198 100 Q184 95 170 88" stroke="#1e3a5f" strokeWidth="8" strokeLinecap="round" fill="none"/>
      {/* Giz */}
      <rect x="158" y="84" width="12" height="4" rx="2" fill="#e2e8f0" transform="rotate(-15 158 84)"/>
      {/* Planta */}
      <rect x="218" y="168" width="18" height="22" rx="3" fill="#16324d"/>
      <ellipse cx="227" cy="158" rx="10" ry="14" fill="#0a4d3a"/>
    </svg>
  )
}

function IlluAluno({ size = 200 }) {
  const s = size, h = s * 0.85
  return (
    <svg width={s} height={h} viewBox="0 0 260 220" fill="none">
      {/* Bolha decorativa */}
      <circle cx="200" cy="55" r="42" fill="rgba(0,216,195,.08)"/>
      {/* Mesa 1 */}
      <rect x="12" y="118" width="105" height="56" rx="5" fill="#16324d" stroke="rgba(255,255,255,.06)" strokeWidth="1"/>
      <rect x="12" y="118" width="105" height="10" rx="5" fill="#1e3a5f"/>
      <rect x="20" y="174" width="6" height="26" rx="2" fill="#16324d"/>
      <rect x="105" y="174" width="6" height="26" rx="2" fill="#16324d"/>
      {/* Caderno na mesa */}
      <rect x="22" y="105" width="68" height="14" rx="3" fill="#00d8c3" opacity=".7"/>
      <line x1="28" y1="110" x2="66" y2="110" stroke="rgba(255,255,255,.5)" strokeWidth="1" strokeLinecap="round"/>
      <line x1="28" y1="114" x2="52" y2="114" stroke="rgba(255,255,255,.3)" strokeWidth="1" strokeLinecap="round"/>
      {/* Lápis */}
      <line x1="96" y1="102" x2="104" y2="130" stroke="#00d8c3" strokeWidth="2.5" strokeLinecap="round" strokeOpacity=".7"/>
      {/* Aluno 1 — teal */}
      <circle cx="64" cy="60" r="20" fill="#0a4d3a"/>
      <circle cx="64" cy="46" r="14" fill="#1e3a5f"/>
      <path d="M46 76 Q64 66 82 76 L86 118 H42 Z" fill="#0a4d3a"/>
      <path d="M46 92 Q36 106 26 118" stroke="#0a4d3a" strokeWidth="9" strokeLinecap="round" fill="none"/>
      <path d="M82 92 Q92 106 100 118" stroke="#0a4d3a" strokeWidth="9" strokeLinecap="round" fill="none"/>
      {/* Mesa 2 */}
      <rect x="143" y="118" width="105" height="56" rx="5" fill="#16324d" stroke="rgba(255,255,255,.06)" strokeWidth="1"/>
      <rect x="143" y="118" width="105" height="10" rx="5" fill="#1e3a5f"/>
      <rect x="151" y="174" width="6" height="26" rx="2" fill="#16324d"/>
      <rect x="236" y="174" width="6" height="26" rx="2" fill="#16324d"/>
      {/* Caderno na mesa 2 */}
      <rect x="153" y="105" width="68" height="14" rx="3" fill="#00d8c3" opacity=".5"/>
      <line x1="159" y1="110" x2="197" y2="110" stroke="rgba(255,255,255,.5)" strokeWidth="1" strokeLinecap="round"/>
      <line x1="159" y1="114" x2="183" y2="114" stroke="rgba(255,255,255,.3)" strokeWidth="1" strokeLinecap="round"/>
      {/* Lápis 2 */}
      <line x1="227" y1="102" x2="235" y2="130" stroke="#00d8c3" strokeWidth="2.5" strokeLinecap="round" strokeOpacity=".5"/>
      {/* Aluno 2 — vermelho/coral */}
      <circle cx="195" cy="60" r="20" fill="#5c2323"/>
      <circle cx="195" cy="46" r="14" fill="#1e3a5f"/>
      <path d="M177 76 Q195 66 213 76 L217 118 H173 Z" fill="#5c2323"/>
      <path d="M177 92 Q167 106 157 118" stroke="#5c2323" strokeWidth="9" strokeLinecap="round" fill="none"/>
      <path d="M213 92 Q223 106 231 118" stroke="#5c2323" strokeWidth="9" strokeLinecap="round" fill="none"/>
    </svg>
  )
}
