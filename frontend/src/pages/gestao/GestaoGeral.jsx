import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const MODULOS = [
  {
    titulo: 'Período Letivo',
    desc: 'Defina o período letivo atual do colégio, edite ou finalize.',
    to: '/gestao-geral/periodo-letivo',
    Icon: IconCalendar,
  },
  {
    titulo: 'Sala',
    desc: 'Crie e edite as salas onde serão realizadas as aulas do colégio.',
    to: '/gestao-geral/salas',
    Icon: IconDoor,
  },
  {
    titulo: 'Curso',
    desc: 'Defina os cursos que serão ofertados para os alunos.',
    to: '/gestao-geral/cursos',
    Icon: IconBook,
  },
  {
    titulo: 'Disciplina',
    desc: 'Crie as disciplinas que serão ministradas pelos docentes.',
    to: '/gestao-geral/disciplinas',
    Icon: IconPencil,
  },
  {
    titulo: 'Turma',
    desc: 'Adicione uma nova turma no seu período letivo.',
    to: '/turmas',
    Icon: IconUsers,
  },
  {
    titulo: 'Série',
    desc: 'Configure as séries e níveis de ensino da escola.',
    to: '/gestao-geral/series',
    Icon: IconLayers,
  },
  {
    titulo: 'Ano Letivo',
    desc: 'Gerencie os anos letivos e períodos de avaliação.',
    to: '/gestao-geral/ano-letivo',
    Icon: IconClock,
  },
  {
    titulo: 'Plano de Pagamento',
    desc: 'Configure planos de mensalidade e condições de pagamento.',
    to: '/gestao-geral/planos',
    Icon: IconCoin,
  },
]

export default function GestaoGeral() {
  const navigate = useNavigate()

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Gestão Geral</div>
          <div className="page-sub">Configure os elementos fundamentais do sistema escolar</div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 20,
      }}>
        {MODULOS.map(mod => (
          <ModCard key={mod.titulo} mod={mod} onClick={() => navigate(mod.to)} />
        ))}
      </div>
    </div>
  )
}

function ModCard({ mod, onClick }) {
  const [hovered, setHovered] = useState(false)
  const { Icon } = mod

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#ffffff',
        border: `1px solid ${hovered ? 'rgba(26,109,212,0.28)' : 'rgba(26,109,212,0.1)'}`,
        borderRadius: 12,
        padding: '26px 24px 22px',
        transition: 'all .18s cubic-bezier(.4,0,.2,1)',
        boxShadow: hovered
          ? '0 8px 28px rgba(26,109,212,0.11), 0 2px 8px rgba(0,0,0,0.04)'
          : '0 1px 4px rgba(26,109,212,0.05)',
        transform: hovered ? 'translateY(-2px)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Linha roxa no topo — aparece no hover */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 3,
        background: 'linear-gradient(90deg, #3b8ef5, #60a5fa)',
        borderRadius: '12px 12px 0 0',
        opacity: hovered ? 1 : 0,
        transition: 'opacity .18s',
      }} />

      {/* Título com ícone */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
      }}>
        <span style={{
          color: hovered ? '#1a6dd4' : '#60a5fa',
          transition: 'color .18s',
          display: 'flex',
          flexShrink: 0,
        }}>
          <Icon />
        </span>
        <span style={{
          fontSize: 15,
          fontWeight: 700,
          color: '#1a1040',
          letterSpacing: '-.2px',
        }}>
          {mod.titulo}
        </span>
      </div>

      {/* Descrição */}
      <p style={{
        fontSize: 13,
        color: '#8b7fb5',
        lineHeight: 1.6,
        margin: 0,
        marginBottom: 22,
        flex: 1,
      }}>
        {mod.desc}
      </p>

      {/* Botão */}
      <button
        onClick={onClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 16px',
          borderRadius: 8,
          background: hovered
            ? 'linear-gradient(135deg, #1a6dd4, #3b8ef5)'
            : 'rgba(26,109,212,0.07)',
          color: hovered ? '#ffffff' : '#1a6dd4',
          fontSize: 13,
          fontWeight: 700,
          border: `1px solid ${hovered ? 'transparent' : 'rgba(26,109,212,0.16)'}`,
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'all .18s',
          boxShadow: hovered ? '0 3px 12px rgba(26,109,212,0.28)' : 'none',
          alignSelf: 'flex-start',
        }}
      >
        Acessar
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke={hovered ? '#fff' : '#1a6dd4'} strokeWidth="2.2"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ transition: 'stroke .18s' }}>
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 8 16 12 12 16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
      </button>
    </div>
  )
}

/* ── SVG Icons ── */
const Ico = ({ children }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
)

function IconCalendar() { return <Ico><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Ico> }
function IconDoor()     { return <Ico><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/><circle cx="15" cy="12" r=".5" fill="currentColor"/></Ico> }
function IconBook()     { return <Ico><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></Ico> }
function IconPencil()   { return <Ico><line x1="18" y1="2" x2="22" y2="6"/><path d="M7.5 20.5 19 9l-4-4L3.5 16.5 2 22z"/></Ico> }
function IconUsers()    { return <Ico><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Ico> }
function IconLayers()   { return <Ico><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></Ico> }
function IconClock()    { return <Ico><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Ico> }
function IconCoin()     { return <Ico><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></Ico> }
