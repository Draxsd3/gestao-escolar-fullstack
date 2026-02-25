import React from 'react'

export const ICON_BUTTON_STYLE = {
  width: 32,
  height: 32,
  padding: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}

function BaseIcon({ children, size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function EditIcon({ size }) {
  return (
    <BaseIcon size={size}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </BaseIcon>
  )
}

export function ViewIcon({ size }) {
  return (
    <BaseIcon size={size}>
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </BaseIcon>
  )
}

export function PowerIcon({ size }) {
  return (
    <BaseIcon size={size}>
      <path d="M12 3v8" />
      <path d="M7.5 5.8a8 8 0 1 0 9 0" />
    </BaseIcon>
  )
}

export function DeleteIcon({ size }) {
  return (
    <BaseIcon size={size}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </BaseIcon>
  )
}

export function KeyIcon({ size }) {
  return (
    <BaseIcon size={size}>
      <circle cx="8" cy="15" r="4" />
      <path d="M12 15h8" />
      <path d="M18 12v6" />
      <path d="M21 13v4" />
    </BaseIcon>
  )
}
