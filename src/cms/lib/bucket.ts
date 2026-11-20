import 'server-only'
import {
  AbortMultipartUploadCommand, CompleteMultipartUploadCommand, CreateMultipartUploadCommand, DeleteObjectCommand, GetObjectCommand,
  HeadObjectCommand, ListMultipartUploadsCommand, ListPartsCommand, PutObjectCommand, S3Client, UploadPartCommand,
} from '@aws-sdk/client-s3'
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

/* ── multipart uploads (large videos, sent by the browser in parts: lib/chunked-upload.ts) ── */

const need = () => { if (!client) throw new Error('Bucket is not configured'); return client }

/** Starts a multipart upload; the object does not exist until completeUpload. Returns its UploadId. */
export async function createUpload(key: string, contentType: string, contentDisposition: string) {
  const res = await need().send(new CreateMultipartUploadCommand({
    Bucket: BUCKET, Key: key, ContentType: contentType, ContentDisposition: contentDisposition,
    CacheControl: 'public, max-age=31536000, immutable',
  }))
  if (!res.UploadId) throw new Error('No upload id')
  return res.UploadId
}

export async function uploadPart(key: string, uploadId: string, partNumber: number, body: Buffer) {
  await need().send(new UploadPartCommand({ Bucket: BUCKET, Key: key, UploadId: uploadId, PartNumber: partNumber, Body: body, ContentLength: body.length }))
}

/** The parts the bucket holds for an upload (paged), as the bucket reports them. */
export async function listParts(key: string, uploadId: string) {
  const parts: { PartNumber: number; ETag: string; Size: number }[] = []
  let marker: string | undefined
  for (;;) {
    const res = await need().send(new ListPartsCommand({ Bucket: BUCKET, Key: key, UploadId: uploadId, PartNumberMarker: marker }))
    for (const p of res.Parts ?? []) if (p.PartNumber && p.ETag) parts.push({ PartNumber: p.PartNumber, ETag: p.ETag, Size: p.Size ?? 0 })
    if (!res.IsTruncated || !res.NextPartNumberMarker) break
    marker = res.NextPartNumberMarker
  }
  return parts
}

export async function completeUpload(key: string, uploadId: string, parts: { PartNumber: number; ETag: string }[]) {
  await need().send(new CompleteMultipartUploadCommand({ Bucket: BUCKET, Key: key, UploadId: uploadId, MultipartUpload: { Parts: parts } }))
}

export async function abortUpload(key: string, uploadId: string) {
  await need().send(new AbortMultipartUploadCommand({ Bucket: BUCKET, Key: key, UploadId: uploadId }))
}

/** An object's size, or null when there is no such object. */
export async function headMedia(key: string): Promise<number | null> {
  try {
    const res = await need().send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }))
    return res.ContentLength ?? 0
  } catch (error) {
    const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode
    if (status === 404 || (error as Error).name === 'NotFound' || (error as Error).name === 'NoSuchKey') return null
    throw error
  }
}

/** Aborts the multipart uploads under `prefix` started before `before` (abandoned: their tickets expired long ago). */
export async function abortStaleUploads(prefix: string, before: Date) {
  let keyMarker: string | undefined
  let uploadIdMarker: string | undefined
  let aborted = 0
  for (;;) {
    const res = await need().send(new ListMultipartUploadsCommand({ Bucket: BUCKET, Prefix: prefix, KeyMarker: keyMarker, UploadIdMarker: uploadIdMarker }))
    for (const u of res.Uploads ?? []) {
      if (u.Key && u.UploadId && u.Initiated && u.Initiated < before) {
        await abortUpload(u.Key, u.UploadId).catch(() => undefined)
        aborted++
      }
    }
    keyMarker = res.NextKeyMarker
    uploadIdMarker = res.NextUploadIdMarker
    if (!res.IsTruncated || (!keyMarker && !uploadIdMarker)) break
  }
  return aborted
}

/** Whether the bucket says a multipart upload is gone (completed or aborted). */
export const isNoSuchUpload = (error: unknown) => (error as Error | undefined)?.name === 'NoSuchUpload' || (error as { Code?: string } | undefined)?.Code === 'NoSuchUpload'

export async function presignMedia(key: string): Promise<string> {
  if (!client) throw new Error('Bucket is not configured')
  const signingDate = new Date(Math.floor(Date.now() / WINDOW_MS) * WINDOW_MS)
  return getSignedUrl(client, new GetObjectCommand({ Bucket: BUCKET, Key: key }), {
    expiresIn: EXPIRES_IN_S,
    signingDate,
  })
}
