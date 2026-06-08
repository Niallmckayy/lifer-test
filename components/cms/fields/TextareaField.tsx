'use client'

type Props = {
  label: string
  value: string
  onChange: (val: string) => void
  placeholder?: string
}

export function TextareaField({ label, value, onChange, placeholder }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(245,232,208,0.35)' }}>
        {label}
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full px-3 py-2 text-sm outline-none resize-y transition-all"
        style={{
          background: 'rgba(245,232,208,0.04)',
          border: '1px solid rgba(245,232,208,0.1)',
          borderRadius: '8px',
          color: '#f5e8d0',
          minHeight: '90px',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'rgba(212,131,12,0.4)' }}
        onBlur={e => { e.currentTarget.style.borderColor = 'rgba(245,232,208,0.1)' }}
      />
    </div>
  )
}
