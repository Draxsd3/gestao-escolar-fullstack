import React from 'react'

export function Button({ children, variant='primary', size='', className='', disabled, onClick, type='button', ...p }) {
  return <button type={type} className={['btn',`btn-${variant}`,size?`btn-${size}`:'',className].filter(Boolean).join(' ')} disabled={disabled} onClick={onClick} {...p}>{children}</button>
}
export function Badge({ children, variant='secondary', className='' }) {
  return <span className={`badge badge-${variant} ${className}`}>{children}</span>
}
export function Card({ title, actions, children, className='', style }) {
  return (
    <div className={`card ${className}`} style={style}>
      {(title||actions) && <div className="card-header">{title && <div className="card-title">{title}</div>}{actions && <div>{actions}</div>}</div>}
      {children}
    </div>
  )
}
export function StatCard({ label, value, sub, icon, iconBg, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: iconBg||'var(--accent-soft)' }}>{icon}</div>
      <div className="stat-value" style={color?{color}:{}}>{value??'—'}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}
export function Loading({ message='Carregando...' }) {
  return <div className="loading-wrap"><div className="spinner"/><div className="loading-text">{message}</div></div>
}
export function EmptyState({ icon='🔍', title='Nenhum resultado', message='' }) {
  return <div className="empty-state"><div className="empty-icon">{icon}</div><div className="empty-title">{title}</div>{message&&<div className="empty-message">{message}</div>}</div>
}
export function Alert({ children, variant='info', onClose }) {
  const icons={success:'✓',error:'✕',warning:'⚠',info:'ℹ'}
  return (
    <div className={`alert alert-${variant}`}>
      <span>{icons[variant]}</span>
      <span style={{flex:1}}>{children}</span>
      {onClose && <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'inherit',opacity:.7,fontSize:14}}>✕</button>}
    </div>
  )
}
export function Modal({ isOpen, onClose, title, children, footer }) {
  if (!isOpen) return null
  return (
    <div className="modal-backdrop" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:17,lineHeight:1}}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
export function Pagination({ meta, onPageChange }) {
  if (!meta||!meta.last_page||meta.last_page<=1) return null
  const cp=meta.current_page||1, lp=meta.last_page
  const pages=[]
  for(let i=Math.max(1,cp-2);i<=Math.min(lp,cp+2);i++) pages.push(i)
  return (
    <div className="pagination">
      <span>{meta.from??0}–{meta.to??0} de {meta.total??0}</span>
      <div className="pagination-controls">
        <button className="pagination-btn" disabled={cp<=1} onClick={()=>onPageChange(cp-1)}>‹</button>
        {pages.map(p=><button key={p} className={`pagination-btn${p===cp?' active':''}`} onClick={()=>onPageChange(p)}>{p}</button>)}
        <button className="pagination-btn" disabled={cp>=lp} onClick={()=>onPageChange(cp+1)}>›</button>
      </div>
    </div>
  )
}
