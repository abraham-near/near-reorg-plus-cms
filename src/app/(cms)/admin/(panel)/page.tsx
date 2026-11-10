import { redirect } from 'next/navigation'

// Reads the session (cookie + database) before rendering: this page blocks by design (src/app/(cms)/layout.tsx).
export const instant = false

export default function AdminIndex() {
  redirect('/admin/dashboard')
}
