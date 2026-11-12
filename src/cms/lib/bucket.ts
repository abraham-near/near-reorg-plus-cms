import 'server-only'
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Railway Bucket that holds the mirrored CMS media (public/cms is gitignored).
// Variable names are the ones Railway injects when the bucket is referenced from the service.
const { BUCKET, ENDPOINT, REGION, ACCESS_KEY_ID, SECRET_ACCESS_KEY, BUCKET_FORCE_PATH_STYLE } = process.env

const client =
  BUCKET && ENDPOINT && ACCESS_KEY_ID && SECRET_ACCESS_KEY
    ? new S3Client({
        endpoint: ENDPOINT,
        region: REGION || 'auto',
        credentials: { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY },
        // Railway buckets are virtual-hosted; older ones need path-style (see the Credentials tab).
        forcePathStyle: BUCKET_FORCE_PATH_STYLE === 'true',
      })
    : null

export const bucketEnabled = client !== null

// Signatures are anchored to the start of a daily window so every request in that window
// gets the same URL — browsers and the bucket can then cache the media itself.
const WINDOW_MS = 24 * 60 * 60 * 1000
const EXPIRES_IN_S = 2 * 24 * 60 * 60

/** Uploads one object. Keys are content-hashed (`cms/<sha1-16>.<ext>`), so they are cached as immutable. */
export async function putMedia(key: string, body: Buffer, contentType: string, contentDisposition?: string) {
  if (!client) throw new Error('Bucket is not configured')
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      ContentDisposition: contentDisposition,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  )
}

/** Reads one object's bytes (the optimizer re-encodes files uploaded before it existed). */
export async function getMediaObject(key: string): Promise<Buffer> {
  if (!client) throw new Error('Bucket is not configured')
  const res = await client.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
  if (!res.Body) throw new Error(`Empty object: ${key}`)
  return Buffer.from(await res.Body.transformToByteArray())
}

export async function deleteMedia(key: string) {
  if (!client) throw new Error('Bucket is not configured')
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

export async function presignMedia(key: string): Promise<string> {
  if (!client) throw new Error('Bucket is not configured')
  const signingDate = new Date(Math.floor(Date.now() / WINDOW_MS) * WINDOW_MS)
  return getSignedUrl(client, new GetObjectCommand({ Bucket: BUCKET, Key: key }), {
    expiresIn: EXPIRES_IN_S,
    signingDate,
  })
}
