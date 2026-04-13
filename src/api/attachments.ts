import { z } from 'zod'
import { supabase } from '../lib/supabase'

export const AttachmentRow = z.object({
  id: z.string().uuid(),
  document_id: z.string().uuid(),
  file_name: z.string(),
  mime_type: z.string().nullable(),
  storage_bucket: z.string(),
  storage_path: z.string(),
  kind: z.string().optional(),
  created_at: z.string(),
})

export type AttachmentRow = z.infer<typeof AttachmentRow>

export async function listHardcopyProofs(documentId: string) {
  const { data, error } = await supabase
    .from('document_attachments')
    .select('id,document_id,file_name,mime_type,storage_bucket,storage_path,kind,created_at')
    .eq('document_id', documentId)
    .eq('kind', 'hardcopy_proof')
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw error
  return z.array(AttachmentRow).parse(data)
}

export async function createSignedAttachmentUrl(args: {
  bucket: string
  path: string
  expiresInSeconds?: number
}) {
  const { data, error } = await supabase.storage
    .from(args.bucket)
    .createSignedUrl(args.path, args.expiresInSeconds ?? 60 * 10)
  if (error) throw error
  return data.signedUrl
}

