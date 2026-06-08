'use client'

type Props = {
  label: string
  value: string
  onChange: (val: string) => void
  placeholder?: string
}

export function TextField({ label, value, onChange, placeholder }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(245,232,208,0.35)' }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm outline-none transition-all"
        style={{
          background: 'rgba(245,232,208,0.04)',
          border: '1px solid rgba(245,232,208,0.1)',
          borderRadius: '8px',
          color: '#f5e8d0',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'rgba(212,131,12,0.4)' }}
        onBlur={e => { e.currentTarget.style.borderColor = 'rgba(245,232,208,0.1)' }}
      />
    </div>
  )
}
