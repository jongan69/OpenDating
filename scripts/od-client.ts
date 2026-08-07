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
} from '../src/protocols/opendating/crypto/encryption.js';
import { buildGiftWrap } from '../src/protocols/opendating/crypto/gift-wrap.js';
import { createEnvelope } from '../src/protocols/opendating/protocol/envelope.js';

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

async function main(): Promise<void> {
  const command = process.argv[2] ?? 'verify';

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
