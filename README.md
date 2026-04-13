# Routing Action Slip System (RAS)

Web-based Routing Action Slip System for tracking and managing document flow.

## What’s implemented (scaffold)

- Login page (Supabase email/password)
- Auth-protected app shell (sidebar + pages)
- Pages stubbed for Dashboard / Documents / Inbox / New Routing Slip / Document Detail
- SQL scripts for Supabase schema + RLS

## Fields mirrored from your Excel template

- Originating Office
- Reference Number
- Subject
- Date of Document
- Date & Time Received
- Routing table columns: Date & Time, From, To, Remarks / Instruction / Action Requested

## Setup

### 1) Create a Supabase project

In Supabase SQL Editor, run:

1. `supabase/schema.sql`
2. `supabase/rls.sql`
3. `supabase/routing_functions.sql`
4. `supabase/views.sql`
5. (optional) `supabase/profile_trigger.sql`

Then create a Storage bucket named **`document-attachments`** (private recommended).

#### Required manual step: seed profiles

This app expects a row in `public.profiles` for each auth user.

- Create users in **Supabase Auth**
- Insert `profiles` rows (or add your own trigger to auto-create profiles on signup)

### 2) Configure environment variables

Copy `.env.example` to `.env.local` and fill:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 3) Run locally

```bash
cd ras-routing-slip
npm install
npm run dev
```

## Vercel notes (React Router)

This project uses client-side routing. For Vercel, `vercel.json` includes a rewrite so routes like
`/documents/new` work on refresh/direct navigation.

## Next steps

- Build full document CRUD + file upload to Storage
- (Optional) add automatic profile creation on signup (trigger)

