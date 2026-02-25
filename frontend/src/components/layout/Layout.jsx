import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useAnoLetivo } from '../../context/AnoLetivoContext'
import logoMinimal from '../../assets/logo-minimal.svg'
import { setConfirmHandler, subscribeFeedback } from '../../services/feedback'

/* ═══════════════════════════════════════════════════════════
   ESTRUTURA DE NAVEGAÇÃO
   Gestão Geral logo abaixo do Dashboard (conforme pedido)
═══════════════════════════════════════════════════════════ */
const NAV = [
  {
    section: null,
    items: [
      { type:'link', to:'/', label:'Dashboard', icon:IcoDashboard,
        perfis:['admin','secretaria','coordenacao','professor','responsavel','aluno'] },
      { type:'group', label:'Gestão Geral', icon:IcoGestao,
        perfis:['admin'],
        match:['/gestao-geral','/turmas'],
        children:[
          { to:'/gestao-geral',                 label:'Visão Geral',    icon:IcoGrid     },
          { to:'/gestao-geral/periodo-letivo',  label:'Período Letivo', icon:IcoCalendar },
          { to:'/turmas',                       label:'Turmas',         icon:IcoTurmas   },
          { to:'/gestao-geral/salas',           label:'Salas',          icon:IcoDoor     },
          { to:'/gestao-geral/cursos',          label:'Cursos',         icon:IcoBook     },
          { to:'/gestao-geral/disciplinas',     label:'Disciplinas',    icon:IcoPencil   },
          
        ],
      },
    ],
  },
  {
    section: 'Acadêmico',
    items: [
      { type:'group', label:'Acadêmico', icon:IcoAcademico,
        perfis:['admin','secretaria','coordenacao','professor'],
        match:['/alunos','/professores','/matriculas','/notas','/professor'],
        children:[
          { to:'/professor/portal',    label:'Minhas Turmas', icon:IcoTurmas,      perfis:['professor'] },
          { to:'/alunos',              label:'Alunos',       icon:IcoAlunos,      perfis:['admin','secretaria'] },
          { to:'/professores',         label:'Professores',  icon:IcoProfessores, perfis:['admin','secretaria','coordenacao'] },
          { to:'/matriculas',          label:'Matrículas',   icon:IcoMatriculas,  perfis:['admin','secretaria','coordenacao'] },
          { to:'/notas',               label:'Notas',        icon:IcoNotas,       perfis:['admin','professor','coordenacao'] },
          { to:'/professor/tarefas',   label:'Tarefas',      icon:IcoTarefa,      perfis:['professor','admin'] },
        ],
      },
      // ── Portal do Aluno ──────────────────────────────────
      { type:'group', label:'Meu Portal', icon:IcoPortalAluno,
        perfis:['aluno'],
        match:['/aluno'],
        children:[
          { to:'/aluno/boletim', label:'Meu Boletim', icon:IcoBoletim, perfis:['aluno'] },
          { to:'/aluno/tarefas', label:'Tarefas',     icon:IcoTarefa,  perfis:['aluno'] },
        ],
      },
    ],
  },
  {
    section: 'Comunicação',
    items: [
      { type:'link', to:'/comunicados', label:'Comunicados', icon:IcoComunicados,
        perfis:['admin','secretaria','coordenacao','professor','responsavel','aluno'] },
      { type:'link', to:'/mensagens', label:'Mensagens', icon:IcoMensagens,
        perfis:['admin','secretaria','coordenacao','professor','responsavel','aluno'] },
    ],
  },
  {
    section: 'Gestão',
    items: [
      { type:'group', label:'Financeiro', icon:IcoFinanceiro,
        perfis:['admin','secretaria'],
        match:['/financeiro'],
        children:[
          { to:'/financeiro',               label:'Resumo',          icon:IcoChart  },
          { to:'/financeiro/mensalidades',  label:'Mensalidades',    icon:IcoMoney  },
          { to:'/financeiro/inadimplentes', label:'Inadimplentes',   icon:IcoAlert  },
          { to:'/financeiro/planos',        label:'Planos de Pgto.', icon:IcoPlano  },
        ],
      },
    ],
  },
]

const AVATAR_BG = {
  admin:       'linear-gradient(135deg,#1a6dd4,#3b8ef5)',
  secretaria:  'linear-gradient(135deg,#0ea5e9,#38bdf8)',
  coordenacao: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
  professor:   'linear-gradient(135deg,#059669,#34d399)',
  responsavel: 'linear-gradient(135deg,#ec4899,#f472b6)',
  aluno:       'linear-gradient(135deg,#dc2626,#fb7185)',
}

/* ═══════════════════════════════════════════════════════════
   COMPONENTES DE NAVEGAÇÃO
═══════════════════════════════════════════════════════════ */
function NavLink({ item, location }) {
  const active = location.pathname === item.to ||
    (item.to !== '/' && location.pathname.startsWith(item.to))
  const Icon = item.icon
  return (
    <Link to={item.to} className={`nav-item${active ? ' active' : ''}`}>
      <span className="nav-icon"><Icon /></span>
      <span>{item.label}</span>
    </Link>
  )
}

function NavGroup({ item, location, perfil }) {
  const isChildActive = item.match?.some(m => location.pathname.startsWith(m)) ||
    item.children?.some(c => location.pathname === c.to ||
      (c.to !== '/' && location.pathname.startsWith(c.to)))

  const [open, setOpen] = useState(isChildActive)
  useEffect(() => { if (isChildActive) setOpen(true) }, [location.pathname])

  const Icon = item.icon
  const children = item.children?.filter(c =>
    !c.perfis || c.perfis.includes(perfil)
  ) || []
  if (!children.length) return null

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className={`nav-group-trigger${isChildActive ? ' active' : ''}`}
      >
        <span className="nav-icon"><Icon /></span>
        <span style={{ flex:1 }}>{item.label}</span>
        <span style={{
          color:'var(--text-sidebar-m)', transition:'transform .2s',
          transform: open ? 'rotate(180deg)' : 'none',
          display:'flex', alignItems:'center', flexShrink:0,
        }}>
          <IcoChevron />
        </span>
      </button>

      <div style={{
        overflow:'hidden',
        maxHeight: open ? children.length * 40 + 8 + 'px' : '0px',
        transition:'max-height .22s cubic-bezier(.4,0,.2,1)',
      }}>
        <div style={{ paddingLeft:12, paddingTop:2, paddingBottom:6, position:'relative' }}>
          {/* Linha conectora vertical */}
          <div style={{
            position:'absolute', left:22, top:4, bottom:8,
            width:1, background:'rgba(255,255,255,.07)', borderRadius:99,
          }}/>
          {children.map(child => {
            const active = location.pathname === child.to ||
              (child.to !== '/' && location.pathname.startsWith(child.to))
            const CIcon = child.icon
            return (
              <Link key={child.to} to={child.to}
                style={{
                  display:'flex', alignItems:'center', gap:8,
                  padding:'7px 10px 7px 30px',
                  borderRadius:8,
                  color: active ? '#fff' : 'rgba(193,208,224,0.65)',
                  textDecoration:'none',
                  fontSize:13.5, fontWeight: active ? 600 : 400,
                  transition:'all .13s',
                  background: active ? 'rgba(26,109,212,.24)' : 'transparent',
                  marginBottom:1, position:'relative',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(255,255,255,.05)'
                    e.currentTarget.style.color = '#fff'
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'rgba(193,208,224,0.65)'
                  }
                }}
              >
                {/* Ponto indicador */}
                <span style={{
                  position:'absolute', left:12,
                  width:5, height:5, borderRadius:'50%',
                  background: active ? '#60a5fa' : 'rgba(255,255,255,.12)',
                  transition:'background .13s',
                }}/>
                <span style={{ color: active ? '#60a5fa' : 'rgba(193,208,224,.4)', flexShrink:0 }}>
                  <CIcon size={13} />
                </span>
                {child.label}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   LAYOUT PRINCIPAL
═══════════════════════════════════════════════════════════ */
export default function Layout() {
  const { usuario, logout } = useAuth()
  const { labelVigente, periodoAtivo, anoLetivo } = useAnoLetivo()
  const location = useLocation()
  const navigate = useNavigate()
  const [toasts, setToasts] = useState([])
  const [confirmBox, setConfirmBox] = useState(null)
  const perfil = usuario?.perfil || 'aluno'
  const initials = usuario?.nome
    ? usuario.nome.split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase()
    : '?'

  const handleLogout = async () => { await logout(); navigate('/login') }

  useEffect(() => {
    const unsubscribe = subscribeFeedback(({ type, message }) => {
      if (!message) return
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      setToasts((prev) => [...prev, { id, type, message }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 4500)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    const dispose = setConfirmHandler((options) => new Promise((resolve) => {
      setConfirmBox({
        message: options?.message || 'Confirmar acao?',
        resolve,
      })
    }))
    return dispose
  }, [])

  // Breadcrumb legível
  const crumbs = location.pathname === '/' ? ['Dashboard'] :
    location.pathname.split('/').filter(Boolean).map(s =>
      s.replace(/-/g,' ').replace(/\b\w/g, c => c.toUpperCase())
    )

  return (
    <div className="app-shell">
      <div style={{ position:'fixed', bottom:14, right:14, zIndex:12000, display:'flex', flexDirection:'column', gap:8, maxWidth:380 }}>
        {toasts.map((t) => (
          <div key={t.id} style={{
            padding:'10px 12px',
            borderRadius:10,
            border:'1px solid',
            background: t.type === 'success' ? '#10b981' : '#ef4444',
            borderColor: t.type === 'success' ? '#059669' : '#dc2626',
            color: '#ffffff',
            boxShadow:'0 8px 28px rgba(0,0,0,.12)',
            fontSize:13,
            lineHeight:1.45,
            fontWeight:600,
          }}>
            {t.message}
          </div>
        ))}
      </div>

      {confirmBox && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.35)', zIndex:13000, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:'min(92vw, 420px)', background:'#fff', borderRadius:12, padding:16, boxShadow:'0 20px 60px rgba(0,0,0,.25)' }}>
            <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:10 }}>Confirmacao</div>
            <div style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.5, marginBottom:16 }}>
              {confirmBox.message}
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button
                onClick={() => { confirmBox.resolve(false); setConfirmBox(null) }}
                style={{ border:'1px solid var(--border)', background:'#fff', color:'var(--text-secondary)', borderRadius:8, padding:'8px 12px', fontSize:13, cursor:'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => { confirmBox.resolve(true); setConfirmBox(null) }}
                style={{ border:'1px solid rgba(26,109,212,.25)', background:'rgba(26,109,212,.08)', color:'#1a6dd4', borderRadius:8, padding:'8px 12px', fontSize:13, fontWeight:700, cursor:'pointer' }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src={logoMinimal} alt="Babel" className="logo-img" style={{ width:30, height:30 }} />
          <div className="logo-text-wrap">
            <div className="logo-text">BABEL</div>
            <div className="logo-sub">Gestão Escolar</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((group, gi) => {
            const visible = group.items.filter(item => item.perfis.includes(perfil))
            if (!visible.length) return null
            return (
              <div key={gi} style={{ marginBottom:2 }}>
                {group.section && <div className="nav-section-label">{group.section}</div>}
                {visible.map((item, ii) =>
                  item.type === 'group'
                    ? <NavGroup key={ii} item={item} location={location} perfil={perfil} />
                    : <NavLink  key={item.to} item={item} location={location} />
                )}
              </div>
            )
          })}
        </nav>

        {/* Footer do usuário */}
        <div className="sidebar-footer">
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button
              type="button"
              onClick={() => navigate('/perfil')}
              title="Meu perfil"
              style={{
                flex:1,
                minWidth:0,
                display:'flex',
                alignItems:'center',
                gap:9,
                padding:'9px 11px',
                borderRadius:9,
                border:'1px solid transparent',
                background:'transparent',
                cursor:'pointer',
                textAlign:'left',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.05)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{
                width:30, height:30, borderRadius:'50%', flexShrink:0,
                background: AVATAR_BG[perfil] || AVATAR_BG.aluno,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:11, fontWeight:700, color:'#fff',
                overflow:'hidden',
              }}>
                {usuario?.foto_url ? (
                  <img
                    src={usuario.foto_url}
                    alt="Foto do usuario"
                    style={{ width:'100%', height:'100%', objectFit:'cover' }}
                  />
                ) : initials}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12.5, fontWeight:600, color:'#fff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {usuario?.nome}
                </div>
                <div style={{ fontSize:10.5, color:'var(--text-sidebar-m)', textTransform:'capitalize' }}>
                  {perfil}
                </div>
              </div>
            </button>
            <button onClick={handleLogout} title="Sair"
              style={{
                background:'none', border:'none', cursor:'pointer',
                color:'var(--text-sidebar-m)', padding:5, borderRadius:6,
                display:'flex', alignItems:'center', transition:'color .13s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-sidebar-m)'}
            >
              <IcoLogout />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main-content">
        <header className="topbar">
          {/* Breadcrumb */}
          <div style={{ flex:1, display:'flex', alignItems:'center', gap:6, fontSize:12.5, color:'var(--text-muted)' }}>
            {crumbs.map((c, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span style={{ opacity:.4 }}>›</span>}
                <span style={{ color: i === crumbs.length-1 ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: i === crumbs.length-1 ? 600 : 400 }}>{c}</span>
              </React.Fragment>
            ))}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            {/* ══ Indicador Ano Letivo / Período Ativo ══ */}
            <div style={{
              display:'flex', alignItems:'center', gap:6,
              background:'var(--bg-card)',
              border:'1px solid var(--border-light)',
              borderRadius:999, padding:'5px 10px',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span style={{
                fontSize:12, fontWeight:600,
                color:'var(--text-primary)',
                whiteSpace:'nowrap',
              }}>
                {labelVigente}
              </span>
              {anoLetivo?.modelo_periodo && (
                <span style={{
                  fontSize:10, fontWeight:700,
                  color:'var(--text-muted)',
                  background:'transparent',
                  border:'1px solid var(--border-light)',
                  borderRadius:999, padding:'1px 6px',
                  textTransform:'uppercase', letterSpacing:0.3,
                }}>
                  {anoLetivo.modelo_periodo === 'semestral' ? 'SEM' : 'BIM'}
                </span>
              )}
            </div>

          </div>
        </header>

        <main className="page-body"><Outlet /></main>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   ÍCONES — todos mesma cor, traço uniforme 1.9px
═══════════════════════════════════════════════════════════ */
const I = ({ size=16, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.9"
    strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
)

// Cada ícone aceita prop size para sub-itens (13px)
function IcoDashboard ({ size=16 }) { return <I size={size}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></I> }
function IcoGestao    ({ size=16 }) { return <I size={size}><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></I> }
function IcoAcademico ({ size=16 }) { return <I size={size}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></I> }
function IcoAlunos      ({ size=16 }) { return <I size={size}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></I> }
function IcoProfessores ({ size=16 }) { return <I size={size}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/><line x1="12" y1="12" x2="12" y2="15"/><line x1="9" y1="15" x2="15" y2="15"/></I> }
function IcoMatriculas({ size=16 }) { return <I size={size}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></I> }
function IcoNotas     ({ size=16 }) { return <I size={size}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></I> }
function IcoTarefa    ({ size=16 }) { return <I size={size}><rect x="4" y="3" width="16" height="18" rx="2"/><polyline points="8 8 10 10 14 6"/><line x1="8" y1="14" x2="16" y2="14"/></I> }
function IcoPortalAluno({ size=16 }) { return <I size={size}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="12" cy="10" r="2.5"/><path d="M8 17c.9-1.8 2.3-2.7 4-2.7S15.1 15.2 16 17"/></I> }
function IcoBoletim   ({ size=16 }) { return <I size={size}><path d="M6 2h9l4 4v16H6z"/><polyline points="15 2 15 6 19 6"/><line x1="9" y1="11" x2="16" y2="11"/><line x1="9" y1="15" x2="16" y2="15"/></I> }
function IcoFrequencia({ size=16 }) { return <I size={size}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></I> }
function IcoComunicados({ size=16 }){ return <I size={size}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></I> }
function IcoMensagens ({ size=16 }) { return <I size={size}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></I> }
function IcoFinanceiro({ size=16 }) { return <I size={size}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></I> }
function IcoUsuarios  ({ size=16 }) { return <I size={size}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></I> }
function IcoChart     ({ size=16 }) { return <I size={size}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></I> }
function IcoMoney     ({ size=16 }) { return <I size={size}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></I> }
function IcoAlert     ({ size=16 }) { return <I size={size}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></I> }
function IcoPlano     ({ size=16 }) { return <I size={size}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></I> }
function IcoGrid      ({ size=16 }) { return <I size={size}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></I> }
function IcoCalendar  ({ size=16 }) { return <I size={size}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></I> }
function IcoTurmas    ({ size=16 }) { return <I size={size}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></I> }
function IcoDoor      ({ size=16 }) { return <I size={size}><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/></I> }
function IcoBook      ({ size=16 }) { return <I size={size}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></I> }
function IcoPencil    ({ size=16 }) { return <I size={size}><line x1="18" y1="2" x2="22" y2="6"/><path d="M7.5 20.5 19 9l-4-4L3.5 16.5 2 22z"/></I> }
function IcoLayers    ({ size=16 }) { return <I size={size}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></I> }
function IcoClock     ({ size=16 }) { return <I size={size}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></I> }
function IcoChevron() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg> }
function IcoLogout()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> }
