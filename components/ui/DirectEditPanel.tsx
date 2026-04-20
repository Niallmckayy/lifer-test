'use client'

import { useState, useTransition } from 'react'
import { applyDirectEdit, searchPhotos } from '@/lib/actions'
import type { ContentBrief } from '@/lib/claude'

interface Props {
  websiteId: string
  brief: ContentBrief
  onDraftCreated: () => void
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#f1f5f9',
  padding: '8px 10px',
  fontSize: '13px',
  outline: 'none',
  fontFamily: 'inherit',
  resize: 'vertical',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 500,
  color: 'rgba(241,245,249,0.4)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '4px',
}

const sectionHeadStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: '#f59e0b',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  borderBottom: '1px solid rgba(245,158,11,0.15)',
  paddingBottom: '6px',
  marginBottom: '10px',
  marginTop: '4px',
}

function Field({ label, value, onChange, rows }: {
  label: string
  value: string
  onChange: (v: string) => void
  rows?: number
}) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <label style={labelStyle}>{label}</label>
      {rows && rows > 1 ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={rows}
          style={fieldStyle}
          onFocus={e => (e.currentTarget.style.borderColor = 'rgba(245,158,11,0.5)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ ...fieldStyle, resize: undefined }}
          onFocus={e => (e.currentTarget.style.borderColor = 'rgba(245,158,11,0.5)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
        />
      )}
    </div>
  )
}

// ── Image picker ──────────────────────────────────────────
type Photo = { url: string; thumbUrl: string; credit: string }

function ImagePicker({ label, value, onChange }: {
  label: string
  value: string | undefined
  onChange: (url: string) => void
}) {
  const [open, setOpen]           = useState(false)
  const [query, setQuery]         = useState('')
  const [results, setResults]     = useState<Photo[]>([])
  const [urlInput, setUrlInput]   = useState('')
  const [searching, startSearch]  = useTransition()

  function runSearch() {
    if (!query.trim()) return
    startSearch(async () => {
      const photos = await searchPhotos(query.trim(), 9)
      setResults(photos)
    })
  }

  function selectPhoto(url: string) {
    onChange(url)
    setOpen(false)
    setResults([])
    setQuery('')
  }

  function applyUrl() {
    if (urlInput.trim()) {
      onChange(urlInput.trim())
      setUrlInput('')
      setOpen(false)
    }
  }

  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={labelStyle}>{label}</label>

      {/* Current image preview + toggle */}
      <div
        style={{
          position: 'relative',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.03)',
          aspectRatio: '16/7',
          marginBottom: open ? '8px' : 0,
        }}
      >
        {value ? (
          <img
            src={value}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(241,245,249,0.2)', fontSize: '12px',
          }}>
            No image set
          </div>
        )}
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            position: 'absolute', bottom: '8px', right: '8px',
            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '6px', color: '#f1f5f9',
            fontSize: '11px', fontWeight: 600, padding: '4px 10px',
            cursor: 'pointer',
          }}
        >
          {open ? 'Cancel' : 'Change'}
        </button>
      </div>

      {/* Picker dropdown */}
      {open && (
        <div
          style={{
            background: 'rgba(15,23,42,0.95)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            padding: '12px',
          }}
        >
          {/* Unsplash search */}
          <p style={{ ...labelStyle, marginBottom: '6px' }}>Search Unsplash</p>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runSearch()}
              placeholder="e.g. gym interior, office light…"
              style={{ ...fieldStyle, flex: 1, resize: undefined, padding: '7px 10px' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(245,158,11,0.5)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
            <button
              onClick={runSearch}
              disabled={searching}
              style={{
                background: searching ? 'rgba(245,158,11,0.3)' : 'rgba(245,158,11,0.15)',
                border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: '8px', color: '#f59e0b',
                fontSize: '12px', fontWeight: 600,
                padding: '7px 12px', cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {searching ? '…' : 'Search'}
            </button>
          </div>

          {/* Results grid */}
          {results.length > 0 && (
            <div
              style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '4px', marginBottom: '12px',
              }}
            >
              {results.map((p, i) => (
                <button
                  key={i}
                  onClick={() => selectPhoto(p.url)}
                  title={p.credit}
                  style={{
                    padding: 0, border: value === p.url ? '2px solid #f59e0b' : '2px solid transparent',
                    borderRadius: '6px', overflow: 'hidden', cursor: 'pointer',
                    aspectRatio: '1', background: 'none',
                    transition: 'border-color 0.15s',
                  }}
                >
                  <img
                    src={p.thumbUrl}
                    alt={p.credit}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </button>
              ))}
            </div>
          )}

          {/* URL fallback */}
          <p style={{ ...labelStyle, marginBottom: '6px' }}>Or paste an image URL</p>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="url"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applyUrl()}
              placeholder="https://…"
              style={{ ...fieldStyle, flex: 1, resize: undefined, padding: '7px 10px' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(245,158,11,0.5)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
            <button
              onClick={applyUrl}
              disabled={!urlInput.trim()}
              style={{
                background: 'rgba(245,158,11,0.15)',
                border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: '8px', color: '#f59e0b',
                fontSize: '12px', fontWeight: 600,
                padding: '7px 12px', cursor: 'pointer',
                opacity: urlInput.trim() ? 1 : 0.4,
              }}
            >
              Use
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────

export default function DirectEditPanel({ websiteId, brief, onDraftCreated }: Props) {
  const [local, setLocal] = useState<ContentBrief>({ ...brief })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function set<K extends keyof ContentBrief>(key: K, value: ContentBrief[K]) {
    setSaved(false)
    setLocal(prev => ({ ...prev, [key]: value }))
  }

  function setService(i: number, field: 'name' | 'description', value: string) {
    const updated = local.services.map((s, idx) => idx === i ? { ...s, [field]: value } : s)
    set('services', updated)
  }

  function addService() {
    set('services', [...local.services, { name: '', description: '' }])
  }

  function removeService(i: number) {
    set('services', local.services.filter((_, idx) => idx !== i))
  }

  function setProcess(i: number, field: 'title' | 'body', value: string) {
    const updated = local.process.map((s, idx) => idx === i ? { ...s, [field]: value } : s)
    set('process', updated)
  }

  function setStat(i: number, field: 'value' | 'label', value: string) {
    const updated = local.stats.map((s, idx) => idx === i ? { ...s, [field]: value } : s)
    set('stats', updated)
  }

  function setTestimonial(i: number, field: 'quote' | 'author' | 'role', value: string) {
    const updated = local.testimonials.map((t, idx) => idx === i ? { ...t, [field]: value } : t)
    set('testimonials', updated)
  }

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const result = await applyDirectEdit(websiteId, local)
      if (result.error) {
        setError(result.error)
      } else {
        setSaved(true)
        onDraftCreated()
      }
    })
  }

  const btnStyle: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '13px',
    fontWeight: 600,
    cursor: isPending ? 'wait' : 'pointer',
    background: isPending ? 'rgba(245,158,11,0.4)' : '#f59e0b',
    color: '#0f172a',
    transition: 'opacity 0.15s',
  }

  const addBtnStyle: React.CSSProperties = {
    background: 'none',
    border: '1px dashed rgba(245,158,11,0.3)',
    borderRadius: '6px',
    color: 'rgba(245,158,11,0.6)',
    fontSize: '12px',
    padding: '5px 10px',
    cursor: 'pointer',
    width: '100%',
    marginTop: '4px',
  }

  const removeBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'rgba(239,68,68,0.5)',
    fontSize: '11px',
    cursor: 'pointer',
    padding: '0',
    alignSelf: 'flex-start',
    marginTop: '2px',
  }

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(15,23,42,0.6)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 16px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9', margin: 0 }}>
          Direct Edit
        </p>
        <p style={{ fontSize: '11px', color: 'rgba(241,245,249,0.35)', margin: '2px 0 0' }}>
          Changes are saved as a draft — no AI involved.
        </p>
      </div>

      {/* Scrollable fields */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>

        <p style={sectionHeadStyle}>Photos</p>
        <ImagePicker
          label="Hero Background"
          value={local.heroImageUrl}
          onChange={v => set('heroImageUrl', v)}
        />
        <ImagePicker
          label="About Section"
          value={local.aboutImageUrl}
          onChange={v => set('aboutImageUrl', v)}
        />
        {local.galleryEnabled && (
          <ImagePicker
            label="Gallery Image"
            value={local.galleryImageUrl}
            onChange={v => set('galleryImageUrl', v)}
          />
        )}

        <p style={{ ...sectionHeadStyle, marginTop: '18px' }}>Hero</p>
        <Field label="Headline" value={local.headline} onChange={v => set('headline', v)} />
        <Field label="Tagline" value={local.tagline} onChange={v => set('tagline', v)} />
        <Field label="Subheadline" value={local.subheadline} onChange={v => set('subheadline', v)} rows={2} />
        <Field label="CTA Button Text" value={local.ctaText} onChange={v => set('ctaText', v)} />

        <p style={{ ...sectionHeadStyle, marginTop: '18px' }}>About</p>
        <Field label="About" value={local.about} onChange={v => set('about', v)} rows={4} />

        <p style={{ ...sectionHeadStyle, marginTop: '18px' }}>Services</p>
        {local.services.map((svc, i) => (
          <div
            key={i}
            style={{
              marginBottom: '12px',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(241,245,249,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Service {i + 1}
              </span>
              {local.services.length > 1 && (
                <button style={removeBtnStyle} onClick={() => removeService(i)}>Remove</button>
              )}
            </div>
            <Field label="Name" value={svc.name} onChange={v => setService(i, 'name', v)} />
            <Field label="Description" value={svc.description} onChange={v => setService(i, 'description', v)} rows={2} />
          </div>
        ))}
        <button style={addBtnStyle} onClick={addService}>+ Add service</button>

        <p style={{ ...sectionHeadStyle, marginTop: '18px' }}>Process Steps</p>
        {local.process.map((step, i) => (
          <div
            key={i}
            style={{
              marginBottom: '10px',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <span style={{ fontSize: '11px', color: 'rgba(241,245,249,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
              Step {step.step}
            </span>
            <Field label="Title" value={step.title} onChange={v => setProcess(i, 'title', v)} />
            <Field label="Body" value={step.body} onChange={v => setProcess(i, 'body', v)} rows={2} />
          </div>
        ))}

        <p style={{ ...sectionHeadStyle, marginTop: '18px' }}>Stats</p>
        {local.stats.map((stat, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <Field label="Value" value={stat.value} onChange={v => setStat(i, 'value', v)} />
            <Field label="Label" value={stat.label} onChange={v => setStat(i, 'label', v)} />
          </div>
        ))}

        <p style={{ ...sectionHeadStyle, marginTop: '18px' }}>Testimonials</p>
        {local.testimonials.map((t, i) => (
          <div
            key={i}
            style={{
              marginBottom: '10px',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <span style={{ fontSize: '11px', color: 'rgba(241,245,249,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
              Testimonial {i + 1}
            </span>
            <Field label="Quote" value={t.quote} onChange={v => setTestimonial(i, 'quote', v)} rows={3} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <Field label="Author" value={t.author} onChange={v => setTestimonial(i, 'author', v)} />
              <Field label="Role" value={t.role} onChange={v => setTestimonial(i, 'role', v)} />
            </div>
          </div>
        ))}

        <p style={{ ...sectionHeadStyle, marginTop: '18px' }}>Footer CTA</p>
        <Field label="Headline" value={local.finalCtaHeadline} onChange={v => set('finalCtaHeadline', v)} />
        <Field label="Subtext" value={local.finalCtaSubtext} onChange={v => set('finalCtaSubtext', v)} rows={2} />

        <p style={{ ...sectionHeadStyle, marginTop: '18px' }}>Contact</p>
        <Field label="Email" value={local.email} onChange={v => set('email', v)} />
        <Field label="Location" value={local.location} onChange={v => set('location', v)} />

        <div style={{ height: '16px' }} />
      </div>

      {/* Save bar */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexShrink: 0,
        }}
      >
        <button style={btnStyle} onClick={handleSave} disabled={isPending}>
          {isPending ? 'Saving…' : 'Save as draft'}
        </button>
        {saved && !isPending && (
          <span style={{ fontSize: '12px', color: '#4ade80' }}>Draft saved — preview updated.</span>
        )}
        {error && (
          <span style={{ fontSize: '12px', color: '#f87171' }}>{error}</span>
        )}
      </div>
    </div>
  )
}
