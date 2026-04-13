import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { createDocument } from '../api/documents'

export function NewDocumentPage() {
  const nav = useNavigate()
  const qc = useQueryClient()

  const [originatingOffice, setOriginatingOffice] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [subject, setSubject] = useState('')
  const [dateOfDocument, setDateOfDocument] = useState('')
  const [dateTimeReceived, setDateTimeReceived] = useState('')
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium')
  const [error, setError] = useState<string | null>(null)

  const create = useMutation({
    mutationFn: async () => {
      const doc = await createDocument({
        title: subject.trim() || 'Untitled',
        originating_office: originatingOffice.trim(),
        reference_number: referenceNumber.trim() || undefined,
        date_of_document: dateOfDocument || undefined,
        date_time_received: dateTimeReceived ? new Date(dateTimeReceived).toISOString() : undefined,
        priority: priority.toLowerCase() as 'low' | 'medium' | 'high' | 'urgent',
      })
      return doc
    },
    onSuccess: async (doc) => {
      await qc.invalidateQueries({ queryKey: ['documents'] })
      nav(`/documents/${doc.id}`)
    },
    onError: (e) => setError((e as Error).message),
  })

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold text-slate-900">New routing slip</div>
        <div className="text-sm text-slate-600">
          Mirrors your Excel template fields (originating office, reference no., subject, dates).
        </div>
      </div>

      <form
        className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault()
          setError(null)
          create.mutate()
        }}
      >
        <label className="block">
          <div className="text-xs font-medium text-slate-700">Originating office</div>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={originatingOffice}
            onChange={(e) => setOriginatingOffice(e.target.value)}
            placeholder="e.g., FLIGHT INFORMATION DISPLAY SYSTEM"
            required
          />
        </label>

        <label className="block">
          <div className="text-xs font-medium text-slate-700">Reference number</div>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="e.g., PPIA-FIDS-2025-11-195"
          />
        </label>

        <label className="block md:col-span-2">
          <div className="text-xs font-medium text-slate-700">Subject</div>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g., Upgrade display monitors"
          />
        </label>

        <label className="block">
          <div className="text-xs font-medium text-slate-700">Date of document</div>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={dateOfDocument}
            onChange={(e) => setDateOfDocument(e.target.value)}
            type="date"
          />
        </label>

        <label className="block">
          <div className="text-xs font-medium text-slate-700">Date & time received</div>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={dateTimeReceived}
            onChange={(e) => setDateTimeReceived(e.target.value)}
            type="datetime-local"
          />
        </label>

        <label className="block">
          <div className="text-xs font-medium text-slate-700">Priority</div>
          <select
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={priority}
            onChange={(e) => setPriority(e.target.value as typeof priority)}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </label>

        <label className="block">
          <div className="text-xs font-medium text-slate-700">Attach file (PDF/DOCX)</div>
          <input className="mt-1 w-full text-sm" type="file" />
        </label>

        {error ? (
          <div className="md:col-span-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="md:col-span-2 flex items-center justify-end gap-2">
          <button
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
            type="button"
            onClick={() => {
              nav('/documents/new/preview', {
                state: {
                  originatingOffice,
                  referenceNumber,
                  subject: subject.trim() || 'Untitled',
                  dateOfDocument,
                  dateTimeReceived: dateTimeReceived
                    ? new Date(dateTimeReceived).toLocaleString()
                    : '',
                },
              })
            }}
          >
            Preview / Print
          </button>
          <button
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
            type="button"
            onClick={() => nav('/documents')}
          >
            Cancel
          </button>
          <button
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            disabled={create.isPending}
            type="submit"
          >
            {create.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}

