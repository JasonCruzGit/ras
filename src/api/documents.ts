import { z } from 'zod'
import { supabase } from '../lib/supabase'

export const DocumentPriority = z.enum(['low', 'medium', 'high', 'urgent'])
export type DocumentPriority = z.infer<typeof DocumentPriority>

export const DocumentStatus = z.enum([
  'pending',
  'in_progress',
  'approved',
  'rejected',
  'completed',
])
export type DocumentStatus = z.infer<typeof DocumentStatus>

export const DocumentRow = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  originating_office: z.string(),
  reference_number: z.string().nullable(),
  date_of_document: z.string().nullable(), // ISO date
  date_time_received: z.string().nullable(), // ISO timestamp
  priority: DocumentPriority,
  status: DocumentStatus,
  created_by: z.string().uuid(),
  current_holder_user_id: z.string().uuid().nullable(),
  current_holder_department_id: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type DocumentRow = z.infer<typeof DocumentRow>

export async function listDocuments() {
  const { data, error } = await supabase
    .from('documents')
    .select(
      'id,title,originating_office,reference_number,priority,status,created_at,updated_at,current_holder_user_id',
    )
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw error
  return z
    .array(
      DocumentRow.pick({
        id: true,
        title: true,
        originating_office: true,
        reference_number: true,
        priority: true,
        status: true,
        created_at: true,
        updated_at: true,
        current_holder_user_id: true,
      }),
    )
    .parse(data)
}

export async function getDocument(id: string) {
  const { data, error } = await supabase.from('documents').select('*').eq('id', id).single()
  if (error) throw error
  return DocumentRow.parse(data)
}

export const CreateDocumentInput = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  originating_office: z.string().min(1),
  reference_number: z.string().optional(),
  date_of_document: z.string().optional(), // YYYY-MM-DD
  date_time_received: z.string().optional(), // ISO string
  priority: DocumentPriority,
})
export type CreateDocumentInput = z.infer<typeof CreateDocumentInput>

export async function createDocument(input: CreateDocumentInput) {
  const userRes = await supabase.auth.getUser()
  const uid = userRes.data.user?.id
  if (!uid) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('documents')
    .insert({
      title: input.title,
      description: input.description ?? null,
      originating_office: input.originating_office,
      reference_number: input.reference_number ?? null,
      date_of_document: input.date_of_document ?? null,
      date_time_received: input.date_time_received ?? null,
      priority: input.priority,
      status: 'pending',
      created_by: uid,
    })
    .select('*')
    .single()
  if (error) throw error
  return DocumentRow.parse(data)
}

