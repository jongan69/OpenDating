/**
 * Blossom media server (BUD-01 / BUD-02) backed by Cloudflare R2.
 *
 * Blossom is an HTTP protocol; R2 is the storage behind it. Implementing the
 * endpoints here rather than depending on a third-party media host keeps
 * everything on one vendor while staying protocol-native, so a member could
 * point at a different Blossom server later without the app changing.
 *
 * Blobs are content-addressed by sha256:
 *   PUT    /upload        store a blob
 *   GET    /<sha256>      fetch it
 *   HEAD   /<sha256>      check existence
 *   GET    /list/<pubkey> list a member's blobs
 *   DELETE /<sha256>      remove one
 *
 * Privacy note: a blob URL is unguessable (256-bit hash) but not secret —
 * anyone holding the URL can fetch it, exactly as with any CDN-backed photo.
 * Profile photos are shown to candidates by design, so this is the intended
 * boundary; nothing private should ever be stored here.
 */
import { bytesToHex } from '../opendating/crypto/encryption.js';
import { sha256 } from '@noble/hashes/sha256';
import { parseAuthHeader, verifyAuth } from './auth.js';

/** Hard ceiling on a single blob. Profile photos are far smaller. */
const MAX_BLOB_BYTES = 8 * 1024 * 1024;

/**
 * Only image types are accepted. A media host that will serve anything is a
 * malware host, and this one exists purely for profile photos.
 */
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
]);

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
};

export interface BlossomEnv {
  MEDIA_BUCKET?: R2Bucket;
  RELAY_DATABASE?: D1Database;
}

export interface BlobDescriptor {
  url: string;
  sha256: string;
  size: number;
  type: string;
  uploaded: number;
}

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      ...extra,
    },
  });
}

function error(message: string, status: number): Response {
  // BUD-01 puts the reason in X-Reason so clients can surface it.
  return json({ message }, status, { 'X-Reason': message });
}

function blobUrl(origin: string, hash: string, type: string): string {
  const ext = EXTENSIONS[type];
  return ext ? `${origin}/${hash}.${ext}` : `${origin}/${hash}`;
}

/** True when the path looks like a blob request (64 hex, optional extension). */
export function parseBlobPath(pathname: string): string | null {
  const match = /^\/([0-9a-f]{64})(?:\.[a-z0-9]+)?$/i.exec(pathname);
  return match ? match[1].toLowerCase() : null;
}

export function isBlossomPath(pathname: string): boolean {
  return (
    pathname === '/upload' ||
    pathname.startsWith('/list/') ||
    parseBlobPath(pathname) !== null
  );
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export async function handleBlossomRequest(
  request: Request,
  env: BlossomEnv,
): Promise<Response> {
  const url = new URL(request.url);
  const bucket = env.MEDIA_BUCKET;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  if (!bucket) {
    // The binding is absent, so media is simply not deployed here. Say so
    // plainly rather than 500-ing — clients treat it as "photos unavailable".
    return error('Media storage is not configured on this relay', 503);
  }

  if (url.pathname === '/upload' && request.method === 'PUT') {
    return handleUpload(request, bucket, url.origin);
  }

  if (url.pathname.startsWith('/list/') && request.method === 'GET') {
    return handleList(url, bucket);
  }

  const hash = parseBlobPath(url.pathname);
  if (hash) {
    if (request.method === 'GET' || request.method === 'HEAD') {
      return handleGet(hash, bucket, request.method === 'HEAD');
    }
    if (request.method === 'DELETE') {
      return handleDelete(request, hash, bucket);
    }
  }

  return error('Not found', 404);
}

async function handleUpload(
  request: Request,
  bucket: R2Bucket,
  origin: string,
): Promise<Response> {
  const now = Math.floor(Date.now() / 1000);

  const auth = parseAuthHeader(request.headers.get('Authorization'));
  const authResult = verifyAuth(auth, 'upload', now);
  if (!authResult.ok || !authResult.pubkey) {
    return error(authResult.error ?? 'Unauthorized', 401);
  }

  const declaredType = request.headers.get('Content-Type') ?? '';
  const type = declaredType.split(';')[0].trim().toLowerCase();
  if (!ALLOWED_TYPES.has(type)) {
    return error(`Unsupported media type: ${type || 'unknown'}`, 415);
  }

  const declaredLength = Number(request.headers.get('Content-Length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BLOB_BYTES) {
    return error(`Blob exceeds ${MAX_BLOB_BYTES} bytes`, 413);
  }

  const body = new Uint8Array(await request.arrayBuffer());
  if (body.byteLength === 0) return error('Empty body', 400);
  // Re-check after reading: Content-Length is client-supplied and may lie.
  if (body.byteLength > MAX_BLOB_BYTES) {
    return error(`Blob exceeds ${MAX_BLOB_BYTES} bytes`, 413);
  }

  // Content addressing is computed here, never trusted from the client.
  const hash = bytesToHex(sha256(body));

  // The authorization's x tag must match what was actually sent, so an
  // upload grant cannot be redirected to different content.
  const recheck = verifyAuth(auth, 'upload', now, hash);
  if (!recheck.ok) {
    return error(recheck.error ?? 'Authorization does not cover this blob', 401);
  }

  const existing = await bucket.head(hash);
  if (!existing) {
    await bucket.put(hash, body, {
      httpMetadata: {
        contentType: type,
        // Content-addressed, so a blob at a given URL can never change.
        cacheControl: 'public, max-age=31536000, immutable',
      },
      customMetadata: {
        uploader: authResult.pubkey,
        uploaded: String(now),
      },
    });
  }

  const descriptor: BlobDescriptor = {
    url: blobUrl(origin, hash, type),
    sha256: hash,
    size: body.byteLength,
    type,
    uploaded: now,
  };
  return json(descriptor, 201);
}

async function handleGet(
  hash: string,
  bucket: R2Bucket,
  headOnly: boolean,
): Promise<Response> {
  const object = headOnly ? await bucket.head(hash) : await bucket.get(hash);
  if (!object) return error('Blob not found', 404);

  const headers = new Headers({
    'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
    'Content-Length': String(object.size),
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Access-Control-Allow-Origin': '*',
    ETag: object.httpEtag,
  });

  if (headOnly) return new Response(null, { status: 200, headers });
  return new Response((object as R2ObjectBody).body, { status: 200, headers });
}

async function handleList(url: URL, bucket: R2Bucket): Promise<Response> {
  const pubkey = url.pathname.slice('/list/'.length).toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(pubkey)) return error('Malformed pubkey', 400);

  // R2 has no secondary index, so this scans and filters on uploader. Fine at
  // profile-photo volume; if media grows, move the index into D1.
  const listed = await bucket.list({ limit: 1000 });
  const blobs: BlobDescriptor[] = [];

  for (const entry of listed.objects) {
    // `list` omits custom metadata on some runtimes, so read each object's
    // head rather than trusting the listing to carry the uploader.
    const object = await bucket.head(entry.key);
    if (object?.customMetadata?.uploader !== pubkey) continue;

    const type = object.httpMetadata?.contentType ?? 'application/octet-stream';
    blobs.push({
      url: blobUrl(url.origin, object.key, type),
      sha256: object.key,
      size: object.size,
      type,
      uploaded: Number(object.customMetadata?.uploaded ?? 0),
    });
  }

  return json(blobs);
}

async function handleDelete(
  request: Request,
  hash: string,
  bucket: R2Bucket,
): Promise<Response> {
  const now = Math.floor(Date.now() / 1000);

  const auth = parseAuthHeader(request.headers.get('Authorization'));
  const authResult = verifyAuth(auth, 'delete', now, hash);
  if (!authResult.ok || !authResult.pubkey) {
    return error(authResult.error ?? 'Unauthorized', 401);
  }

  const object = await bucket.head(hash);
  if (!object) return error('Blob not found', 404);

  // Only the uploader may delete. Without this any member could erase another
  // member's photos, since the hash is public.
  if (object.customMetadata?.uploader !== authResult.pubkey) {
    return error('Only the uploader may delete this blob', 403);
  }

  await bucket.delete(hash);
  return json({ message: 'Deleted' });
}
