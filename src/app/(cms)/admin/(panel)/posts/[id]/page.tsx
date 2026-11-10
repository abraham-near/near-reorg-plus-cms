import { redirect } from 'next/navigation'

type Props = { params: Promise<{ id: string }> }

// /admin/posts/<id> is linked from the dashboard and audit views; the editor lives at /edit.
export default async function PostIndexRedirect({ params }: Props) {
  const { id } = await params
  redirect(`/admin/posts/${encodeURIComponent(id)}/edit`)
}
