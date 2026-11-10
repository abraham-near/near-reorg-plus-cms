import { bucketEnabled, presignMedia } from '@/cms/lib/bucket'

// Only reached when the file is not in public/cms (static files win), i.e. on Railway.
// Redirects to a presigned bucket URL so media bytes never go through this service.
const SAFE_SEGMENT = /^[\w.-]+$/

export async function GET(_req: Request, ctx: RouteContext<'/cms/[...path]'>) {
  const { path } = await ctx.params
  if (!bucketEnabled || !path.every((s) => SAFE_SEGMENT.test(s) && s !== '..' && s !== '.')) {
    return new Response('Not found', { status: 404 })
  }

  const url = await presignMedia(`cms/${path.join('/')}`)
  return new Response(null, {
    status: 302,
    headers: {
      Location: url,
      // Well under the signature lifetime (lib/bucket.ts) so a cached redirect never points at an expired URL.
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
