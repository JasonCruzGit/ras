import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getSessionByToken, uploadHardcopyPhoto } from '../api/hardcopyProof'

export function HardcopyUploadPage() {
  const { token } = useParams()
  const [file, setFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const session = useQuery({
    queryKey: ['hardcopy-session', token],
    queryFn: () => getSessionByToken(token!),
    enabled: !!token,
  })

  const upload = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error('Missing token')
      if (!session.data) throw new Error('Session not loaded')
      if (!file) throw new Error('Select a photo first')
      return uploadHardcopyPhoto({ token, documentId: session.data.document_id, file })
    },
  })

  const title = useMemo(() => 'Upload hardcopy proof', [])

  useEffect(() => {
    if (!file) return
    if (!session.data) return
    if (upload.isPending || upload.isSuccess) return
    // Auto-upload once a photo is selected (better UX on phones)
    upload.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, session.data])

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto w-full max-w-md space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-lg font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-600">
            Take a photo of the hardcopy document and upload it as proof.
          </div>
        </div>

        {session.isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            Loading…
          </div>
        ) : session.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {(session.error as Error).message}
          </div>
        ) : session.data ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="text-xs text-slate-500">
              Expires: {new Date(session.data.expires_at).toLocaleString()}
            </div>

            {session.data.uploaded_at ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                This proof link has already been used. You can close this page.
              </div>
            ) : (
              <>
                <input
                  ref={inputRef}
                  className="hidden"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />

                <button
                  className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                  disabled={upload.isPending}
                  onClick={() => inputRef.current?.click()}
                  type="button"
                >
                  {upload.isPending ? 'Uploading…' : file ? 'Retake / Choose another photo' : 'Take photo / Choose photo'}
                </button>

                <div className="text-xs text-slate-600">
                  {file ? `Selected: ${file.name}` : 'After selecting a photo, it will upload automatically.'}
                </div>
              </>
            )}

            {upload.isSuccess ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                Uploaded successfully. You can close this page.
              </div>
            ) : null}

            {upload.isError ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {(upload.error as Error).message}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

