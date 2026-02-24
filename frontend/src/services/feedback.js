const FEEDBACK_EVENT = 'babel:feedback'
let confirmHandler = null

export function notifyFeedback(type, message) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(FEEDBACK_EVENT, {
    detail: { type, message: String(message || '') },
  }))
}

export function notifySuccess(message) {
  notifyFeedback('success', message)
}

export function notifyError(message) {
  notifyFeedback('error', message)
}

export function subscribeFeedback(handler) {
  if (typeof window === 'undefined') return () => {}
  const listener = (event) => handler?.(event.detail || {})
  window.addEventListener(FEEDBACK_EVENT, listener)
  return () => window.removeEventListener(FEEDBACK_EVENT, listener)
}

export function setConfirmHandler(handler) {
  confirmHandler = handler
  return () => { confirmHandler = null }
}

export async function requestConfirmation(options = {}) {
  if (typeof confirmHandler === 'function') {
    return !!(await confirmHandler(options))
  }
  return true
}
