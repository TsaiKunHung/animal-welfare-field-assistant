import { useEffect } from 'react'

/*
  Base 元件 — 尺寸/顏色一律照 Figma「動保 Design System」BASE 群組。
  數值來源是 get_design_context 回傳的參考碼，不要憑感覺調整。
  Button   : px-18 py-10 / r-8 / shadow-xs / 16px bold / line-24
  Input    : label 14px medium #404040 line-20, gap 6 / box px-14 py-10 r-8 border #d4d4d4
  Checkbox : 16px, r-4, border #d4d4d4
*/

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...rest
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-md shadow-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
  const sizes = {
    sm: 'px-3.5 py-2 text-sm leading-5',
    md: 'px-[18px] py-2.5 text-base leading-6',
    lg: 'px-5 py-3 text-base leading-6',
  }
  const variants = {
    primary: 'bg-field-600 border border-field-600 text-white hover:bg-field-700 hover:border-field-700',
    secondary:
      'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50',
    ghost: 'bg-transparent border border-transparent text-field-700 shadow-none hover:bg-field-50',
    danger: 'bg-danger border border-danger text-white hover:opacity-90',
  }
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  )
}

export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`flex w-full flex-col gap-1.5 ${className}`}>
      {label && (
        <span className="text-sm leading-5 font-medium text-neutral-700">{label}</span>
      )}
      {children}
      {hint && <span className="text-sm leading-5 text-neutral-500">{hint}</span>}
    </label>
  )
}

export function Input({ className = '', ...rest }) {
  return (
    <input
      className={`w-full rounded-md border border-neutral-300 bg-white px-3.5 py-2.5 text-base leading-6 shadow-xs outline-none placeholder:text-neutral-500 focus:border-field-600 ${className}`}
      {...rest}
    />
  )
}

export function Textarea({ className = '', ...rest }) {
  return (
    <textarea
      className={`w-full resize-none rounded-md border border-neutral-300 bg-white px-3.5 py-2.5 text-base leading-6 shadow-xs outline-none placeholder:text-neutral-500 focus:border-field-600 ${className}`}
      {...rest}
    />
  )
}

export function Checkbox({ checked, onChange, label, className = '', disabled }) {
  return (
    <span
      className={`inline-flex items-center gap-2 ${disabled ? 'opacity-40' : 'cursor-pointer'} ${className}`}
      onClick={() => !disabled && onChange?.(!checked)}
      role="checkbox"
      aria-checked={!!checked}
      tabIndex={0}
    >
      <span
        className={`flex size-4 shrink-0 items-center justify-center rounded-xs border ${
          checked ? 'border-field-600 bg-field-600' : 'border-neutral-300 bg-white'
        }`}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="size-3 text-white" fill="none">
            <path
              d="M10 3L4.5 8.5L2 6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      {label && (
        <span className="text-sm leading-5 font-medium text-neutral-700">{label}</span>
      )}
    </span>
  )
}

export function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-lg border border-hairline bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  )
}

const badgeTones = {
  neutral: 'bg-neutral-100 text-neutral-700',
  field: 'bg-field-50 text-field-700',
  danger: 'bg-danger-bg text-danger',
  warning: 'bg-warning-bg text-warning',
  success: 'bg-success-bg text-success',
  info: 'bg-info-bg text-info',
}

export function Badge({ children, tone = 'neutral', className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs leading-[18px] font-medium ${badgeTones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

/**
 * AI 產出的區塊都掛這個徽章。
 * 樣式對照 Figma：紫色 pill（bg ai-50 / border ai-200 / text ai-700）＋左側小圓點，文字「AI Assist」。
 * AI 產生的**內文**也用 `text-ai-700`，這是 Figma 一致的語意，不要改用主色。
 */
export function AiBadge({ children = 'AI Assist', className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-ai-200 bg-ai-50 px-2 py-0.5 text-xs leading-[18px] font-medium text-ai-700 ${className}`}
    >
      <span className="size-1.5 rounded-full bg-ai-500" />
      {children}
    </span>
  )
}

export function Modal({ open, onClose, title, children, width = 720, footer }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[rgba(15,23,41,0.45)]" onClick={onClose} />
      <div
        className="relative flex max-h-[calc(100%-64px)] flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        style={{ width }}
      >
        {title && (
          <div className="flex shrink-0 items-center justify-between border-b border-hairline px-6 py-4">
            <h2 className="text-lg leading-7 font-bold text-ink">{title}</h2>
            <button
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"
              aria-label="關閉"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        )}
        <div className="scroll-thin flex-1 overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-hairline px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

/** 佔位圖：照片/地圖/街景一律用這個，不引外部圖片（離線 demo 也要能跑） */
export function Placeholder({ label, className = '', tone = 'photo' }) {
  const tones = {
    photo: 'from-neutral-200 to-neutral-300 text-neutral-600',
    map: 'from-field-50 to-field-100 text-field-700',
    street: 'from-[#dbe7e6] to-[#c3d6d4] text-field-800',
  }
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br text-xs ${tones[tone]} ${className}`}
    >
      {label}
    </div>
  )
}
