import type { DocumentRow } from '../api/documents'
import type { RouteRow } from '../api/timeline'

function personLine(
  name: string | null | undefined,
  dept: string | null | undefined,
  email: string | null | undefined,
): string {
  const n = name?.trim()
  const d = dept?.trim()
  const e = email?.trim()
  return n || d || e || ''
}

/**
 * FROM column: same idea as DATE & TIME — use persisted route text, then joined names,
 * then document-level context on row 1 when nothing else exists.
 */
export function actionSlipFromCell(r: RouteRow, rowIndex: number, doc: DocumentRow): string {
  const direct = r.from_text?.trim()
  if (direct) return direct
  const joined = personLine(r.from_display_name, r.from_department_name, r.from_email)
  if (joined) return joined
  if (rowIndex === 0) {
    const office = doc.originating_office?.trim()
    if (office) return office
  }
  return '—'
}

/**
 * Paper slip convention: from the second routing row onward, **FROM** is the **TO** of the
 * previous row (the prior recipient is the sender of this step).
 */
export function actionSlipFromCellChained(
  routes: RouteRow[],
  rowIndex: number,
  doc: DocumentRow,
): string {
  const r = routes[rowIndex]
  if (!r) return ''

  if (rowIndex > 0) {
    const prev = routes[rowIndex - 1]
    if (prev) {
      return actionSlipToCell(prev, rowIndex - 1, doc)
    }
  }

  return actionSlipFromCell(r, rowIndex, doc)
}

/** TO column: route text → joined names → originating office on first row as last resort. */
export function actionSlipToCell(r: RouteRow, rowIndex: number, doc: DocumentRow): string {
  const direct = r.to_text?.trim()
  if (direct) return direct
  const joined = personLine(r.to_display_name, r.to_department_name, r.to_email)
  if (joined) return joined
  if (rowIndex === 0) {
    const office = doc.originating_office?.trim()
    if (office) return office
  }
  return '—'
}

/** Free-text remarks under the checkboxes (row 1 mirrors saved instruction + document description). */
export function actionSlipRemarksText(r: RouteRow | null, rowIndex: number, doc: DocumentRow): string {
  const instr = r?.initial_instruction?.trim()
  if (instr) return instr
  if (rowIndex === 0) {
    const desc = doc.description?.trim()
    if (desc) return desc
  }
  return ''
}
