export type FieldType = 'text' | 'textarea' | 'image'

export type FieldDef = {
  type: FieldType
  label: string
  required?: boolean
  placeholder?: string
}

export type SectionDef = {
  label: string
  repeatable?: boolean
  fields: Record<string, FieldDef>
}

export type PageDef = {
  label: string
  sections: Record<string, SectionDef>
}

export type CmsSchema = {
  pages: Record<string, PageDef>
}

// Content values mirror schema structure.
// Non-repeatable sections: Record<fieldKey, value>
// Repeatable sections: Array<Record<fieldKey, value>>
export type SectionContent = Record<string, string>
export type CmsContent = Record<string, Record<string, SectionContent | SectionContent[]>>
