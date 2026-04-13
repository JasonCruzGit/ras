import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { DocumentRow } from './documents'

const AssignedDoc = DocumentRow.pick({
  id: true,
  title: true,
  originating_office: true,
  reference_number: true,
  priority: true,
  status: true,
  created_at: true,
  updated_at: true,
  current_holder_user_id: true,
})

export type AssignedDoc = z.infer<typeof AssignedDoc>

export async function listAssignedToMe() {
  const u = await supabase.auth.getUser()
  const uid = u.data.user?.id
  if (!uid) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('documents')
    .select(
      'id,title,originating_office,reference_number,priority,status,created_at,updated_at,current_holder_user_id',
    )
    .eq('current_holder_user_id', uid)
    .order('updated_at', { ascending: false })
    .limit(200)
  if (error) throw error
  return z.array(AssignedDoc).parse(data)
}

export async function approveDocument(documentId: string, remarks?: string) {
  const { error } = await supabase.rpc('approve_document', {
    p_document_id: documentId,
    p_remarks: remarks ?? null,
  })
  if (error) throw error
}

export async function rejectDocument(documentId: string, remarks?: string) {
  const { error } = await supabase.rpc('reject_document', {
    p_document_id: documentId,
    p_remarks: remarks ?? null,
  })
  if (error) throw error
}

export async function forwardDocument(args: {
  documentId: string
  toUserId?: string
  toDepartmentId?: string
  instruction?: string
  remarks?: string
}) {
  const { error } = await supabase.rpc('forward_document', {
    p_document_id: args.documentId,
    p_to_user_id: args.toUserId ?? null,
    p_to_department_id: args.toDepartmentId ?? null,
    p_instruction: args.instruction ?? null,
    p_remarks: args.remarks ?? null,
  })
  if (error) throw error
}

