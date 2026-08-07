#!/usr/bin/env npx tsx
/**
 * OpenDating live client harness.
 *
 * A scriptable member: connects over WebSocket, completes NIP-42 auth, and
 * drives real service requests against a deployed relay. Two uses:
 *
 *   1. End-to-end verification without a device in the loop.
 *   2. Seeding a second member, because discovery only returns people who are
 *      mutually eligible — a single account always sees an empty deck, so one
 *      device alone cannot prove matching works.
 *
 * Usage:
 *   npx tsx scripts/od-client.ts seed   --name Ava --age 27 --gender woman --geohash dr5ru
 *   npx tsx scripts/od-client.ts verify --geohash dr5ru
 *   npx tsx scripts/od-client.ts seed   --key <hex>   # reuse an identity
 */
import WebSocket from 'ws';
import {
  generateKeypair,
  nip44Decrypt,
  signEvent,
  bytesToHex,
} from '../src/protocols/opendating/crypto/encryption.js';
import { buildGiftWrap } from '../src/protocols/opendating/crypto/gift-wrap.js';
import { createEnvelope } from '../src/protocols/opendating/protocol/envelope.js';
import { sha256 } from '@noble/hashes/sha256';

const RELAY_WS = process.env.OD_RELAY_WS ?? 'wss://opendating-relay.jonathang132298.workers.dev';
const RELAY_HTTP = process.env.OD_RELAY_HTTP ?? 'https://opendating-relay.jonathang132298.workers.dev';

const REQUEST_TIMEOUT_MS = 30_000;
/** NIP-59 backdates wraps up to two days; widen `since` or responses are filtered out. */
const BACKDATE_SEC = 2 * 24 * 60 * 60;

type Services = Record<string, { pubkey: string }>;

interface Envelope {
  protocol: string;
  version: string;
  type: string;
  request_id: string;
  created_at: number;
  payload: Record<string, unknown>;
}

function log(step: string, detail = ''): void {
  console.log(`  ${step}${detail ? ` — ${detail}` : ''}`);
}

async function fetchServices(): Promise<Services> {
  const res = await fetch(RELAY_HTTP, { headers: { Accept: 'application/nostr+json' } });
  const doc = (await res.json()) as any;
  const block = doc?.opendating;
  const services = block?.services ?? block?.roles;
  if (!services) throw new Error('Relay does not advertise OpenDating services');
  return services as Services;
}

class LiveClient {
  private ws: WebSocket | null = null;
  private pending = new Map<string, { resolve: (e: Envelope) => void; reject: (e: Error) => void; timer: NodeJS.Timeout }>();
  private services: Services = {};
  private authed = false;

  constructor(
    readonly privkey: string,
    readonly pubkey: string,
  ) {}

  async connect(): Promise<void> {
    this.services = await fetchServices();
    log('services', Object.keys(this.services).join(', '));

    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(RELAY_WS);
      this.ws = ws;
      const failTimer = setTimeout(() => reject(new Error('Connect timed out')), 20_000);

      ws.on('open', () => {
        clearTimeout(failTimer);
        resolve();
      });

      ws.on('error', (err) => {
        clearTimeout(failTimer);
        reject(err);
      });

      ws.on('message', (raw) => this.onMessage(raw.toString()));
    });
  }

  private onMessage(raw: string): void {
    let msg: any[];
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    if (msg[0] === 'AUTH' && typeof msg[1] === 'string') {
      this.sendAuth(msg[1]);
      return;
    }
    if (msg[0] === 'OK' && this.pendingAuthId && msg[1] === this.pendingAuthId) {
      this.authed = msg[2] === true;
      log('nip-42', this.authed ? 'authenticated' : `rejected: ${msg[3]}`);
      // Subscribe only once authenticated. The relay requires NIP-42 before
      // it will accept a REQ, so subscribing on open is silently dropped and
      // every response then arrives with nobody listening.
      if (this.authed) this.subscribeInbox();
      return;
    }
    if (msg[0] === 'CLOSED') {
      log('subscription closed', `${msg[1]}: ${msg[2]}`);
      return;
    }
    if (msg[0] === 'NOTICE') {
      log('notice', String(msg[1]));
      return;
    }
    if (msg[0] === 'EOSE') {
      log('eose', String(msg[1]));
      return;
    }
    if (msg[0] === 'EVENT' && msg[2]?.kind === 1059) {
      this.onGiftWrap(msg[2]);
    }
  }

  private pendingAuthId: string | null = null;

  private subscribeInbox(): void {
    this.ws?.send(JSON.stringify([
      'REQ',
      'inbox',
      {
        kinds: [1059],
        '#p': [this.pubkey],
        since: Math.floor(Date.now() / 1000) - BACKDATE_SEC - 3600,
      },
    ]));
    log('subscribed', 'gift-wrap inbox');
  }

  private sendAuth(challenge: string): void {
    const unsigned = {
      pubkey: this.pubkey,
      created_at: Math.floor(Date.now() / 1000),
      kind: 22242,
      tags: [
        ['relay', RELAY_WS],
        ['challenge', challenge],
      ],
      content: '',
    };
    const { id, sig } = signEvent(unsigned, this.privkey);
    this.pendingAuthId = id;
    this.ws?.send(JSON.stringify(['AUTH', { ...unsigned, id, sig }]));
  }

  /** Unwrap 1059 -> seal(13) -> rumor(78) and resolve the matching request. */
  private onGiftWrap(event: any): void {
    try {
      const sealJson = nip44Decrypt(event.content, this.privkey, event.pubkey);
      const seal = JSON.parse(sealJson);
      if (seal.kind !== 13) return;

      const rumorJson = nip44Decrypt(seal.content, this.privkey, seal.pubkey);
      const rumor = JSON.parse(rumorJson);

      if (rumor.kind === 14) {
        this.deliverDM(seal.pubkey, rumor.content);
        return;
      }
      if (rumor.kind !== 78) return;

      const envelope = JSON.parse(rumor.content) as Envelope;
      const waiting = this.pending.get(envelope.request_id);
      if (!waiting) return;

      clearTimeout(waiting.timer);
      this.pending.delete(envelope.request_id);

      if (envelope.type === 'system.error') {
        const p = envelope.payload as { code?: string; message?: string };
        waiting.reject(new Error(`${p?.code ?? 'error'}: ${p?.message ?? ''}`));
      } else {
        waiting.resolve(envelope);
      }
    } catch {
      // Not ours to read.
    }
  }

  async request(
    role: string,
    type: string,
    payload: Record<string, unknown> = {},
  ): Promise<Envelope> {
    const service = this.services[role];
    if (!service) throw new Error(`Relay does not run the "${role}" service`);

    const requestId = crypto.randomUUID();
    const envelope = createEnvelope(type, requestId, payload);
    const { giftWrap } = await buildGiftWrap(
      78,
      JSON.stringify(envelope),
      this.privkey,
      this.pubkey,
      service.pubkey,
    );

    const response = new Promise<Envelope>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error(`Timed out: ${type}`));
      }, REQUEST_TIMEOUT_MS);
      this.pending.set(requestId, { resolve, reject, timer });
    });

    this.ws?.send(JSON.stringify(['EVENT', giftWrap]));
    return response;
  }

  /**
   * Send a NIP-17 direct message. Two wraps, matching the mobile client: one
   * to the recipient, one to ourselves, since the recipient's copy is
   * encrypted to them alone and would otherwise be unrecoverable after a
   * restart.
   */
  async sendDM(recipientPubkey: string, text: string): Promise<void> {
    const rumor = JSON.stringify({
      text,
      to: recipientPubkey,
      created_at: Math.floor(Date.now() / 1000),
    });
    for (const audience of [recipientPubkey, this.pubkey]) {
      const { giftWrap } = await buildGiftWrap(
        14, rumor, this.privkey, this.pubkey, audience,
      );
      this.ws?.send(JSON.stringify(['EVENT', giftWrap]));
    }
  }

  /** Resolve when a kind-14 DM arrives, or reject on timeout. */
  waitForDM(timeoutMs = 25_000): Promise<{ from: string; text: string }> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('No DM received')), timeoutMs);
      this.dmWaiter = (msg) => {
        clearTimeout(timer);
        resolve(msg);
      };
    });
  }

  private dmWaiter: ((m: { from: string; text: string }) => void) | null = null;

  /** Called from onGiftWrap for kind-14 rumors. */
  private deliverDM(from: string, content: string): void {
    let text = content;
    try {
      const parsed = JSON.parse(content) as { text?: string };
      if (typeof parsed.text === 'string') text = parsed.text;
    } catch {
      /* bare text */
    }
    this.dmWaiter?.({ from, text });
  }

  close(): void {
    for (const [, p] of this.pending) clearTimeout(p.timer);
    this.ws?.close();
  }
}

// ---------------------------------------------------------------------------

function arg(name: string, fallback = ''): string {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : fallback;
}

/**
 * Two matched members exchange a NIP-17 message.
 * Messages are pure relay transport (kind 1059) — no service is involved —
 * so this checks the relay stores and forwards gift wraps between members.
 */
async function runDmTest(): Promise<void> {
  const { derivePublicKey } = await import('../src/protocols/opendating/crypto/service-signer.js');
  const aPriv = arg('from', '1111111111111111111111111111111111111111111111111111111111111111');
  const bPriv = arg('to', '2222222222222222222222222222222222222222222222222222222222222222');
  const a = new LiveClient(aPriv, derivePublicKey(aPriv));
  const b = new LiveClient(bPriv, derivePublicKey(bPriv));

  console.log(`  sender    ${a.pubkey.substring(0, 16)}…`);
  console.log(`  recipient ${b.pubkey.substring(0, 16)}…\n`);

  await Promise.all([a.connect(), b.connect()]);
  await new Promise((r) => setTimeout(r, 3000)); // NIP-42 + subscription

  const waiting = b.waitForDM();
  const text = `hello from the harness at ${new Date().toISOString()}`;
  log('sending DM', text.substring(0, 40) + '…');
  await a.sendDM(b.pubkey, text);

  try {
    const received = await waiting;
    log('received', `"${received.text.substring(0, 40)}…"`);
    log('sender verified', received.from === a.pubkey ? 'yes' : `NO (got ${received.from.substring(0, 12)}…)`);
    console.log('\n✅ NIP-17 delivery works\n');
  } catch (err) {
    console.error(`\n❌ ${(err as Error).message} — messaging is broken\n`);
    process.exitCode = 1;
  } finally {
    a.close();
    b.close();
    setTimeout(() => process.exit(process.exitCode ?? 0), 250);
  }
}

// ---------------------------------------------------------------------------
// Blossom upload
// ---------------------------------------------------------------------------

/** Minimal valid 1×1 white PNG — 68 bytes, valid image. */
const MINI_PNG = Uint8Array.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
  0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
  0x00, 0x00, 0x03, 0x00, 0x01, 0x1C, 0xF0, 0x02, 0x0F, 0x00, 0x00, 0x00,
  0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82,
]);

async function runUpload(): Promise<void> {
  const fs = await import('node:fs');
  const privkey = arg('key') || generateKeypair().privateKey;
  const { derivePublicKey } = await import('../src/protocols/opendating/crypto/service-signer.js');
  const pubkey = derivePublicKey(privkey);
  const filePath = arg('file', '');
  const shouldCleanup = process.argv.includes('--delete');

  const bytes = filePath
    ? fs.readFileSync(filePath)
    : MINI_PNG;
  const hash = bytesToHex(sha256(bytes));

  console.log(`\nOpenDating live client — upload${shouldCleanup ? ' (then delete)' : ''}`);
  console.log(`  pubkey  ${pubkey}`);
  console.log(`  file    ${filePath || '<embedded 1×1 PNG>'}`);
  console.log(`  size    ${bytes.length} bytes`);
  console.log(`  hash    ${hash}\n`);

  // Build kind-24242 authorization event (BUD-01)
  const now = Math.floor(Date.now() / 1000);
  const unsigned = {
    pubkey,
    created_at: now,
    kind: 24242,
    tags: [
      ['t', 'upload'],
      ['expiration', String(now + 300)],
      ['x', hash],
    ],
    content: '',
  };
  const { id, sig } = signEvent(unsigned as any, privkey);
  const authEvent = { ...unsigned, id, sig };
  const authHeader = `Nostr ${btoa(JSON.stringify(authEvent))}`;

  // Upload
  log('upload', 'PUT /upload');
  const putRes = await fetch(`${RELAY_HTTP}/upload`, {
    method: 'PUT',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'image/png',
      'Content-Length': String(bytes.length),
    },
    body: bytes,
  });

  if (putRes.status !== 201) {
    const errBody = await putRes.text().catch(() => '');
    throw new Error(`Upload failed: HTTP ${putRes.status} ${errBody}`);
  }

  const descriptor = await putRes.json() as { url: string; sha256: string; size: number; type: string };
  log('stored', `${descriptor.url} (${descriptor.size}B ${descriptor.type})`);

  // Verify retrieval
  log('fetch', `GET ${descriptor.url}`);
  const getRes = await fetch(descriptor.url);
  if (getRes.status !== 200) {
    throw new Error(`GET failed: HTTP ${getRes.status}`);
  }
  const fetched = new Uint8Array(await getRes.arrayBuffer());
  if (fetched.length !== bytes.length) {
    throw new Error(`Size mismatch: stored ${bytes.length}, fetched ${fetched.length}`);
  }
  for (let i = 0; i < bytes.length; i++) {
    if (fetched[i] !== bytes[i]) throw new Error(`Byte mismatch at offset ${i}`);
  }
  log('verified', `bytes match (${fetched.length}B)`);

  // Verify HEAD
  const headRes = await fetch(descriptor.url, { method: 'HEAD' });
  if (headRes.status !== 200) throw new Error(`HEAD failed: HTTP ${headRes.status}`);
  log('head', '200 OK');

  // Cleanup
  if (shouldCleanup) {
    const delUnsigned = {
      pubkey, created_at: now, kind: 24242,
      tags: [['t', 'delete'], ['expiration', String(now + 300)], ['x', hash]],
      content: '',
    };
    const delSigned = signEvent(delUnsigned as any, privkey);
    const delAuth = `Nostr ${btoa(JSON.stringify({ ...delUnsigned, id: delSigned.id, sig: delSigned.sig }))}`;
    const delRes = await fetch(`${RELAY_HTTP}/${hash}`, {
      method: 'DELETE', headers: { Authorization: delAuth },
    });
    if (delRes.status !== 200) {
      console.log(`  delete ${delRes.status} (non-fatal)`);
    } else {
      log('deleted', hash);
    }
  }

  console.log('\n✅ Blossom upload works\n');
}

async function main(): Promise<void> {
  const command = process.argv[2] ?? 'verify';

  if (command === 'dm') {
    console.log('\nOpenDating live client — dm\n');
    await runDmTest();
    return;
  }

  if (command === 'upload') {
    await runUpload();
    return;
  }

  const privkey = arg('key') || generateKeypair().privateKey;
  const { derivePublicKey } = await import('../src/protocols/opendating/crypto/service-signer.js');
  const pubkey = derivePublicKey(privkey);

  const name = arg('name', 'Test Member');
  const age = Number(arg('age', '28'));
  const gender = arg('gender', 'woman');
  const geohash = arg('geohash', 'dr5ru');

  console.log(`\nOpenDating live client — ${command}`);
  console.log(`  pubkey  ${pubkey}`);
  console.log(`  privkey ${privkey}   (reuse with --key)\n`);

  const client = new LiveClient(privkey, pubkey);
  await client.connect();
  // Give NIP-42 a moment; the relay sends its challenge on connect.
  await new Promise((r) => setTimeout(r, 2500));

  try {
    log('profile.create');
    const created = await client.request('profile', 'profile.create');
    log('  member', String((created.payload as any).member_id).substring(0, 16) + '…');

    log('profile.update', `${name}, ${age}, ${gender}`);
    await client.request('profile', 'profile.update', {
      profile: {
        display_name: name,
        age,
        gender,
        bio: `${name} is here to verify the discovery pipeline end to end.`,
        interests: ['coffee', 'hiking', 'testing'],
        relationship_intent: 'long_term',
        v: '0.1',
      },
    });
    log('  ok');

    log('discovery.update_location', geohash);
    await client.request('discovery', 'discovery.update_location', {
      geohash_prefix: geohash,
      country_code: 'US',
    });
    log('  ok');

    log('discovery.update_preferences');
    await client.request('discovery', 'discovery.update_preferences', {
      min_age: 18,
      max_age: 99,
      max_distance_km: 100,
      genders: ['woman', 'man', 'nonbinary', 'other'],
      intent: 'long_term',
    });
    log('  ok');

    if (command === 'verify') {
      log('discovery.get_candidates');
      const page = await client.request('discovery', 'discovery.get_candidates', { limit: 20 });
      const payload = page.payload as any;
      const candidates = payload.candidates ?? [];
      log('  candidates', String(candidates.length));
      log('  remaining_today', String(payload.remaining_today));

      for (const c of candidates.slice(0, 5)) {
        console.log(
          `      • ${c.profile?.display_name ?? '(no name)'}, ${c.profile?.age ?? '?'} — ` +
            `${c.distance_bucket} — pubkey ${String(c.pubkey).substring(0, 12)}… ` +
            `grant ${String(c.candidate_grant).substring(0, 8)}…`,
        );
      }

      if (candidates.length > 0) {
        const target = candidates[0];
        log('intent.like', target.profile?.display_name ?? target.pubkey.substring(0, 12));
        const liked = await client.request('matcher', 'intent.like', {
          target_pubkey: target.pubkey,
          candidate_grant: target.candidate_grant,
        });
        log('  match_created', String((liked.payload as any).match_created));
      }

      log('match.list');
      const matches = await client.request('matcher', 'match.list');
      log('  matches', String(((matches.payload as any).matches ?? []).length));
    }

    console.log('\n✅ Completed\n');
  } catch (err) {
    console.error(`\n❌ ${(err as Error).message}\n`);
    process.exitCode = 1;
  } finally {
    client.close();
    setTimeout(() => process.exit(process.exitCode ?? 0), 250);
  }
}

void main();
