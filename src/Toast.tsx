export type ToastKind = 'success' | 'warning' | 'error'

interface ToastProps {
  kind: ToastKind
  message: string
  onDismiss?: () => void
}

export function Toast({ kind, message, onDismiss }: ToastProps) {
  return (
    <div className={`toast toast-${kind}`} role="status">
      <p className="toast-message">{message}</p>
      {onDismiss ? (
        <button type="button" className="toast-dismiss" onClick={onDismiss}>
          Dismiss
        </button>
      ) : null}
    </div>
  )
}
