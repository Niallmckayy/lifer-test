'use client'

import { useState, useTransition } from 'react'
import { initializeSiteContent, updateCmsSchema } from '@/lib/cms-actions'
import type { CmsSchema, CmsContent } from '@/types/cms'

type Props = {
  websiteId: string
  existingSchema: string | null
  existingContent: string | null
  existingRevalidateHook: string | null
}

export function CmsSetupForm({ websiteId, existingSchema, existingContent, existingRevalidateHook }: Props) {
  const [schemaJson, setSchemaJson] = useState(
    existingSchema
      ? JSON.stringify(JSON.parse(existingSchema), null, 2)
      : JSON.stringify(RESET_RECOVERY_SCHEMA, null, 2)
  )
  const [contentJson, setContentJson] = useState(
    existingContent
      ? JSON.stringify(JSON.parse(existingContent), null, 2)
      : '{}'
  )
  const [revalidateHook, setRevalidateHook] = useState(existingRevalidateHook ?? '')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [, startTransition] = useTransition()

  async function handleSave() {
    setStatus('saving')
    setErrorMsg('')

    let schema: CmsSchema
    let content: CmsContent
    try {
      schema = JSON.parse(schemaJson)
      content = JSON.parse(contentJson)
    } catch {
      setStatus('error')
      setErrorMsg('Invalid JSON — please check the schema or content.')
      return
    }

    startTransition(async () => {
      const result = await initializeSiteContent(
        websiteId,
        schema,
        content,
        revalidateHook || undefined,
      )
      if (result.success) {
        setStatus('saved')
      } else {
        setStatus('error')
        setErrorMsg(result.error ?? 'Unknown error')
      }
    })
  }

  async function handleSchemaOnly() {
    setStatus('saving')
    setErrorMsg('')

    let schema: CmsSchema
    try {
      schema = JSON.parse(schemaJson)
    } catch {
      setStatus('error')
      setErrorMsg('Invalid JSON in schema.')
      return
    }

    startTransition(async () => {
      const result = await updateCmsSchema(websiteId, schema)
      setStatus(result.success ? 'saved' : 'error')
      if (!result.success) setErrorMsg(result.error ?? 'Unknown error')
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {status === 'saved' && (
        <div className="px-4 py-3 text-sm" style={{ background: 'rgba(77,158,58,0.12)', color: '#6dbf56', borderRadius: '10px' }}>
          Saved successfully.
        </div>
      )}
      {status === 'error' && (
        <div className="px-4 py-3 text-sm" style={{ background: 'rgba(192,57,27,0.12)', color: '#e05a3a', borderRadius: '10px' }}>
          {errorMsg}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(245,232,208,0.35)' }}>
          Content Schema (JSON)
        </label>
        <p className="text-xs" style={{ color: 'rgba(245,232,208,0.25)' }}>
          Defines pages, sections, and fields. The editor is generated from this.
        </p>
        <textarea
          value={schemaJson}
          onChange={e => setSchemaJson(e.target.value)}
          rows={20}
          className="w-full px-4 py-3 text-xs font-mono outline-none resize-y"
          style={{
            background: 'rgba(245,232,208,0.04)',
            border: '1px solid rgba(245,232,208,0.1)',
            borderRadius: '8px',
            color: '#f5e8d0',
            lineHeight: '1.6',
          }}
          spellCheck={false}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(245,232,208,0.35)' }}>
          Initial Content (JSON)
        </label>
        <p className="text-xs" style={{ color: 'rgba(245,232,208,0.25)' }}>
          The starting content values. Leave as {"{ }"} to start empty.
        </p>
        <textarea
          value={contentJson}
          onChange={e => setContentJson(e.target.value)}
          rows={12}
          className="w-full px-4 py-3 text-xs font-mono outline-none resize-y"
          style={{
            background: 'rgba(245,232,208,0.04)',
            border: '1px solid rgba(245,232,208,0.1)',
            borderRadius: '8px',
            color: '#f5e8d0',
            lineHeight: '1.6',
          }}
          spellCheck={false}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(245,232,208,0.35)' }}>
          Revalidation Hook URL (optional)
        </label>
        <p className="text-xs" style={{ color: 'rgba(245,232,208,0.25)' }}>
          The site&apos;s Next.js revalidation endpoint. Called on publish to clear ISR cache instantly.
        </p>
        <input
          type="url"
          value={revalidateHook}
          onChange={e => setRevalidateHook(e.target.value)}
          placeholder="https://your-site.vercel.app/api/revalidate"
          className="px-3 py-2 text-sm outline-none"
          style={{
            background: 'rgba(245,232,208,0.04)',
            border: '1px solid rgba(245,232,208,0.1)',
            borderRadius: '8px',
            color: '#f5e8d0',
          }}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={status === 'saving'}
          className="text-sm font-semibold px-5 py-2.5 transition-opacity hover:opacity-90"
          style={{ background: '#d4830c', color: '#fff', borderRadius: '8px', cursor: status === 'saving' ? 'not-allowed' : 'pointer' }}
        >
          {status === 'saving' ? 'Saving…' : 'Initialize / Update CMS'}
        </button>
        {existingSchema && (
          <button
            onClick={handleSchemaOnly}
            disabled={status === 'saving'}
            className="text-sm font-medium px-4 py-2.5 transition-opacity hover:opacity-80"
            style={{
              background: 'rgba(245,232,208,0.06)',
              color: 'rgba(245,232,208,0.6)',
              borderRadius: '8px',
              border: '1px solid rgba(245,232,208,0.1)',
              cursor: status === 'saving' ? 'not-allowed' : 'pointer',
            }}
          >
            Update Schema Only
          </button>
        )}
      </div>
    </div>
  )
}

// Default schema for reset-recovery style sites
const RESET_RECOVERY_SCHEMA: CmsSchema = {
  pages: {
    home: {
      label: 'Home Page',
      sections: {
        hero: {
          label: 'Hero',
          fields: {
            headline:    { type: 'text',     label: 'Main Headline' },
            subheadline: { type: 'text',     label: 'Subheadline' },
            heroImage:   { type: 'image',    label: 'Hero Background Image' },
            ctaText:     { type: 'text',     label: 'Primary CTA Button Text' },
          },
        },
        services: {
          label: 'Services',
          repeatable: true,
          fields: {
            title:       { type: 'text',     label: 'Service Name' },
            subtitle:    { type: 'text',     label: 'Category' },
            description: { type: 'textarea', label: 'Short Description' },
            detail:      { type: 'textarea', label: 'Expanded Detail' },
            temperature: { type: 'text',     label: 'Temperature (optional)' },
          },
        },
        gallery: {
          label: 'Gallery',
          repeatable: true,
          fields: {
            imageUrl: { type: 'image', label: 'Photo' },
            label:    { type: 'text',  label: 'Overlay Label' },
          },
        },
        about: {
          label: 'About',
          fields: {
            heading: { type: 'text',     label: 'Heading' },
            body:    { type: 'textarea', label: 'Body Copy' },
          },
        },
        stats: {
          label: 'Stats',
          repeatable: true,
          fields: {
            value: { type: 'text', label: 'Stat Value (e.g. 5+)' },
            label: { type: 'text', label: 'Stat Label' },
          },
        },
        pillars: {
          label: 'Pillars',
          repeatable: true,
          fields: {
            title:       { type: 'text',     label: 'Pillar Title' },
            description: { type: 'textarea', label: 'Pillar Description' },
          },
        },
        contact: {
          label: 'Contact',
          fields: {
            heading:  { type: 'text', label: 'Section Heading' },
            email:    { type: 'text', label: 'Email Address' },
            location: { type: 'text', label: 'Location' },
          },
        },
      },
    },
  },
}
