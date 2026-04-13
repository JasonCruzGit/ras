import { z } from 'zod'
import { supabase } from '../lib/supabase'

export const CreateSessionResponse = z.object({
  token: z.string().uuid(),
  url: z.string().optional(),
})

export async function createHardcopySession(documentId: string) {
  const { data, error } = await supabase.rpc('create_hardcopy_upload_session', {
    p_document_id: documentId,
  })
  if (error) throw error
  // supabase returns array of rows for table returns
  const row = z.array(CreateSessionResponse).parse(data)[0]
  if (!row) throw new Error('Failed to create session')
  return row
}

export const SessionRow = z.object({
  token: z.string().uuid(),
  document_id: z.string().uuid(),
  expires_at: z.string(),
  uploaded_at: z.string().nullable(),
})

export async function getSessionByToken(token: string) {
  const { data, error } = await supabase.rpc('get_hardcopy_upload_session', { p_token: token })
  if (error) throw error
  const row = z.array(SessionRow).parse(data)[0]
  if (!row) throw new Error('Invalid or expired token')
  return row
}

export async function uploadHardcopyPhoto(args: {
  token: string
  documentId: string
  file: File
}) {
  const ext = args.file.name.split('.').pop() || 'jpg'
  const path = `hardcopy/${args.token}/${Date.now()}.${ext}`

  const up = await supabase.storage.from('document-attachments').upload(path, args.file, {
    cacheControl: '3600',
    upsert: false,
    contentType: args.file.type || 'image/jpeg',
  })
  if (up.error) throw up.error

  const { data, error } = await supabase.rpc('finalize_hardcopy_upload', {
    p_token: args.token,
    p_storage_path: path,
    p_file_name: args.file.name || `hardcopy.${ext}`,
    p_mime_type: args.file.type || 'image/jpeg',
  })
  if (error) throw error

  return { storagePath: path, attachmentId: data }
}

