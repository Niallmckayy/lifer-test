'use client'

import { useState, useTransition } from 'react'
import { saveCmsDraft, publishCmsContent } from '@/lib/cms-actions'
import type { CmsSchema, CmsContent, SectionContent } from '@/types/cms'
import { TextField } from './fields/TextField'
import { TextareaField } from './fields/TextareaField'
import { ImageField } from './fields/ImageField'

type Props = {
  websiteId: string
  schema: CmsSchema
  initialContent: CmsContent
  initialDraft: CmsContent | null
}

export function ContentEditor({ websiteId, schema, initialContent, initialDraft }: Props) {
  const pages = Object.entries(schema.pages)
  const [activePage, setActivePage] = useState(pages[0]?.[0] ?? '')
  const [activeSection, setActiveSection] = useState(
    Object.keys(pages[0]?.[1]?.sections ?? {})[0] ?? ''
  )

  const [content, setContent] = useState<CmsContent>(initialDraft ?? initialContent)
  const [isDirty, setIsDirty] = useState(!!initialDraft)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'published' | 'error'>('idle')
  const [, startTransition] = useTransition()
  const [fieldsVisible, setFieldsVisible] = useState(true)

  function getFieldValue(page: string, section: string, field: string): string {
    const sec = content[page]?.[section]
    if (!sec) return ''
    if (Array.isArray(sec)) return ''
    return (sec as SectionContent)[field] ?? ''
  }

  function setFieldValue(page: string, section: string, field: string, val: string) {
    setContent(prev => {
      const sec = prev[page]?.[section]
      if (Array.isArray(sec)) return prev
      return {
        ...prev,
        [page]: {
          ...prev[page],
          [section]: {
            ...(sec as SectionContent ?? {}),
            [field]: val,
          },
        },
      }
    })
    setIsDirty(true)
    setSaveStatus('idle')
  }

  function getRepeatableItems(page: string, section: string): SectionContent[] {
    const sec = content[page]?.[section]
    return Array.isArray(sec) ? sec : []
  }

  function setRepeatableItems(page: string, section: string, items: SectionContent[]) {
    setContent(prev => ({
      ...prev,
      [page]: { ...prev[page], [section]: items },
    }))
    setIsDirty(true)
    setSaveStatus('idle')
  }

  async function handleSaveDraft() {
    setSaveStatus('saving')
    startTransition(async () => {
      const result = await saveCmsDraft(websiteId, content)
      setSaveStatus(result.success ? 'saved' : 'error')
      if (result.success) setIsDirty(false)
    })
  }

  async function handlePublish() {
    setSaveStatus('saving')
    startTransition(async () => {
      const saveResult = await saveCmsDraft(websiteId, content)
      if (!saveResult.success) { setSaveStatus('error'); return }
      const pubResult = await publishCmsContent(websiteId)
      setSaveStatus(pubResult.success ? 'published' : 'error')
      if (pubResult.success) setIsDirty(false)
    })
  }

  function switchSection(fn: () => void) {
    setFieldsVisible(false)
    setTimeout(() => {
      fn()
      setFieldsVisible(true)
    }, 120)
  }

  function handlePageChange(pageKey: string) {
    switchSection(() => {
      setActivePage(pageKey)
      setActiveSection(Object.keys(schema.pages[pageKey].sections)[0] ?? '')
    })
  }

  const pageDef = schema.pages[activePage]
  const sectionDef = pageDef?.sections[activeSection]

  return (
    <div className="flex flex-col h-full">
      {/* ── Top bar ─────────────────────────────────────── */}
      <div
        className="px-4 py-3 md:px-8 md:py-4 flex items-center justify-between shrink-0 gap-3"
        style={{ borderBottom: '1px solid rgba(245,232,208,0.06)' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <h1
            className="text-lg font-bold"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#f5e8d0' }}
          >
            Content Editor
          </h1>
          {isDirty && (
            <span className="text-xs px-2 py-0.5" style={{ background: 'rgba(212,131,12,0.12)', color: '#e8a020', borderRadius: '999px' }}>
              Unsaved draft
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveDraft}
            disabled={saveStatus === 'saving' || !isDirty}
            className="text-sm font-medium px-4 py-2 transition-opacity"
            style={{
              background: 'rgba(245,232,208,0.06)',
              color: 'rgba(245,232,208,0.6)',
              borderRadius: '8px',
              border: '1px solid rgba(245,232,208,0.1)',
              cursor: !isDirty || saveStatus === 'saving' ? 'not-allowed' : 'pointer',
              opacity: !isDirty ? 0.4 : 1,
            }}
          >
            {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved ✓' : 'Save Draft'}
          </button>
          <button
            onClick={handlePublish}
            disabled={saveStatus === 'saving'}
            className="text-sm font-semibold px-5 py-2 transition-opacity hover:opacity-90"
            style={{
              background: saveStatus === 'published' ? '#4d9e3a' : '#d4830c',
              color: '#fff',
              borderRadius: '8px',
              cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
            }}
          >
            {saveStatus === 'published' ? 'Published ✓' : saveStatus === 'saving' ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </div>

      {saveStatus === 'error' && (
        <div className="px-8 py-2 text-sm" style={{ background: 'rgba(192,57,27,0.1)', color: '#e05a3a' }}>
          Something went wrong — please try again.
        </div>
      )}

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* ── Nav: horizontal scroll on mobile, vertical sidebar on desktop ── */}
        <div
          className="shrink-0 md:w-52 flex flex-row md:flex-col overflow-x-auto md:overflow-x-hidden md:overflow-y-auto border-b md:border-b-0 md:border-r"
          style={{ borderColor: 'rgba(245,232,208,0.06)', background: 'rgba(245,232,208,0.01)' }}
        >
          {pages.map(([pageKey, pageDef]) => (
            <div key={pageKey} className="flex flex-row md:flex-col">
              {pages.length > 1 && (
                <button
                  onClick={() => handlePageChange(pageKey)}
                  className="shrink-0 text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap"
                  style={{ color: activePage === pageKey ? '#d4830c' : 'rgba(245,232,208,0.25)' }}
                >
                  {pageDef.label}
                </button>
              )}
              {activePage === pageKey && (
                <div className="flex flex-row md:flex-col">
                  {Object.entries(pageDef.sections).map(([secKey, secDef]) => (
                    <button
                      key={secKey}
                      onClick={() => switchSection(() => setActiveSection(secKey))}
                      className="shrink-0 text-left px-4 md:px-5 py-3 md:py-2 text-sm transition-all whitespace-nowrap"
                      style={{
                        color: activeSection === secKey ? '#e8a020' : 'rgba(245,232,208,0.4)',
                        background: activeSection === secKey ? 'rgba(212,131,12,0.08)' : 'transparent',
                        borderBottom: `2px solid ${activeSection === secKey ? '#d4830c' : 'transparent'}`,
                      }}
                    >
                      {secDef.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Fields ── */}
        <div
          className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6"
          style={{ opacity: fieldsVisible ? 1 : 0, transition: 'opacity 0.12s ease' }}
        >
          {sectionDef ? (
            <div className="max-w-2xl flex flex-col gap-5">
              <div>
                <h2 className="text-base font-semibold" style={{ color: '#f5e8d0', fontFamily: "'Playfair Display', Georgia, serif" }}>
                  {sectionDef.label}
                </h2>
                {sectionDef.repeatable && (
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(245,232,208,0.3)' }}>
                    List — you can add, edit, or remove items.
                  </p>
                )}
              </div>

              {sectionDef.repeatable ? (
                <RepeatableSection
                  sectionDef={sectionDef}
                  items={getRepeatableItems(activePage, activeSection)}
                  websiteId={websiteId}
                  onChange={items => setRepeatableItems(activePage, activeSection, items)}
                />
              ) : (
                <div className="flex flex-col gap-4">
                  {Object.entries(sectionDef.fields).map(([fieldKey, fieldDef]) => {
                    const val = getFieldValue(activePage, activeSection, fieldKey)
                    if (fieldDef.type === 'image') {
                      return (
                        <ImageField
                          key={fieldKey}
                          label={fieldDef.label}
                          value={val}
                          websiteId={websiteId}
                          onChange={url => setFieldValue(activePage, activeSection, fieldKey, url)}
                        />
                      )
                    }
                    if (fieldDef.type === 'textarea') {
                      return (
                        <TextareaField
                          key={fieldKey}
                          label={fieldDef.label}
                          value={val}
                          placeholder={fieldDef.placeholder}
                          onChange={v => setFieldValue(activePage, activeSection, fieldKey, v)}
                        />
                      )
                    }
                    return (
                      <TextField
                        key={fieldKey}
                        label={fieldDef.label}
                        value={val}
                        placeholder={fieldDef.placeholder}
                        onChange={v => setFieldValue(activePage, activeSection, fieldKey, v)}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'rgba(245,232,208,0.3)' }}>Select a section.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Repeatable section (services, gallery, stats, etc.) ──
type RepeatableProps = {
  sectionDef: { fields: Record<string, { type: string; label: string; placeholder?: string }> }
  items: SectionContent[]
  websiteId: string
  onChange: (items: SectionContent[]) => void
}

function RepeatableSection({ sectionDef, items, websiteId, onChange }: RepeatableProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(items.length > 0 ? 0 : null)

  function updateItem(idx: number, field: string, val: string) {
    onChange(items.map((item, i) => i === idx ? { ...item, [field]: val } : item))
  }

  function addItem() {
    const blank: SectionContent = Object.fromEntries(Object.keys(sectionDef.fields).map(k => [k, '']))
    onChange([...items, blank])
    setExpandedIdx(items.length)
  }

  function removeItem(idx: number) {
    onChange(items.filter((_, i) => i !== idx))
    setExpandedIdx(null)
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, idx) => (
        <div
          key={idx}
          style={{
            border: '1px solid rgba(245,232,208,0.08)',
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 cursor-pointer"
            style={{ background: 'rgba(245,232,208,0.03)' }}
            onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
          >
            <span className="text-sm font-medium" style={{ color: 'rgba(245,232,208,0.6)' }}>
              {item[Object.keys(sectionDef.fields)[0]] || `Item ${idx + 1}`}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={e => { e.stopPropagation(); removeItem(idx) }}
                className="text-xs px-2 py-1 transition-opacity hover:opacity-70"
                style={{ color: '#e05a3a' }}
              >
                Remove
              </button>
              <svg
                width="12" height="12" viewBox="0 0 12 12" fill="none"
                style={{
                  transform: expandedIdx === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s',
                  color: 'rgba(245,232,208,0.3)',
                }}
              >
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {expandedIdx === idx && (
            <div className="px-4 py-4 flex flex-col gap-4" style={{ borderTop: '1px solid rgba(245,232,208,0.06)' }}>
              {Object.entries(sectionDef.fields).map(([fieldKey, fieldDef]) => {
                const val = item[fieldKey] ?? ''
                if (fieldDef.type === 'image') {
                  return (
                    <ImageField
                      key={fieldKey}
                      label={fieldDef.label}
                      value={val}
                      websiteId={websiteId}
                      onChange={url => updateItem(idx, fieldKey, url)}
                    />
                  )
                }
                if (fieldDef.type === 'textarea') {
                  return (
                    <TextareaField
                      key={fieldKey}
                      label={fieldDef.label}
                      value={val}
                      placeholder={fieldDef.placeholder}
                      onChange={v => updateItem(idx, fieldKey, v)}
                    />
                  )
                }
                return (
                  <TextField
                    key={fieldKey}
                    label={fieldDef.label}
                    value={val}
                    placeholder={fieldDef.placeholder}
                    onChange={v => updateItem(idx, fieldKey, v)}
                  />
                )
              })}
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 self-start transition-opacity hover:opacity-80"
        style={{
          background: 'rgba(212,131,12,0.1)',
          color: '#e8a020',
          borderRadius: '8px',
          border: '1px solid rgba(212,131,12,0.2)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Add item
      </button>
    </div>
  )
}
