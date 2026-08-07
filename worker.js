var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/types.ts
var _RateLimiter, RateLimiter;
var init_types = __esm({
  "src/types.ts"() {
    "use strict";
    _RateLimiter = class _RateLimiter {
      constructor(rate, capacity) {
        this.tokens = capacity;
        this.lastRefillTime = Date.now();
        this.capacity = capacity;
        this.fillRate = rate;
      }
      removeToken() {
        this.refill();
        if (this.tokens < 1) {
          return false;
        }
        this.tokens -= 1;
        return true;
      }
      refill() {
        const now = Date.now();
        const elapsedTime = now - this.lastRefillTime;
        const tokensToAdd = Math.floor(elapsedTime * this.fillRate);
        this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
        this.lastRefillTime = now;
      }
    };
    __name(_RateLimiter, "RateLimiter");
    RateLimiter = _RateLimiter;
  }
});

// src/config.ts
var config_exports = {};
__export(config_exports, {
  AUTH_REQUIRED: () => AUTH_REQUIRED,
  AUTH_TIMEOUT_MS: () => AUTH_TIMEOUT_MS,
  DB_PRUNE_BATCH_SIZE: () => DB_PRUNE_BATCH_SIZE,
  DB_PRUNE_TARGET_GB: () => DB_PRUNE_TARGET_GB,
  DB_PRUNING_ENABLED: () => DB_PRUNING_ENABLED,
  DB_SIZE_THRESHOLD_GB: () => DB_SIZE_THRESHOLD_GB,
  PAY_TO_RELAY_ENABLED: () => PAY_TO_RELAY_ENABLED,
  PUBKEY_RATE_LIMIT: () => PUBKEY_RATE_LIMIT,
  RELAY_ACCESS_PRICE_SATS: () => RELAY_ACCESS_PRICE_SATS,
  REQ_RATE_LIMIT: () => REQ_RATE_LIMIT,
  allowedEventKinds: () => allowedEventKinds,
  allowedNip05Domains: () => allowedNip05Domains,
  allowedPubkeys: () => allowedPubkeys,
  allowedTags: () => allowedTags,
  antiSpamKinds: () => antiSpamKinds,
  blockedContent: () => blockedContent,
  blockedEventKinds: () => blockedEventKinds,
  blockedNip05Domains: () => blockedNip05Domains,
  blockedPubkeys: () => blockedPubkeys,
  blockedTags: () => blockedTags,
  checkValidNip05: () => checkValidNip05,
  containsBlockedContent: () => containsBlockedContent,
  enableAntiSpam: () => enableAntiSpam,
  enableGlobalDuplicateCheck: () => enableGlobalDuplicateCheck,
  excludedRateLimitKinds: () => excludedRateLimitKinds,
  isEventKindAllowed: () => isEventKindAllowed,
  isPubkeyAllowed: () => isPubkeyAllowed,
  isTagAllowed: () => isTagAllowed,
  nip05Users: () => nip05Users,
  pruneProtectedKinds: () => pruneProtectedKinds,
  relayInfo: () => relayInfo,
  relayNpub: () => relayNpub
});
function isPubkeyAllowed(pubkey) {
  if (allowedPubkeys.size > 0 && !allowedPubkeys.has(pubkey)) {
    return false;
  }
  return !blockedPubkeys.has(pubkey);
}
function isEventKindAllowed(kind) {
  if (allowedEventKinds.size > 0 && !allowedEventKinds.has(kind)) {
    return false;
  }
  return !blockedEventKinds.has(kind);
}
function containsBlockedContent(event) {
  const lowercaseContent = (event.content || "").toLowerCase();
  const lowercaseTags = event.tags.map((tag) => tag.join("").toLowerCase());
  for (const blocked of blockedContent) {
    const blockedLower = blocked.toLowerCase();
    if (lowercaseContent.includes(blockedLower) || lowercaseTags.some((tag) => tag.includes(blockedLower))) {
      return true;
    }
  }
  return false;
}
function isTagAllowed(tag) {
  if (allowedTags.size > 0 && !allowedTags.has(tag)) {
    return false;
  }
  return !blockedTags.has(tag);
}
var relayNpub, PAY_TO_RELAY_ENABLED, RELAY_ACCESS_PRICE_SATS, AUTH_REQUIRED, AUTH_TIMEOUT_MS, relayInfo, nip05Users, enableAntiSpam, enableGlobalDuplicateCheck, antiSpamKinds, blockedPubkeys, allowedPubkeys, blockedEventKinds, allowedEventKinds, blockedContent, checkValidNip05, blockedNip05Domains, allowedNip05Domains, blockedTags, allowedTags, PUBKEY_RATE_LIMIT, REQ_RATE_LIMIT, excludedRateLimitKinds, DB_PRUNING_ENABLED, DB_SIZE_THRESHOLD_GB, DB_PRUNE_BATCH_SIZE, DB_PRUNE_TARGET_GB, pruneProtectedKinds;
var init_config = __esm({
  "src/config.ts"() {
    "use strict";
    relayNpub = "npub16jdfqgazrkapk0yrqm9rdxlnys7ck39c7zmdzxtxqlmmpxg04r0sd733sv";
    PAY_TO_RELAY_ENABLED = false;
    RELAY_ACCESS_PRICE_SATS = 212121;
    AUTH_REQUIRED = true;
    AUTH_TIMEOUT_MS = 6e4;
    relayInfo = {
      name: "OpenDating Reference Relay",
      description: "OpenDating v0.1 \u2014 private dating protocol on Nostr",
      pubkey: "991dad84451dc04e5dbbf77037a96e89f9d5f9b8e6678f403bc10ebbcfa9bbbe",
      contact: "jonathang132298@gmail.com",
      // Only NIPs verified as implemented
      supported_nips: [1, 2, 5, 9, 11, 12, 15, 16, 17, 20, 33, 42, 44, 56, 59, 62, 78],
      software: "https://github.com/jongan69/OpenDating",
      version: "0.1.0",
      icon: "https://raw.githubusercontent.com/jongan69/OpenDating/main/images/lockup-coral.png",
      // Optional fields (uncomment as needed):
      // banner: "https://example.com/banner.jpg",
      // privacy_policy: "https://example.com/privacy-policy.html",
      // terms_of_service: "https://example.com/terms.html",
      // Relay limitations
      limitation: {
        // max_message_length: 524288, // 512KB
        // max_subscriptions: 300,
        // max_limit: 10000,
        // max_subid_length: 256,
        // max_event_tags: 2000,
        // max_content_length: 70000,
        // min_pow_difficulty: 0,
        auth_required: AUTH_REQUIRED,
        payment_required: PAY_TO_RELAY_ENABLED,
        restricted_writes: PAY_TO_RELAY_ENABLED
        // created_at_lower_limit: 0,
        // created_at_upper_limit: 2147483647,
        // default_limit: 10000
      }
      // Event retention policies (uncomment and configure as needed):
      // retention: [
      //   { kinds: [0, 1, [5, 7], [40, 49]], time: 3600 },
      //   { kinds: [[40000, 49999]], time: 100 },
      //   { kinds: [[30000, 39999]], count: 1000 },
      //   { time: 3600, count: 10000 }
      // ],
      // Content limitations by country (uncomment as needed):
      // relay_countries: ["*"], // Use ["US", "CA", "EU"] for specific countries, ["*"] for global
      // Community preferences (uncomment as needed):
      // language_tags: ["en", "en-419"], // IETF language tags, use ["*"] for all languages
      // tags: ["sfw-only", "bitcoin-only", "anime"], // Community/content tags
      // posting_policy: "https://example.com/posting-policy.html",
      // Payment configuration (added dynamically in handleRelayInfoRequest if PAY_TO_RELAY_ENABLED):
      // payments_url: "https://my-relay/payments",
      // fees: {
      //   admission: [{ amount: 1000000, unit: "msats" }],
      //   subscription: [{ amount: 5000000, unit: "msats", period: 2592000 }],
      //   publication: [{ kinds: [4], amount: 100, unit: "msats" }],
      // }
    };
    nip05Users = {
      "Luxas": "d49a9023a21dba1b3c8306ca369bf3243d8b44b8f0b6d1196607f7b0990fa8df"
      // ... more NIP-05 verified users
    };
    enableAntiSpam = false;
    enableGlobalDuplicateCheck = false;
    antiSpamKinds = /* @__PURE__ */ new Set([
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      16,
      17,
      40,
      41,
      42,
      43,
      44,
      64,
      818,
      1021,
      1022,
      1040,
      1059,
      1063,
      1311,
      1617,
      1621,
      1622,
      1630,
      1633,
      1971,
      1984,
      1985,
      1986,
      1987,
      2003,
      2004,
      2022,
      4550,
      5e3,
      5999,
      6e3,
      6999,
      7e3,
      9e3,
      9030,
      9041,
      9467,
      9734,
      9735,
      9802,
      1e4,
      10001,
      10002,
      10003,
      10004,
      10005,
      10006,
      10007,
      10009,
      10015,
      10030,
      10050,
      10063,
      10096,
      13194,
      21e3,
      22242,
      23194,
      23195,
      24133,
      24242,
      27235,
      3e4,
      30001,
      30002,
      30003,
      30004,
      30005,
      30007,
      30008,
      30009,
      30015,
      30017,
      30018,
      30019,
      30020,
      30023,
      30024,
      30030,
      30040,
      30041,
      30063,
      30078,
      30311,
      30315,
      30402,
      30403,
      30617,
      30618,
      30818,
      30819,
      31890,
      31922,
      31923,
      31924,
      31925,
      31989,
      31990,
      34235,
      34236,
      34237,
      34550,
      39e3,
      39001,
      39002,
      39003,
      39004,
      39005,
      39006,
      39007,
      39008,
      39009
      // Add other kinds you want to check for duplicates
    ]);
    blockedPubkeys = /* @__PURE__ */ new Set([
      "3c7f5948b5d80900046a67d8e3bf4971d6cba013abece1dd542eca223cf3dd3f",
      "fed5c0c3c8fe8f51629a0b39951acdf040fd40f53a327ae79ee69991176ba058",
      "e810fafa1e89cdf80cced8e013938e87e21b699b24c8570537be92aec4b12c18",
      "05aee96dd41429a3ae97a9dac4dfc6867fdfacebca3f3bdc051e5004b0751f01",
      "53a756bb596055219d93e888f71d936ec6c47d960320476c955efd8941af4362"
    ]);
    allowedPubkeys = /* @__PURE__ */ new Set([
      // ... pubkeys that are explicitly allowed
    ]);
    blockedEventKinds = /* @__PURE__ */ new Set([
      1064
    ]);
    allowedEventKinds = /* @__PURE__ */ new Set([
      // ... kinds that are explicitly allowed
    ]);
    blockedContent = /* @__PURE__ */ new Set([
      "~~ hello world! ~~"
      // ... more blocked content
    ]);
    checkValidNip05 = false;
    blockedNip05Domains = /* @__PURE__ */ new Set([
      // Add domains that are explicitly blocked
      // "primal.net"
    ]);
    allowedNip05Domains = /* @__PURE__ */ new Set([
      // Add domains that are explicitly allowed
      // Leave empty to allow all domains (unless blocked)
    ]);
    blockedTags = /* @__PURE__ */ new Set([
      // ... tags that are explicitly blocked
    ]);
    allowedTags = /* @__PURE__ */ new Set([
      // "p", "e", "t"
      // ... tags that are explicitly allowed
    ]);
    PUBKEY_RATE_LIMIT = { rate: 10 / 6e4, capacity: 10 };
    REQ_RATE_LIMIT = { rate: 50 / 6e4, capacity: 50 };
    excludedRateLimitKinds = /* @__PURE__ */ new Set([]);
    DB_PRUNING_ENABLED = true;
    DB_SIZE_THRESHOLD_GB = 4;
    DB_PRUNE_BATCH_SIZE = 1e3;
    DB_PRUNE_TARGET_GB = 3.5;
    pruneProtectedKinds = /* @__PURE__ */ new Set([
      0,
      // Profile metadata
      3,
      // Contact list / follows
      10002
      // Relay list metadata
    ]);
    __name(isPubkeyAllowed, "isPubkeyAllowed");
    __name(isEventKindAllowed, "isEventKindAllowed");
    __name(containsBlockedContent, "containsBlockedContent");
    __name(isTagAllowed, "isTagAllowed");
  }
});

// node_modules/@noble/hashes/esm/crypto.js
var crypto2;
var init_crypto = __esm({
  "node_modules/@noble/hashes/esm/crypto.js"() {
    crypto2 = typeof globalThis === "object" && "crypto" in globalThis ? globalThis.crypto : void 0;
  }
});

// node_modules/@noble/hashes/esm/utils.js
function isBytes(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function anumber(n) {
  if (!Number.isSafeInteger(n) || n < 0)
    throw new Error("positive integer expected, got " + n);
}
function abytes(b, ...lengths) {
  if (!isBytes(b))
    throw new Error("Uint8Array expected");
  if (lengths.length > 0 && !lengths.includes(b.length))
    throw new Error("Uint8Array expected of length " + lengths + ", got length=" + b.length);
}
function ahash(h) {
  if (typeof h !== "function" || typeof h.create !== "function")
    throw new Error("Hash should be wrapped by utils.createHasher");
  anumber(h.outputLen);
  anumber(h.blockLen);
}
function aexists(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (checkFinished && instance.finished)
    throw new Error("Hash#digest() has already been called");
}
function aoutput(out, instance) {
  abytes(out);
  const min = instance.outputLen;
  if (out.length < min) {
    throw new Error("digestInto() expects output buffer of length at least " + min);
  }
}
function clean(...arrays) {
  for (let i = 0; i < arrays.length; i++) {
    arrays[i].fill(0);
  }
}
function createView(arr) {
  return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
function rotr(word, shift) {
  return word << 32 - shift | word >>> shift;
}
function bytesToHex(bytes) {
  abytes(bytes);
  if (hasHexBuiltin)
    return bytes.toHex();
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += hexes[bytes[i]];
  }
  return hex;
}
function asciiToBase16(ch) {
  if (ch >= asciis._0 && ch <= asciis._9)
    return ch - asciis._0;
  if (ch >= asciis.A && ch <= asciis.F)
    return ch - (asciis.A - 10);
  if (ch >= asciis.a && ch <= asciis.f)
    return ch - (asciis.a - 10);
  return;
}
function hexToBytes(hex) {
  if (typeof hex !== "string")
    throw new Error("hex string expected, got " + typeof hex);
  if (hasHexBuiltin)
    return Uint8Array.fromHex(hex);
  const hl = hex.length;
  const al = hl / 2;
  if (hl % 2)
    throw new Error("hex string expected, got unpadded hex of length " + hl);
  const array = new Uint8Array(al);
  for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
    const n1 = asciiToBase16(hex.charCodeAt(hi));
    const n2 = asciiToBase16(hex.charCodeAt(hi + 1));
    if (n1 === void 0 || n2 === void 0) {
      const char = hex[hi] + hex[hi + 1];
      throw new Error('hex string expected, got non-hex character "' + char + '" at index ' + hi);
    }
    array[ai] = n1 * 16 + n2;
  }
  return array;
}
function utf8ToBytes(str) {
  if (typeof str !== "string")
    throw new Error("string expected");
  return new Uint8Array(new TextEncoder().encode(str));
}
function toBytes(data) {
  if (typeof data === "string")
    data = utf8ToBytes(data);
  abytes(data);
  return data;
}
function concatBytes(...arrays) {
  let sum = 0;
  for (let i = 0; i < arrays.length; i++) {
    const a = arrays[i];
    abytes(a);
    sum += a.length;
  }
  const res = new Uint8Array(sum);
  for (let i = 0, pad2 = 0; i < arrays.length; i++) {
    const a = arrays[i];
    res.set(a, pad2);
    pad2 += a.length;
  }
  return res;
}
function createHasher(hashCons) {
  const hashC = /* @__PURE__ */ __name((msg) => hashCons().update(toBytes(msg)).digest(), "hashC");
  const tmp = hashCons();
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.create = () => hashCons();
  return hashC;
}
function randomBytes(bytesLength = 32) {
  if (crypto2 && typeof crypto2.getRandomValues === "function") {
    return crypto2.getRandomValues(new Uint8Array(bytesLength));
  }
  if (crypto2 && typeof crypto2.randomBytes === "function") {
    return Uint8Array.from(crypto2.randomBytes(bytesLength));
  }
  throw new Error("crypto.getRandomValues must be defined");
}
var hasHexBuiltin, hexes, asciis, _Hash, Hash;
var init_utils = __esm({
  "node_modules/@noble/hashes/esm/utils.js"() {
    init_crypto();
    __name(isBytes, "isBytes");
    __name(anumber, "anumber");
    __name(abytes, "abytes");
    __name(ahash, "ahash");
    __name(aexists, "aexists");
    __name(aoutput, "aoutput");
    __name(clean, "clean");
    __name(createView, "createView");
    __name(rotr, "rotr");
    hasHexBuiltin = /* @__PURE__ */ (() => (
      // @ts-ignore
      typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function"
    ))();
    hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
    __name(bytesToHex, "bytesToHex");
    asciis = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
    __name(asciiToBase16, "asciiToBase16");
    __name(hexToBytes, "hexToBytes");
    __name(utf8ToBytes, "utf8ToBytes");
    __name(toBytes, "toBytes");
    __name(concatBytes, "concatBytes");
    _Hash = class _Hash {
    };
    __name(_Hash, "Hash");
    Hash = _Hash;
    __name(createHasher, "createHasher");
    __name(randomBytes, "randomBytes");
  }
});

// node_modules/@noble/hashes/esm/_md.js
function setBigUint64(view, byteOffset, value, isLE2) {
  if (typeof view.setBigUint64 === "function")
    return view.setBigUint64(byteOffset, value, isLE2);
  const _32n = BigInt(32);
  const _u32_max = BigInt(4294967295);
  const wh = Number(value >> _32n & _u32_max);
  const wl = Number(value & _u32_max);
  const h = isLE2 ? 4 : 0;
  const l = isLE2 ? 0 : 4;
  view.setUint32(byteOffset + h, wh, isLE2);
  view.setUint32(byteOffset + l, wl, isLE2);
}
function Chi(a, b, c) {
  return a & b ^ ~a & c;
}
function Maj(a, b, c) {
  return a & b ^ a & c ^ b & c;
}
var _HashMD, HashMD, SHA256_IV;
var init_md = __esm({
  "node_modules/@noble/hashes/esm/_md.js"() {
    init_utils();
    __name(setBigUint64, "setBigUint64");
    __name(Chi, "Chi");
    __name(Maj, "Maj");
    _HashMD = class _HashMD extends Hash {
      constructor(blockLen, outputLen, padOffset, isLE2) {
        super();
        this.finished = false;
        this.length = 0;
        this.pos = 0;
        this.destroyed = false;
        this.blockLen = blockLen;
        this.outputLen = outputLen;
        this.padOffset = padOffset;
        this.isLE = isLE2;
        this.buffer = new Uint8Array(blockLen);
        this.view = createView(this.buffer);
      }
      update(data) {
        aexists(this);
        data = toBytes(data);
        abytes(data);
        const { view, buffer, blockLen } = this;
        const len = data.length;
        for (let pos = 0; pos < len; ) {
          const take = Math.min(blockLen - this.pos, len - pos);
          if (take === blockLen) {
            const dataView = createView(data);
            for (; blockLen <= len - pos; pos += blockLen)
              this.process(dataView, pos);
            continue;
          }
          buffer.set(data.subarray(pos, pos + take), this.pos);
          this.pos += take;
          pos += take;
          if (this.pos === blockLen) {
            this.process(view, 0);
            this.pos = 0;
          }
        }
        this.length += data.length;
        this.roundClean();
        return this;
      }
      digestInto(out) {
        aexists(this);
        aoutput(out, this);
        this.finished = true;
        const { buffer, view, blockLen, isLE: isLE2 } = this;
        let { pos } = this;
        buffer[pos++] = 128;
        clean(this.buffer.subarray(pos));
        if (this.padOffset > blockLen - pos) {
          this.process(view, 0);
          pos = 0;
        }
        for (let i = pos; i < blockLen; i++)
          buffer[i] = 0;
        setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE2);
        this.process(view, 0);
        const oview = createView(out);
        const len = this.outputLen;
        if (len % 4)
          throw new Error("_sha2: outputLen should be aligned to 32bit");
        const outLen = len / 4;
        const state = this.get();
        if (outLen > state.length)
          throw new Error("_sha2: outputLen bigger than state");
        for (let i = 0; i < outLen; i++)
          oview.setUint32(4 * i, state[i], isLE2);
      }
      digest() {
        const { buffer, outputLen } = this;
        this.digestInto(buffer);
        const res = buffer.slice(0, outputLen);
        this.destroy();
        return res;
      }
      _cloneInto(to) {
        to || (to = new this.constructor());
        to.set(...this.get());
        const { blockLen, buffer, length, finished, destroyed, pos } = this;
        to.destroyed = destroyed;
        to.finished = finished;
        to.length = length;
        to.pos = pos;
        if (length % blockLen)
          to.buffer.set(buffer);
        return to;
      }
      clone() {
        return this._cloneInto();
      }
    };
    __name(_HashMD, "HashMD");
    HashMD = _HashMD;
    SHA256_IV = /* @__PURE__ */ Uint32Array.from([
      1779033703,
      3144134277,
      1013904242,
      2773480762,
      1359893119,
      2600822924,
      528734635,
      1541459225
    ]);
  }
});

// node_modules/@noble/hashes/esm/sha2.js
var SHA256_K, SHA256_W, _SHA256, SHA256, sha256;
var init_sha2 = __esm({
  "node_modules/@noble/hashes/esm/sha2.js"() {
    init_md();
    init_utils();
    SHA256_K = /* @__PURE__ */ Uint32Array.from([
      1116352408,
      1899447441,
      3049323471,
      3921009573,
      961987163,
      1508970993,
      2453635748,
      2870763221,
      3624381080,
      310598401,
      607225278,
      1426881987,
      1925078388,
      2162078206,
      2614888103,
      3248222580,
      3835390401,
      4022224774,
      264347078,
      604807628,
      770255983,
      1249150122,
      1555081692,
      1996064986,
      2554220882,
      2821834349,
      2952996808,
      3210313671,
      3336571891,
      3584528711,
      113926993,
      338241895,
      666307205,
      773529912,
      1294757372,
      1396182291,
      1695183700,
      1986661051,
      2177026350,
      2456956037,
      2730485921,
      2820302411,
      3259730800,
      3345764771,
      3516065817,
      3600352804,
      4094571909,
      275423344,
      430227734,
      506948616,
      659060556,
      883997877,
      958139571,
      1322822218,
      1537002063,
      1747873779,
      1955562222,
      2024104815,
      2227730452,
      2361852424,
      2428436474,
      2756734187,
      3204031479,
      3329325298
    ]);
    SHA256_W = /* @__PURE__ */ new Uint32Array(64);
    _SHA256 = class _SHA256 extends HashMD {
      constructor(outputLen = 32) {
        super(64, outputLen, 8, false);
        this.A = SHA256_IV[0] | 0;
        this.B = SHA256_IV[1] | 0;
        this.C = SHA256_IV[2] | 0;
        this.D = SHA256_IV[3] | 0;
        this.E = SHA256_IV[4] | 0;
        this.F = SHA256_IV[5] | 0;
        this.G = SHA256_IV[6] | 0;
        this.H = SHA256_IV[7] | 0;
      }
      get() {
        const { A, B, C, D, E, F, G, H } = this;
        return [A, B, C, D, E, F, G, H];
      }
      // prettier-ignore
      set(A, B, C, D, E, F, G, H) {
        this.A = A | 0;
        this.B = B | 0;
        this.C = C | 0;
        this.D = D | 0;
        this.E = E | 0;
        this.F = F | 0;
        this.G = G | 0;
        this.H = H | 0;
      }
      process(view, offset) {
        for (let i = 0; i < 16; i++, offset += 4)
          SHA256_W[i] = view.getUint32(offset, false);
        for (let i = 16; i < 64; i++) {
          const W15 = SHA256_W[i - 15];
          const W2 = SHA256_W[i - 2];
          const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;
          const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;
          SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
        }
        let { A, B, C, D, E, F, G, H } = this;
        for (let i = 0; i < 64; i++) {
          const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
          const T1 = H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i] | 0;
          const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
          const T2 = sigma0 + Maj(A, B, C) | 0;
          H = G;
          G = F;
          F = E;
          E = D + T1 | 0;
          D = C;
          C = B;
          B = A;
          A = T1 + T2 | 0;
        }
        A = A + this.A | 0;
        B = B + this.B | 0;
        C = C + this.C | 0;
        D = D + this.D | 0;
        E = E + this.E | 0;
        F = F + this.F | 0;
        G = G + this.G | 0;
        H = H + this.H | 0;
        this.set(A, B, C, D, E, F, G, H);
      }
      roundClean() {
        clean(SHA256_W);
      }
      destroy() {
        this.set(0, 0, 0, 0, 0, 0, 0, 0);
        clean(this.buffer);
      }
    };
    __name(_SHA256, "SHA256");
    SHA256 = _SHA256;
    sha256 = /* @__PURE__ */ createHasher(() => new SHA256());
  }
});

// node_modules/@noble/hashes/esm/hmac.js
var _HMAC, HMAC, hmac;
var init_hmac = __esm({
  "node_modules/@noble/hashes/esm/hmac.js"() {
    init_utils();
    _HMAC = class _HMAC extends Hash {
      constructor(hash, _key) {
        super();
        this.finished = false;
        this.destroyed = false;
        ahash(hash);
        const key = toBytes(_key);
        this.iHash = hash.create();
        if (typeof this.iHash.update !== "function")
          throw new Error("Expected instance of class which extends utils.Hash");
        this.blockLen = this.iHash.blockLen;
        this.outputLen = this.iHash.outputLen;
        const blockLen = this.blockLen;
        const pad2 = new Uint8Array(blockLen);
        pad2.set(key.length > blockLen ? hash.create().update(key).digest() : key);
        for (let i = 0; i < pad2.length; i++)
          pad2[i] ^= 54;
        this.iHash.update(pad2);
        this.oHash = hash.create();
        for (let i = 0; i < pad2.length; i++)
          pad2[i] ^= 54 ^ 92;
        this.oHash.update(pad2);
        clean(pad2);
      }
      update(buf) {
        aexists(this);
        this.iHash.update(buf);
        return this;
      }
      digestInto(out) {
        aexists(this);
        abytes(out, this.outputLen);
        this.finished = true;
        this.iHash.digestInto(out);
        this.oHash.update(out);
        this.oHash.digestInto(out);
        this.destroy();
      }
      digest() {
        const out = new Uint8Array(this.oHash.outputLen);
        this.digestInto(out);
        return out;
      }
      _cloneInto(to) {
        to || (to = Object.create(Object.getPrototypeOf(this), {}));
        const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
        to = to;
        to.finished = finished;
        to.destroyed = destroyed;
        to.blockLen = blockLen;
        to.outputLen = outputLen;
        to.oHash = oHash._cloneInto(to.oHash);
        to.iHash = iHash._cloneInto(to.iHash);
        return to;
      }
      clone() {
        return this._cloneInto();
      }
      destroy() {
        this.destroyed = true;
        this.oHash.destroy();
        this.iHash.destroy();
      }
    };
    __name(_HMAC, "HMAC");
    HMAC = _HMAC;
    hmac = /* @__PURE__ */ __name((hash, key, message) => new HMAC(hash, key).update(message).digest(), "hmac");
    hmac.create = (hash, key) => new HMAC(hash, key);
  }
});

// node_modules/@noble/curves/esm/utils.js
function _abool2(value, title = "") {
  if (typeof value !== "boolean") {
    const prefix = title && `"${title}"`;
    throw new Error(prefix + "expected boolean, got type=" + typeof value);
  }
  return value;
}
function _abytes2(value, length, title = "") {
  const bytes = isBytes(value);
  const len = value?.length;
  const needsLen = length !== void 0;
  if (!bytes || needsLen && len !== length) {
    const prefix = title && `"${title}" `;
    const ofLen = needsLen ? ` of length ${length}` : "";
    const got = bytes ? `length=${len}` : `type=${typeof value}`;
    throw new Error(prefix + "expected Uint8Array" + ofLen + ", got " + got);
  }
  return value;
}
function numberToHexUnpadded(num2) {
  const hex = num2.toString(16);
  return hex.length & 1 ? "0" + hex : hex;
}
function hexToNumber(hex) {
  if (typeof hex !== "string")
    throw new Error("hex string expected, got " + typeof hex);
  return hex === "" ? _0n : BigInt("0x" + hex);
}
function bytesToNumberBE(bytes) {
  return hexToNumber(bytesToHex(bytes));
}
function bytesToNumberLE(bytes) {
  abytes(bytes);
  return hexToNumber(bytesToHex(Uint8Array.from(bytes).reverse()));
}
function numberToBytesBE(n, len) {
  return hexToBytes(n.toString(16).padStart(len * 2, "0"));
}
function numberToBytesLE(n, len) {
  return numberToBytesBE(n, len).reverse();
}
function ensureBytes(title, hex, expectedLength) {
  let res;
  if (typeof hex === "string") {
    try {
      res = hexToBytes(hex);
    } catch (e) {
      throw new Error(title + " must be hex string or Uint8Array, cause: " + e);
    }
  } else if (isBytes(hex)) {
    res = Uint8Array.from(hex);
  } else {
    throw new Error(title + " must be hex string or Uint8Array");
  }
  const len = res.length;
  if (typeof expectedLength === "number" && len !== expectedLength)
    throw new Error(title + " of length " + expectedLength + " expected, got " + len);
  return res;
}
function inRange(n, min, max) {
  return isPosBig(n) && isPosBig(min) && isPosBig(max) && min <= n && n < max;
}
function aInRange(title, n, min, max) {
  if (!inRange(n, min, max))
    throw new Error("expected valid " + title + ": " + min + " <= n < " + max + ", got " + n);
}
function bitLen(n) {
  let len;
  for (len = 0; n > _0n; n >>= _1n, len += 1)
    ;
  return len;
}
function createHmacDrbg(hashLen, qByteLen, hmacFn) {
  if (typeof hashLen !== "number" || hashLen < 2)
    throw new Error("hashLen must be a number");
  if (typeof qByteLen !== "number" || qByteLen < 2)
    throw new Error("qByteLen must be a number");
  if (typeof hmacFn !== "function")
    throw new Error("hmacFn must be a function");
  const u8n = /* @__PURE__ */ __name((len) => new Uint8Array(len), "u8n");
  const u8of = /* @__PURE__ */ __name((byte) => Uint8Array.of(byte), "u8of");
  let v = u8n(hashLen);
  let k = u8n(hashLen);
  let i = 0;
  const reset = /* @__PURE__ */ __name(() => {
    v.fill(1);
    k.fill(0);
    i = 0;
  }, "reset");
  const h = /* @__PURE__ */ __name((...b) => hmacFn(k, v, ...b), "h");
  const reseed = /* @__PURE__ */ __name((seed = u8n(0)) => {
    k = h(u8of(0), seed);
    v = h();
    if (seed.length === 0)
      return;
    k = h(u8of(1), seed);
    v = h();
  }, "reseed");
  const gen = /* @__PURE__ */ __name(() => {
    if (i++ >= 1e3)
      throw new Error("drbg: tried 1000 values");
    let len = 0;
    const out = [];
    while (len < qByteLen) {
      v = h();
      const sl = v.slice();
      out.push(sl);
      len += v.length;
    }
    return concatBytes(...out);
  }, "gen");
  const genUntil = /* @__PURE__ */ __name((seed, pred) => {
    reset();
    reseed(seed);
    let res = void 0;
    while (!(res = pred(gen())))
      reseed();
    reset();
    return res;
  }, "genUntil");
  return genUntil;
}
function _validateObject(object, fields, optFields = {}) {
  if (!object || typeof object !== "object")
    throw new Error("expected valid options object");
  function checkField(fieldName, expectedType, isOpt) {
    const val = object[fieldName];
    if (isOpt && val === void 0)
      return;
    const current = typeof val;
    if (current !== expectedType || val === null)
      throw new Error(`param "${fieldName}" is invalid: expected ${expectedType}, got ${current}`);
  }
  __name(checkField, "checkField");
  Object.entries(fields).forEach(([k, v]) => checkField(k, v, false));
  Object.entries(optFields).forEach(([k, v]) => checkField(k, v, true));
}
function memoized(fn) {
  const map = /* @__PURE__ */ new WeakMap();
  return (arg, ...args) => {
    const val = map.get(arg);
    if (val !== void 0)
      return val;
    const computed = fn(arg, ...args);
    map.set(arg, computed);
    return computed;
  };
}
var _0n, _1n, isPosBig, bitMask;
var init_utils2 = __esm({
  "node_modules/@noble/curves/esm/utils.js"() {
    init_utils();
    init_utils();
    _0n = /* @__PURE__ */ BigInt(0);
    _1n = /* @__PURE__ */ BigInt(1);
    __name(_abool2, "_abool2");
    __name(_abytes2, "_abytes2");
    __name(numberToHexUnpadded, "numberToHexUnpadded");
    __name(hexToNumber, "hexToNumber");
    __name(bytesToNumberBE, "bytesToNumberBE");
    __name(bytesToNumberLE, "bytesToNumberLE");
    __name(numberToBytesBE, "numberToBytesBE");
    __name(numberToBytesLE, "numberToBytesLE");
    __name(ensureBytes, "ensureBytes");
    isPosBig = /* @__PURE__ */ __name((n) => typeof n === "bigint" && _0n <= n, "isPosBig");
    __name(inRange, "inRange");
    __name(aInRange, "aInRange");
    __name(bitLen, "bitLen");
    bitMask = /* @__PURE__ */ __name((n) => (_1n << BigInt(n)) - _1n, "bitMask");
    __name(createHmacDrbg, "createHmacDrbg");
    __name(_validateObject, "_validateObject");
    __name(memoized, "memoized");
  }
});

// node_modules/@noble/curves/esm/abstract/modular.js
function mod(a, b) {
  const result = a % b;
  return result >= _0n2 ? result : b + result;
}
function pow2(x, power, modulo) {
  let res = x;
  while (power-- > _0n2) {
    res *= res;
    res %= modulo;
  }
  return res;
}
function invert(number, modulo) {
  if (number === _0n2)
    throw new Error("invert: expected non-zero number");
  if (modulo <= _0n2)
    throw new Error("invert: expected positive modulus, got " + modulo);
  let a = mod(number, modulo);
  let b = modulo;
  let x = _0n2, y = _1n2, u = _1n2, v = _0n2;
  while (a !== _0n2) {
    const q = b / a;
    const r = b % a;
    const m = x - u * q;
    const n = y - v * q;
    b = a, a = r, x = u, y = v, u = m, v = n;
  }
  const gcd = b;
  if (gcd !== _1n2)
    throw new Error("invert: does not exist");
  return mod(x, modulo);
}
function assertIsSquare(Fp, root, n) {
  if (!Fp.eql(Fp.sqr(root), n))
    throw new Error("Cannot find square root");
}
function sqrt3mod4(Fp, n) {
  const p1div4 = (Fp.ORDER + _1n2) / _4n;
  const root = Fp.pow(n, p1div4);
  assertIsSquare(Fp, root, n);
  return root;
}
function sqrt5mod8(Fp, n) {
  const p5div8 = (Fp.ORDER - _5n) / _8n;
  const n2 = Fp.mul(n, _2n);
  const v = Fp.pow(n2, p5div8);
  const nv = Fp.mul(n, v);
  const i = Fp.mul(Fp.mul(nv, _2n), v);
  const root = Fp.mul(nv, Fp.sub(i, Fp.ONE));
  assertIsSquare(Fp, root, n);
  return root;
}
function sqrt9mod16(P) {
  const Fp_ = Field(P);
  const tn = tonelliShanks(P);
  const c1 = tn(Fp_, Fp_.neg(Fp_.ONE));
  const c2 = tn(Fp_, c1);
  const c3 = tn(Fp_, Fp_.neg(c1));
  const c4 = (P + _7n) / _16n;
  return (Fp, n) => {
    let tv1 = Fp.pow(n, c4);
    let tv2 = Fp.mul(tv1, c1);
    const tv3 = Fp.mul(tv1, c2);
    const tv4 = Fp.mul(tv1, c3);
    const e1 = Fp.eql(Fp.sqr(tv2), n);
    const e2 = Fp.eql(Fp.sqr(tv3), n);
    tv1 = Fp.cmov(tv1, tv2, e1);
    tv2 = Fp.cmov(tv4, tv3, e2);
    const e3 = Fp.eql(Fp.sqr(tv2), n);
    const root = Fp.cmov(tv1, tv2, e3);
    assertIsSquare(Fp, root, n);
    return root;
  };
}
function tonelliShanks(P) {
  if (P < _3n)
    throw new Error("sqrt is not defined for small field");
  let Q = P - _1n2;
  let S = 0;
  while (Q % _2n === _0n2) {
    Q /= _2n;
    S++;
  }
  let Z = _2n;
  const _Fp = Field(P);
  while (FpLegendre(_Fp, Z) === 1) {
    if (Z++ > 1e3)
      throw new Error("Cannot find square root: probably non-prime P");
  }
  if (S === 1)
    return sqrt3mod4;
  let cc = _Fp.pow(Z, Q);
  const Q1div2 = (Q + _1n2) / _2n;
  return /* @__PURE__ */ __name(function tonelliSlow(Fp, n) {
    if (Fp.is0(n))
      return n;
    if (FpLegendre(Fp, n) !== 1)
      throw new Error("Cannot find square root");
    let M = S;
    let c = Fp.mul(Fp.ONE, cc);
    let t = Fp.pow(n, Q);
    let R = Fp.pow(n, Q1div2);
    while (!Fp.eql(t, Fp.ONE)) {
      if (Fp.is0(t))
        return Fp.ZERO;
      let i = 1;
      let t_tmp = Fp.sqr(t);
      while (!Fp.eql(t_tmp, Fp.ONE)) {
        i++;
        t_tmp = Fp.sqr(t_tmp);
        if (i === M)
          throw new Error("Cannot find square root");
      }
      const exponent = _1n2 << BigInt(M - i - 1);
      const b = Fp.pow(c, exponent);
      M = i;
      c = Fp.sqr(b);
      t = Fp.mul(t, c);
      R = Fp.mul(R, b);
    }
    return R;
  }, "tonelliSlow");
}
function FpSqrt(P) {
  if (P % _4n === _3n)
    return sqrt3mod4;
  if (P % _8n === _5n)
    return sqrt5mod8;
  if (P % _16n === _9n)
    return sqrt9mod16(P);
  return tonelliShanks(P);
}
function validateField(field) {
  const initial = {
    ORDER: "bigint",
    MASK: "bigint",
    BYTES: "number",
    BITS: "number"
  };
  const opts = FIELD_FIELDS.reduce((map, val) => {
    map[val] = "function";
    return map;
  }, initial);
  _validateObject(field, opts);
  return field;
}
function FpPow(Fp, num2, power) {
  if (power < _0n2)
    throw new Error("invalid exponent, negatives unsupported");
  if (power === _0n2)
    return Fp.ONE;
  if (power === _1n2)
    return num2;
  let p = Fp.ONE;
  let d = num2;
  while (power > _0n2) {
    if (power & _1n2)
      p = Fp.mul(p, d);
    d = Fp.sqr(d);
    power >>= _1n2;
  }
  return p;
}
function FpInvertBatch(Fp, nums, passZero = false) {
  const inverted = new Array(nums.length).fill(passZero ? Fp.ZERO : void 0);
  const multipliedAcc = nums.reduce((acc, num2, i) => {
    if (Fp.is0(num2))
      return acc;
    inverted[i] = acc;
    return Fp.mul(acc, num2);
  }, Fp.ONE);
  const invertedAcc = Fp.inv(multipliedAcc);
  nums.reduceRight((acc, num2, i) => {
    if (Fp.is0(num2))
      return acc;
    inverted[i] = Fp.mul(acc, inverted[i]);
    return Fp.mul(acc, num2);
  }, invertedAcc);
  return inverted;
}
function FpLegendre(Fp, n) {
  const p1mod2 = (Fp.ORDER - _1n2) / _2n;
  const powered = Fp.pow(n, p1mod2);
  const yes = Fp.eql(powered, Fp.ONE);
  const zero = Fp.eql(powered, Fp.ZERO);
  const no = Fp.eql(powered, Fp.neg(Fp.ONE));
  if (!yes && !zero && !no)
    throw new Error("invalid Legendre symbol result");
  return yes ? 1 : zero ? 0 : -1;
}
function nLength(n, nBitLength) {
  if (nBitLength !== void 0)
    anumber(nBitLength);
  const _nBitLength = nBitLength !== void 0 ? nBitLength : n.toString(2).length;
  const nByteLength = Math.ceil(_nBitLength / 8);
  return { nBitLength: _nBitLength, nByteLength };
}
function Field(ORDER, bitLenOrOpts, isLE2 = false, opts = {}) {
  if (ORDER <= _0n2)
    throw new Error("invalid field: expected ORDER > 0, got " + ORDER);
  let _nbitLength = void 0;
  let _sqrt = void 0;
  let modFromBytes = false;
  let allowedLengths = void 0;
  if (typeof bitLenOrOpts === "object" && bitLenOrOpts != null) {
    if (opts.sqrt || isLE2)
      throw new Error("cannot specify opts in two arguments");
    const _opts = bitLenOrOpts;
    if (_opts.BITS)
      _nbitLength = _opts.BITS;
    if (_opts.sqrt)
      _sqrt = _opts.sqrt;
    if (typeof _opts.isLE === "boolean")
      isLE2 = _opts.isLE;
    if (typeof _opts.modFromBytes === "boolean")
      modFromBytes = _opts.modFromBytes;
    allowedLengths = _opts.allowedLengths;
  } else {
    if (typeof bitLenOrOpts === "number")
      _nbitLength = bitLenOrOpts;
    if (opts.sqrt)
      _sqrt = opts.sqrt;
  }
  const { nBitLength: BITS, nByteLength: BYTES } = nLength(ORDER, _nbitLength);
  if (BYTES > 2048)
    throw new Error("invalid field: expected ORDER of <= 2048 bytes");
  let sqrtP;
  const f = Object.freeze({
    ORDER,
    isLE: isLE2,
    BITS,
    BYTES,
    MASK: bitMask(BITS),
    ZERO: _0n2,
    ONE: _1n2,
    allowedLengths,
    create: (num2) => mod(num2, ORDER),
    isValid: (num2) => {
      if (typeof num2 !== "bigint")
        throw new Error("invalid field element: expected bigint, got " + typeof num2);
      return _0n2 <= num2 && num2 < ORDER;
    },
    is0: (num2) => num2 === _0n2,
    // is valid and invertible
    isValidNot0: (num2) => !f.is0(num2) && f.isValid(num2),
    isOdd: (num2) => (num2 & _1n2) === _1n2,
    neg: (num2) => mod(-num2, ORDER),
    eql: (lhs, rhs) => lhs === rhs,
    sqr: (num2) => mod(num2 * num2, ORDER),
    add: (lhs, rhs) => mod(lhs + rhs, ORDER),
    sub: (lhs, rhs) => mod(lhs - rhs, ORDER),
    mul: (lhs, rhs) => mod(lhs * rhs, ORDER),
    pow: (num2, power) => FpPow(f, num2, power),
    div: (lhs, rhs) => mod(lhs * invert(rhs, ORDER), ORDER),
    // Same as above, but doesn't normalize
    sqrN: (num2) => num2 * num2,
    addN: (lhs, rhs) => lhs + rhs,
    subN: (lhs, rhs) => lhs - rhs,
    mulN: (lhs, rhs) => lhs * rhs,
    inv: (num2) => invert(num2, ORDER),
    sqrt: _sqrt || ((n) => {
      if (!sqrtP)
        sqrtP = FpSqrt(ORDER);
      return sqrtP(f, n);
    }),
    toBytes: (num2) => isLE2 ? numberToBytesLE(num2, BYTES) : numberToBytesBE(num2, BYTES),
    fromBytes: (bytes, skipValidation = true) => {
      if (allowedLengths) {
        if (!allowedLengths.includes(bytes.length) || bytes.length > BYTES) {
          throw new Error("Field.fromBytes: expected " + allowedLengths + " bytes, got " + bytes.length);
        }
        const padded = new Uint8Array(BYTES);
        padded.set(bytes, isLE2 ? 0 : padded.length - bytes.length);
        bytes = padded;
      }
      if (bytes.length !== BYTES)
        throw new Error("Field.fromBytes: expected " + BYTES + " bytes, got " + bytes.length);
      let scalar = isLE2 ? bytesToNumberLE(bytes) : bytesToNumberBE(bytes);
      if (modFromBytes)
        scalar = mod(scalar, ORDER);
      if (!skipValidation) {
        if (!f.isValid(scalar))
          throw new Error("invalid field element: outside of range 0..ORDER");
      }
      return scalar;
    },
    // TODO: we don't need it here, move out to separate fn
    invertBatch: (lst) => FpInvertBatch(f, lst),
    // We can't move this out because Fp6, Fp12 implement it
    // and it's unclear what to return in there.
    cmov: (a, b, c) => c ? b : a
  });
  return Object.freeze(f);
}
function getFieldBytesLength(fieldOrder) {
  if (typeof fieldOrder !== "bigint")
    throw new Error("field order must be bigint");
  const bitLength = fieldOrder.toString(2).length;
  return Math.ceil(bitLength / 8);
}
function getMinHashLength(fieldOrder) {
  const length = getFieldBytesLength(fieldOrder);
  return length + Math.ceil(length / 2);
}
function mapHashToField(key, fieldOrder, isLE2 = false) {
  const len = key.length;
  const fieldLen = getFieldBytesLength(fieldOrder);
  const minLen = getMinHashLength(fieldOrder);
  if (len < 16 || len < minLen || len > 1024)
    throw new Error("expected " + minLen + "-1024 bytes of input, got " + len);
  const num2 = isLE2 ? bytesToNumberLE(key) : bytesToNumberBE(key);
  const reduced = mod(num2, fieldOrder - _1n2) + _1n2;
  return isLE2 ? numberToBytesLE(reduced, fieldLen) : numberToBytesBE(reduced, fieldLen);
}
var _0n2, _1n2, _2n, _3n, _4n, _5n, _7n, _8n, _9n, _16n, FIELD_FIELDS;
var init_modular = __esm({
  "node_modules/@noble/curves/esm/abstract/modular.js"() {
    init_utils2();
    _0n2 = BigInt(0);
    _1n2 = BigInt(1);
    _2n = /* @__PURE__ */ BigInt(2);
    _3n = /* @__PURE__ */ BigInt(3);
    _4n = /* @__PURE__ */ BigInt(4);
    _5n = /* @__PURE__ */ BigInt(5);
    _7n = /* @__PURE__ */ BigInt(7);
    _8n = /* @__PURE__ */ BigInt(8);
    _9n = /* @__PURE__ */ BigInt(9);
    _16n = /* @__PURE__ */ BigInt(16);
    __name(mod, "mod");
    __name(pow2, "pow2");
    __name(invert, "invert");
    __name(assertIsSquare, "assertIsSquare");
    __name(sqrt3mod4, "sqrt3mod4");
    __name(sqrt5mod8, "sqrt5mod8");
    __name(sqrt9mod16, "sqrt9mod16");
    __name(tonelliShanks, "tonelliShanks");
    __name(FpSqrt, "FpSqrt");
    FIELD_FIELDS = [
      "create",
      "isValid",
      "is0",
      "neg",
      "inv",
      "sqrt",
      "sqr",
      "eql",
      "add",
      "sub",
      "mul",
      "pow",
      "div",
      "addN",
      "subN",
      "mulN",
      "sqrN"
    ];
    __name(validateField, "validateField");
    __name(FpPow, "FpPow");
    __name(FpInvertBatch, "FpInvertBatch");
    __name(FpLegendre, "FpLegendre");
    __name(nLength, "nLength");
    __name(Field, "Field");
    __name(getFieldBytesLength, "getFieldBytesLength");
    __name(getMinHashLength, "getMinHashLength");
    __name(mapHashToField, "mapHashToField");
  }
});

// node_modules/@noble/curves/esm/abstract/curve.js
function negateCt(condition, item) {
  const neg = item.negate();
  return condition ? neg : item;
}
function normalizeZ(c, points) {
  const invertedZs = FpInvertBatch(c.Fp, points.map((p) => p.Z));
  return points.map((p, i) => c.fromAffine(p.toAffine(invertedZs[i])));
}
function validateW(W, bits) {
  if (!Number.isSafeInteger(W) || W <= 0 || W > bits)
    throw new Error("invalid window size, expected [1.." + bits + "], got W=" + W);
}
function calcWOpts(W, scalarBits) {
  validateW(W, scalarBits);
  const windows = Math.ceil(scalarBits / W) + 1;
  const windowSize = 2 ** (W - 1);
  const maxNumber = 2 ** W;
  const mask = bitMask(W);
  const shiftBy = BigInt(W);
  return { windows, windowSize, mask, maxNumber, shiftBy };
}
function calcOffsets(n, window, wOpts) {
  const { windowSize, mask, maxNumber, shiftBy } = wOpts;
  let wbits = Number(n & mask);
  let nextN = n >> shiftBy;
  if (wbits > windowSize) {
    wbits -= maxNumber;
    nextN += _1n3;
  }
  const offsetStart = window * windowSize;
  const offset = offsetStart + Math.abs(wbits) - 1;
  const isZero = wbits === 0;
  const isNeg = wbits < 0;
  const isNegF = window % 2 !== 0;
  const offsetF = offsetStart;
  return { nextN, offset, isZero, isNeg, isNegF, offsetF };
}
function validateMSMPoints(points, c) {
  if (!Array.isArray(points))
    throw new Error("array expected");
  points.forEach((p, i) => {
    if (!(p instanceof c))
      throw new Error("invalid point at index " + i);
  });
}
function validateMSMScalars(scalars, field) {
  if (!Array.isArray(scalars))
    throw new Error("array of scalars expected");
  scalars.forEach((s, i) => {
    if (!field.isValid(s))
      throw new Error("invalid scalar at index " + i);
  });
}
function getW(P) {
  return pointWindowSizes.get(P) || 1;
}
function assert0(n) {
  if (n !== _0n3)
    throw new Error("invalid wNAF");
}
function mulEndoUnsafe(Point, point, k1, k2) {
  let acc = point;
  let p1 = Point.ZERO;
  let p2 = Point.ZERO;
  while (k1 > _0n3 || k2 > _0n3) {
    if (k1 & _1n3)
      p1 = p1.add(acc);
    if (k2 & _1n3)
      p2 = p2.add(acc);
    acc = acc.double();
    k1 >>= _1n3;
    k2 >>= _1n3;
  }
  return { p1, p2 };
}
function pippenger(c, fieldN, points, scalars) {
  validateMSMPoints(points, c);
  validateMSMScalars(scalars, fieldN);
  const plength = points.length;
  const slength = scalars.length;
  if (plength !== slength)
    throw new Error("arrays of points and scalars must have equal length");
  const zero = c.ZERO;
  const wbits = bitLen(BigInt(plength));
  let windowSize = 1;
  if (wbits > 12)
    windowSize = wbits - 3;
  else if (wbits > 4)
    windowSize = wbits - 2;
  else if (wbits > 0)
    windowSize = 2;
  const MASK = bitMask(windowSize);
  const buckets = new Array(Number(MASK) + 1).fill(zero);
  const lastBits = Math.floor((fieldN.BITS - 1) / windowSize) * windowSize;
  let sum = zero;
  for (let i = lastBits; i >= 0; i -= windowSize) {
    buckets.fill(zero);
    for (let j = 0; j < slength; j++) {
      const scalar = scalars[j];
      const wbits2 = Number(scalar >> BigInt(i) & MASK);
      buckets[wbits2] = buckets[wbits2].add(points[j]);
    }
    let resI = zero;
    for (let j = buckets.length - 1, sumI = zero; j > 0; j--) {
      sumI = sumI.add(buckets[j]);
      resI = resI.add(sumI);
    }
    sum = sum.add(resI);
    if (i !== 0)
      for (let j = 0; j < windowSize; j++)
        sum = sum.double();
  }
  return sum;
}
function createField(order, field, isLE2) {
  if (field) {
    if (field.ORDER !== order)
      throw new Error("Field.ORDER must match order: Fp == p, Fn == n");
    validateField(field);
    return field;
  } else {
    return Field(order, { isLE: isLE2 });
  }
}
function _createCurveFields(type, CURVE, curveOpts = {}, FpFnLE) {
  if (FpFnLE === void 0)
    FpFnLE = type === "edwards";
  if (!CURVE || typeof CURVE !== "object")
    throw new Error(`expected valid ${type} CURVE object`);
  for (const p of ["p", "n", "h"]) {
    const val = CURVE[p];
    if (!(typeof val === "bigint" && val > _0n3))
      throw new Error(`CURVE.${p} must be positive bigint`);
  }
  const Fp = createField(CURVE.p, curveOpts.Fp, FpFnLE);
  const Fn = createField(CURVE.n, curveOpts.Fn, FpFnLE);
  const _b = type === "weierstrass" ? "b" : "d";
  const params = ["Gx", "Gy", "a", _b];
  for (const p of params) {
    if (!Fp.isValid(CURVE[p]))
      throw new Error(`CURVE.${p} must be valid field element of CURVE.Fp`);
  }
  CURVE = Object.freeze(Object.assign({}, CURVE));
  return { CURVE, Fp, Fn };
}
var _0n3, _1n3, pointPrecomputes, pointWindowSizes, _wNAF, wNAF;
var init_curve = __esm({
  "node_modules/@noble/curves/esm/abstract/curve.js"() {
    init_utils2();
    init_modular();
    _0n3 = BigInt(0);
    _1n3 = BigInt(1);
    __name(negateCt, "negateCt");
    __name(normalizeZ, "normalizeZ");
    __name(validateW, "validateW");
    __name(calcWOpts, "calcWOpts");
    __name(calcOffsets, "calcOffsets");
    __name(validateMSMPoints, "validateMSMPoints");
    __name(validateMSMScalars, "validateMSMScalars");
    pointPrecomputes = /* @__PURE__ */ new WeakMap();
    pointWindowSizes = /* @__PURE__ */ new WeakMap();
    __name(getW, "getW");
    __name(assert0, "assert0");
    _wNAF = class _wNAF {
      // Parametrized with a given Point class (not individual point)
      constructor(Point, bits) {
        this.BASE = Point.BASE;
        this.ZERO = Point.ZERO;
        this.Fn = Point.Fn;
        this.bits = bits;
      }
      // non-const time multiplication ladder
      _unsafeLadder(elm, n, p = this.ZERO) {
        let d = elm;
        while (n > _0n3) {
          if (n & _1n3)
            p = p.add(d);
          d = d.double();
          n >>= _1n3;
        }
        return p;
      }
      /**
       * Creates a wNAF precomputation window. Used for caching.
       * Default window size is set by `utils.precompute()` and is equal to 8.
       * Number of precomputed points depends on the curve size:
       * 2^(𝑊−1) * (Math.ceil(𝑛 / 𝑊) + 1), where:
       * - 𝑊 is the window size
       * - 𝑛 is the bitlength of the curve order.
       * For a 256-bit curve and window size 8, the number of precomputed points is 128 * 33 = 4224.
       * @param point Point instance
       * @param W window size
       * @returns precomputed point tables flattened to a single array
       */
      precomputeWindow(point, W) {
        const { windows, windowSize } = calcWOpts(W, this.bits);
        const points = [];
        let p = point;
        let base = p;
        for (let window = 0; window < windows; window++) {
          base = p;
          points.push(base);
          for (let i = 1; i < windowSize; i++) {
            base = base.add(p);
            points.push(base);
          }
          p = base.double();
        }
        return points;
      }
      /**
       * Implements ec multiplication using precomputed tables and w-ary non-adjacent form.
       * More compact implementation:
       * https://github.com/paulmillr/noble-secp256k1/blob/47cb1669b6e506ad66b35fe7d76132ae97465da2/index.ts#L502-L541
       * @returns real and fake (for const-time) points
       */
      wNAF(W, precomputes, n) {
        if (!this.Fn.isValid(n))
          throw new Error("invalid scalar");
        let p = this.ZERO;
        let f = this.BASE;
        const wo = calcWOpts(W, this.bits);
        for (let window = 0; window < wo.windows; window++) {
          const { nextN, offset, isZero, isNeg, isNegF, offsetF } = calcOffsets(n, window, wo);
          n = nextN;
          if (isZero) {
            f = f.add(negateCt(isNegF, precomputes[offsetF]));
          } else {
            p = p.add(negateCt(isNeg, precomputes[offset]));
          }
        }
        assert0(n);
        return { p, f };
      }
      /**
       * Implements ec unsafe (non const-time) multiplication using precomputed tables and w-ary non-adjacent form.
       * @param acc accumulator point to add result of multiplication
       * @returns point
       */
      wNAFUnsafe(W, precomputes, n, acc = this.ZERO) {
        const wo = calcWOpts(W, this.bits);
        for (let window = 0; window < wo.windows; window++) {
          if (n === _0n3)
            break;
          const { nextN, offset, isZero, isNeg } = calcOffsets(n, window, wo);
          n = nextN;
          if (isZero) {
            continue;
          } else {
            const item = precomputes[offset];
            acc = acc.add(isNeg ? item.negate() : item);
          }
        }
        assert0(n);
        return acc;
      }
      getPrecomputes(W, point, transform) {
        let comp = pointPrecomputes.get(point);
        if (!comp) {
          comp = this.precomputeWindow(point, W);
          if (W !== 1) {
            if (typeof transform === "function")
              comp = transform(comp);
            pointPrecomputes.set(point, comp);
          }
        }
        return comp;
      }
      cached(point, scalar, transform) {
        const W = getW(point);
        return this.wNAF(W, this.getPrecomputes(W, point, transform), scalar);
      }
      unsafe(point, scalar, transform, prev) {
        const W = getW(point);
        if (W === 1)
          return this._unsafeLadder(point, scalar, prev);
        return this.wNAFUnsafe(W, this.getPrecomputes(W, point, transform), scalar, prev);
      }
      // We calculate precomputes for elliptic curve point multiplication
      // using windowed method. This specifies window size and
      // stores precomputed values. Usually only base point would be precomputed.
      createCache(P, W) {
        validateW(W, this.bits);
        pointWindowSizes.set(P, W);
        pointPrecomputes.delete(P);
      }
      hasCache(elm) {
        return getW(elm) !== 1;
      }
    };
    __name(_wNAF, "wNAF");
    wNAF = _wNAF;
    __name(mulEndoUnsafe, "mulEndoUnsafe");
    __name(pippenger, "pippenger");
    __name(createField, "createField");
    __name(_createCurveFields, "_createCurveFields");
  }
});

// node_modules/@noble/curves/esm/abstract/weierstrass.js
function _splitEndoScalar(k, basis, n) {
  const [[a1, b1], [a2, b2]] = basis;
  const c1 = divNearest(b2 * k, n);
  const c2 = divNearest(-b1 * k, n);
  let k1 = k - c1 * a1 - c2 * a2;
  let k2 = -c1 * b1 - c2 * b2;
  const k1neg = k1 < _0n4;
  const k2neg = k2 < _0n4;
  if (k1neg)
    k1 = -k1;
  if (k2neg)
    k2 = -k2;
  const MAX_NUM = bitMask(Math.ceil(bitLen(n) / 2)) + _1n4;
  if (k1 < _0n4 || k1 >= MAX_NUM || k2 < _0n4 || k2 >= MAX_NUM) {
    throw new Error("splitScalar (endomorphism): failed, k=" + k);
  }
  return { k1neg, k1, k2neg, k2 };
}
function validateSigFormat(format) {
  if (!["compact", "recovered", "der"].includes(format))
    throw new Error('Signature format must be "compact", "recovered", or "der"');
  return format;
}
function validateSigOpts(opts, def) {
  const optsn = {};
  for (let optName of Object.keys(def)) {
    optsn[optName] = opts[optName] === void 0 ? def[optName] : opts[optName];
  }
  _abool2(optsn.lowS, "lowS");
  _abool2(optsn.prehash, "prehash");
  if (optsn.format !== void 0)
    validateSigFormat(optsn.format);
  return optsn;
}
function _normFnElement(Fn, key) {
  const { BYTES: expected } = Fn;
  let num2;
  if (typeof key === "bigint") {
    num2 = key;
  } else {
    let bytes = ensureBytes("private key", key);
    try {
      num2 = Fn.fromBytes(bytes);
    } catch (error2) {
      throw new Error(`invalid private key: expected ui8a of size ${expected}, got ${typeof key}`);
    }
  }
  if (!Fn.isValidNot0(num2))
    throw new Error("invalid private key: out of range [1..N-1]");
  return num2;
}
function weierstrassN(params, extraOpts = {}) {
  const validated = _createCurveFields("weierstrass", params, extraOpts);
  const { Fp, Fn } = validated;
  let CURVE = validated.CURVE;
  const { h: cofactor, n: CURVE_ORDER } = CURVE;
  _validateObject(extraOpts, {}, {
    allowInfinityPoint: "boolean",
    clearCofactor: "function",
    isTorsionFree: "function",
    fromBytes: "function",
    toBytes: "function",
    endo: "object",
    wrapPrivateKey: "boolean"
  });
  const { endo } = extraOpts;
  if (endo) {
    if (!Fp.is0(CURVE.a) || typeof endo.beta !== "bigint" || !Array.isArray(endo.basises)) {
      throw new Error('invalid endo: expected "beta": bigint and "basises": array');
    }
  }
  const lengths = getWLengths(Fp, Fn);
  function assertCompressionIsSupported() {
    if (!Fp.isOdd)
      throw new Error("compression is not supported: Field does not have .isOdd()");
  }
  __name(assertCompressionIsSupported, "assertCompressionIsSupported");
  function pointToBytes2(_c, point, isCompressed) {
    const { x, y } = point.toAffine();
    const bx = Fp.toBytes(x);
    _abool2(isCompressed, "isCompressed");
    if (isCompressed) {
      assertCompressionIsSupported();
      const hasEvenY = !Fp.isOdd(y);
      return concatBytes(pprefix(hasEvenY), bx);
    } else {
      return concatBytes(Uint8Array.of(4), bx, Fp.toBytes(y));
    }
  }
  __name(pointToBytes2, "pointToBytes");
  function pointFromBytes(bytes) {
    _abytes2(bytes, void 0, "Point");
    const { publicKey: comp, publicKeyUncompressed: uncomp } = lengths;
    const length = bytes.length;
    const head = bytes[0];
    const tail = bytes.subarray(1);
    if (length === comp && (head === 2 || head === 3)) {
      const x = Fp.fromBytes(tail);
      if (!Fp.isValid(x))
        throw new Error("bad point: is not on curve, wrong x");
      const y2 = weierstrassEquation(x);
      let y;
      try {
        y = Fp.sqrt(y2);
      } catch (sqrtError) {
        const err = sqrtError instanceof Error ? ": " + sqrtError.message : "";
        throw new Error("bad point: is not on curve, sqrt error" + err);
      }
      assertCompressionIsSupported();
      const isYOdd = Fp.isOdd(y);
      const isHeadOdd = (head & 1) === 1;
      if (isHeadOdd !== isYOdd)
        y = Fp.neg(y);
      return { x, y };
    } else if (length === uncomp && head === 4) {
      const L = Fp.BYTES;
      const x = Fp.fromBytes(tail.subarray(0, L));
      const y = Fp.fromBytes(tail.subarray(L, L * 2));
      if (!isValidXY(x, y))
        throw new Error("bad point: is not on curve");
      return { x, y };
    } else {
      throw new Error(`bad point: got length ${length}, expected compressed=${comp} or uncompressed=${uncomp}`);
    }
  }
  __name(pointFromBytes, "pointFromBytes");
  const encodePoint = extraOpts.toBytes || pointToBytes2;
  const decodePoint = extraOpts.fromBytes || pointFromBytes;
  function weierstrassEquation(x) {
    const x2 = Fp.sqr(x);
    const x3 = Fp.mul(x2, x);
    return Fp.add(Fp.add(x3, Fp.mul(x, CURVE.a)), CURVE.b);
  }
  __name(weierstrassEquation, "weierstrassEquation");
  function isValidXY(x, y) {
    const left = Fp.sqr(y);
    const right = weierstrassEquation(x);
    return Fp.eql(left, right);
  }
  __name(isValidXY, "isValidXY");
  if (!isValidXY(CURVE.Gx, CURVE.Gy))
    throw new Error("bad curve params: generator point");
  const _4a3 = Fp.mul(Fp.pow(CURVE.a, _3n2), _4n2);
  const _27b2 = Fp.mul(Fp.sqr(CURVE.b), BigInt(27));
  if (Fp.is0(Fp.add(_4a3, _27b2)))
    throw new Error("bad curve params: a or b");
  function acoord(title, n, banZero = false) {
    if (!Fp.isValid(n) || banZero && Fp.is0(n))
      throw new Error(`bad point coordinate ${title}`);
    return n;
  }
  __name(acoord, "acoord");
  function aprjpoint(other) {
    if (!(other instanceof Point))
      throw new Error("ProjectivePoint expected");
  }
  __name(aprjpoint, "aprjpoint");
  function splitEndoScalarN(k) {
    if (!endo || !endo.basises)
      throw new Error("no endo");
    return _splitEndoScalar(k, endo.basises, Fn.ORDER);
  }
  __name(splitEndoScalarN, "splitEndoScalarN");
  const toAffineMemo = memoized((p, iz) => {
    const { X, Y, Z } = p;
    if (Fp.eql(Z, Fp.ONE))
      return { x: X, y: Y };
    const is0 = p.is0();
    if (iz == null)
      iz = is0 ? Fp.ONE : Fp.inv(Z);
    const x = Fp.mul(X, iz);
    const y = Fp.mul(Y, iz);
    const zz = Fp.mul(Z, iz);
    if (is0)
      return { x: Fp.ZERO, y: Fp.ZERO };
    if (!Fp.eql(zz, Fp.ONE))
      throw new Error("invZ was invalid");
    return { x, y };
  });
  const assertValidMemo = memoized((p) => {
    if (p.is0()) {
      if (extraOpts.allowInfinityPoint && !Fp.is0(p.Y))
        return;
      throw new Error("bad point: ZERO");
    }
    const { x, y } = p.toAffine();
    if (!Fp.isValid(x) || !Fp.isValid(y))
      throw new Error("bad point: x or y not field elements");
    if (!isValidXY(x, y))
      throw new Error("bad point: equation left != right");
    if (!p.isTorsionFree())
      throw new Error("bad point: not in prime-order subgroup");
    return true;
  });
  function finishEndo(endoBeta, k1p, k2p, k1neg, k2neg) {
    k2p = new Point(Fp.mul(k2p.X, endoBeta), k2p.Y, k2p.Z);
    k1p = negateCt(k1neg, k1p);
    k2p = negateCt(k2neg, k2p);
    return k1p.add(k2p);
  }
  __name(finishEndo, "finishEndo");
  const _Point = class _Point {
    /** Does NOT validate if the point is valid. Use `.assertValidity()`. */
    constructor(X, Y, Z) {
      this.X = acoord("x", X);
      this.Y = acoord("y", Y, true);
      this.Z = acoord("z", Z);
      Object.freeze(this);
    }
    static CURVE() {
      return CURVE;
    }
    /** Does NOT validate if the point is valid. Use `.assertValidity()`. */
    static fromAffine(p) {
      const { x, y } = p || {};
      if (!p || !Fp.isValid(x) || !Fp.isValid(y))
        throw new Error("invalid affine point");
      if (p instanceof _Point)
        throw new Error("projective point not allowed");
      if (Fp.is0(x) && Fp.is0(y))
        return _Point.ZERO;
      return new _Point(x, y, Fp.ONE);
    }
    static fromBytes(bytes) {
      const P = _Point.fromAffine(decodePoint(_abytes2(bytes, void 0, "point")));
      P.assertValidity();
      return P;
    }
    static fromHex(hex) {
      return _Point.fromBytes(ensureBytes("pointHex", hex));
    }
    get x() {
      return this.toAffine().x;
    }
    get y() {
      return this.toAffine().y;
    }
    /**
     *
     * @param windowSize
     * @param isLazy true will defer table computation until the first multiplication
     * @returns
     */
    precompute(windowSize = 8, isLazy = true) {
      wnaf.createCache(this, windowSize);
      if (!isLazy)
        this.multiply(_3n2);
      return this;
    }
    // TODO: return `this`
    /** A point on curve is valid if it conforms to equation. */
    assertValidity() {
      assertValidMemo(this);
    }
    hasEvenY() {
      const { y } = this.toAffine();
      if (!Fp.isOdd)
        throw new Error("Field doesn't support isOdd");
      return !Fp.isOdd(y);
    }
    /** Compare one point to another. */
    equals(other) {
      aprjpoint(other);
      const { X: X1, Y: Y1, Z: Z1 } = this;
      const { X: X2, Y: Y2, Z: Z2 } = other;
      const U1 = Fp.eql(Fp.mul(X1, Z2), Fp.mul(X2, Z1));
      const U2 = Fp.eql(Fp.mul(Y1, Z2), Fp.mul(Y2, Z1));
      return U1 && U2;
    }
    /** Flips point to one corresponding to (x, -y) in Affine coordinates. */
    negate() {
      return new _Point(this.X, Fp.neg(this.Y), this.Z);
    }
    // Renes-Costello-Batina exception-free doubling formula.
    // There is 30% faster Jacobian formula, but it is not complete.
    // https://eprint.iacr.org/2015/1060, algorithm 3
    // Cost: 8M + 3S + 3*a + 2*b3 + 15add.
    double() {
      const { a, b } = CURVE;
      const b3 = Fp.mul(b, _3n2);
      const { X: X1, Y: Y1, Z: Z1 } = this;
      let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
      let t0 = Fp.mul(X1, X1);
      let t1 = Fp.mul(Y1, Y1);
      let t2 = Fp.mul(Z1, Z1);
      let t3 = Fp.mul(X1, Y1);
      t3 = Fp.add(t3, t3);
      Z3 = Fp.mul(X1, Z1);
      Z3 = Fp.add(Z3, Z3);
      X3 = Fp.mul(a, Z3);
      Y3 = Fp.mul(b3, t2);
      Y3 = Fp.add(X3, Y3);
      X3 = Fp.sub(t1, Y3);
      Y3 = Fp.add(t1, Y3);
      Y3 = Fp.mul(X3, Y3);
      X3 = Fp.mul(t3, X3);
      Z3 = Fp.mul(b3, Z3);
      t2 = Fp.mul(a, t2);
      t3 = Fp.sub(t0, t2);
      t3 = Fp.mul(a, t3);
      t3 = Fp.add(t3, Z3);
      Z3 = Fp.add(t0, t0);
      t0 = Fp.add(Z3, t0);
      t0 = Fp.add(t0, t2);
      t0 = Fp.mul(t0, t3);
      Y3 = Fp.add(Y3, t0);
      t2 = Fp.mul(Y1, Z1);
      t2 = Fp.add(t2, t2);
      t0 = Fp.mul(t2, t3);
      X3 = Fp.sub(X3, t0);
      Z3 = Fp.mul(t2, t1);
      Z3 = Fp.add(Z3, Z3);
      Z3 = Fp.add(Z3, Z3);
      return new _Point(X3, Y3, Z3);
    }
    // Renes-Costello-Batina exception-free addition formula.
    // There is 30% faster Jacobian formula, but it is not complete.
    // https://eprint.iacr.org/2015/1060, algorithm 1
    // Cost: 12M + 0S + 3*a + 3*b3 + 23add.
    add(other) {
      aprjpoint(other);
      const { X: X1, Y: Y1, Z: Z1 } = this;
      const { X: X2, Y: Y2, Z: Z2 } = other;
      let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
      const a = CURVE.a;
      const b3 = Fp.mul(CURVE.b, _3n2);
      let t0 = Fp.mul(X1, X2);
      let t1 = Fp.mul(Y1, Y2);
      let t2 = Fp.mul(Z1, Z2);
      let t3 = Fp.add(X1, Y1);
      let t4 = Fp.add(X2, Y2);
      t3 = Fp.mul(t3, t4);
      t4 = Fp.add(t0, t1);
      t3 = Fp.sub(t3, t4);
      t4 = Fp.add(X1, Z1);
      let t5 = Fp.add(X2, Z2);
      t4 = Fp.mul(t4, t5);
      t5 = Fp.add(t0, t2);
      t4 = Fp.sub(t4, t5);
      t5 = Fp.add(Y1, Z1);
      X3 = Fp.add(Y2, Z2);
      t5 = Fp.mul(t5, X3);
      X3 = Fp.add(t1, t2);
      t5 = Fp.sub(t5, X3);
      Z3 = Fp.mul(a, t4);
      X3 = Fp.mul(b3, t2);
      Z3 = Fp.add(X3, Z3);
      X3 = Fp.sub(t1, Z3);
      Z3 = Fp.add(t1, Z3);
      Y3 = Fp.mul(X3, Z3);
      t1 = Fp.add(t0, t0);
      t1 = Fp.add(t1, t0);
      t2 = Fp.mul(a, t2);
      t4 = Fp.mul(b3, t4);
      t1 = Fp.add(t1, t2);
      t2 = Fp.sub(t0, t2);
      t2 = Fp.mul(a, t2);
      t4 = Fp.add(t4, t2);
      t0 = Fp.mul(t1, t4);
      Y3 = Fp.add(Y3, t0);
      t0 = Fp.mul(t5, t4);
      X3 = Fp.mul(t3, X3);
      X3 = Fp.sub(X3, t0);
      t0 = Fp.mul(t3, t1);
      Z3 = Fp.mul(t5, Z3);
      Z3 = Fp.add(Z3, t0);
      return new _Point(X3, Y3, Z3);
    }
    subtract(other) {
      return this.add(other.negate());
    }
    is0() {
      return this.equals(_Point.ZERO);
    }
    /**
     * Constant time multiplication.
     * Uses wNAF method. Windowed method may be 10% faster,
     * but takes 2x longer to generate and consumes 2x memory.
     * Uses precomputes when available.
     * Uses endomorphism for Koblitz curves.
     * @param scalar by which the point would be multiplied
     * @returns New point
     */
    multiply(scalar) {
      const { endo: endo2 } = extraOpts;
      if (!Fn.isValidNot0(scalar))
        throw new Error("invalid scalar: out of range");
      let point, fake;
      const mul = /* @__PURE__ */ __name((n) => wnaf.cached(this, n, (p) => normalizeZ(_Point, p)), "mul");
      if (endo2) {
        const { k1neg, k1, k2neg, k2 } = splitEndoScalarN(scalar);
        const { p: k1p, f: k1f } = mul(k1);
        const { p: k2p, f: k2f } = mul(k2);
        fake = k1f.add(k2f);
        point = finishEndo(endo2.beta, k1p, k2p, k1neg, k2neg);
      } else {
        const { p, f } = mul(scalar);
        point = p;
        fake = f;
      }
      return normalizeZ(_Point, [point, fake])[0];
    }
    /**
     * Non-constant-time multiplication. Uses double-and-add algorithm.
     * It's faster, but should only be used when you don't care about
     * an exposed secret key e.g. sig verification, which works over *public* keys.
     */
    multiplyUnsafe(sc) {
      const { endo: endo2 } = extraOpts;
      const p = this;
      if (!Fn.isValid(sc))
        throw new Error("invalid scalar: out of range");
      if (sc === _0n4 || p.is0())
        return _Point.ZERO;
      if (sc === _1n4)
        return p;
      if (wnaf.hasCache(this))
        return this.multiply(sc);
      if (endo2) {
        const { k1neg, k1, k2neg, k2 } = splitEndoScalarN(sc);
        const { p1, p2 } = mulEndoUnsafe(_Point, p, k1, k2);
        return finishEndo(endo2.beta, p1, p2, k1neg, k2neg);
      } else {
        return wnaf.unsafe(p, sc);
      }
    }
    multiplyAndAddUnsafe(Q, a, b) {
      const sum = this.multiplyUnsafe(a).add(Q.multiplyUnsafe(b));
      return sum.is0() ? void 0 : sum;
    }
    /**
     * Converts Projective point to affine (x, y) coordinates.
     * @param invertedZ Z^-1 (inverted zero) - optional, precomputation is useful for invertBatch
     */
    toAffine(invertedZ) {
      return toAffineMemo(this, invertedZ);
    }
    /**
     * Checks whether Point is free of torsion elements (is in prime subgroup).
     * Always torsion-free for cofactor=1 curves.
     */
    isTorsionFree() {
      const { isTorsionFree } = extraOpts;
      if (cofactor === _1n4)
        return true;
      if (isTorsionFree)
        return isTorsionFree(_Point, this);
      return wnaf.unsafe(this, CURVE_ORDER).is0();
    }
    clearCofactor() {
      const { clearCofactor } = extraOpts;
      if (cofactor === _1n4)
        return this;
      if (clearCofactor)
        return clearCofactor(_Point, this);
      return this.multiplyUnsafe(cofactor);
    }
    isSmallOrder() {
      return this.multiplyUnsafe(cofactor).is0();
    }
    toBytes(isCompressed = true) {
      _abool2(isCompressed, "isCompressed");
      this.assertValidity();
      return encodePoint(_Point, this, isCompressed);
    }
    toHex(isCompressed = true) {
      return bytesToHex(this.toBytes(isCompressed));
    }
    toString() {
      return `<Point ${this.is0() ? "ZERO" : this.toHex()}>`;
    }
    // TODO: remove
    get px() {
      return this.X;
    }
    get py() {
      return this.X;
    }
    get pz() {
      return this.Z;
    }
    toRawBytes(isCompressed = true) {
      return this.toBytes(isCompressed);
    }
    _setWindowSize(windowSize) {
      this.precompute(windowSize);
    }
    static normalizeZ(points) {
      return normalizeZ(_Point, points);
    }
    static msm(points, scalars) {
      return pippenger(_Point, Fn, points, scalars);
    }
    static fromPrivateKey(privateKey) {
      return _Point.BASE.multiply(_normFnElement(Fn, privateKey));
    }
  };
  __name(_Point, "Point");
  let Point = _Point;
  Point.BASE = new Point(CURVE.Gx, CURVE.Gy, Fp.ONE);
  Point.ZERO = new Point(Fp.ZERO, Fp.ONE, Fp.ZERO);
  Point.Fp = Fp;
  Point.Fn = Fn;
  const bits = Fn.BITS;
  const wnaf = new wNAF(Point, extraOpts.endo ? Math.ceil(bits / 2) : bits);
  Point.BASE.precompute(8);
  return Point;
}
function pprefix(hasEvenY) {
  return Uint8Array.of(hasEvenY ? 2 : 3);
}
function getWLengths(Fp, Fn) {
  return {
    secretKey: Fn.BYTES,
    publicKey: 1 + Fp.BYTES,
    publicKeyUncompressed: 1 + 2 * Fp.BYTES,
    publicKeyHasPrefix: true,
    signature: 2 * Fn.BYTES
  };
}
function ecdh(Point, ecdhOpts = {}) {
  const { Fn } = Point;
  const randomBytes_ = ecdhOpts.randomBytes || randomBytes;
  const lengths = Object.assign(getWLengths(Point.Fp, Fn), { seed: getMinHashLength(Fn.ORDER) });
  function isValidSecretKey(secretKey) {
    try {
      return !!_normFnElement(Fn, secretKey);
    } catch (error2) {
      return false;
    }
  }
  __name(isValidSecretKey, "isValidSecretKey");
  function isValidPublicKey(publicKey, isCompressed) {
    const { publicKey: comp, publicKeyUncompressed } = lengths;
    try {
      const l = publicKey.length;
      if (isCompressed === true && l !== comp)
        return false;
      if (isCompressed === false && l !== publicKeyUncompressed)
        return false;
      return !!Point.fromBytes(publicKey);
    } catch (error2) {
      return false;
    }
  }
  __name(isValidPublicKey, "isValidPublicKey");
  function randomSecretKey(seed = randomBytes_(lengths.seed)) {
    return mapHashToField(_abytes2(seed, lengths.seed, "seed"), Fn.ORDER);
  }
  __name(randomSecretKey, "randomSecretKey");
  function getPublicKey(secretKey, isCompressed = true) {
    return Point.BASE.multiply(_normFnElement(Fn, secretKey)).toBytes(isCompressed);
  }
  __name(getPublicKey, "getPublicKey");
  function keygen(seed) {
    const secretKey = randomSecretKey(seed);
    return { secretKey, publicKey: getPublicKey(secretKey) };
  }
  __name(keygen, "keygen");
  function isProbPub(item) {
    if (typeof item === "bigint")
      return false;
    if (item instanceof Point)
      return true;
    const { secretKey, publicKey, publicKeyUncompressed } = lengths;
    if (Fn.allowedLengths || secretKey === publicKey)
      return void 0;
    const l = ensureBytes("key", item).length;
    return l === publicKey || l === publicKeyUncompressed;
  }
  __name(isProbPub, "isProbPub");
  function getSharedSecret(secretKeyA, publicKeyB, isCompressed = true) {
    if (isProbPub(secretKeyA) === true)
      throw new Error("first arg must be private key");
    if (isProbPub(publicKeyB) === false)
      throw new Error("second arg must be public key");
    const s = _normFnElement(Fn, secretKeyA);
    const b = Point.fromHex(publicKeyB);
    return b.multiply(s).toBytes(isCompressed);
  }
  __name(getSharedSecret, "getSharedSecret");
  const utils = {
    isValidSecretKey,
    isValidPublicKey,
    randomSecretKey,
    // TODO: remove
    isValidPrivateKey: isValidSecretKey,
    randomPrivateKey: randomSecretKey,
    normPrivateKeyToScalar: (key) => _normFnElement(Fn, key),
    precompute(windowSize = 8, point = Point.BASE) {
      return point.precompute(windowSize, false);
    }
  };
  return Object.freeze({ getPublicKey, getSharedSecret, keygen, Point, utils, lengths });
}
function ecdsa(Point, hash, ecdsaOpts = {}) {
  ahash(hash);
  _validateObject(ecdsaOpts, {}, {
    hmac: "function",
    lowS: "boolean",
    randomBytes: "function",
    bits2int: "function",
    bits2int_modN: "function"
  });
  const randomBytes3 = ecdsaOpts.randomBytes || randomBytes;
  const hmac2 = ecdsaOpts.hmac || ((key, ...msgs) => hmac(hash, key, concatBytes(...msgs)));
  const { Fp, Fn } = Point;
  const { ORDER: CURVE_ORDER, BITS: fnBits } = Fn;
  const { keygen, getPublicKey, getSharedSecret, utils, lengths } = ecdh(Point, ecdsaOpts);
  const defaultSigOpts = {
    prehash: false,
    lowS: typeof ecdsaOpts.lowS === "boolean" ? ecdsaOpts.lowS : false,
    format: void 0,
    //'compact' as ECDSASigFormat,
    extraEntropy: false
  };
  const defaultSigOpts_format = "compact";
  function isBiggerThanHalfOrder(number) {
    const HALF = CURVE_ORDER >> _1n4;
    return number > HALF;
  }
  __name(isBiggerThanHalfOrder, "isBiggerThanHalfOrder");
  function validateRS(title, num2) {
    if (!Fn.isValidNot0(num2))
      throw new Error(`invalid signature ${title}: out of range 1..Point.Fn.ORDER`);
    return num2;
  }
  __name(validateRS, "validateRS");
  function validateSigLength(bytes, format) {
    validateSigFormat(format);
    const size = lengths.signature;
    const sizer = format === "compact" ? size : format === "recovered" ? size + 1 : void 0;
    return _abytes2(bytes, sizer, `${format} signature`);
  }
  __name(validateSigLength, "validateSigLength");
  const _Signature = class _Signature {
    constructor(r, s, recovery) {
      this.r = validateRS("r", r);
      this.s = validateRS("s", s);
      if (recovery != null)
        this.recovery = recovery;
      Object.freeze(this);
    }
    static fromBytes(bytes, format = defaultSigOpts_format) {
      validateSigLength(bytes, format);
      let recid;
      if (format === "der") {
        const { r: r2, s: s2 } = DER.toSig(_abytes2(bytes));
        return new _Signature(r2, s2);
      }
      if (format === "recovered") {
        recid = bytes[0];
        format = "compact";
        bytes = bytes.subarray(1);
      }
      const L = Fn.BYTES;
      const r = bytes.subarray(0, L);
      const s = bytes.subarray(L, L * 2);
      return new _Signature(Fn.fromBytes(r), Fn.fromBytes(s), recid);
    }
    static fromHex(hex, format) {
      return this.fromBytes(hexToBytes(hex), format);
    }
    addRecoveryBit(recovery) {
      return new _Signature(this.r, this.s, recovery);
    }
    recoverPublicKey(messageHash) {
      const FIELD_ORDER = Fp.ORDER;
      const { r, s, recovery: rec } = this;
      if (rec == null || ![0, 1, 2, 3].includes(rec))
        throw new Error("recovery id invalid");
      const hasCofactor = CURVE_ORDER * _2n2 < FIELD_ORDER;
      if (hasCofactor && rec > 1)
        throw new Error("recovery id is ambiguous for h>1 curve");
      const radj = rec === 2 || rec === 3 ? r + CURVE_ORDER : r;
      if (!Fp.isValid(radj))
        throw new Error("recovery id 2 or 3 invalid");
      const x = Fp.toBytes(radj);
      const R = Point.fromBytes(concatBytes(pprefix((rec & 1) === 0), x));
      const ir = Fn.inv(radj);
      const h = bits2int_modN(ensureBytes("msgHash", messageHash));
      const u1 = Fn.create(-h * ir);
      const u2 = Fn.create(s * ir);
      const Q = Point.BASE.multiplyUnsafe(u1).add(R.multiplyUnsafe(u2));
      if (Q.is0())
        throw new Error("point at infinify");
      Q.assertValidity();
      return Q;
    }
    // Signatures should be low-s, to prevent malleability.
    hasHighS() {
      return isBiggerThanHalfOrder(this.s);
    }
    toBytes(format = defaultSigOpts_format) {
      validateSigFormat(format);
      if (format === "der")
        return hexToBytes(DER.hexFromSig(this));
      const r = Fn.toBytes(this.r);
      const s = Fn.toBytes(this.s);
      if (format === "recovered") {
        if (this.recovery == null)
          throw new Error("recovery bit must be present");
        return concatBytes(Uint8Array.of(this.recovery), r, s);
      }
      return concatBytes(r, s);
    }
    toHex(format) {
      return bytesToHex(this.toBytes(format));
    }
    // TODO: remove
    assertValidity() {
    }
    static fromCompact(hex) {
      return _Signature.fromBytes(ensureBytes("sig", hex), "compact");
    }
    static fromDER(hex) {
      return _Signature.fromBytes(ensureBytes("sig", hex), "der");
    }
    normalizeS() {
      return this.hasHighS() ? new _Signature(this.r, Fn.neg(this.s), this.recovery) : this;
    }
    toDERRawBytes() {
      return this.toBytes("der");
    }
    toDERHex() {
      return bytesToHex(this.toBytes("der"));
    }
    toCompactRawBytes() {
      return this.toBytes("compact");
    }
    toCompactHex() {
      return bytesToHex(this.toBytes("compact"));
    }
  };
  __name(_Signature, "Signature");
  let Signature = _Signature;
  const bits2int = ecdsaOpts.bits2int || /* @__PURE__ */ __name(function bits2int_def(bytes) {
    if (bytes.length > 8192)
      throw new Error("input is too large");
    const num2 = bytesToNumberBE(bytes);
    const delta = bytes.length * 8 - fnBits;
    return delta > 0 ? num2 >> BigInt(delta) : num2;
  }, "bits2int_def");
  const bits2int_modN = ecdsaOpts.bits2int_modN || /* @__PURE__ */ __name(function bits2int_modN_def(bytes) {
    return Fn.create(bits2int(bytes));
  }, "bits2int_modN_def");
  const ORDER_MASK = bitMask(fnBits);
  function int2octets(num2) {
    aInRange("num < 2^" + fnBits, num2, _0n4, ORDER_MASK);
    return Fn.toBytes(num2);
  }
  __name(int2octets, "int2octets");
  function validateMsgAndHash(message, prehash) {
    _abytes2(message, void 0, "message");
    return prehash ? _abytes2(hash(message), void 0, "prehashed message") : message;
  }
  __name(validateMsgAndHash, "validateMsgAndHash");
  function prepSig(message, privateKey, opts) {
    if (["recovered", "canonical"].some((k) => k in opts))
      throw new Error("sign() legacy options not supported");
    const { lowS, prehash, extraEntropy } = validateSigOpts(opts, defaultSigOpts);
    message = validateMsgAndHash(message, prehash);
    const h1int = bits2int_modN(message);
    const d = _normFnElement(Fn, privateKey);
    const seedArgs = [int2octets(d), int2octets(h1int)];
    if (extraEntropy != null && extraEntropy !== false) {
      const e = extraEntropy === true ? randomBytes3(lengths.secretKey) : extraEntropy;
      seedArgs.push(ensureBytes("extraEntropy", e));
    }
    const seed = concatBytes(...seedArgs);
    const m = h1int;
    function k2sig(kBytes) {
      const k = bits2int(kBytes);
      if (!Fn.isValidNot0(k))
        return;
      const ik = Fn.inv(k);
      const q = Point.BASE.multiply(k).toAffine();
      const r = Fn.create(q.x);
      if (r === _0n4)
        return;
      const s = Fn.create(ik * Fn.create(m + r * d));
      if (s === _0n4)
        return;
      let recovery = (q.x === r ? 0 : 2) | Number(q.y & _1n4);
      let normS = s;
      if (lowS && isBiggerThanHalfOrder(s)) {
        normS = Fn.neg(s);
        recovery ^= 1;
      }
      return new Signature(r, normS, recovery);
    }
    __name(k2sig, "k2sig");
    return { seed, k2sig };
  }
  __name(prepSig, "prepSig");
  function sign(message, secretKey, opts = {}) {
    message = ensureBytes("message", message);
    const { seed, k2sig } = prepSig(message, secretKey, opts);
    const drbg = createHmacDrbg(hash.outputLen, Fn.BYTES, hmac2);
    const sig = drbg(seed, k2sig);
    return sig;
  }
  __name(sign, "sign");
  function tryParsingSig(sg) {
    let sig = void 0;
    const isHex = typeof sg === "string" || isBytes(sg);
    const isObj = !isHex && sg !== null && typeof sg === "object" && typeof sg.r === "bigint" && typeof sg.s === "bigint";
    if (!isHex && !isObj)
      throw new Error("invalid signature, expected Uint8Array, hex string or Signature instance");
    if (isObj) {
      sig = new Signature(sg.r, sg.s);
    } else if (isHex) {
      try {
        sig = Signature.fromBytes(ensureBytes("sig", sg), "der");
      } catch (derError) {
        if (!(derError instanceof DER.Err))
          throw derError;
      }
      if (!sig) {
        try {
          sig = Signature.fromBytes(ensureBytes("sig", sg), "compact");
        } catch (error2) {
          return false;
        }
      }
    }
    if (!sig)
      return false;
    return sig;
  }
  __name(tryParsingSig, "tryParsingSig");
  function verify(signature, message, publicKey, opts = {}) {
    const { lowS, prehash, format } = validateSigOpts(opts, defaultSigOpts);
    publicKey = ensureBytes("publicKey", publicKey);
    message = validateMsgAndHash(ensureBytes("message", message), prehash);
    if ("strict" in opts)
      throw new Error("options.strict was renamed to lowS");
    const sig = format === void 0 ? tryParsingSig(signature) : Signature.fromBytes(ensureBytes("sig", signature), format);
    if (sig === false)
      return false;
    try {
      const P = Point.fromBytes(publicKey);
      if (lowS && sig.hasHighS())
        return false;
      const { r, s } = sig;
      const h = bits2int_modN(message);
      const is = Fn.inv(s);
      const u1 = Fn.create(h * is);
      const u2 = Fn.create(r * is);
      const R = Point.BASE.multiplyUnsafe(u1).add(P.multiplyUnsafe(u2));
      if (R.is0())
        return false;
      const v = Fn.create(R.x);
      return v === r;
    } catch (e) {
      return false;
    }
  }
  __name(verify, "verify");
  function recoverPublicKey(signature, message, opts = {}) {
    const { prehash } = validateSigOpts(opts, defaultSigOpts);
    message = validateMsgAndHash(message, prehash);
    return Signature.fromBytes(signature, "recovered").recoverPublicKey(message).toBytes();
  }
  __name(recoverPublicKey, "recoverPublicKey");
  return Object.freeze({
    keygen,
    getPublicKey,
    getSharedSecret,
    utils,
    lengths,
    Point,
    sign,
    verify,
    recoverPublicKey,
    Signature,
    hash
  });
}
function _weierstrass_legacy_opts_to_new(c) {
  const CURVE = {
    a: c.a,
    b: c.b,
    p: c.Fp.ORDER,
    n: c.n,
    h: c.h,
    Gx: c.Gx,
    Gy: c.Gy
  };
  const Fp = c.Fp;
  let allowedLengths = c.allowedPrivateKeyLengths ? Array.from(new Set(c.allowedPrivateKeyLengths.map((l) => Math.ceil(l / 2)))) : void 0;
  const Fn = Field(CURVE.n, {
    BITS: c.nBitLength,
    allowedLengths,
    modFromBytes: c.wrapPrivateKey
  });
  const curveOpts = {
    Fp,
    Fn,
    allowInfinityPoint: c.allowInfinityPoint,
    endo: c.endo,
    isTorsionFree: c.isTorsionFree,
    clearCofactor: c.clearCofactor,
    fromBytes: c.fromBytes,
    toBytes: c.toBytes
  };
  return { CURVE, curveOpts };
}
function _ecdsa_legacy_opts_to_new(c) {
  const { CURVE, curveOpts } = _weierstrass_legacy_opts_to_new(c);
  const ecdsaOpts = {
    hmac: c.hmac,
    randomBytes: c.randomBytes,
    lowS: c.lowS,
    bits2int: c.bits2int,
    bits2int_modN: c.bits2int_modN
  };
  return { CURVE, curveOpts, hash: c.hash, ecdsaOpts };
}
function _ecdsa_new_output_to_legacy(c, _ecdsa) {
  const Point = _ecdsa.Point;
  return Object.assign({}, _ecdsa, {
    ProjectivePoint: Point,
    CURVE: Object.assign({}, c, nLength(Point.Fn.ORDER, Point.Fn.BITS))
  });
}
function weierstrass(c) {
  const { CURVE, curveOpts, hash, ecdsaOpts } = _ecdsa_legacy_opts_to_new(c);
  const Point = weierstrassN(CURVE, curveOpts);
  const signs = ecdsa(Point, hash, ecdsaOpts);
  return _ecdsa_new_output_to_legacy(c, signs);
}
var divNearest, _DERErr, DERErr, DER, _0n4, _1n4, _2n2, _3n2, _4n2;
var init_weierstrass = __esm({
  "node_modules/@noble/curves/esm/abstract/weierstrass.js"() {
    init_hmac();
    init_utils();
    init_utils2();
    init_curve();
    init_modular();
    divNearest = /* @__PURE__ */ __name((num2, den) => (num2 + (num2 >= 0 ? den : -den) / _2n2) / den, "divNearest");
    __name(_splitEndoScalar, "_splitEndoScalar");
    __name(validateSigFormat, "validateSigFormat");
    __name(validateSigOpts, "validateSigOpts");
    _DERErr = class _DERErr extends Error {
      constructor(m = "") {
        super(m);
      }
    };
    __name(_DERErr, "DERErr");
    DERErr = _DERErr;
    DER = {
      // asn.1 DER encoding utils
      Err: DERErr,
      // Basic building block is TLV (Tag-Length-Value)
      _tlv: {
        encode: (tag, data) => {
          const { Err: E } = DER;
          if (tag < 0 || tag > 256)
            throw new E("tlv.encode: wrong tag");
          if (data.length & 1)
            throw new E("tlv.encode: unpadded data");
          const dataLen = data.length / 2;
          const len = numberToHexUnpadded(dataLen);
          if (len.length / 2 & 128)
            throw new E("tlv.encode: long form length too big");
          const lenLen = dataLen > 127 ? numberToHexUnpadded(len.length / 2 | 128) : "";
          const t = numberToHexUnpadded(tag);
          return t + lenLen + len + data;
        },
        // v - value, l - left bytes (unparsed)
        decode(tag, data) {
          const { Err: E } = DER;
          let pos = 0;
          if (tag < 0 || tag > 256)
            throw new E("tlv.encode: wrong tag");
          if (data.length < 2 || data[pos++] !== tag)
            throw new E("tlv.decode: wrong tlv");
          const first = data[pos++];
          const isLong = !!(first & 128);
          let length = 0;
          if (!isLong)
            length = first;
          else {
            const lenLen = first & 127;
            if (!lenLen)
              throw new E("tlv.decode(long): indefinite length not supported");
            if (lenLen > 4)
              throw new E("tlv.decode(long): byte length is too big");
            const lengthBytes = data.subarray(pos, pos + lenLen);
            if (lengthBytes.length !== lenLen)
              throw new E("tlv.decode: length bytes not complete");
            if (lengthBytes[0] === 0)
              throw new E("tlv.decode(long): zero leftmost byte");
            for (const b of lengthBytes)
              length = length << 8 | b;
            pos += lenLen;
            if (length < 128)
              throw new E("tlv.decode(long): not minimal encoding");
          }
          const v = data.subarray(pos, pos + length);
          if (v.length !== length)
            throw new E("tlv.decode: wrong value length");
          return { v, l: data.subarray(pos + length) };
        }
      },
      // https://crypto.stackexchange.com/a/57734 Leftmost bit of first byte is 'negative' flag,
      // since we always use positive integers here. It must always be empty:
      // - add zero byte if exists
      // - if next byte doesn't have a flag, leading zero is not allowed (minimal encoding)
      _int: {
        encode(num2) {
          const { Err: E } = DER;
          if (num2 < _0n4)
            throw new E("integer: negative integers are not allowed");
          let hex = numberToHexUnpadded(num2);
          if (Number.parseInt(hex[0], 16) & 8)
            hex = "00" + hex;
          if (hex.length & 1)
            throw new E("unexpected DER parsing assertion: unpadded hex");
          return hex;
        },
        decode(data) {
          const { Err: E } = DER;
          if (data[0] & 128)
            throw new E("invalid signature integer: negative");
          if (data[0] === 0 && !(data[1] & 128))
            throw new E("invalid signature integer: unnecessary leading zero");
          return bytesToNumberBE(data);
        }
      },
      toSig(hex) {
        const { Err: E, _int: int, _tlv: tlv } = DER;
        const data = ensureBytes("signature", hex);
        const { v: seqBytes, l: seqLeftBytes } = tlv.decode(48, data);
        if (seqLeftBytes.length)
          throw new E("invalid signature: left bytes after parsing");
        const { v: rBytes, l: rLeftBytes } = tlv.decode(2, seqBytes);
        const { v: sBytes, l: sLeftBytes } = tlv.decode(2, rLeftBytes);
        if (sLeftBytes.length)
          throw new E("invalid signature: left bytes after parsing");
        return { r: int.decode(rBytes), s: int.decode(sBytes) };
      },
      hexFromSig(sig) {
        const { _tlv: tlv, _int: int } = DER;
        const rs = tlv.encode(2, int.encode(sig.r));
        const ss = tlv.encode(2, int.encode(sig.s));
        const seq = rs + ss;
        return tlv.encode(48, seq);
      }
    };
    _0n4 = BigInt(0);
    _1n4 = BigInt(1);
    _2n2 = BigInt(2);
    _3n2 = BigInt(3);
    _4n2 = BigInt(4);
    __name(_normFnElement, "_normFnElement");
    __name(weierstrassN, "weierstrassN");
    __name(pprefix, "pprefix");
    __name(getWLengths, "getWLengths");
    __name(ecdh, "ecdh");
    __name(ecdsa, "ecdsa");
    __name(_weierstrass_legacy_opts_to_new, "_weierstrass_legacy_opts_to_new");
    __name(_ecdsa_legacy_opts_to_new, "_ecdsa_legacy_opts_to_new");
    __name(_ecdsa_new_output_to_legacy, "_ecdsa_new_output_to_legacy");
    __name(weierstrass, "weierstrass");
  }
});

// node_modules/@noble/curves/esm/_shortw_utils.js
function createCurve(curveDef, defHash) {
  const create = /* @__PURE__ */ __name((hash) => weierstrass({ ...curveDef, hash }), "create");
  return { ...create(defHash), create };
}
var init_shortw_utils = __esm({
  "node_modules/@noble/curves/esm/_shortw_utils.js"() {
    init_weierstrass();
    __name(createCurve, "createCurve");
  }
});

// node_modules/@noble/curves/esm/secp256k1.js
function sqrtMod(y) {
  const P = secp256k1_CURVE.p;
  const _3n3 = BigInt(3), _6n = BigInt(6), _11n = BigInt(11), _22n = BigInt(22);
  const _23n = BigInt(23), _44n = BigInt(44), _88n = BigInt(88);
  const b2 = y * y * y % P;
  const b3 = b2 * b2 * y % P;
  const b6 = pow2(b3, _3n3, P) * b3 % P;
  const b9 = pow2(b6, _3n3, P) * b3 % P;
  const b11 = pow2(b9, _2n3, P) * b2 % P;
  const b22 = pow2(b11, _11n, P) * b11 % P;
  const b44 = pow2(b22, _22n, P) * b22 % P;
  const b88 = pow2(b44, _44n, P) * b44 % P;
  const b176 = pow2(b88, _88n, P) * b88 % P;
  const b220 = pow2(b176, _44n, P) * b44 % P;
  const b223 = pow2(b220, _3n3, P) * b3 % P;
  const t1 = pow2(b223, _23n, P) * b22 % P;
  const t2 = pow2(t1, _6n, P) * b2 % P;
  const root = pow2(t2, _2n3, P);
  if (!Fpk1.eql(Fpk1.sqr(root), y))
    throw new Error("Cannot find square root");
  return root;
}
function taggedHash(tag, ...messages) {
  let tagP = TAGGED_HASH_PREFIXES[tag];
  if (tagP === void 0) {
    const tagH = sha256(utf8ToBytes(tag));
    tagP = concatBytes(tagH, tagH);
    TAGGED_HASH_PREFIXES[tag] = tagP;
  }
  return sha256(concatBytes(tagP, ...messages));
}
function schnorrGetExtPubKey(priv) {
  const { Fn, BASE } = Pointk1;
  const d_ = _normFnElement(Fn, priv);
  const p = BASE.multiply(d_);
  const scalar = hasEven(p.y) ? d_ : Fn.neg(d_);
  return { scalar, bytes: pointToBytes(p) };
}
function lift_x(x) {
  const Fp = Fpk1;
  if (!Fp.isValidNot0(x))
    throw new Error("invalid x: Fail if x \u2265 p");
  const xx = Fp.create(x * x);
  const c = Fp.create(xx * x + BigInt(7));
  let y = Fp.sqrt(c);
  if (!hasEven(y))
    y = Fp.neg(y);
  const p = Pointk1.fromAffine({ x, y });
  p.assertValidity();
  return p;
}
function challenge(...args) {
  return Pointk1.Fn.create(num(taggedHash("BIP0340/challenge", ...args)));
}
function schnorrGetPublicKey(secretKey) {
  return schnorrGetExtPubKey(secretKey).bytes;
}
function schnorrSign(message, secretKey, auxRand = randomBytes(32)) {
  const { Fn } = Pointk1;
  const m = ensureBytes("message", message);
  const { bytes: px, scalar: d } = schnorrGetExtPubKey(secretKey);
  const a = ensureBytes("auxRand", auxRand, 32);
  const t = Fn.toBytes(d ^ num(taggedHash("BIP0340/aux", a)));
  const rand = taggedHash("BIP0340/nonce", t, px, m);
  const { bytes: rx, scalar: k } = schnorrGetExtPubKey(rand);
  const e = challenge(rx, px, m);
  const sig = new Uint8Array(64);
  sig.set(rx, 0);
  sig.set(Fn.toBytes(Fn.create(k + e * d)), 32);
  if (!schnorrVerify(sig, m, px))
    throw new Error("sign: Invalid signature produced");
  return sig;
}
function schnorrVerify(signature, message, publicKey) {
  const { Fn, BASE } = Pointk1;
  const sig = ensureBytes("signature", signature, 64);
  const m = ensureBytes("message", message);
  const pub = ensureBytes("publicKey", publicKey, 32);
  try {
    const P = lift_x(num(pub));
    const r = num(sig.subarray(0, 32));
    if (!inRange(r, _1n5, secp256k1_CURVE.p))
      return false;
    const s = num(sig.subarray(32, 64));
    if (!inRange(s, _1n5, secp256k1_CURVE.n))
      return false;
    const e = challenge(Fn.toBytes(r), pointToBytes(P), m);
    const R = BASE.multiplyUnsafe(s).add(P.multiplyUnsafe(Fn.neg(e)));
    const { x, y } = R.toAffine();
    if (R.is0() || !hasEven(y) || x !== r)
      return false;
    return true;
  } catch (error2) {
    return false;
  }
}
var secp256k1_CURVE, secp256k1_ENDO, _0n5, _1n5, _2n3, Fpk1, secp256k1, TAGGED_HASH_PREFIXES, pointToBytes, Pointk1, hasEven, num, schnorr;
var init_secp256k1 = __esm({
  "node_modules/@noble/curves/esm/secp256k1.js"() {
    init_sha2();
    init_utils();
    init_shortw_utils();
    init_modular();
    init_weierstrass();
    init_utils2();
    secp256k1_CURVE = {
      p: BigInt("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f"),
      n: BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141"),
      h: BigInt(1),
      a: BigInt(0),
      b: BigInt(7),
      Gx: BigInt("0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"),
      Gy: BigInt("0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8")
    };
    secp256k1_ENDO = {
      beta: BigInt("0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee"),
      basises: [
        [BigInt("0x3086d221a7d46bcde86c90e49284eb15"), -BigInt("0xe4437ed6010e88286f547fa90abfe4c3")],
        [BigInt("0x114ca50f7a8e2f3f657c1108d9d44cfd8"), BigInt("0x3086d221a7d46bcde86c90e49284eb15")]
      ]
    };
    _0n5 = /* @__PURE__ */ BigInt(0);
    _1n5 = /* @__PURE__ */ BigInt(1);
    _2n3 = /* @__PURE__ */ BigInt(2);
    __name(sqrtMod, "sqrtMod");
    Fpk1 = Field(secp256k1_CURVE.p, { sqrt: sqrtMod });
    secp256k1 = createCurve({ ...secp256k1_CURVE, Fp: Fpk1, lowS: true, endo: secp256k1_ENDO }, sha256);
    TAGGED_HASH_PREFIXES = {};
    __name(taggedHash, "taggedHash");
    pointToBytes = /* @__PURE__ */ __name((point) => point.toBytes(true).slice(1), "pointToBytes");
    Pointk1 = /* @__PURE__ */ (() => secp256k1.Point)();
    hasEven = /* @__PURE__ */ __name((y) => y % _2n3 === _0n5, "hasEven");
    __name(schnorrGetExtPubKey, "schnorrGetExtPubKey");
    __name(lift_x, "lift_x");
    num = bytesToNumberBE;
    __name(challenge, "challenge");
    __name(schnorrGetPublicKey, "schnorrGetPublicKey");
    __name(schnorrSign, "schnorrSign");
    __name(schnorrVerify, "schnorrVerify");
    schnorr = /* @__PURE__ */ (() => {
      const size = 32;
      const seedLength = 48;
      const randomSecretKey = /* @__PURE__ */ __name((seed = randomBytes(seedLength)) => {
        return mapHashToField(seed, secp256k1_CURVE.n);
      }, "randomSecretKey");
      secp256k1.utils.randomSecretKey;
      function keygen(seed) {
        const secretKey = randomSecretKey(seed);
        return { secretKey, publicKey: schnorrGetPublicKey(secretKey) };
      }
      __name(keygen, "keygen");
      return {
        keygen,
        getPublicKey: schnorrGetPublicKey,
        sign: schnorrSign,
        verify: schnorrVerify,
        Point: Pointk1,
        utils: {
          randomSecretKey,
          randomPrivateKey: randomSecretKey,
          taggedHash,
          // TODO: remove
          lift_x,
          pointToBytes,
          numberToBytesBE,
          bytesToNumberBE,
          mod
        },
        lengths: {
          secretKey: size,
          publicKey: size,
          publicKeyHasPrefix: false,
          signature: size * 2,
          seed: seedLength
        }
      };
    })();
  }
});

// src/relay/services/registry.ts
var _ExtensionRegistry, ExtensionRegistry, extensionRegistry;
var init_registry = __esm({
  "src/relay/services/registry.ts"() {
    "use strict";
    _ExtensionRegistry = class _ExtensionRegistry {
      constructor() {
        this.extensions = /* @__PURE__ */ new Map();
      }
      /**
       * Register a protocol extension.
       */
      register(extension) {
        if (this.extensions.has(extension.name)) {
          throw new Error(`Extension "${extension.name}" is already registered`);
        }
        this.extensions.set(extension.name, extension);
        console.log(`Registered extension: ${extension.name}`);
      }
      /**
       * Unregister a protocol extension.
       */
      unregister(name) {
        this.extensions.delete(name);
      }
      /**
       * Get all registered extensions.
       */
      getAll() {
        return Array.from(this.extensions.values());
      }
      /**
       * Find an extension that can handle the given event.
       * Returns the first matching extension, or null if none match.
       */
      findHandler(event, context) {
        for (const ext of this.extensions.values()) {
          if (ext.canHandleEvent(event, context)) {
            return ext;
          }
        }
        return null;
      }
      /**
       * Check all extensions for query authorization.
       * If any extension denies the query, it's denied.
       * If no extension handles it, default policy applies.
       */
      async authorizeQuery(filters, context) {
        for (const ext of this.extensions.values()) {
          if (ext.authorizeQuery) {
            const result = await ext.authorizeQuery(filters, context);
            if (!result.allowed) {
              return result;
            }
          }
        }
        return { allowed: true };
      }
    };
    __name(_ExtensionRegistry, "ExtensionRegistry");
    ExtensionRegistry = _ExtensionRegistry;
    extensionRegistry = new ExtensionRegistry();
  }
});

// node_modules/@noble/hashes/esm/hkdf.js
function extract(hash, ikm, salt) {
  ahash(hash);
  if (salt === void 0)
    salt = new Uint8Array(hash.outputLen);
  return hmac(hash, toBytes(salt), toBytes(ikm));
}
function expand(hash, prk, info, length = 32) {
  ahash(hash);
  anumber(length);
  const olen = hash.outputLen;
  if (length > 255 * olen)
    throw new Error("Length should be <= 255*HashLen");
  const blocks = Math.ceil(length / olen);
  if (info === void 0)
    info = EMPTY_BUFFER;
  const okm = new Uint8Array(blocks * olen);
  const HMAC2 = hmac.create(hash, prk);
  const HMACTmp = HMAC2._cloneInto();
  const T = new Uint8Array(HMAC2.outputLen);
  for (let counter = 0; counter < blocks; counter++) {
    HKDF_COUNTER[0] = counter + 1;
    HMACTmp.update(counter === 0 ? EMPTY_BUFFER : T).update(info).update(HKDF_COUNTER).digestInto(T);
    okm.set(T, olen * counter);
    HMAC2._cloneInto(HMACTmp);
  }
  HMAC2.destroy();
  HMACTmp.destroy();
  clean(T, HKDF_COUNTER);
  return okm.slice(0, length);
}
var HKDF_COUNTER, EMPTY_BUFFER;
var init_hkdf = __esm({
  "node_modules/@noble/hashes/esm/hkdf.js"() {
    init_hmac();
    init_utils();
    __name(extract, "extract");
    HKDF_COUNTER = /* @__PURE__ */ Uint8Array.from([0]);
    EMPTY_BUFFER = /* @__PURE__ */ Uint8Array.of();
    __name(expand, "expand");
  }
});

// node_modules/@noble/hashes/esm/sha256.js
var sha2562;
var init_sha256 = __esm({
  "node_modules/@noble/hashes/esm/sha256.js"() {
    init_sha2();
    sha2562 = sha256;
  }
});

// node_modules/@noble/ciphers/utils.js
function isBytes2(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array" && "BYTES_PER_ELEMENT" in a && a.BYTES_PER_ELEMENT === 1;
}
function abool(b) {
  if (typeof b !== "boolean")
    throw new TypeError(`boolean expected, not ${b}`);
}
function anumber2(n) {
  if (typeof n !== "number")
    throw new TypeError("number expected, got " + typeof n);
  if (!Number.isSafeInteger(n) || n < 0)
    throw new RangeError("positive integer expected, got " + n);
}
function abytes2(value, length, title = "") {
  const bytes = isBytes2(value);
  const len = value?.length;
  const needsLen = length !== void 0;
  if (!bytes || needsLen && len !== length) {
    const prefix = title && `"${title}" `;
    const ofLen = needsLen ? ` of length ${length}` : "";
    const got = bytes ? `length=${len}` : `type=${typeof value}`;
    const message = prefix + "expected Uint8Array" + ofLen + ", got " + got;
    if (!bytes)
      throw new TypeError(message);
    throw new RangeError(message);
  }
  return value;
}
function u32(arr) {
  return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
}
function clean2(...arrays) {
  for (let i = 0; i < arrays.length; i++) {
    arrays[i].fill(0);
  }
}
function checkOpts(defaults, opts) {
  if (opts == null || typeof opts !== "object")
    throw new Error("options must be defined");
  const merged = Object.assign(defaults, opts);
  return merged;
}
function getOutput(expectedLength, out, onlyAligned = true) {
  if (out === void 0)
    return new Uint8Array(expectedLength);
  abytes2(out, void 0, "output");
  if (out.length !== expectedLength)
    throw new Error('"output" expected Uint8Array of length ' + expectedLength + ", got: " + out.length);
  if (onlyAligned && !isAligned32(out))
    throw new Error("invalid output, must be aligned");
  return out;
}
function isAligned32(bytes) {
  return bytes.byteOffset % 4 === 0;
}
function copyBytes(bytes) {
  return Uint8Array.from(abytes2(bytes));
}
function randomBytes2(bytesLength = 32) {
  anumber2(bytesLength);
  const cr = typeof globalThis === "object" ? globalThis.crypto : null;
  if (typeof cr?.getRandomValues !== "function")
    throw new Error("crypto.getRandomValues must be defined");
  return cr.getRandomValues(new Uint8Array(bytesLength));
}
var isLE, byteSwap, byteSwap32, swap32IfBE;
var init_utils3 = __esm({
  "node_modules/@noble/ciphers/utils.js"() {
    __name(isBytes2, "isBytes");
    __name(abool, "abool");
    __name(anumber2, "anumber");
    __name(abytes2, "abytes");
    __name(u32, "u32");
    __name(clean2, "clean");
    isLE = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
    byteSwap = /* @__PURE__ */ __name((word) => word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255, "byteSwap");
    byteSwap32 = /* @__PURE__ */ __name((arr) => {
      for (let i = 0; i < arr.length; i++)
        arr[i] = byteSwap(arr[i]);
      return arr;
    }, "byteSwap32");
    swap32IfBE = isLE ? (u) => u : byteSwap32;
    __name(checkOpts, "checkOpts");
    __name(getOutput, "getOutput");
    __name(isAligned32, "isAligned32");
    __name(copyBytes, "copyBytes");
    __name(randomBytes2, "randomBytes");
  }
});

// node_modules/@noble/ciphers/_arx.js
function rotl(a, b) {
  return a << b | a >>> 32 - b;
}
function runCipher(core, sigma, key, nonce, data, output, counter, rounds) {
  const len = data.length;
  const block = new Uint8Array(BLOCK_LEN);
  const b32 = u32(block);
  const isAligned = isLE && isAligned32(data) && isAligned32(output);
  const d32 = isAligned ? u32(data) : U32_EMPTY;
  const o32 = isAligned ? u32(output) : U32_EMPTY;
  if (!isLE) {
    for (let pos = 0; pos < len; counter++) {
      core(sigma, key, nonce, b32, counter, rounds);
      swap32IfBE(b32);
      if (counter >= MAX_COUNTER)
        throw new Error("arx: counter overflow");
      const take = Math.min(BLOCK_LEN, len - pos);
      for (let j = 0, posj; j < take; j++) {
        posj = pos + j;
        output[posj] = data[posj] ^ block[j];
      }
      pos += take;
    }
    return;
  }
  for (let pos = 0; pos < len; counter++) {
    core(sigma, key, nonce, b32, counter, rounds);
    if (counter >= MAX_COUNTER)
      throw new Error("arx: counter overflow");
    const take = Math.min(BLOCK_LEN, len - pos);
    if (isAligned && take === BLOCK_LEN) {
      const pos32 = pos / 4;
      if (pos % 4 !== 0)
        throw new Error("arx: invalid block position");
      for (let j = 0, posj; j < BLOCK_LEN32; j++) {
        posj = pos32 + j;
        o32[posj] = d32[posj] ^ b32[j];
      }
      pos += BLOCK_LEN;
      continue;
    }
    for (let j = 0, posj; j < take; j++) {
      posj = pos + j;
      output[posj] = data[posj] ^ block[j];
    }
    pos += take;
  }
}
function createCipher(core, opts) {
  const { allowShortKeys, extendNonceFn, counterLength, counterRight, rounds } = checkOpts({ allowShortKeys: false, counterLength: 8, counterRight: false, rounds: 20 }, opts);
  if (typeof core !== "function")
    throw new Error("core must be a function");
  anumber2(counterLength);
  anumber2(rounds);
  abool(counterRight);
  abool(allowShortKeys);
  return (key, nonce, data, output, counter = 0) => {
    abytes2(key, void 0, "key");
    abytes2(nonce, void 0, "nonce");
    abytes2(data, void 0, "data");
    const len = data.length;
    output = getOutput(len, output, false);
    anumber2(counter);
    if (counter < 0 || counter >= MAX_COUNTER)
      throw new Error("arx: counter overflow");
    const toClean = [];
    let l = key.length;
    let k;
    let sigma;
    if (l === 32) {
      toClean.push(k = copyBytes(key));
      sigma = sigma32_32;
    } else if (l === 16 && allowShortKeys) {
      k = new Uint8Array(32);
      k.set(key);
      k.set(key, 16);
      sigma = sigma16_32;
      toClean.push(k);
    } else {
      abytes2(key, 32, "arx key");
      throw new Error("invalid key size");
    }
    if (!isLE || !isAligned32(nonce))
      toClean.push(nonce = copyBytes(nonce));
    let k32 = u32(k);
    if (extendNonceFn) {
      if (nonce.length !== 24)
        throw new Error(`arx: extended nonce must be 24 bytes`);
      const n16 = nonce.subarray(0, 16);
      if (isLE)
        extendNonceFn(sigma, k32, u32(n16), k32);
      else {
        const sigmaRaw = swap32IfBE(Uint32Array.from(sigma));
        extendNonceFn(sigmaRaw, k32, u32(n16), k32);
        clean2(sigmaRaw);
        swap32IfBE(k32);
      }
      nonce = nonce.subarray(16);
    } else if (!isLE)
      swap32IfBE(k32);
    const nonceNcLen = 16 - counterLength;
    if (nonceNcLen !== nonce.length)
      throw new Error(`arx: nonce must be ${nonceNcLen} or 16 bytes`);
    if (nonceNcLen !== 12) {
      const nc = new Uint8Array(12);
      nc.set(nonce, counterRight ? 0 : 12 - nonce.length);
      nonce = nc;
      toClean.push(nonce);
    }
    const n32 = swap32IfBE(u32(nonce));
    try {
      runCipher(core, sigma, k32, n32, data, output, counter, rounds);
      return output;
    } finally {
      clean2(...toClean);
    }
  };
}
var encodeStr, sigma16_32, sigma32_32, BLOCK_LEN, BLOCK_LEN32, MAX_COUNTER, U32_EMPTY;
var init_arx = __esm({
  "node_modules/@noble/ciphers/_arx.js"() {
    init_utils3();
    encodeStr = /* @__PURE__ */ __name((str) => Uint8Array.from(str.split(""), (c) => c.charCodeAt(0)), "encodeStr");
    sigma16_32 = /* @__PURE__ */ (() => swap32IfBE(u32(encodeStr("expand 16-byte k"))))();
    sigma32_32 = /* @__PURE__ */ (() => swap32IfBE(u32(encodeStr("expand 32-byte k"))))();
    __name(rotl, "rotl");
    BLOCK_LEN = 64;
    BLOCK_LEN32 = 16;
    MAX_COUNTER = /* @__PURE__ */ (() => 2 ** 32 - 1)();
    U32_EMPTY = /* @__PURE__ */ Uint32Array.of();
    __name(runCipher, "runCipher");
    __name(createCipher, "createCipher");
  }
});

// node_modules/@noble/ciphers/chacha.js
function chachaCore(s, k, n, out, cnt, rounds = 20) {
  let y00 = s[0], y01 = s[1], y02 = s[2], y03 = s[3], y04 = k[0], y05 = k[1], y06 = k[2], y07 = k[3], y08 = k[4], y09 = k[5], y10 = k[6], y11 = k[7], y12 = cnt, y13 = n[0], y14 = n[1], y15 = n[2];
  let x00 = y00, x01 = y01, x02 = y02, x03 = y03, x04 = y04, x05 = y05, x06 = y06, x07 = y07, x08 = y08, x09 = y09, x10 = y10, x11 = y11, x12 = y12, x13 = y13, x14 = y14, x15 = y15;
  for (let r = 0; r < rounds; r += 2) {
    x00 = x00 + x04 | 0;
    x12 = rotl(x12 ^ x00, 16);
    x08 = x08 + x12 | 0;
    x04 = rotl(x04 ^ x08, 12);
    x00 = x00 + x04 | 0;
    x12 = rotl(x12 ^ x00, 8);
    x08 = x08 + x12 | 0;
    x04 = rotl(x04 ^ x08, 7);
    x01 = x01 + x05 | 0;
    x13 = rotl(x13 ^ x01, 16);
    x09 = x09 + x13 | 0;
    x05 = rotl(x05 ^ x09, 12);
    x01 = x01 + x05 | 0;
    x13 = rotl(x13 ^ x01, 8);
    x09 = x09 + x13 | 0;
    x05 = rotl(x05 ^ x09, 7);
    x02 = x02 + x06 | 0;
    x14 = rotl(x14 ^ x02, 16);
    x10 = x10 + x14 | 0;
    x06 = rotl(x06 ^ x10, 12);
    x02 = x02 + x06 | 0;
    x14 = rotl(x14 ^ x02, 8);
    x10 = x10 + x14 | 0;
    x06 = rotl(x06 ^ x10, 7);
    x03 = x03 + x07 | 0;
    x15 = rotl(x15 ^ x03, 16);
    x11 = x11 + x15 | 0;
    x07 = rotl(x07 ^ x11, 12);
    x03 = x03 + x07 | 0;
    x15 = rotl(x15 ^ x03, 8);
    x11 = x11 + x15 | 0;
    x07 = rotl(x07 ^ x11, 7);
    x00 = x00 + x05 | 0;
    x15 = rotl(x15 ^ x00, 16);
    x10 = x10 + x15 | 0;
    x05 = rotl(x05 ^ x10, 12);
    x00 = x00 + x05 | 0;
    x15 = rotl(x15 ^ x00, 8);
    x10 = x10 + x15 | 0;
    x05 = rotl(x05 ^ x10, 7);
    x01 = x01 + x06 | 0;
    x12 = rotl(x12 ^ x01, 16);
    x11 = x11 + x12 | 0;
    x06 = rotl(x06 ^ x11, 12);
    x01 = x01 + x06 | 0;
    x12 = rotl(x12 ^ x01, 8);
    x11 = x11 + x12 | 0;
    x06 = rotl(x06 ^ x11, 7);
    x02 = x02 + x07 | 0;
    x13 = rotl(x13 ^ x02, 16);
    x08 = x08 + x13 | 0;
    x07 = rotl(x07 ^ x08, 12);
    x02 = x02 + x07 | 0;
    x13 = rotl(x13 ^ x02, 8);
    x08 = x08 + x13 | 0;
    x07 = rotl(x07 ^ x08, 7);
    x03 = x03 + x04 | 0;
    x14 = rotl(x14 ^ x03, 16);
    x09 = x09 + x14 | 0;
    x04 = rotl(x04 ^ x09, 12);
    x03 = x03 + x04 | 0;
    x14 = rotl(x14 ^ x03, 8);
    x09 = x09 + x14 | 0;
    x04 = rotl(x04 ^ x09, 7);
  }
  let oi = 0;
  out[oi++] = y00 + x00 | 0;
  out[oi++] = y01 + x01 | 0;
  out[oi++] = y02 + x02 | 0;
  out[oi++] = y03 + x03 | 0;
  out[oi++] = y04 + x04 | 0;
  out[oi++] = y05 + x05 | 0;
  out[oi++] = y06 + x06 | 0;
  out[oi++] = y07 + x07 | 0;
  out[oi++] = y08 + x08 | 0;
  out[oi++] = y09 + x09 | 0;
  out[oi++] = y10 + x10 | 0;
  out[oi++] = y11 + x11 | 0;
  out[oi++] = y12 + x12 | 0;
  out[oi++] = y13 + x13 | 0;
  out[oi++] = y14 + x14 | 0;
  out[oi++] = y15 + x15 | 0;
}
var chacha20;
var init_chacha = __esm({
  "node_modules/@noble/ciphers/chacha.js"() {
    init_arx();
    __name(chachaCore, "chachaCore");
    chacha20 = /* @__PURE__ */ createCipher(chachaCore, {
      counterRight: false,
      counterLength: 4,
      allowShortKeys: false
    });
  }
});

// src/protocols/opendating/crypto/encryption.ts
function generateKeypair() {
  const priv = randomBytes2(32);
  const pub = schnorr.getPublicKey(priv);
  return {
    privateKey: bytesToHex2(priv),
    publicKey: bytesToHex2(pub)
  };
}
function getConversationKey(privateKeyHex, publicKeyHex) {
  const priv = hexToBytes2(privateKeyHex);
  const pub = hexToBytes2(publicKeyHex);
  const pubKeyBigInt = bytesToBigInt(pub);
  const pubPoint = schnorr.utils.lift_x(pubKeyBigInt);
  const privScalar = bytesToBigInt(priv);
  const sharedPoint = pubPoint.multiply(privScalar);
  const sharedX = sharedPoint.toRawBytes(true).slice(1, 33);
  return extract(sha2562, sharedX, NIP44_SALT);
}
function bytesToBigInt(bytes) {
  let hex = "0x";
  for (const b of bytes) {
    hex += b.toString(16).padStart(2, "0");
  }
  return BigInt(hex);
}
function getMessageKeys(conversationKey, nonce) {
  const expanded = expand(sha2562, conversationKey, nonce, MESSAGE_KEYS_LEN);
  return {
    chachaKey: expanded.slice(0, CHACHA_KEY_LEN),
    chachaNonce: expanded.slice(CHACHA_KEY_LEN, CHACHA_KEY_LEN + CHACHA_NONCE_LEN),
    hmacKey: expanded.slice(CHACHA_KEY_LEN + CHACHA_NONCE_LEN)
  };
}
function calcPaddedLen(unpaddedLen) {
  if (unpaddedLen < MIN_PLAINTEXT_LEN) {
    throw new Error("Plaintext must be at least 1 byte");
  }
  if (unpaddedLen <= MIN_PADDED_LEN) {
    return MIN_PADDED_LEN;
  }
  const nextPower = 1 << Math.floor(Math.log2(unpaddedLen - 1)) + 1;
  const chunk = nextPower <= 256 ? MIN_PADDED_LEN : nextPower / 8;
  return chunk * (Math.floor((unpaddedLen - 1) / chunk) + 1);
}
function pad(plaintext) {
  const unpaddedLen = plaintext.length;
  const paddedLen = calcPaddedLen(unpaddedLen);
  const result = new Uint8Array(paddedLen);
  if (unpaddedLen < 65536) {
    result[0] = unpaddedLen >> 8 & 255;
    result[1] = unpaddedLen & 255;
    result.set(plaintext, 2);
  } else {
    result[0] = 0;
    result[1] = 0;
    result[2] = unpaddedLen >> 24 & 255;
    result[3] = unpaddedLen >> 16 & 255;
    result[4] = unpaddedLen >> 8 & 255;
    result[5] = unpaddedLen & 255;
    result.set(plaintext, 6);
  }
  return result;
}
function unpad(padded) {
  if (padded.length < 2) {
    throw new Error("Padded data too short");
  }
  let unpaddedLen;
  let offset;
  if (padded[0] === 0 && padded[1] === 0) {
    if (padded.length < 6) {
      throw new Error("Padded data too short for long format");
    }
    unpaddedLen = padded[2] << 24 | padded[3] << 16 | padded[4] << 8 | padded[5];
    offset = 6;
  } else {
    unpaddedLen = padded[0] << 8 | padded[1];
    offset = 2;
  }
  if (unpaddedLen < MIN_PLAINTEXT_LEN || unpaddedLen > padded.length - offset) {
    throw new Error("Invalid padding length");
  }
  return padded.slice(offset, offset + unpaddedLen);
}
function nip44Encrypt(plaintext, privateKeyHex, publicKeyHex) {
  const conversationKey = getConversationKey(privateKeyHex, publicKeyHex);
  const nonce = randomBytes2(NONCE_LEN);
  const keys = getMessageKeys(conversationKey, nonce);
  const plaintextBytes = new TextEncoder().encode(plaintext);
  const padded = pad(plaintextBytes);
  const ciphertext = chacha20(keys.chachaKey, keys.chachaNonce, padded);
  const aad = new Uint8Array(nonce.length + ciphertext.length);
  aad.set(nonce);
  aad.set(ciphertext, nonce.length);
  const mac = hmac(sha2562, keys.hmacKey, aad);
  const payload = new Uint8Array(1 + NONCE_LEN + ciphertext.length + MAC_LEN);
  payload[0] = NIP44_VERSION;
  payload.set(nonce, 1);
  payload.set(ciphertext, 1 + NONCE_LEN);
  payload.set(mac, 1 + NONCE_LEN + ciphertext.length);
  return bytesToBase64(payload);
}
function nip44Decrypt(payload, privateKeyHex, publicKeyHex) {
  if (!payload || payload.length < 128) {
    throw new Error("nip44: payload too short");
  }
  if (payload[0] === "#") {
    throw new Error("nip44: unknown encoding version");
  }
  const data = base64ToBytes(payload);
  if (data.length < 97) {
    throw new Error("nip44: decoded data too short");
  }
  const version = data[0];
  if (version !== NIP44_VERSION) {
    throw new Error(`nip44: unknown version ${version}`);
  }
  const nonce = data.slice(1, 1 + NONCE_LEN);
  const ciphertext = data.slice(1 + NONCE_LEN, data.length - MAC_LEN);
  const mac = data.slice(data.length - MAC_LEN);
  const conversationKey = getConversationKey(privateKeyHex, publicKeyHex);
  const keys = getMessageKeys(conversationKey, nonce);
  const aad = new Uint8Array(nonce.length + ciphertext.length);
  aad.set(nonce);
  aad.set(ciphertext, nonce.length);
  const expectedMac = hmac(sha2562, keys.hmacKey, aad);
  if (!constantTimeEqual(mac, expectedMac)) {
    throw new Error("nip44: MAC verification failed");
  }
  const padded = chacha20(keys.chachaKey, keys.chachaNonce, ciphertext);
  const plaintext = unpad(padded);
  return new TextDecoder().decode(plaintext);
}
function getEventHash(event) {
  const serialized = JSON.stringify([
    0,
    event.pubkey,
    event.created_at,
    event.kind,
    event.tags,
    event.content
  ]);
  return bytesToHex2(sha2562(new TextEncoder().encode(serialized)));
}
function signEvent(event, privateKeyHex) {
  const id = getEventHash(event);
  const sig = bytesToHex2(schnorr.sign(hexToBytes2(id), privateKeyHex));
  return { id, sig };
}
function constantTimeEqual(a, b) {
  if (a.length !== b.length)
    return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}
function bytesToHex2(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function hexToBytes2(hex) {
  if (hex.length % 2 !== 0)
    throw new Error("Invalid hex string");
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
function bytesToBase64(bytes) {
  return btoa(String.fromCharCode(...bytes));
}
function base64ToBytes(base64) {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}
var NIP44_VERSION, NIP44_SALT, NONCE_LEN, MAC_LEN, CHACHA_KEY_LEN, CHACHA_NONCE_LEN, MESSAGE_KEYS_LEN, MIN_PLAINTEXT_LEN, MIN_PADDED_LEN;
var init_encryption = __esm({
  "src/protocols/opendating/crypto/encryption.ts"() {
    "use strict";
    init_secp256k1();
    init_hkdf();
    init_sha256();
    init_hmac();
    init_chacha();
    init_utils3();
    NIP44_VERSION = 2;
    NIP44_SALT = new TextEncoder().encode("nip44-v2");
    NONCE_LEN = 32;
    MAC_LEN = 32;
    CHACHA_KEY_LEN = 32;
    CHACHA_NONCE_LEN = 12;
    MESSAGE_KEYS_LEN = 76;
    MIN_PLAINTEXT_LEN = 1;
    MIN_PADDED_LEN = 32;
    __name(generateKeypair, "generateKeypair");
    __name(getConversationKey, "getConversationKey");
    __name(bytesToBigInt, "bytesToBigInt");
    __name(getMessageKeys, "getMessageKeys");
    __name(calcPaddedLen, "calcPaddedLen");
    __name(pad, "pad");
    __name(unpad, "unpad");
    __name(nip44Encrypt, "nip44Encrypt");
    __name(nip44Decrypt, "nip44Decrypt");
    __name(getEventHash, "getEventHash");
    __name(signEvent, "signEvent");
    __name(constantTimeEqual, "constantTimeEqual");
    __name(bytesToHex2, "bytesToHex");
    __name(hexToBytes2, "hexToBytes");
    __name(bytesToBase64, "bytesToBase64");
    __name(base64ToBytes, "base64ToBytes");
  }
});

// src/protocols/opendating/protocol/constants.ts
var OPENDATING_PROTOCOL, OPENDATING_VERSION, SUPPORTED_VERSIONS, MAX_OD_PAYLOAD_BYTES, OD_REQUEST_MAX_AGE_SEC, OD_REQUEST_MAX_FUTURE_SEC, OD_IDEMPOTENCY_RETENTION_SEC, OD_FEATURES;
var init_constants = __esm({
  "src/protocols/opendating/protocol/constants.ts"() {
    "use strict";
    OPENDATING_PROTOCOL = "opendating";
    OPENDATING_VERSION = "0.1";
    SUPPORTED_VERSIONS = ["0.1"];
    MAX_OD_PAYLOAD_BYTES = 16 * 1024;
    OD_REQUEST_MAX_AGE_SEC = 5 * 60;
    OD_REQUEST_MAX_FUTURE_SEC = 60;
    OD_IDEMPOTENCY_RETENTION_SEC = 24 * 60 * 60;
    OD_FEATURES = [
      "private-service-requests",
      "nip42-required",
      "nip59-transport"
    ];
  }
});

// src/protocols/opendating/protocol/message-types.ts
function isValidPingPayload(p) {
  return typeof p === "object" && p !== null && Object.keys(p).length === 0;
}
function isValidPongPayload(p) {
  if (typeof p !== "object" || p === null)
    return false;
  const o = p;
  return typeof o.server_time === "number" && typeof o.protocol_version === "string";
}
function isValidCapabilitiesPayload(p) {
  return typeof p === "object" && p !== null && Object.keys(p).length === 0;
}
function isValidCapabilitiesResultPayload(p) {
  if (typeof p !== "object" || p === null)
    return false;
  const o = p;
  return Array.isArray(o.versions) && Array.isArray(o.services) && Array.isArray(o.features);
}
function isKnownMessageType(type) {
  return type in MESSAGE_VALIDATORS;
}
function getPayloadValidator(type) {
  return MESSAGE_VALIDATORS[type];
}
var MESSAGE_VALIDATORS;
var init_message_types = __esm({
  "src/protocols/opendating/protocol/message-types.ts"() {
    "use strict";
    __name(isValidPingPayload, "isValidPingPayload");
    __name(isValidPongPayload, "isValidPongPayload");
    __name(isValidCapabilitiesPayload, "isValidCapabilitiesPayload");
    __name(isValidCapabilitiesResultPayload, "isValidCapabilitiesResultPayload");
    MESSAGE_VALIDATORS = {
      // System
      "system.ping": isValidPingPayload,
      "system.pong": isValidPongPayload,
      "system.capabilities": isValidCapabilitiesPayload,
      "system.capabilities.result": isValidCapabilitiesResultPayload,
      "system.error": (p) => typeof p === "object" && p !== null && typeof p.code === "string",
      // Profile
      "profile.create": (p) => typeof p === "object" && p !== null,
      "profile.create.result": (p) => typeof p === "object" && p !== null,
      "profile.update": (p) => typeof p === "object" && p !== null,
      "profile.update.result": (p) => typeof p === "object" && p !== null,
      "profile.get": (p) => typeof p === "object" && p !== null,
      "profile.get.result": (p) => typeof p === "object" && p !== null,
      "profile.pause": (p) => typeof p === "object" && p !== null,
      "profile.pause.result": (p) => typeof p === "object" && p !== null,
      "profile.resume": (p) => typeof p === "object" && p !== null,
      "profile.resume.result": (p) => typeof p === "object" && p !== null,
      "profile.delete": (p) => typeof p === "object" && p !== null,
      "profile.delete.result": (p) => typeof p === "object" && p !== null,
      // Discovery
      "discovery.update_location": (p) => typeof p === "object" && p !== null,
      "discovery.update_location.result": (p) => typeof p === "object" && p !== null,
      "discovery.get_candidates": (p) => typeof p === "object" && p !== null,
      "discovery.get_candidates.result": (p) => typeof p === "object" && p !== null,
      "discovery.update_preferences": (p) => typeof p === "object" && p !== null,
      "discovery.update_preferences.result": (p) => typeof p === "object" && p !== null,
      // Intents + Matches
      "intent.like": (p) => typeof p === "object" && p !== null,
      "intent.like.result": (p) => typeof p === "object" && p !== null,
      "intent.revoke": (p) => typeof p === "object" && p !== null,
      "intent.revoke.result": (p) => typeof p === "object" && p !== null,
      "match.list": (p) => typeof p === "object" && p !== null,
      "match.list.result": (p) => typeof p === "object" && p !== null,
      // Blocks
      "block.create": (p) => typeof p === "object" && p !== null,
      "block.create.result": (p) => typeof p === "object" && p !== null,
      "block.list": (p) => typeof p === "object" && p !== null,
      "block.list.result": (p) => typeof p === "object" && p !== null,
      "unmatch.create": (p) => typeof p === "object" && p !== null,
      "unmatch.create.result": (p) => typeof p === "object" && p !== null,
      // Reports + Moderation
      "report.create": (p) => typeof p === "object" && p !== null,
      "report.create.result": (p) => typeof p === "object" && p !== null,
      "moderation.action": (p) => typeof p === "object" && p !== null,
      "moderation.action.result": (p) => typeof p === "object" && p !== null,
      // Visibility
      "visibility.update": (p) => typeof p === "object" && p !== null,
      "visibility.update.result": (p) => typeof p === "object" && p !== null,
      // Block remove
      "block.remove": (p) => typeof p === "object" && p !== null,
      "block.remove.result": (p) => typeof p === "object" && p !== null,
      // Report received ack
      "report.received": (p) => typeof p === "object" && p !== null,
      // Verification
      "verification.list": (p) => typeof p === "object" && p !== null,
      "verification.list.result": (p) => typeof p === "object" && p !== null,
      // Account delete
      "account.delete": (p) => typeof p === "object" && p !== null,
      "account.delete.result": (p) => typeof p === "object" && p !== null,
      // Service-level
      "service.ack": (p) => typeof p === "object" && p !== null,
      "service.error": (p) => typeof p === "object" && p !== null && typeof p.code === "string"
    };
    __name(isKnownMessageType, "isKnownMessageType");
    __name(getPayloadValidator, "getPayloadValidator");
  }
});

// src/protocols/opendating/protocol/version.ts
function isSupportedVersion(version) {
  return SUPPORTED_VERSIONS.includes(version);
}
var init_version = __esm({
  "src/protocols/opendating/protocol/version.ts"() {
    "use strict";
    init_constants();
    __name(isSupportedVersion, "isSupportedVersion");
  }
});

// src/protocols/opendating/protocol/validation.ts
function validateODRequest(envelope) {
  if (!envelope || typeof envelope !== "object") {
    return { valid: false, errorCode: "invalid_envelope", errorMessage: "Envelope must be an object" };
  }
  const e = envelope;
  if (e.protocol !== OPENDATING_PROTOCOL) {
    return {
      valid: false,
      errorCode: "invalid_envelope",
      errorMessage: `Unknown protocol: ${String(e.protocol)}`
    };
  }
  if (typeof e.version !== "string") {
    return { valid: false, errorCode: "invalid_envelope", errorMessage: "Missing version" };
  }
  if (!isSupportedVersion(e.version)) {
    return {
      valid: false,
      errorCode: "unsupported_version",
      errorMessage: `Unsupported version: ${e.version}`
    };
  }
  if (typeof e.type !== "string" || e.type.length === 0) {
    return { valid: false, errorCode: "invalid_envelope", errorMessage: "Missing message type" };
  }
  if (!isKnownMessageType(e.type)) {
    return {
      valid: false,
      errorCode: "unsupported_type",
      errorMessage: `Unknown message type: ${e.type}`
    };
  }
  if (typeof e.request_id !== "string" || e.request_id.length < 8) {
    return { valid: false, errorCode: "invalid_envelope", errorMessage: "Invalid request_id" };
  }
  if (typeof e.created_at !== "number" || e.created_at <= 0) {
    return { valid: false, errorCode: "invalid_envelope", errorMessage: "Invalid created_at" };
  }
  if (typeof e.payload !== "object" || e.payload === null) {
    return { valid: false, errorCode: "invalid_envelope", errorMessage: "Payload must be an object" };
  }
  const payloadValidator = getPayloadValidator(e.type);
  if (payloadValidator && !payloadValidator(e.payload)) {
    return { valid: false, errorCode: "invalid_envelope", errorMessage: "Invalid payload for message type" };
  }
  const size = JSON.stringify(e).length;
  if (size > MAX_OD_PAYLOAD_BYTES) {
    return {
      valid: false,
      errorCode: "payload_too_large",
      errorMessage: `Payload too large: ${size} bytes (max ${MAX_OD_PAYLOAD_BYTES})`
    };
  }
  return { valid: true };
}
var init_validation = __esm({
  "src/protocols/opendating/protocol/validation.ts"() {
    "use strict";
    init_constants();
    init_message_types();
    init_version();
    __name(validateODRequest, "validateODRequest");
  }
});

// src/protocols/opendating/protocol/envelope.ts
function createEnvelope(type, requestId, payload = {}, version = "0.1") {
  return {
    protocol: OPENDATING_PROTOCOL,
    version,
    type,
    request_id: requestId,
    created_at: Math.floor(Date.now() / 1e3),
    payload
  };
}
function createErrorEnvelope(requestId, code, message) {
  return {
    protocol: OPENDATING_PROTOCOL,
    version: "0.1",
    type: "system.error",
    request_id: requestId,
    created_at: Math.floor(Date.now() / 1e3),
    payload: { code, message }
  };
}
function checkRequestFreshness(created_at, maxAgeSec = 300, maxFutureSec = 60) {
  const now = Math.floor(Date.now() / 1e3);
  const age = now - created_at;
  if (age > maxAgeSec) {
    return `Request expired: ${age}s old (max ${maxAgeSec}s)`;
  }
  if (age < -maxFutureSec) {
    return `Request from the future: ${-age}s ahead (max ${maxFutureSec}s)`;
  }
  return null;
}
var init_envelope = __esm({
  "src/protocols/opendating/protocol/envelope.ts"() {
    "use strict";
    init_constants();
    __name(createEnvelope, "createEnvelope");
    __name(createErrorEnvelope, "createErrorEnvelope");
    __name(checkRequestFreshness, "checkRequestFreshness");
  }
});

// src/protocols/opendating/services/registry.ts
var _OpenDatingServiceRegistry, OpenDatingServiceRegistry, odServiceRegistry;
var init_registry2 = __esm({
  "src/protocols/opendating/services/registry.ts"() {
    "use strict";
    _OpenDatingServiceRegistry = class _OpenDatingServiceRegistry {
      constructor() {
        this.services = /* @__PURE__ */ new Map();
        this.byPubkey = /* @__PURE__ */ new Map();
      }
      /**
       * Register a service.
       */
      register(service) {
        this.services.set(service.role, service);
        this.byPubkey.set(service.pubkey, service);
        console.log(`Registered OpenDating service: ${service.role} (pubkey: ${service.pubkey.substring(0, 8)}...)`);
      }
      /**
       * Resolve a service by its Nostr public key (recipient of a gift wrap).
       */
      resolveByRecipient(pubkey) {
        return this.byPubkey.get(pubkey);
      }
      /**
       * Resolve a service by its role.
       */
      resolveByRole(role) {
        return this.services.get(role);
      }
      /**
       * Resolve a service that supports a given message type.
       */
      resolveByMessageType(type) {
        for (const service of this.services.values()) {
          if (service.supports(type)) {
            return service;
          }
        }
        return void 0;
      }
      /**
       * List all registered services for capability reporting.
       */
      listServices() {
        return Array.from(this.services.values()).map((s) => ({
          role: s.role,
          pubkey: s.pubkey
        }));
      }
      /**
       * Check if a pubkey is a registered service.
       */
      isServicePubkey(pubkey) {
        return this.byPubkey.has(pubkey);
      }
    };
    __name(_OpenDatingServiceRegistry, "OpenDatingServiceRegistry");
    OpenDatingServiceRegistry = _OpenDatingServiceRegistry;
    odServiceRegistry = new OpenDatingServiceRegistry();
  }
});

// src/protocols/opendating/transport/context.ts
var context_exports = {};
__export(context_exports, {
  toServiceContext: () => toServiceContext
});
function toServiceContext(ctx) {
  return {
    authenticatedPubkey: ctx.authenticatedPubkey,
    senderPubkey: ctx.senderPubkey,
    servicePubkey: ctx.servicePubkey,
    protocolVersion: ctx.protocolVersion,
    receivedAt: Math.floor(ctx.receivedAt / 1e3),
    requestId: ctx.requestId
  };
}
var init_context = __esm({
  "src/protocols/opendating/transport/context.ts"() {
    "use strict";
    __name(toServiceContext, "toServiceContext");
  }
});

// src/protocols/opendating/transport/router.ts
async function routeRequest(envelope, ctx, idempotencyCheck, idempotencyRecord) {
  const validation = validateODRequest(envelope);
  if (!validation.valid) {
    return {
      success: false,
      envelope: createErrorEnvelope(
        envelope.request_id || "unknown",
        validation.errorCode || "invalid_envelope",
        validation.errorMessage || "Invalid request"
      )
    };
  }
  if (!isSupportedVersion(envelope.version)) {
    return {
      success: false,
      envelope: createErrorEnvelope(
        envelope.request_id,
        "unsupported_version",
        `Unsupported version: ${envelope.version}`
      )
    };
  }
  const freshnessError = checkRequestFreshness(
    envelope.created_at,
    OD_REQUEST_MAX_AGE_SEC,
    OD_REQUEST_MAX_FUTURE_SEC
  );
  if (freshnessError) {
    return {
      success: false,
      envelope: createErrorEnvelope(
        envelope.request_id,
        envelope.created_at > Math.floor(Date.now() / 1e3) ? "future_request" : "expired_request",
        freshnessError
      )
    };
  }
  if (ctx.authenticatedPubkey !== ctx.senderPubkey) {
    return {
      success: false,
      envelope: createErrorEnvelope(
        envelope.request_id,
        "sender_auth_mismatch",
        "Authenticated connection identity does not match request sender"
      )
    };
  }
  const service = odServiceRegistry.resolveByRecipient(ctx.servicePubkey);
  if (!service) {
    return {
      success: false,
      envelope: createErrorEnvelope(
        envelope.request_id,
        "unknown_service",
        "Unknown service recipient"
      )
    };
  }
  if (!service.supports(envelope.type)) {
    return {
      success: false,
      envelope: createErrorEnvelope(
        envelope.request_id,
        "unsupported_type",
        `Service ${service.role} does not support ${envelope.type}`
      )
    };
  }
  if (idempotencyCheck) {
    const isDuplicate = await idempotencyCheck(
      ctx.servicePubkey,
      ctx.senderPubkey,
      envelope.request_id
    );
    if (isDuplicate) {
      return {
        success: true,
        envelope: createErrorEnvelope(
          envelope.request_id,
          "duplicate_request",
          "Duplicate request \u2014 already processed"
        ),
        duplicate: true
      };
    }
  }
  try {
    const { toServiceContext: toServiceContext2 } = await Promise.resolve().then(() => (init_context(), context_exports));
    const result = await service.handle(envelope, toServiceContext2(ctx));
    if (idempotencyRecord) {
      await idempotencyRecord(
        ctx.servicePubkey,
        ctx.senderPubkey,
        envelope.request_id,
        envelope.type
      ).catch((err) => console.error("Failed to record idempotency:", err));
    }
    return { success: true, envelope: result.response };
  } catch (error2) {
    console.error(`Service error (${service.role}/${envelope.type}):`, error2);
    return {
      success: false,
      envelope: createErrorEnvelope(
        envelope.request_id,
        "internal_error",
        "Internal processing error"
      )
    };
  }
}
var init_router = __esm({
  "src/protocols/opendating/transport/router.ts"() {
    "use strict";
    init_validation();
    init_version();
    init_envelope();
    init_constants();
    init_envelope();
    init_registry2();
    __name(routeRequest, "routeRequest");
  }
});

// src/protocols/opendating/identities/registry.ts
var _InMemoryServiceIdentityRegistry, InMemoryServiceIdentityRegistry, serviceIdentityRegistry;
var init_registry3 = __esm({
  "src/protocols/opendating/identities/registry.ts"() {
    "use strict";
    _InMemoryServiceIdentityRegistry = class _InMemoryServiceIdentityRegistry {
      constructor() {
        this.byRole = /* @__PURE__ */ new Map();
        this.byPubkey = /* @__PURE__ */ new Map();
        this.signers = /* @__PURE__ */ new Map();
      }
      register(identity) {
        this.byRole.set(identity.role, identity);
        this.byPubkey.set(identity.pubkey, identity);
      }
      registerSigner(signer) {
        this.register(signer);
        this.signers.set(signer.pubkey, signer);
      }
      getByRole(role) {
        return this.byRole.get(role);
      }
      getByPubkey(pubkey) {
        return this.byPubkey.get(pubkey);
      }
      getAll() {
        return Array.from(this.byRole.values());
      }
      getSigner(pubkey) {
        return this.signers.get(pubkey);
      }
      /**
       * Check if a pubkey belongs to a registered service.
       */
      isServicePubkey(pubkey) {
        return this.byPubkey.has(pubkey);
      }
    };
    __name(_InMemoryServiceIdentityRegistry, "InMemoryServiceIdentityRegistry");
    InMemoryServiceIdentityRegistry = _InMemoryServiceIdentityRegistry;
    serviceIdentityRegistry = new InMemoryServiceIdentityRegistry();
  }
});

// src/protocols/opendating/storage/d1/idempotency.ts
var _D1IdempotencyStore, D1IdempotencyStore;
var init_idempotency = __esm({
  "src/protocols/opendating/storage/d1/idempotency.ts"() {
    "use strict";
    init_constants();
    _D1IdempotencyStore = class _D1IdempotencyStore {
      constructor(db) {
        this.db = db;
      }
      async isDuplicate(servicePubkey, senderPubkey, requestId) {
        try {
          const session = this.db.withSession("first-unconstrained");
          const result = await session.prepare(
            `SELECT request_id FROM od_idempotency
         WHERE service_pubkey = ? AND sender_pubkey = ? AND request_id = ?
         LIMIT 1`
          ).bind(servicePubkey, senderPubkey, requestId).first();
          return result !== null;
        } catch (error2) {
          console.error("Idempotency check failed:", error2);
          return false;
        }
      }
      async record(servicePubkey, senderPubkey, requestId, requestType) {
        try {
          const session = this.db.withSession("first-primary");
          const now = Math.floor(Date.now() / 1e3);
          const expiresAt = now + OD_IDEMPOTENCY_RETENTION_SEC;
          await session.prepare(
            `INSERT OR IGNORE INTO od_idempotency
         (service_pubkey, sender_pubkey, request_id, request_type, created_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)`
          ).bind(servicePubkey, senderPubkey, requestId, requestType, now, expiresAt).run();
        } catch (error2) {
          console.error("Failed to record idempotency:", error2);
        }
      }
      async pruneExpired() {
        try {
          const session = this.db.withSession("first-primary");
          const now = Math.floor(Date.now() / 1e3);
          const result = await session.prepare(
            `DELETE FROM od_idempotency WHERE expires_at < ?`
          ).bind(now).run();
          const deleted = result.meta?.changes || 0;
          if (deleted > 0) {
            console.log(`Pruned ${deleted} expired idempotency records`);
          }
          return deleted;
        } catch (error2) {
          console.error("Idempotency pruning failed:", error2);
          return 0;
        }
      }
    };
    __name(_D1IdempotencyStore, "D1IdempotencyStore");
    D1IdempotencyStore = _D1IdempotencyStore;
  }
});

// src/protocols/opendating/crypto/gift-wrap.ts
function randomPastTimestamp(now) {
  const offsetBytes = randomBytes2(4);
  const offset = new DataView(offsetBytes.buffer).getUint32(0) % MAX_PAST_OFFSET_SEC;
  return now - offset;
}
async function buildGiftWrap(rumorKind, rumorContent, senderPrivKeyHex, senderPubKeyHex, recipientPubKeyHex) {
  const now = Math.floor(Date.now() / 1e3);
  const rumorUnsigned = {
    pubkey: senderPubKeyHex,
    created_at: now,
    // Canonical time — the real one
    kind: rumorKind,
    tags: [],
    content: rumorContent
  };
  const rumorId = getEventHash(rumorUnsigned);
  const rumor = {
    ...rumorUnsigned,
    id: rumorId,
    sig: ""
    // Unsigned — no signature
  };
  const sealContent = nip44Encrypt(
    JSON.stringify(rumor),
    senderPrivKeyHex,
    recipientPubKeyHex
  );
  const sealCreatedAt = randomPastTimestamp(now);
  const sealUnsigned = {
    pubkey: senderPubKeyHex,
    created_at: sealCreatedAt,
    kind: 13,
    tags: [],
    // NIP-59: tags MUST always be empty in kind 13
    content: sealContent
  };
  const { id: sealId, sig: sealSig } = signEvent(sealUnsigned, senderPrivKeyHex);
  const seal = {
    ...sealUnsigned,
    id: sealId,
    sig: sealSig
  };
  const wrapperKeypair = generateKeypair();
  const wrapContent = nip44Encrypt(
    JSON.stringify(seal),
    wrapperKeypair.privateKey,
    recipientPubKeyHex
  );
  const wrapCreatedAt = randomPastTimestamp(now);
  const wrapUnsigned = {
    pubkey: wrapperKeypair.publicKey,
    created_at: wrapCreatedAt,
    kind: 1059,
    tags: [["p", recipientPubKeyHex]],
    // Route to recipient
    content: wrapContent
  };
  const { id: wrapId, sig: wrapSig } = signEvent(wrapUnsigned, wrapperKeypair.privateKey);
  return {
    giftWrap: {
      ...wrapUnsigned,
      id: wrapId,
      sig: wrapSig
    },
    wrapperKeypair
  };
}
async function buildServiceResponseGiftWrap(rumorKind, responseContent, servicePrivKeyHex, servicePubKeyHex, userPubKeyHex) {
  return buildGiftWrap(rumorKind, responseContent, servicePrivKeyHex, servicePubKeyHex, userPubKeyHex);
}
var MAX_PAST_OFFSET_SEC;
var init_gift_wrap = __esm({
  "src/protocols/opendating/crypto/gift-wrap.ts"() {
    "use strict";
    init_encryption();
    init_utils3();
    MAX_PAST_OFFSET_SEC = 2 * 24 * 60 * 60;
    __name(randomPastTimestamp, "randomPastTimestamp");
    __name(buildGiftWrap, "buildGiftWrap");
    __name(buildServiceResponseGiftWrap, "buildServiceResponseGiftWrap");
  }
});

// src/shared/logger.ts
function formatLog(entry) {
  const parts = [
    `[${entry.timestamp}]`,
    `[${entry.level.toUpperCase()}]`
  ];
  if (entry.sessionId)
    parts.push(`[sess:${entry.sessionId.substring(0, 8)}]`);
  if (entry.pubkey)
    parts.push(`[pk:${entry.pubkey.substring(0, 8)}]`);
  parts.push(entry.message);
  if (entry.data)
    parts.push(JSON.stringify(entry.data));
  return parts.join(" ");
}
function log(level, message, context) {
  const entry = {
    level,
    message,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    ...context
  };
  const formatted = formatLog(entry);
  switch (level) {
    case "debug":
      console.debug(formatted);
      break;
    case "info":
      console.log(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    case "error":
    case "security":
      console.error(formatted);
      break;
  }
}
var logger;
var init_logger = __esm({
  "src/shared/logger.ts"() {
    "use strict";
    __name(formatLog, "formatLog");
    __name(log, "log");
    logger = {
      debug: (msg, ctx) => log("debug", msg, ctx),
      info: (msg, ctx) => log("info", msg, ctx),
      warn: (msg, ctx) => log("warn", msg, ctx),
      error: (msg, ctx) => log("error", msg, ctx),
      security: (msg, ctx) => log("security", msg, ctx)
    };
  }
});

// src/cloudflare/moderation.ts
async function moderateContent(ai, text, category) {
  if (!ai) {
    console.log(`[moderation] AI binding absent \u2014 allowing ${category} content without screening`);
    return { passed: true, flags: [], confidence: 0, recommendation: "allow", explanation: "AI moderation not configured" };
  }
  if (!text || text.trim().length < 2) {
    return { passed: true, flags: [], confidence: 1, recommendation: "allow", explanation: "Content too short to screen" };
  }
  try {
    const response = await ai.run("@cf/meta/llama-3.2-3b-instruct", {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Category: ${category}

Content to classify:
"""
${text.slice(0, 2e3)}
"""` }
      ],
      max_tokens: 256,
      temperature: 0
    });
    let raw = response.response ?? response.choices?.[0]?.message?.content ?? "{}";
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    const action = parsed.action;
    const recommendation = action === "flag" ? "flag" : action === "block" ? "block" : "allow";
    return {
      passed: recommendation === "allow",
      flags: Array.isArray(parsed.categories) ? parsed.categories : [],
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
      recommendation,
      explanation: parsed.reason || "No explanation provided"
    };
  } catch (err) {
    console.error(`[moderation] AI call failed for ${category}:`, err);
    return { passed: true, flags: [], confidence: 0, recommendation: "allow", explanation: `Moderation error: ${String(err).slice(0, 100)}` };
  }
}
function shouldBlock(result) {
  return result.recommendation === "block" && result.confidence >= 0.85;
}
var SYSTEM_PROMPT;
var init_moderation = __esm({
  "src/cloudflare/moderation.ts"() {
    "use strict";
    SYSTEM_PROMPT = `You are a content moderation classifier. Output ONLY a JSON object, no other text.

{
  "is_harmful": false,
  "categories": [],
  "confidence": 0.95,
  "action": "allow",
  "reason": "brief explanation"
}

RULES:
- "action" is "allow", "flag", or "block"
- "categories" is a list: harassment, hate_speech, sexual_content, spam, violence, personal_info, self_harm, underage, impersonation, commercial
- Dating-appropriate content (flirting, describing oneself, relationship preferences, sexual orientation, gender identity) is ALLOWED
- Only BLOCK: harassment, hate speech, underage content, doxxing, explicit sexual content
- FLAG borderline cases that need human review
- "confidence" is 0.0 to 1.0`;
    __name(moderateContent, "moderateContent");
    __name(shouldBlock, "shouldBlock");
  }
});

// src/protocols/opendating/extension.ts
function initOpenDatingExtension(db) {
  idempotencyStore = new D1IdempotencyStore(db);
}
function isAddressedToService(event) {
  if (event.kind !== 1059)
    return null;
  const pTags = event.tags.filter((t) => t[0] === "p").map((t) => t[1]);
  for (const pTag of pTags) {
    if (serviceIdentityRegistry.isServicePubkey(pTag)) {
      return { servicePubkey: pTag };
    }
  }
  return null;
}
async function decryptAndParse(event, servicePubkey) {
  try {
    const signer = serviceIdentityRegistry.getSigner(servicePubkey);
    if (!signer) {
      logger.warn("No signer available for service", { pubkey: servicePubkey.substring(0, 8) });
      return null;
    }
    const sealJson = await nip44Decrypt(
      event.content,
      signer.privateKey,
      event.pubkey
      // ephemeral wrapper pubkey
    );
    const seal = JSON.parse(sealJson);
    if (seal.kind !== 13) {
      logger.warn("Inner seal is not kind 13", { kind: seal.kind });
      return null;
    }
    const rumorJson = await nip44Decrypt(
      seal.content,
      signer.privateKey,
      seal.pubkey
      // sender's pubkey from the seal
    );
    const rumor = JSON.parse(rumorJson);
    if (rumor.kind !== 78) {
      logger.warn("Inner rumor is not kind 78", { kind: rumor.kind });
      return null;
    }
    const envelope = JSON.parse(rumor.content);
    if (envelope.protocol !== OPENDATING_PROTOCOL) {
      return null;
    }
    return {
      envelope,
      rumorEvent: rumor,
      senderPubkey: seal.pubkey
      // The actual sender (from the seal)
    };
  } catch (error2) {
    logger.warn("Failed to decrypt/parse gift wrap", {
      error: error2.message
    });
    return null;
  }
}
async function sendResponse(envelope, senderPubkey, servicePubkey, env) {
  try {
    const signer = serviceIdentityRegistry.getSigner(servicePubkey);
    if (!signer) {
      logger.error("Cannot send response \u2014 no signer for service", { servicePubkey: servicePubkey.substring(0, 8) });
      return null;
    }
    const responseJson = JSON.stringify(envelope);
    const { giftWrap } = await buildServiceResponseGiftWrap(
      78,
      // rumor kind for application messages
      responseJson,
      signer.privateKey,
      signer.pubkey,
      senderPubkey
    );
    if (env.RELAY_DATABASE) {
      const { processEvent: processEvent2 } = await Promise.resolve().then(() => (init_relay_worker(), relay_worker_exports));
      await processEvent2(giftWrap, "opendating-service-response", env);
      logger.info("Published OpenDating response", {
        type: envelope.type,
        requestId: envelope.request_id,
        recipient: senderPubkey.substring(0, 8)
      });
    }
    return giftWrap;
  } catch (error2) {
    logger.error("Failed to send OpenDating response", {
      error: error2.message,
      type: envelope.type
    });
    return null;
  }
}
async function screenProfileContent(envelope, senderPubkey, context) {
  try {
    const payload = envelope.payload;
    const profile = payload?.profile;
    if (!profile)
      return;
    const bio = typeof profile.bio === "string" ? profile.bio : "";
    const name = typeof profile.display_name === "string" ? profile.display_name : "";
    const text = [name, bio].filter(Boolean).join(" ");
    if (text.length < 3)
      return;
    const env = context._env;
    if (!env?.AI)
      return;
    const result = await moderateContent(env.AI, text, "profile_bio");
    if (shouldBlock(result)) {
      logger.warn("[moderation] Blocked profile content", {
        senderPrefix: senderPubkey.slice(0, 8),
        flags: result.flags,
        confidence: result.confidence
      });
      throw new Error(`Profile content rejected: ${result.explanation}`);
    }
    if (result.flags.length > 0) {
      logger.info("[moderation] Flagged profile (allowed through)", {
        senderPrefix: senderPubkey.slice(0, 8),
        flags: result.flags
      });
    }
  } catch (err) {
    if (err.message?.startsWith("Profile content rejected:"))
      throw err;
    logger.error("[moderation] screenProfileContent error");
  }
}
var idempotencyStore, openDatingExtension;
var init_extension = __esm({
  "src/protocols/opendating/extension.ts"() {
    "use strict";
    init_encryption();
    init_router();
    init_registry3();
    init_envelope();
    init_constants();
    init_idempotency();
    init_gift_wrap();
    init_logger();
    init_moderation();
    idempotencyStore = null;
    __name(initOpenDatingExtension, "initOpenDatingExtension");
    __name(isAddressedToService, "isAddressedToService");
    __name(decryptAndParse, "decryptAndParse");
    __name(sendResponse, "sendResponse");
    __name(screenProfileContent, "screenProfileContent");
    openDatingExtension = {
      name: "opendating",
      canHandleEvent(event, _context) {
        const match = isAddressedToService(event);
        return match !== null;
      },
      async handleEvent(event, context) {
        const match = isAddressedToService(event);
        if (!match) {
          return { handled: false };
        }
        const { servicePubkey } = match;
        const decrypted = await decryptAndParse(event, servicePubkey);
        if (!decrypted) {
          return { handled: false };
        }
        const { envelope, senderPubkey } = decrypted;
        if (envelope.type === "profile.create" || envelope.type === "profile.update") {
          try {
            await screenProfileContent(envelope, senderPubkey, context);
          } catch (modErr) {
            const errMsg = modErr.message || "Content rejected by moderation";
            const env2 = context._env;
            let rejection = null;
            if (env2) {
              const errorEnvelope = createErrorEnvelope(
                envelope.request_id,
                "content_rejected",
                errMsg
              );
              rejection = await sendResponse(errorEnvelope, senderPubkey, servicePubkey, env2);
            }
            return {
              handled: true,
              storeNormally: false,
              message: errMsg,
              publish: rejection ? [rejection] : void 0
            };
          }
        }
        const transportCtx = {
          relayContext: context,
          authenticatedPubkey: context.authenticatedPubkey || "",
          senderPubkey,
          servicePubkey,
          protocolVersion: envelope.version,
          requestId: envelope.request_id,
          receivedAt: Date.now()
        };
        const result = await routeRequest(
          envelope,
          transportCtx,
          // Idempotency check
          idempotencyStore ? (spk, sp, rid) => idempotencyStore.isDuplicate(spk, sp, rid) : void 0,
          // Idempotency record
          idempotencyStore ? (spk, sp, rid, type) => idempotencyStore.record(spk, sp, rid, type) : void 0
        );
        const env = context._env;
        const responseEvent = env ? await sendResponse(result.envelope, senderPubkey, servicePubkey, env) : null;
        return {
          handled: true,
          storeNormally: false,
          message: result.success ? "" : result.envelope.type === "system.error" ? "error" : "",
          publish: responseEvent ? [responseEvent] : void 0
        };
      },
      async authorizeQuery(_filters, _context) {
        return { allowed: true };
      }
    };
  }
});

// src/protocols/opendating/crypto/service-signer.ts
function derivePublicKey(privateKeyHex) {
  const privBytes = hexToBytes2(privateKeyHex);
  const pubBytes = schnorr.getPublicKey(privBytes);
  return bytesToHex2(pubBytes);
}
function validateServiceKey(privateKeyHex) {
  try {
    if (!/^[a-f0-9]{64}$/i.test(privateKeyHex)) {
      return null;
    }
    return derivePublicKey(privateKeyHex);
  } catch {
    return null;
  }
}
var init_service_signer = __esm({
  "src/protocols/opendating/crypto/service-signer.ts"() {
    "use strict";
    init_secp256k1();
    init_encryption();
    __name(derivePublicKey, "derivePublicKey");
    __name(validateServiceKey, "validateServiceKey");
  }
});

// src/protocols/opendating/identities/loader.ts
function loadServiceIdentity(role, privateKeyHex) {
  const publicKey = validateServiceKey(privateKeyHex);
  if (!publicKey) {
    throw new Error(`Invalid private key for service role "${role}". Check the OD_${role.toUpperCase()}_SERVICE_PRIVKEY secret.`);
  }
  const signer = {
    role,
    pubkey: publicKey,
    privateKey: privateKeyHex,
    signEvent(event) {
      return signEvent(event, this.privateKey);
    }
  };
  serviceIdentityRegistry.registerSigner(signer);
  console.log(`Loaded service identity: ${role} (pubkey: ${publicKey.substring(0, 8)}...)`);
  return signer;
}
function secretNameForRole(role) {
  return `OD_${role.toUpperCase()}_SERVICE_PRIVKEY`;
}
function loadServiceIdentitiesFromEnv(env) {
  const signers = [];
  const missing = [];
  for (const role of LOADABLE_SERVICE_ROLES) {
    const secretName = secretNameForRole(role);
    const key = env[secretName];
    if (!key || key.length === 0) {
      missing.push(role);
      continue;
    }
    try {
      signers.push(loadServiceIdentity(role, key));
    } catch (err) {
      console.error(`Failed to load "${role}" service identity:`, err.message);
    }
  }
  if (missing.length > 0) {
    console.warn(
      `[OpenDating] Not loaded (secret unset): ${missing.join(", ")}. Set with: wrangler secret put ${secretNameForRole(missing[0])}`
    );
  }
  return signers;
}
function getServiceIdentitiesForCapabilities() {
  return serviceIdentityRegistry.getAll().map((si) => ({
    role: si.role,
    pubkey: si.pubkey,
    supportedTypes: getSupportedTypesForRole(si.role)
  }));
}
function getSupportedTypesForRole(role) {
  switch (role) {
    case "system":
      return ["system.ping", "system.capabilities"];
    case "profile":
      return ["profile.create", "profile.update", "profile.get", "profile.pause", "profile.resume", "profile.delete"];
    case "discovery":
      return ["discovery.update_location", "discovery.get_candidates", "discovery.update_preferences"];
    case "matcher":
      return ["intent.like", "intent.revoke", "match.list"];
    case "dm_policy":
      return ["block.create", "block.list", "unmatch.create"];
    case "moderation":
      return ["report.create", "moderation.action"];
    default:
      return [];
  }
}
var LOADABLE_SERVICE_ROLES;
var init_loader = __esm({
  "src/protocols/opendating/identities/loader.ts"() {
    "use strict";
    init_service_signer();
    init_encryption();
    init_registry3();
    __name(loadServiceIdentity, "loadServiceIdentity");
    LOADABLE_SERVICE_ROLES = [
      "system",
      "profile",
      "discovery",
      "matcher",
      "dm_policy",
      "moderation",
      "deletion"
    ];
    __name(secretNameForRole, "secretNameForRole");
    __name(loadServiceIdentitiesFromEnv, "loadServiceIdentitiesFromEnv");
    __name(getServiceIdentitiesForCapabilities, "getServiceIdentitiesForCapabilities");
    __name(getSupportedTypesForRole, "getSupportedTypesForRole");
  }
});

// src/protocols/opendating/protocol/capabilities.ts
function buildCapabilities(services) {
  return {
    versions: [...SUPPORTED_VERSIONS],
    services: services.map((s) => ({
      role: s.role,
      pubkey: s.pubkey,
      supported_types: s.supportedTypes
    })),
    features: [...OD_FEATURES]
  };
}
function buildNip11Advertisement(services) {
  const serviceMap = {};
  for (const s of services) {
    serviceMap[s.role] = { pubkey: s.pubkey };
  }
  return {
    opendating: {
      versions: [...SUPPORTED_VERSIONS],
      services: serviceMap
    }
  };
}
var init_capabilities = __esm({
  "src/protocols/opendating/protocol/capabilities.ts"() {
    "use strict";
    init_constants();
    __name(buildCapabilities, "buildCapabilities");
    __name(buildNip11Advertisement, "buildNip11Advertisement");
  }
});

// src/protocols/opendating/services/system/service.ts
var SUPPORTED_TYPES, _SystemService, SystemService;
var init_service = __esm({
  "src/protocols/opendating/services/system/service.ts"() {
    "use strict";
    init_envelope();
    init_constants();
    init_capabilities();
    init_loader();
    SUPPORTED_TYPES = /* @__PURE__ */ new Set([
      "system.ping",
      "system.capabilities"
    ]);
    _SystemService = class _SystemService {
      constructor(role, pubkey) {
        this.role = role;
        this.pubkey = pubkey;
      }
      supports(type) {
        return SUPPORTED_TYPES.has(type);
      }
      async handle(request, context) {
        switch (request.type) {
          case "system.ping":
            return this.handlePing(request);
          case "system.capabilities":
            return this.handleCapabilities(request);
          default:
            throw new Error(`System service does not support type: ${request.type}`);
        }
      }
      handlePing(request) {
        return {
          response: createEnvelope("system.pong", request.request_id, {
            server_time: Math.floor(Date.now() / 1e3),
            protocol_version: OPENDATING_VERSION
          })
        };
      }
      handleCapabilities(request) {
        const services = getServiceIdentitiesForCapabilities();
        return {
          response: createEnvelope(
            "system.capabilities.result",
            request.request_id,
            buildCapabilities(services)
          )
        };
      }
    };
    __name(_SystemService, "SystemService");
    SystemService = _SystemService;
  }
});

// src/protocols/opendating/storage/d1/membership.ts
function profileCompleteness(content) {
  let score = 0;
  if (content.display_name && String(content.display_name).trim())
    score += 25;
  if (typeof content.age === "number")
    score += 15;
  if (content.gender)
    score += 10;
  if (content.bio && String(content.bio).trim().length >= 20)
    score += 20;
  if (Array.isArray(content.photos) && content.photos.length > 0)
    score += 20;
  if (Array.isArray(content.interests) && content.interests.length >= 3)
    score += 10;
  return Math.min(score, 100);
}
function initMembershipKeys(env) {
  const indexSecret = env.OD_INDEX_KEY_V1;
  const dataSecret = env.OD_DATA_KEY_V1;
  const allowDev = env.OD_ALLOW_DEV_KEYS === "true";
  if (indexSecret && dataSecret) {
    if (indexSecret.length < 32 || dataSecret.length < 32) {
      throw new Error(
        "OD_INDEX_KEY_V1 and OD_DATA_KEY_V1 must each be at least 32 characters."
      );
    }
    _indexKey = new TextEncoder().encode(indexSecret);
    _dataKeyRaw = new TextEncoder().encode(dataSecret);
    _usingDevKeys = false;
    return;
  }
  if (!allowDev) {
    throw new Error(
      "OD_INDEX_KEY_V1 and OD_DATA_KEY_V1 are required. Generate them with `npm run opendating:keys:generate` and set them with `wrangler secret put`. For local development only, set OD_ALLOW_DEV_KEYS=true."
    );
  }
  console.warn(
    "[OpenDating] SECURITY: using published development key material. Member IDs are reversible and stored pubkeys are readable. Never run this configuration with real users."
  );
  _indexKey = new TextEncoder().encode(DEV_INDEX_KEY);
  _dataKeyRaw = new TextEncoder().encode(DEV_DATA_KEY);
  _usingDevKeys = true;
}
function indexKey() {
  if (!_indexKey) {
    throw new Error("Membership keys not initialised \u2014 call initMembershipKeys(env) first.");
  }
  return _indexKey;
}
function deriveMemberId(pubkey) {
  const key = indexKey();
  const msg = hexToBytes2(pubkey);
  return bytesToHex2(hmac(sha2562, key, msg));
}
async function encryptString(plaintext, dataKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    dataKey,
    encoded
  );
  const combined = new Uint8Array(iv.length + new Uint8Array(ct).length);
  combined.set(iv);
  combined.set(new Uint8Array(ct), iv.length);
  return bytesToHex2(combined);
}
async function decryptString(encryptedHex, dataKey) {
  const combined = hexToBytes2(encryptedHex);
  const iv = combined.slice(0, 12);
  const ct = combined.slice(12);
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    dataKey,
    ct
  );
  return new TextDecoder().decode(pt);
}
async function getDataKey() {
  if (!_dataKeyRaw) {
    throw new Error("Membership keys not initialised \u2014 call initMembershipKeys(env) first.");
  }
  return crypto.subtle.importKey(
    "raw",
    _dataKeyRaw.slice(0, 32),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}
var DEV_INDEX_KEY, DEV_DATA_KEY, _indexKey, _dataKeyRaw, _usingDevKeys, _D1MembershipStore, D1MembershipStore;
var init_membership = __esm({
  "src/protocols/opendating/storage/d1/membership.ts"() {
    "use strict";
    init_hmac();
    init_sha256();
    init_encryption();
    __name(profileCompleteness, "profileCompleteness");
    DEV_INDEX_KEY = "opendating-index-key-v1-dev-only-00000000000000";
    DEV_DATA_KEY = "opendating-data-key-v1-dev-only-000000";
    _indexKey = null;
    _dataKeyRaw = null;
    _usingDevKeys = false;
    __name(initMembershipKeys, "initMembershipKeys");
    __name(indexKey, "indexKey");
    __name(deriveMemberId, "deriveMemberId");
    __name(encryptString, "encryptString");
    __name(decryptString, "decryptString");
    __name(getDataKey, "getDataKey");
    _D1MembershipStore = class _D1MembershipStore {
      constructor(db) {
        this.db = db;
        this.dataKey = null;
      }
      async ensureDataKey() {
        if (!this.dataKey)
          this.dataKey = await getDataKey();
        return this.dataKey;
      }
      getMemberId(pubkey) {
        return deriveMemberId(pubkey);
      }
      // -----------------------------------------------------------------------
      // Member lifecycle
      // -----------------------------------------------------------------------
      async getMember(pubkey) {
        const memberId = this.getMemberId(pubkey);
        const session = this.db.withSession("first-unconstrained");
        const row = await session.prepare(
          "SELECT * FROM od_members WHERE member_id = ?"
        ).bind(memberId).first();
        if (!row)
          return null;
        const dk = await this.ensureDataKey();
        const pubkeyDecrypted = await decryptString(row.encrypted_pubkey, dk);
        return {
          memberId: row.member_id,
          pubkey: pubkeyDecrypted,
          status: row.status,
          trustTier: row.trust_tier || 0,
          lastActiveBucket: row.last_active_bucket,
          protocolVersion: row.protocol_version,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      }
      async createMember(pubkey) {
        const memberId = this.getMemberId(pubkey);
        const now = Math.floor(Date.now() / 1e3);
        const session = this.db.withSession("first-primary");
        const dk = await this.ensureDataKey();
        const encryptedPubkey = await encryptString(pubkey, dk);
        await session.prepare(
          `INSERT OR IGNORE INTO od_members
       (member_id, encrypted_pubkey, status, trust_tier, protocol_version, created_at, updated_at)
       VALUES (?, ?, 'active', 0, '0.1', ?, ?)`
        ).bind(memberId, encryptedPubkey, now, now).run();
        await session.batch([
          session.prepare(
            `INSERT OR IGNORE INTO od_profiles
         (member_id, profile_version, visibility_state, completeness, created_at, updated_at)
         VALUES (?, 1, 'discoverable', 0, ?, ?)`
          ).bind(memberId, now, now),
          session.prepare(
            `INSERT OR IGNORE INTO od_discovery_index
         (member_id, visible, updated_at)
         VALUES (?, 0, ?)`
          ).bind(memberId, now)
        ]);
        return {
          memberId,
          pubkey,
          status: "active",
          trustTier: 0,
          lastActiveBucket: null,
          protocolVersion: "0.1",
          createdAt: now,
          updatedAt: now
        };
      }
      async ensureMember(pubkey) {
        const existing = await this.getMember(pubkey);
        if (existing) {
          if (existing.status === "deleted")
            throw new Error("Member has been deleted");
          if (existing.status === "banned")
            throw new Error("Member is banned");
          return existing;
        }
        return this.createMember(pubkey);
      }
      async updateStatus(pubkey, status) {
        const memberId = this.getMemberId(pubkey);
        const now = Math.floor(Date.now() / 1e3);
        const session = this.db.withSession("first-primary");
        await session.prepare(
          "UPDATE od_members SET status = ?, updated_at = ? WHERE member_id = ?"
        ).bind(status, now, memberId).run();
      }
      async pauseMember(pubkey) {
        const memberId = this.getMemberId(pubkey);
        const now = Math.floor(Date.now() / 1e3);
        const session = this.db.withSession("first-primary");
        await session.batch([
          session.prepare("UPDATE od_members SET status = ?, updated_at = ? WHERE member_id = ?").bind("paused", now, memberId),
          session.prepare("UPDATE od_profiles SET visibility_state = ?, updated_at = ? WHERE member_id = ?").bind("paused", now, memberId),
          session.prepare("UPDATE od_discovery_index SET visible = 0, updated_at = ? WHERE member_id = ?").bind(now, memberId)
        ]);
      }
      async resumeMember(pubkey) {
        const memberId = this.getMemberId(pubkey);
        const now = Math.floor(Date.now() / 1e3);
        const session = this.db.withSession("first-primary");
        await session.batch([
          session.prepare("UPDATE od_members SET status = ?, updated_at = ? WHERE member_id = ?").bind("active", now, memberId),
          session.prepare("UPDATE od_profiles SET visibility_state = ?, updated_at = ? WHERE member_id = ?").bind("discoverable", now, memberId),
          session.prepare("UPDATE od_discovery_index SET visible = 1, updated_at = ? WHERE member_id = ?").bind(now, memberId)
        ]);
      }
      async deleteMember(pubkey) {
        const memberId = this.getMemberId(pubkey);
        const now = Math.floor(Date.now() / 1e3);
        const session = this.db.withSession("first-primary");
        await session.batch([
          session.prepare("UPDATE od_members SET status = ?, updated_at = ? WHERE member_id = ?").bind("deleted", now, memberId),
          session.prepare("UPDATE od_profiles SET visibility_state = ?, updated_at = ? WHERE member_id = ?").bind("hidden", now, memberId),
          session.prepare("UPDATE od_discovery_index SET visible = 0, updated_at = ? WHERE member_id = ?").bind(now, memberId),
          session.prepare("DELETE FROM od_profile_media WHERE member_id = ?").bind(memberId)
        ]);
      }
      // -----------------------------------------------------------------------
      // Profile (PRD §72)
      // -----------------------------------------------------------------------
      async getProfile(pubkey) {
        const memberId = this.getMemberId(pubkey);
        const session = this.db.withSession("first-unconstrained");
        const row = await session.prepare(
          "SELECT * FROM od_profiles WHERE member_id = ?"
        ).bind(memberId).first();
        if (!row)
          return null;
        return {
          memberId: row.member_id,
          profileVersion: row.profile_version,
          age: row.age,
          genderCategory: row.gender_category,
          relationshipIntent: row.relationship_intent,
          visibilityState: row.visibility_state,
          completeness: row.completeness,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      }
      /**
       * Store the member's profile content.
       *
       * The content blob is encrypted at rest under the data key; only the few
       * fields discovery filters on (age, gender, intent) are denormalised into
       * columns, so a database dump exposes coarse buckets rather than bios,
       * names, and photos.
       *
       * This replaces the old `updateProfileEventId`, which took an event id and
       * silently discarded it — profiles had no content at all as a result.
       */
      async updateProfileContent(pubkey, content) {
        const memberId = this.getMemberId(pubkey);
        const now = Math.floor(Date.now() / 1e3);
        const dk = await this.ensureDataKey();
        const encrypted = await encryptString(JSON.stringify(content), dk);
        const age = typeof content.age === "number" ? content.age : null;
        const gender = typeof content.gender === "string" ? content.gender : null;
        const intent = typeof content.relationship_intent === "string" ? content.relationship_intent : null;
        const session = this.db.withSession("first-primary");
        await session.prepare(
          `INSERT INTO od_profiles
         (member_id, profile_version, encrypted_profile_payload, age, gender_category,
          relationship_intent, visibility_state, completeness, created_at, updated_at)
       VALUES (?, 1, ?, ?, ?, ?, 'discoverable', ?, ?, ?)
       ON CONFLICT(member_id) DO UPDATE SET
         profile_version = od_profiles.profile_version + 1,
         encrypted_profile_payload = excluded.encrypted_profile_payload,
         age = excluded.age,
         gender_category = excluded.gender_category,
         relationship_intent = excluded.relationship_intent,
         completeness = excluded.completeness,
         updated_at = excluded.updated_at`
        ).bind(
          memberId,
          encrypted,
          age,
          gender,
          intent,
          profileCompleteness(content),
          now,
          now
        ).run();
      }
      /**
       * Recover a member's real pubkey from their pseudonymous id.
       *
       * Member ids are one-way (HMAC), so this is the only path back. It exists
       * because acting on a candidate is impossible without it: a like is
       * addressed to `target_pubkey` and a direct message is NIP-44 encrypted to
       * that key. Callers must only use it for members the viewer holds a grant
       * for — it is the boundary where pseudonymity is deliberately traded for a
       * usable product, so widening its use widens who is identifiable.
       */
      async getPubkeyByMemberId(memberId) {
        const session = this.db.withSession("first-unconstrained");
        const row = await session.prepare(
          `SELECT encrypted_pubkey FROM od_members WHERE member_id = ? AND status = 'active'`
        ).bind(memberId).first();
        if (typeof row?.encrypted_pubkey !== "string")
          return null;
        try {
          const dk = await this.ensureDataKey();
          return await decryptString(row.encrypted_pubkey, dk);
        } catch {
          return null;
        }
      }
      /** Read back a member's own decrypted profile content. */
      async getProfileContent(pubkey) {
        return this.getProfileContentByMemberId(this.getMemberId(pubkey));
      }
      /**
       * Decrypt a member's profile content by member id — used by discovery to
       * build the cards granted viewers see.
       */
      async getProfileContentByMemberId(memberId) {
        const session = this.db.withSession("first-unconstrained");
        const row = await session.prepare(
          "SELECT encrypted_profile_payload FROM od_profiles WHERE member_id = ?"
        ).bind(memberId).first();
        const blob = row?.encrypted_profile_payload;
        if (typeof blob !== "string" || blob.length === 0)
          return null;
        try {
          const dk = await this.ensureDataKey();
          return JSON.parse(await decryptString(blob, dk));
        } catch {
          return null;
        }
      }
      /**
       * Mirror a member's filterable attributes into the discovery index.
       *
       * `od_discovery_index` is the denormalised table discovery scans, so it has
       * to be refreshed whenever profile content, visibility, or location change.
       * Geo cells are left untouched here — only the discovery service knows them,
       * and it writes them on location update.
       */
      async syncDiscoveryIndex(pubkey) {
        const memberId = this.getMemberId(pubkey);
        const now = Math.floor(Date.now() / 1e3);
        const session = this.db.withSession("first-primary");
        const row = await session.prepare(
          `SELECT p.age, p.gender_category, p.relationship_intent, p.visibility_state,
              m.status, m.trust_tier
         FROM od_members m LEFT JOIN od_profiles p ON p.member_id = m.member_id
        WHERE m.member_id = ?`
        ).bind(memberId).first();
        if (!row)
          return;
        const visible = row.status === "active" && row.visibility_state === "discoverable" ? 1 : 0;
        await session.prepare(
          `INSERT INTO od_discovery_index
         (member_id, age, gender_category, intent_category, visible, trust_tier,
          activity_bucket, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'recently', ?)
       ON CONFLICT(member_id) DO UPDATE SET
         age = excluded.age,
         gender_category = excluded.gender_category,
         intent_category = excluded.intent_category,
         visible = excluded.visible,
         trust_tier = excluded.trust_tier,
         activity_bucket = excluded.activity_bucket,
         updated_at = excluded.updated_at`
        ).bind(
          memberId,
          row.age ?? null,
          row.gender_category ?? null,
          row.relationship_intent ?? null,
          visible,
          row.trust_tier ?? 0,
          now
        ).run();
      }
      async setVisibility(pubkey, visibility) {
        const memberId = this.getMemberId(pubkey);
        const now = Math.floor(Date.now() / 1e3);
        const visible = visibility === "discoverable" ? 1 : 0;
        const session = this.db.withSession("first-primary");
        await session.batch([
          session.prepare(
            "UPDATE od_profiles SET visibility_state = ?, updated_at = ? WHERE member_id = ?"
          ).bind(visibility, now, memberId),
          session.prepare(
            "UPDATE od_discovery_index SET visible = ?, updated_at = ? WHERE member_id = ?"
          ).bind(visible, now, memberId)
        ]);
      }
    };
    __name(_D1MembershipStore, "D1MembershipStore");
    D1MembershipStore = _D1MembershipStore;
  }
});

// src/protocols/opendating/services/profile/service.ts
function validateProfileContent(profile) {
  if (typeof profile !== "object" || profile === null || Array.isArray(profile)) {
    return "profile must be an object";
  }
  const p = profile;
  const name = typeof p.display_name === "string" ? p.display_name.trim() : "";
  if (name.length === 0)
    return "display_name is required";
  if (name.length > 80)
    return "display_name must be 80 characters or fewer";
  if (p.age !== void 0) {
    if (typeof p.age !== "number" || !Number.isInteger(p.age)) {
      return "age must be a whole number";
    }
    if (p.age < MIN_AGE)
      return `age must be at least ${MIN_AGE}`;
    if (p.age > MAX_AGE)
      return `age must be ${MAX_AGE} or under`;
  }
  if (p.bio !== void 0 && typeof p.bio === "string" && p.bio.length > MAX_BIO_LENGTH) {
    return `bio must be ${MAX_BIO_LENGTH} characters or fewer`;
  }
  if (p.interests !== void 0 && (!Array.isArray(p.interests) || p.interests.length > MAX_INTERESTS)) {
    return `interests must be an array of at most ${MAX_INTERESTS} items`;
  }
  if (p.photos !== void 0 && (!Array.isArray(p.photos) || p.photos.length > MAX_PHOTOS)) {
    return `photos must be an array of at most ${MAX_PHOTOS} items`;
  }
  return null;
}
var MIN_AGE, MAX_AGE, MAX_BIO_LENGTH, MAX_INTERESTS, MAX_PHOTOS, _ProfileService, ProfileService;
var init_service2 = __esm({
  "src/protocols/opendating/services/profile/service.ts"() {
    "use strict";
    init_envelope();
    init_membership();
    MIN_AGE = 18;
    MAX_AGE = 120;
    MAX_BIO_LENGTH = 2e3;
    MAX_INTERESTS = 30;
    MAX_PHOTOS = 9;
    __name(validateProfileContent, "validateProfileContent");
    _ProfileService = class _ProfileService {
      constructor(role, pubkey, db) {
        this.role = role;
        this.pubkey = pubkey;
        this.membership = new D1MembershipStore(db);
      }
      supports(type) {
        return [
          "profile.create",
          "profile.update",
          "profile.get",
          "profile.pause",
          "profile.resume",
          "profile.delete",
          "visibility.update"
        ].includes(type);
      }
      async handle(request, context) {
        switch (request.type) {
          case "profile.create":
            return this.handleCreate(request, context);
          case "profile.update":
            return this.handleUpdate(request, context);
          case "profile.get":
            return this.handleGet(request, context);
          case "profile.pause":
            return this.handlePause(request, context);
          case "profile.resume":
            return this.handleResume(request, context);
          case "profile.delete":
            return this.handleDelete(request, context);
          case "visibility.update":
            return this.handleVisibilityUpdate(request, context);
          default:
            throw new Error(`Profile service: unsupported type ${request.type}`);
        }
      }
      async handleCreate(request, ctx) {
        const member = await this.membership.ensureMember(ctx.senderPubkey);
        return { response: createEnvelope("profile.create.result", request.request_id, {
          member_id: member.memberId,
          status: member.status,
          created_at: member.createdAt
        }) };
      }
      /**
       * Store the member's profile content.
       *
       * This used to accept the request and discard it — profiles existed as
       * membership rows with no name, bio, or photos, so a card had nothing to
       * render. Content now persists (encrypted at rest) and the denormalised
       * filter columns are mirrored into the discovery index so the member
       * becomes findable.
       */
      async handleUpdate(request, ctx) {
        await this.membership.ensureMember(ctx.senderPubkey);
        const payload = request.payload;
        const profile = payload.profile;
        if (profile === void 0) {
          const now2 = Math.floor(Date.now() / 1e3);
          return { response: createEnvelope("profile.update.result", request.request_id, { updated_at: now2 }) };
        }
        const invalid = validateProfileContent(profile);
        if (invalid) {
          return { response: createErrorEnvelope(request.request_id, "invalid_profile", invalid) };
        }
        await this.membership.updateProfileContent(ctx.senderPubkey, profile);
        await this.membership.syncDiscoveryIndex(ctx.senderPubkey);
        const now = Math.floor(Date.now() / 1e3);
        return { response: createEnvelope("profile.update.result", request.request_id, {
          completeness: profileCompleteness(profile),
          updated_at: now
        }) };
      }
      async handleGet(request, ctx) {
        const member = await this.membership.getMember(ctx.senderPubkey);
        if (!member)
          return { response: createErrorEnvelope(request.request_id, "unauthorized", "No membership") };
        const profile = await this.membership.getProfile(ctx.senderPubkey);
        const content = await this.membership.getProfileContent(ctx.senderPubkey);
        return { response: createEnvelope("profile.get.result", request.request_id, {
          member_id: member.memberId,
          status: member.status,
          trust_tier: member.trustTier,
          profile: content,
          visibility: profile?.visibilityState || "hidden",
          completeness: profile?.completeness || 0,
          created_at: member.createdAt,
          updated_at: member.updatedAt
        }) };
      }
      async handlePause(request, ctx) {
        await this.membership.pauseMember(ctx.senderPubkey);
        await this.membership.syncDiscoveryIndex(ctx.senderPubkey);
        return { response: createEnvelope("profile.pause.result", request.request_id, { paused_at: Math.floor(Date.now() / 1e3) }) };
      }
      async handleResume(request, ctx) {
        await this.membership.resumeMember(ctx.senderPubkey);
        await this.membership.syncDiscoveryIndex(ctx.senderPubkey);
        return { response: createEnvelope("profile.resume.result", request.request_id, { resumed_at: Math.floor(Date.now() / 1e3) }) };
      }
      async handleDelete(request, ctx) {
        await this.membership.deleteMember(ctx.senderPubkey);
        return { response: createEnvelope("profile.delete.result", request.request_id, { deleted_at: Math.floor(Date.now() / 1e3) }) };
      }
      async handleVisibilityUpdate(request, ctx) {
        const payload = request.payload;
        const vis = payload.visibility;
        await this.membership.setVisibility(ctx.senderPubkey, vis);
        await this.membership.syncDiscoveryIndex(ctx.senderPubkey);
        return { response: createEnvelope("visibility.update.result", request.request_id, { updated_at: Math.floor(Date.now() / 1e3) }) };
      }
    };
    __name(_ProfileService, "ProfileService");
    ProfileService = _ProfileService;
  }
});

// src/protocols/opendating/services/discovery/service.ts
function clampAge(value, fallback) {
  if (typeof value !== "number" || !Number.isFinite(value))
    return fallback;
  return Math.min(Math.max(Math.round(value), 18), 120);
}
function grantToken(viewerId, candidateId, now) {
  return bytesToHex2(
    sha2562(new TextEncoder().encode(`${viewerId}:${candidateId}:${now}`))
  ).substring(0, 32);
}
function publicProfile(content) {
  return {
    display_name: content.display_name ?? "",
    age: content.age,
    gender: content.gender,
    bio: content.bio,
    interests: Array.isArray(content.interests) ? content.interests.slice(0, 30) : [],
    relationship_intent: content.relationship_intent,
    prompts: Array.isArray(content.prompts) ? content.prompts.slice(0, 5) : [],
    photos: Array.isArray(content.photos) ? content.photos.slice(0, 9) : []
  };
}
var MAX_DAILY_CANDIDATES, CANDIDATE_BATCH_SIZE, CANDIDATE_GRANT_TTL, DAY_SEC, GEO_TIERS, _DiscoveryService, DiscoveryService;
var init_service3 = __esm({
  "src/protocols/opendating/services/discovery/service.ts"() {
    "use strict";
    init_envelope();
    init_membership();
    init_sha256();
    init_encryption();
    MAX_DAILY_CANDIDATES = 50;
    CANDIDATE_BATCH_SIZE = 20;
    CANDIDATE_GRANT_TTL = 24 * 60 * 60;
    DAY_SEC = 24 * 60 * 60;
    GEO_TIERS = [
      { column: "geo_cell_p5", precision: 5, bucket: "nearby" },
      { column: "geo_cell_p4", precision: 4, bucket: "within 10 mi" },
      { column: "geo_cell_p3", precision: 3, bucket: "10-50 mi" }
    ];
    _DiscoveryService = class _DiscoveryService {
      constructor(role, pubkey, db) {
        this.role = role;
        this.pubkey = pubkey;
        this.db = db;
        this.membership = new D1MembershipStore(db);
      }
      supports(type) {
        return type === "discovery.update_location" || type === "discovery.get_candidates" || type === "discovery.update_preferences";
      }
      async handle(request, ctx) {
        const member = await this.membership.ensureMember(ctx.senderPubkey);
        switch (request.type) {
          case "discovery.update_location":
            return this.updateLocation(ctx.senderPubkey, member.memberId, request);
          case "discovery.get_candidates":
            return this.getCandidates(member.memberId, request);
          case "discovery.update_preferences":
            return this.updatePreferences(ctx.senderPubkey, member.memberId, request);
          default:
            throw new Error(`Discovery service does not support: ${request.type}`);
        }
      }
      // -------------------------------------------------------------------------
      // Location
      // -------------------------------------------------------------------------
      async updateLocation(pubkey, memberId, request) {
        const payload = request.payload;
        const geohashPrefix = payload.geohash_prefix;
        if (typeof geohashPrefix !== "string" || geohashPrefix.length < 3 || geohashPrefix.length > 6) {
          return { response: createErrorEnvelope(
            request.request_id,
            "invalid_envelope",
            "geohash_prefix must be 3-6 characters (coarse location only)"
          ) };
        }
        if (!/^[0-9bcdefghjkmnpqrstuvwxyz]+$/.test(geohashPrefix)) {
          return { response: createErrorEnvelope(
            request.request_id,
            "invalid_envelope",
            "geohash_prefix contains characters outside the geohash alphabet"
          ) };
        }
        const now = Math.floor(Date.now() / 1e3);
        const session = this.db.withSession("first-primary");
        await session.prepare(
          `INSERT INTO od_discovery_index
         (member_id, geo_cell_p5, geo_cell_p4, geo_cell_p3, visible, trust_tier, activity_bucket, updated_at)
       VALUES (?, ?, ?, ?, 0, 0, 'recently', ?)
       ON CONFLICT(member_id) DO UPDATE SET
         geo_cell_p5 = excluded.geo_cell_p5,
         geo_cell_p4 = excluded.geo_cell_p4,
         geo_cell_p3 = excluded.geo_cell_p3,
         activity_bucket = 'recently',
         updated_at = excluded.updated_at`
        ).bind(
          memberId,
          geohashPrefix.substring(0, 5),
          geohashPrefix.substring(0, 4),
          geohashPrefix.substring(0, 3),
          now
        ).run();
        await this.membership.syncDiscoveryIndex(pubkey);
        return { response: createEnvelope("discovery.update_location.result", request.request_id, { updated_at: now }) };
      }
      // -------------------------------------------------------------------------
      // Preferences
      // -------------------------------------------------------------------------
      async updatePreferences(pubkey, memberId, request) {
        const payload = request.payload;
        const now = Math.floor(Date.now() / 1e3);
        const ageMin = clampAge(payload.min_age, 18);
        const ageMax = clampAge(payload.max_age, 99);
        if (ageMin > ageMax) {
          return { response: createErrorEnvelope(
            request.request_id,
            "invalid_envelope",
            "min_age must not exceed max_age"
          ) };
        }
        const genders = Array.isArray(payload.genders) ? payload.genders.filter((g) => typeof g === "string") : null;
        const intent = typeof payload.intent === "string" ? payload.intent : null;
        const maxDistanceKm = typeof payload.max_distance_km === "number" && payload.max_distance_km > 0 ? Math.min(Math.round(payload.max_distance_km), 500) : 100;
        const session = this.db.withSession("first-primary");
        await session.prepare(
          `INSERT INTO od_discovery_prefs
         (member_id, age_min, age_max, max_distance_km, genders, intent, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(member_id) DO UPDATE SET
         age_min = excluded.age_min,
         age_max = excluded.age_max,
         max_distance_km = excluded.max_distance_km,
         genders = excluded.genders,
         intent = excluded.intent,
         updated_at = excluded.updated_at`
        ).bind(
          memberId,
          ageMin,
          ageMax,
          maxDistanceKm,
          genders && genders.length > 0 ? JSON.stringify(genders) : null,
          intent,
          now
        ).run();
        await session.prepare(
          `DELETE FROM od_candidate_grants WHERE viewer_id = ? AND grant_type = 'discovery'`
        ).bind(memberId).run();
        await this.membership.syncDiscoveryIndex(pubkey);
        return { response: createEnvelope("discovery.update_preferences.result", request.request_id, { updated_at: now }) };
      }
      // -------------------------------------------------------------------------
      // Candidates
      // -------------------------------------------------------------------------
      async getCandidates(memberId, request) {
        const payload = request.payload;
        const limit = Math.min(
          typeof payload.limit === "number" ? payload.limit : CANDIDATE_BATCH_SIZE,
          CANDIDATE_BATCH_SIZE
        );
        const now = Math.floor(Date.now() / 1e3);
        const quota = await this.consumeQuota(memberId, now);
        if (quota.exhausted) {
          return { response: createErrorEnvelope(
            request.request_id,
            "discovery_quota_exhausted",
            `Daily discovery limit reached (${MAX_DAILY_CANDIDATES})`
          ) };
        }
        const viewer = await this.loadViewer(memberId);
        if (!viewer) {
          return { response: createErrorEnvelope(
            request.request_id,
            "invalid_location",
            "Set your location before discovering people nearby"
          ) };
        }
        let granted = await this.loadExistingGrants(memberId, now, limit);
        if (granted.length < limit) {
          const fresh = await this.generateGrants(
            memberId,
            viewer,
            limit - granted.length,
            now
          );
          granted = [...granted, ...fresh];
        }
        const candidates = await this.hydrate(granted);
        const served = quota.servedToday + candidates.length;
        await this.recordServed(memberId, served, quota.resetAt, now);
        return {
          response: createEnvelope("discovery.get_candidates.result", request.request_id, {
            candidates,
            cursor: null,
            remaining_today: Math.max(MAX_DAILY_CANDIDATES - served, 0)
          })
        };
      }
      /** Read the viewer's own index row and preferences. */
      async loadViewer(memberId) {
        const session = this.db.withSession("first-unconstrained");
        const row = await session.prepare(
          `SELECT geo_cell_p5, geo_cell_p4, geo_cell_p3 FROM od_discovery_index WHERE member_id = ?`
        ).bind(memberId).first();
        if (!row || !row.geo_cell_p3)
          return null;
        const prefRow = await session.prepare(
          `SELECT age_min, age_max, max_distance_km, genders, intent
         FROM od_discovery_prefs WHERE member_id = ?`
        ).bind(memberId).first();
        let genders = null;
        if (typeof prefRow?.genders === "string") {
          try {
            const parsed = JSON.parse(prefRow.genders);
            if (Array.isArray(parsed) && parsed.length > 0)
              genders = parsed;
          } catch {
          }
        }
        return {
          cells: {
            geo_cell_p5: row.geo_cell_p5 ?? null,
            geo_cell_p4: row.geo_cell_p4 ?? null,
            geo_cell_p3: row.geo_cell_p3 ?? null
          },
          prefs: {
            ageMin: clampAge(prefRow?.age_min, 18),
            ageMax: clampAge(prefRow?.age_max, 99),
            maxDistanceKm: typeof prefRow?.max_distance_km === "number" ? prefRow.max_distance_km : 100,
            genders,
            intent: typeof prefRow?.intent === "string" ? prefRow.intent : null
          }
        };
      }
      async loadExistingGrants(memberId, now, limit) {
        const session = this.db.withSession("first-unconstrained");
        const rows = await session.prepare(
          `SELECT candidate_id, grant_token, distance_bucket FROM od_candidate_grants
        WHERE viewer_id = ? AND (expires_at IS NULL OR expires_at > ?)
        ORDER BY granted_at DESC LIMIT ?`
        ).bind(memberId, now, limit).all();
        return rows.results ?? [];
      }
      /**
       * Find new candidates and grant the viewer permission to see them.
       *
       * Widens outward through the geohash tiers, excluding at the SQL layer:
       * the viewer themselves, anyone invisible, anyone already granted or
       * already seen, and blocks in either direction.
       */
      async generateGrants(memberId, viewer, want, now) {
        const collected = [];
        const excluded = /* @__PURE__ */ new Set([memberId]);
        const session = this.db.withSession("first-unconstrained");
        const maxPrecision = viewer.prefs.maxDistanceKm <= 10 ? 5 : viewer.prefs.maxDistanceKm <= 50 ? 4 : 3;
        for (const tier of GEO_TIERS) {
          if (collected.length >= want)
            break;
          if (tier.precision < maxPrecision)
            break;
          const cell = viewer.cells[tier.column];
          if (!cell)
            continue;
          const genderFilter = viewer.prefs.genders ? ` AND di.gender_category IN (${viewer.prefs.genders.map(() => "?").join(",")})` : "";
          const binds = [cell, viewer.prefs.ageMin, viewer.prefs.ageMax];
          if (viewer.prefs.genders)
            binds.push(...viewer.prefs.genders);
          binds.push(
            memberId,
            // di.member_id != ?
            memberId,
            // od_seen_candidates.viewer_id = ?
            memberId,
            // od_blocks.blocker_member_id = ?
            memberId,
            // od_blocks.blocked_member_id = ?
            memberId,
            // od_candidate_grants.viewer_id = ?
            now,
            want - collected.length
          );
          const rows = await session.prepare(
            `SELECT di.member_id, di.age, di.gender_category, di.intent_category
           FROM od_discovery_index di
           JOIN od_members m ON m.member_id = di.member_id
          WHERE di.${tier.column} = ?
            AND di.visible = 1
            AND m.status = 'active'
            AND di.age IS NOT NULL
            AND di.age BETWEEN ? AND ?
            ${genderFilter}
            AND di.member_id != ?
            AND di.member_id NOT IN (SELECT candidate_id FROM od_seen_candidates WHERE viewer_id = ?)
            AND di.member_id NOT IN (
              SELECT blocked_member_id FROM od_blocks WHERE blocker_member_id = ?
              UNION
              SELECT blocker_member_id FROM od_blocks WHERE blocked_member_id = ?
            )
            AND di.member_id NOT IN (
              SELECT candidate_id FROM od_candidate_grants
               WHERE viewer_id = ? AND (expires_at IS NULL OR expires_at > ?)
            )
          ORDER BY di.trust_tier DESC, di.updated_at DESC
          LIMIT ?`
          ).bind(...binds).all();
          for (const raw of rows.results ?? []) {
            if (excluded.has(raw.member_id))
              continue;
            excluded.add(raw.member_id);
            collected.push({
              candidate_id: raw.member_id,
              grant_token: grantToken(memberId, raw.member_id, now),
              distance_bucket: tier.bucket
            });
            if (collected.length >= want)
              break;
          }
        }
        if (collected.length > 0) {
          await this.persistGrants(memberId, collected, now);
        }
        return collected;
      }
      async persistGrants(memberId, grants, now) {
        const session = this.db.withSession("first-primary");
        const expiresAt = now + CANDIDATE_GRANT_TTL;
        const statements = grants.flatMap((g) => [
          session.prepare(
            `INSERT OR REPLACE INTO od_candidate_grants
           (viewer_id, candidate_id, grant_token, grant_type, distance_bucket, geo_precision, granted_at, expires_at)
         VALUES (?, ?, ?, 'discovery', ?, NULL, ?, ?)`
          ).bind(memberId, g.candidate_id, g.grant_token, g.distance_bucket, now, expiresAt),
          // Mark as seen at grant time rather than on like/pass. A pass is a
          // purely local gesture the client never reports, so recording here is
          // what stops the same faces cycling back round tomorrow. Grants expire
          // after a day; this ledger does not.
          session.prepare(
            `INSERT OR IGNORE INTO od_seen_candidates (viewer_id, candidate_id, seen_at)
         VALUES (?, ?, ?)`
          ).bind(memberId, g.candidate_id, now)
        ]);
        await session.batch(statements);
      }
      /**
       * Turn grants into the cards a client can actually render: real pubkey,
       * decrypted profile content, coarse distance, and the grant token.
       *
       * The pubkey has to be returned — a like is addressed to `target_pubkey`
       * and a direct message is encrypted to it, so a pseudonymous member id
       * alone leaves the viewer unable to act on anyone they are shown.
       */
      async hydrate(grants) {
        const out = [];
        for (const grant of grants) {
          const pubkey = await this.membership.getPubkeyByMemberId(grant.candidate_id);
          if (!pubkey)
            continue;
          const content = await this.membership.getProfileContentByMemberId(grant.candidate_id);
          if (!content)
            continue;
          out.push({
            pubkey,
            profile: publicProfile(content),
            distance_bucket: grant.distance_bucket,
            candidate_grant: grant.grant_token
          });
        }
        return out;
      }
      // -------------------------------------------------------------------------
      // Quota
      // -------------------------------------------------------------------------
      async consumeQuota(memberId, now) {
        const session = this.db.withSession("first-unconstrained");
        const row = await session.prepare(
          "SELECT daily_candidates_served, daily_reset_at FROM od_discovery_quotas WHERE member_id = ?"
        ).bind(memberId).first();
        if (!row)
          return { exhausted: false, servedToday: 0, resetAt: now + DAY_SEC };
        const resetAt = row.daily_reset_at ?? 0;
        if (now > resetAt) {
          return { exhausted: false, servedToday: 0, resetAt: now + DAY_SEC };
        }
        const served = row.daily_candidates_served ?? 0;
        return { exhausted: served >= MAX_DAILY_CANDIDATES, servedToday: served, resetAt };
      }
      async recordServed(memberId, served, resetAt, now) {
        const session = this.db.withSession("first-primary");
        await session.prepare(
          `INSERT INTO od_discovery_quotas
         (member_id, daily_candidates_served, daily_likes_sent, daily_reset_at, updated_at)
       VALUES (?, ?, 0, ?, ?)
       ON CONFLICT(member_id) DO UPDATE SET
         daily_candidates_served = excluded.daily_candidates_served,
         daily_reset_at = excluded.daily_reset_at,
         updated_at = excluded.updated_at`
        ).bind(memberId, served, resetAt, now).run();
      }
    };
    __name(_DiscoveryService, "DiscoveryService");
    DiscoveryService = _DiscoveryService;
    __name(clampAge, "clampAge");
    __name(grantToken, "grantToken");
    __name(publicProfile, "publicProfile");
  }
});

// src/protocols/opendating/services/matcher/service.ts
function deterministicMatchId(pubkeyA, pubkeyB) {
  const sorted = [pubkeyA, pubkeyB].sort();
  return bytesToHex2(sha2562(new TextEncoder().encode(sorted[0] + sorted[1])));
}
function intentId(fromPubkey, toPubkey, type) {
  return bytesToHex2(sha2562(new TextEncoder().encode(fromPubkey + toPubkey + type)));
}
var LIKE_EXPIRY_SEC, _MatcherService, MatcherService;
var init_service4 = __esm({
  "src/protocols/opendating/services/matcher/service.ts"() {
    "use strict";
    init_envelope();
    init_membership();
    init_sha256();
    init_encryption();
    LIKE_EXPIRY_SEC = 90 * 24 * 60 * 60;
    __name(deterministicMatchId, "deterministicMatchId");
    __name(intentId, "intentId");
    _MatcherService = class _MatcherService {
      constructor(role, pubkey, db) {
        this.role = role;
        this.pubkey = pubkey;
        this.db = db;
        this.membership = new D1MembershipStore(db);
      }
      supports(type) {
        return ["intent.like", "intent.revoke", "match.list"].includes(type);
      }
      async handle(request, ctx) {
        const member = await this.membership.ensureMember(ctx.senderPubkey);
        switch (request.type) {
          case "intent.like":
            return this.handleLike(member.memberId, request, ctx);
          case "intent.revoke":
            return this.handleRevoke(member.memberId, request, ctx);
          case "match.list":
            return this.handleMatchList(member.memberId, request);
          default:
            throw new Error(`Matcher service does not support: ${request.type}`);
        }
      }
      async handleLike(memberId, request, ctx) {
        const payload = request.payload;
        const targetPubkey = payload.target_pubkey;
        if (!targetPubkey || targetPubkey === ctx.senderPubkey) {
          return { response: createErrorEnvelope(request.request_id, "invalid_envelope", "Invalid target") };
        }
        const targetMemberId = this.membership.getMemberId(targetPubkey);
        const iid = intentId(ctx.senderPubkey, targetPubkey, "like");
        const now = Math.floor(Date.now() / 1e3);
        const session = this.db.withSession("first-primary");
        await session.prepare(
          `INSERT OR IGNORE INTO od_intents (id, from_member_id, to_member_id, intent_type, state, created_at, expires_at)
       VALUES (?, ?, ?, 'like', 'active', ?, ?)`
        ).bind(iid, memberId, targetMemberId, now, now + LIKE_EXPIRY_SEC).run();
        const reciprocal = await session.prepare(
          `SELECT id FROM od_intents
       WHERE from_member_id = ? AND to_member_id = ? AND intent_type = 'like' AND state = 'active'`
        ).bind(targetMemberId, memberId).first();
        let matchCreated = false;
        if (reciprocal) {
          const matchId = deterministicMatchId(ctx.senderPubkey, targetPubkey);
          await session.prepare(
            `INSERT OR IGNORE INTO od_matches (match_id, member_a, member_b, state, created_at, updated_at)
         VALUES (?, ?, ?, 'active', ?, ?)`
          ).bind(matchId, memberId, targetMemberId, now, now).run();
          const notifAId = bytesToHex2(sha2562(new TextEncoder().encode(matchId + memberId + "match_created")));
          const notifBId = bytesToHex2(sha2562(new TextEncoder().encode(matchId + targetMemberId + "match_created")));
          await session.batch([
            session.prepare(
              `INSERT OR IGNORE INTO od_match_notifications (id, match_id, recipient_member_id, notification_type, created_at)
           VALUES (?, ?, ?, 'match_created', ?)`
            ).bind(notifAId, matchId, memberId, now),
            session.prepare(
              `INSERT OR IGNORE INTO od_match_notifications (id, match_id, recipient_member_id, notification_type, created_at)
           VALUES (?, ?, ?, 'match_created', ?)`
            ).bind(notifBId, matchId, targetMemberId, now)
          ]);
          matchCreated = true;
        }
        return {
          response: createEnvelope("intent.like.result", request.request_id, {
            intent_id: iid,
            match_created: matchCreated,
            created_at: now
          })
        };
      }
      async handleRevoke(memberId, request, ctx) {
        const payload = request.payload;
        const targetPubkey = payload.target_pubkey;
        const iid = intentId(ctx.senderPubkey, targetPubkey, "like");
        const now = Math.floor(Date.now() / 1e3);
        const session = this.db.withSession("first-primary");
        await session.prepare(
          `UPDATE od_intents SET state = 'revoked', revoked_at = ? WHERE id = ? AND from_member_id = ?`
        ).bind(now, iid, memberId).run();
        return { response: createEnvelope("intent.revoke.result", request.request_id, { revoked_at: now }) };
      }
      async handleMatchList(memberId, request) {
        const session = this.db.withSession("first-unconstrained");
        const matches = await session.prepare(
          `SELECT match_id, member_a, member_b, state, created_at FROM od_matches
       WHERE (member_a = ? OR member_b = ?) AND state = 'active'
       ORDER BY created_at DESC LIMIT 50`
        ).bind(memberId, memberId).all();
        return {
          response: createEnvelope("match.list.result", request.request_id, {
            matches: matches.results.map((r) => ({
              match_id: r.match_id,
              other_member: r.member_a === memberId ? r.member_b : r.member_a,
              state: r.state,
              created_at: r.created_at
            }))
          })
        };
      }
    };
    __name(_MatcherService, "MatcherService");
    MatcherService = _MatcherService;
  }
});

// src/protocols/opendating/services/block/service.ts
var _BlockService, BlockService;
var init_service5 = __esm({
  "src/protocols/opendating/services/block/service.ts"() {
    "use strict";
    init_envelope();
    init_membership();
    _BlockService = class _BlockService {
      constructor(role, pubkey, db) {
        this.role = role;
        this.pubkey = pubkey;
        this.db = db;
        this.membership = new D1MembershipStore(db);
      }
      supports(type) {
        return ["block.create", "block.list", "unmatch.create"].includes(type);
      }
      async handle(request, ctx) {
        const member = await this.membership.ensureMember(ctx.senderPubkey);
        switch (request.type) {
          case "block.create":
            return this.createBlock(member.memberId, request, ctx);
          case "block.list":
            return this.listBlocks(member.memberId, request);
          case "unmatch.create":
            return this.createUnmatch(member.memberId, request, ctx);
          default:
            throw new Error(`Block service does not support: ${request.type}`);
        }
      }
      async createBlock(memberId, request, ctx) {
        const payload = request.payload;
        const targetPubkey = payload.target_pubkey;
        const targetMemberId = this.membership.getMemberId(targetPubkey);
        const now = Math.floor(Date.now() / 1e3);
        const session = this.db.withSession("first-primary");
        await session.prepare(
          `INSERT OR REPLACE INTO od_blocks (blocker_member_id, blocked_member_id, block_type, created_at)
       VALUES (?, ?, 'block', ?)`
        ).bind(memberId, targetMemberId, now).run();
        await session.prepare(
          `UPDATE od_matches SET state = 'blocked_a', updated_at = ?
       WHERE (member_a = ? AND member_b = ?) OR (member_a = ? AND member_b = ?)`
        ).bind(now, memberId, targetMemberId, targetMemberId, memberId).run();
        await session.prepare(
          `UPDATE od_intents SET state = 'revoked', revoked_at = ?
       WHERE (from_member_id = ? AND to_member_id = ?)
          OR (from_member_id = ? AND to_member_id = ?)`
        ).bind(now, memberId, targetMemberId, targetMemberId, memberId).run();
        await session.prepare(
          `DELETE FROM od_candidate_grants WHERE (viewer_id = ? AND candidate_id = ?) OR (viewer_id = ? AND candidate_id = ?)`
        ).bind(memberId, targetMemberId, targetMemberId, memberId).run();
        return { response: createEnvelope("block.create.result", request.request_id, { blocked_at: now }) };
      }
      async listBlocks(memberId, request) {
        const session = this.db.withSession("first-unconstrained");
        const blocks = await session.prepare(
          `SELECT blocked_member_id, created_at FROM od_blocks WHERE blocker_member_id = ? ORDER BY created_at DESC`
        ).bind(memberId).all();
        return {
          response: createEnvelope("block.list.result", request.request_id, {
            blocked: blocks.results.map((r) => ({
              member_id: r.blocked_member_id,
              created_at: r.created_at
            }))
          })
        };
      }
      async createUnmatch(memberId, request, ctx) {
        const payload = request.payload;
        const targetPubkey = payload.target_pubkey;
        const targetMemberId = this.membership.getMemberId(targetPubkey);
        const now = Math.floor(Date.now() / 1e3);
        const session = this.db.withSession("first-primary");
        const matchResult = await session.prepare(
          `UPDATE od_matches SET state = 'unmatched_a', updated_at = ?
       WHERE member_a = ? AND member_b = ? AND state = 'active'`
        ).bind(now, memberId, targetMemberId).run();
        if (matchResult.meta?.changes === 0) {
          await session.prepare(
            `UPDATE od_matches SET state = 'unmatched_b', updated_at = ?
         WHERE member_b = ? AND member_a = ? AND state = 'active'`
          ).bind(now, memberId, targetMemberId).run();
        }
        return { response: createEnvelope("unmatch.create.result", request.request_id, { unmatched_at: now }) };
      }
    };
    __name(_BlockService, "BlockService");
    BlockService = _BlockService;
  }
});

// src/protocols/opendating/services/moderation/service.ts
var _ModerationService, ModerationService;
var init_service6 = __esm({
  "src/protocols/opendating/services/moderation/service.ts"() {
    "use strict";
    init_envelope();
    init_membership();
    init_encryption();
    init_sha256();
    _ModerationService = class _ModerationService {
      constructor(role, pubkey, db) {
        this.role = role;
        this.pubkey = pubkey;
        this.db = db;
        this.membership = new D1MembershipStore(db);
      }
      supports(type) {
        return ["report.create", "moderation.action"].includes(type);
      }
      async handle(request, ctx) {
        switch (request.type) {
          case "report.create":
            return this.createReport(request, ctx);
          case "moderation.action":
            return this.applyAction(request, ctx);
          default:
            throw new Error(`Moderation service does not support: ${request.type}`);
        }
      }
      async createReport(request, ctx) {
        const payload = request.payload;
        const subjectPubkey = payload.subject_pubkey;
        const reportType = payload.report_type;
        const description = payload.description_encrypted;
        if (!subjectPubkey || !reportType) {
          return { response: createErrorEnvelope(request.request_id, "invalid_envelope", "Missing subject_pubkey or report_type") };
        }
        const validTypes = ["harassment", "scam", "catfish", "underage", "inappropriate_content", "other"];
        if (!validTypes.includes(reportType)) {
          return { response: createErrorEnvelope(request.request_id, "invalid_envelope", `Invalid report_type: ${reportType}`) };
        }
        const reporterMemberId = this.membership.getMemberId(ctx.senderPubkey);
        const subjectMemberId = this.membership.getMemberId(subjectPubkey);
        const now = Math.floor(Date.now() / 1e3);
        const reportId = bytesToHex2(sha2562(new TextEncoder().encode(
          ctx.senderPubkey + subjectPubkey + reportType + String(now)
        )));
        const session = this.db.withSession("first-primary");
        await session.prepare(
          `INSERT INTO od_reports (report_id, reporter_member_id, subject_member_id, report_type, description_encrypted,
        evidence_event_ids, severity, state, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'medium', 'pending', ?, ?)`
        ).bind(
          reportId,
          reporterMemberId,
          subjectMemberId,
          reportType,
          description || null,
          JSON.stringify(payload.evidence_event_ids || []),
          now,
          now
        ).run();
        return { response: createEnvelope("report.create.result", request.request_id, { report_id: reportId, created_at: now }) };
      }
      async applyAction(request, ctx) {
        const session = this.db.withSession("first-unconstrained");
        const moderator = await session.prepare(
          "SELECT role FROM od_moderators WHERE pubkey = ?"
        ).bind(ctx.senderPubkey).first();
        if (!moderator) {
          return { response: createErrorEnvelope(request.request_id, "unauthorized", "Not a moderator") };
        }
        const payload = request.payload;
        const targetMemberId = payload.target_member_id;
        const actionType = payload.action_type;
        const reason = payload.reason;
        const durationSeconds = payload.duration_seconds;
        const now = Math.floor(Date.now() / 1e3);
        const actionId = bytesToHex2(sha2562(new TextEncoder().encode(
          ctx.senderPubkey + targetMemberId + actionType + String(now)
        )));
        const ps = this.db.withSession("first-primary");
        await ps.prepare(
          `INSERT INTO od_moderation_actions (action_id, report_id, moderator_pubkey, action_type, target_member_id, reason, duration_seconds, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(actionId, payload.report_id || null, ctx.senderPubkey, actionType, targetMemberId, reason, durationSeconds || null, now).run();
        if (["suspend", "ban"].includes(actionType)) {
          await ps.prepare(
            `INSERT OR REPLACE INTO od_sanctions (target_member_id, sanction_type, reason, expires_at, created_at, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`
          ).bind(
            targetMemberId,
            actionType === "ban" ? "banned" : "suspended",
            reason,
            durationSeconds ? now + durationSeconds : null,
            now,
            ctx.senderPubkey
          ).run();
          await ps.prepare(
            `UPDATE od_profiles SET visibility = 'hidden', updated_at = ? WHERE member_id = ?`
          ).bind(now, targetMemberId).run();
        }
        return { response: createEnvelope("moderation.action.result", request.request_id, { action_id: actionId, applied_at: now }) };
      }
    };
    __name(_ModerationService, "ModerationService");
    ModerationService = _ModerationService;
  }
});

// src/protocols/opendating/services/deletion/service.ts
var _DeletionService, DeletionService;
var init_service7 = __esm({
  "src/protocols/opendating/services/deletion/service.ts"() {
    "use strict";
    init_envelope();
    init_membership();
    init_encryption();
    init_sha256();
    _DeletionService = class _DeletionService {
      constructor(role, pubkey, db) {
        this.role = role;
        this.pubkey = pubkey;
        this.db = db;
        this.membership = new D1MembershipStore(db);
      }
      supports(type) {
        return type === "account.delete";
      }
      async handle(request, ctx) {
        const memberId = this.membership.getMemberId(ctx.senderPubkey);
        const now = Math.floor(Date.now() / 1e3);
        const session = this.db.withSession("first-primary");
        await this.membership.deleteMember(ctx.senderPubkey);
        await session.prepare(
          `UPDATE od_intents SET state = 'revoked', revoked_at = ? WHERE from_member_id = ?`
        ).bind(now, memberId).run();
        await session.prepare(
          `UPDATE od_matches SET state = 'unmatched_a', updated_at = ?
       WHERE (member_a = ? OR member_b = ?) AND state = 'active'`
        ).bind(now, memberId, memberId).run();
        await session.prepare(
          `DELETE FROM od_blocks WHERE blocker_member_id = ? OR blocked_member_id = ?`
        ).bind(memberId, memberId).run();
        await session.prepare(
          `DELETE FROM od_candidate_grants WHERE viewer_id = ? OR candidate_id = ?`
        ).bind(memberId, memberId).run();
        const requestHash = bytesToHex2(sha2562(new TextEncoder().encode(
          ctx.senderPubkey + String(now)
        )));
        await session.prepare(
          `INSERT OR REPLACE INTO od_vanish_tombstones (member_id, cutoff_timestamp, request_hash, created_at)
       VALUES (?, ?, ?, ?)`
        ).bind(memberId, now, requestHash, now).run();
        return { response: createEnvelope("account.delete.result", request.request_id, {
          deleted_at: now,
          tombstone_hash: requestHash
        }) };
      }
    };
    __name(_DeletionService, "DeletionService");
    DeletionService = _DeletionService;
  }
});

// src/protocols/opendating/index.ts
function initOpenDating(env, db) {
  if (initialized)
    return;
  console.log("[OpenDating] Initializing protocol core...");
  try {
    initMembershipKeys(env || {});
  } catch (err) {
    console.error("[OpenDating] Refusing to start:", err.message);
    return;
  }
  initOpenDatingExtension(db);
  const signers = loadServiceIdentitiesFromEnv(env || {});
  if (signers.length === 0) {
    console.warn("[OpenDating] No service identities loaded");
    return;
  }
  const factories = {
    system: (pk) => odServiceRegistry.register(new SystemService("system", pk)),
    profile: (pk) => odServiceRegistry.register(new ProfileService("profile", pk, db)),
    discovery: (pk) => odServiceRegistry.register(new DiscoveryService("discovery", pk, db)),
    matcher: (pk) => odServiceRegistry.register(new MatcherService("matcher", pk, db)),
    dm_policy: (pk) => odServiceRegistry.register(new BlockService("dm_policy", pk, db)),
    moderation: (pk) => odServiceRegistry.register(new ModerationService("moderation", pk, db)),
    deletion: (pk) => odServiceRegistry.register(new DeletionService("deletion", pk, db))
  };
  for (const signer of signers) {
    const factory = factories[signer.role];
    if (factory) {
      factory(signer.pubkey);
    } else {
      console.warn(`[OpenDating] Unknown service role: ${signer.role}`);
    }
  }
  extensionRegistry.register(openDatingExtension);
  initialized = true;
  console.log(`[OpenDating] Initialized with ${signers.length} service(s)`);
}
function getOpenDatingNip11Advertisement() {
  return buildNip11Advertisement(odServiceRegistry.listServices());
}
var initialized;
var init_opendating = __esm({
  "src/protocols/opendating/index.ts"() {
    "use strict";
    init_registry();
    init_extension();
    init_loader();
    init_service();
    init_service2();
    init_service3();
    init_service4();
    init_service5();
    init_service6();
    init_service7();
    init_registry2();
    init_membership();
    init_capabilities();
    init_constants();
    init_envelope();
    init_gift_wrap();
    init_encryption();
    initialized = false;
    __name(initOpenDating, "initOpenDating");
    __name(getOpenDatingNip11Advertisement, "getOpenDatingNip11Advertisement");
  }
});

// src/protocols/blossom/auth.ts
function tagValue(event, name) {
  return event.tags.find((t) => t[0] === name)?.[1];
}
function tagValues(event, name) {
  return event.tags.filter((t) => t[0] === name).map((t) => t[1]);
}
function computeEventId(event) {
  const serialized = JSON.stringify([
    0,
    event.pubkey,
    event.created_at,
    event.kind,
    event.tags,
    event.content
  ]);
  return bytesToHex2(sha2562(new TextEncoder().encode(serialized)));
}
function parseAuthHeader(header) {
  if (!header)
    return null;
  const match = /^Nostr\s+(.+)$/i.exec(header.trim());
  if (!match)
    return null;
  try {
    const json2 = atob(match[1]);
    const parsed = JSON.parse(json2);
    if (typeof parsed?.pubkey !== "string" || !Array.isArray(parsed?.tags))
      return null;
    return parsed;
  } catch {
    return null;
  }
}
function verifyAuth(event, verb, now, blobHash) {
  if (!event)
    return { ok: false, error: "Missing Authorization header" };
  if (event.kind !== BLOSSOM_AUTH_KIND) {
    return { ok: false, error: `Authorization must be kind ${BLOSSOM_AUTH_KIND}` };
  }
  if (!/^[0-9a-f]{64}$/i.test(event.pubkey)) {
    return { ok: false, error: "Malformed pubkey" };
  }
  const verbs = tagValues(event, "t");
  if (!verbs.includes(verb)) {
    return { ok: false, error: `Authorization is not valid for "${verb}"` };
  }
  const expiration = Number(tagValue(event, "expiration"));
  if (!Number.isFinite(expiration)) {
    return { ok: false, error: "Authorization must carry an expiration tag" };
  }
  if (expiration <= now) {
    return { ok: false, error: "Authorization has expired" };
  }
  if (expiration - now > MAX_AUTH_LIFETIME_SEC) {
    return { ok: false, error: "Authorization expiration is too far in the future" };
  }
  if (event.created_at > now + 300) {
    return { ok: false, error: "Authorization is dated in the future" };
  }
  if (verb === "upload" || verb === "delete") {
    const hashes = tagValues(event, "x").map((h) => h.toLowerCase());
    if (hashes.length === 0) {
      return { ok: false, error: "Authorization must carry an x tag with the blob hash" };
    }
    if (blobHash && !hashes.includes(blobHash.toLowerCase())) {
      return { ok: false, error: "Authorization does not cover this blob" };
    }
  }
  if (computeEventId(event) !== event.id?.toLowerCase()) {
    return { ok: false, error: "Authorization id does not match its contents" };
  }
  try {
    const valid = schnorr.verify(
      hexToBytes2(event.sig),
      hexToBytes2(event.id),
      hexToBytes2(event.pubkey)
    );
    if (!valid)
      return { ok: false, error: "Invalid signature" };
  } catch {
    return { ok: false, error: "Invalid signature" };
  }
  return { ok: true, pubkey: event.pubkey.toLowerCase() };
}
var BLOSSOM_AUTH_KIND, MAX_AUTH_LIFETIME_SEC;
var init_auth = __esm({
  "src/protocols/blossom/auth.ts"() {
    "use strict";
    init_secp256k1();
    init_sha256();
    init_encryption();
    BLOSSOM_AUTH_KIND = 24242;
    MAX_AUTH_LIFETIME_SEC = 10 * 60;
    __name(tagValue, "tagValue");
    __name(tagValues, "tagValues");
    __name(computeEventId, "computeEventId");
    __name(parseAuthHeader, "parseAuthHeader");
    __name(verifyAuth, "verifyAuth");
  }
});

// src/protocols/blossom/server.ts
function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      ...extra
    }
  });
}
function error(message, status) {
  return json({ message }, status, { "X-Reason": message });
}
function blobUrl(origin, hash, type) {
  const ext = EXTENSIONS[type];
  return ext ? `${origin}/${hash}.${ext}` : `${origin}/${hash}`;
}
function parseBlobPath(pathname) {
  const match = /^\/([0-9a-f]{64})(?:\.[a-z0-9]+)?$/i.exec(pathname);
  return match ? match[1].toLowerCase() : null;
}
function isBlossomPath(pathname) {
  return pathname === "/upload" || pathname.startsWith("/list/") || parseBlobPath(pathname) !== null;
}
async function handleBlossomRequest(request, env) {
  const url = new URL(request.url);
  const bucket = env.MEDIA_BUCKET;
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Max-Age": "86400"
      }
    });
  }
  if (!bucket) {
    return error("Media storage is not configured on this relay", 503);
  }
  if (url.pathname === "/upload" && request.method === "PUT") {
    return handleUpload(request, bucket, url.origin);
  }
  if (url.pathname.startsWith("/list/") && request.method === "GET") {
    return handleList(url, bucket);
  }
  const hash = parseBlobPath(url.pathname);
  if (hash) {
    if (request.method === "GET" || request.method === "HEAD") {
      return handleGet(hash, bucket, request.method === "HEAD");
    }
    if (request.method === "DELETE") {
      return handleDelete(request, hash, bucket);
    }
  }
  return error("Not found", 404);
}
async function handleUpload(request, bucket, origin) {
  const now = Math.floor(Date.now() / 1e3);
  const auth = parseAuthHeader(request.headers.get("Authorization"));
  const authResult = verifyAuth(auth, "upload", now);
  if (!authResult.ok || !authResult.pubkey) {
    return error(authResult.error ?? "Unauthorized", 401);
  }
  const declaredType = request.headers.get("Content-Type") ?? "";
  const type = declaredType.split(";")[0].trim().toLowerCase();
  if (!ALLOWED_TYPES.has(type)) {
    return error(`Unsupported media type: ${type || "unknown"}`, 415);
  }
  const declaredLength = Number(request.headers.get("Content-Length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BLOB_BYTES) {
    return error(`Blob exceeds ${MAX_BLOB_BYTES} bytes`, 413);
  }
  const body = new Uint8Array(await request.arrayBuffer());
  if (body.byteLength === 0)
    return error("Empty body", 400);
  if (body.byteLength > MAX_BLOB_BYTES) {
    return error(`Blob exceeds ${MAX_BLOB_BYTES} bytes`, 413);
  }
  const hash = bytesToHex2(sha2562(body));
  const recheck = verifyAuth(auth, "upload", now, hash);
  if (!recheck.ok) {
    return error(recheck.error ?? "Authorization does not cover this blob", 401);
  }
  const existing = await bucket.head(hash);
  if (!existing) {
    await bucket.put(hash, body, {
      httpMetadata: {
        contentType: type,
        // Content-addressed, so a blob at a given URL can never change.
        cacheControl: "public, max-age=31536000, immutable"
      },
      customMetadata: {
        uploader: authResult.pubkey,
        uploaded: String(now)
      }
    });
  }
  const descriptor = {
    url: blobUrl(origin, hash, type),
    sha256: hash,
    size: body.byteLength,
    type,
    uploaded: now
  };
  return json(descriptor, 201);
}
async function handleGet(hash, bucket, headOnly) {
  const object = headOnly ? await bucket.head(hash) : await bucket.get(hash);
  if (!object)
    return error("Blob not found", 404);
  const headers = new Headers({
    "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
    "Content-Length": String(object.size),
    "Cache-Control": "public, max-age=31536000, immutable",
    "Access-Control-Allow-Origin": "*",
    ETag: object.httpEtag
  });
  if (headOnly)
    return new Response(null, { status: 200, headers });
  return new Response(object.body, { status: 200, headers });
}
async function handleList(url, bucket) {
  const pubkey = url.pathname.slice("/list/".length).toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(pubkey))
    return error("Malformed pubkey", 400);
  const listed = await bucket.list({ limit: 1e3 });
  const blobs = [];
  for (const entry of listed.objects) {
    const object = await bucket.head(entry.key);
    if (object?.customMetadata?.uploader !== pubkey)
      continue;
    const type = object.httpMetadata?.contentType ?? "application/octet-stream";
    blobs.push({
      url: blobUrl(url.origin, object.key, type),
      sha256: object.key,
      size: object.size,
      type,
      uploaded: Number(object.customMetadata?.uploaded ?? 0)
    });
  }
  return json(blobs);
}
async function handleDelete(request, hash, bucket) {
  const now = Math.floor(Date.now() / 1e3);
  const auth = parseAuthHeader(request.headers.get("Authorization"));
  const authResult = verifyAuth(auth, "delete", now, hash);
  if (!authResult.ok || !authResult.pubkey) {
    return error(authResult.error ?? "Unauthorized", 401);
  }
  const object = await bucket.head(hash);
  if (!object)
    return error("Blob not found", 404);
  if (object.customMetadata?.uploader !== authResult.pubkey) {
    return error("Only the uploader may delete this blob", 403);
  }
  await bucket.delete(hash);
  return json({ message: "Deleted" });
}
var MAX_BLOB_BYTES, ALLOWED_TYPES, EXTENSIONS;
var init_server = __esm({
  "src/protocols/blossom/server.ts"() {
    "use strict";
    init_encryption();
    init_sha256();
    init_auth();
    MAX_BLOB_BYTES = 8 * 1024 * 1024;
    ALLOWED_TYPES = /* @__PURE__ */ new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/heic"
    ]);
    EXTENSIONS = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
      "image/heic": "heic"
    };
    __name(json, "json");
    __name(error, "error");
    __name(blobUrl, "blobUrl");
    __name(parseBlobPath, "parseBlobPath");
    __name(isBlossomPath, "isBlossomPath");
    __name(handleBlossomRequest, "handleBlossomRequest");
    __name(handleUpload, "handleUpload");
    __name(handleGet, "handleGet");
    __name(handleList, "handleList");
    __name(handleDelete, "handleDelete");
  }
});

// src/cloudflare/queue.ts
async function processTask(message, db, ai) {
  const { type, payload } = message;
  try {
    switch (type) {
      case "report.created":
        await processReportCreated(db, payload);
        break;
      case "match.notify":
        await processMatchNotification(db, payload);
        break;
      case "member.deleted":
        await processMemberDeleted(db, payload);
        break;
      case "profile.updated":
        await processProfileUpdated(db, payload);
        break;
      default:
        console.warn(`[queue] unknown task type: ${type}`);
    }
  } catch (err) {
    console.error(`[queue] task ${type} failed:`, err);
    throw err;
  }
}
async function processReportCreated(db, payload) {
  const { reportId } = payload;
  if (!reportId)
    return;
  await db.prepare(
    `UPDATE od_reports SET status = 'triaging' WHERE report_id = ? AND status = 'pending'`
  ).bind(reportId).run();
  console.log(`[queue] report ${reportId} queued for triage`);
}
async function processMatchNotification(db, payload) {
  const { matchId, memberA, memberB } = payload;
  if (!matchId)
    return;
  await db.prepare(
    `INSERT OR IGNORE INTO od_match_notifications (match_id, member_id, notified_at)
     VALUES (?, ?, ?), (?, ?, ?)`
  ).bind(
    matchId,
    memberA,
    Math.floor(Date.now() / 1e3),
    matchId,
    memberB,
    Math.floor(Date.now() / 1e3)
  ).run();
  console.log(`[queue] match notification sent for ${matchId}`);
}
async function processMemberDeleted(db, payload) {
  const { memberId } = payload;
  if (!memberId)
    return;
  const now = Math.floor(Date.now() / 1e3);
  const tables = [
    "od_profiles",
    "od_discovery_index",
    "od_visibility_prefs",
    "od_discovery_prefs",
    "od_discovery_quotas",
    "od_locations",
    "od_seen_candidates",
    "od_candidate_grants",
    "od_intents",
    "od_matches",
    "od_match_notifications",
    "od_blocks",
    "od_unmatches",
    "od_profile_media"
  ];
  for (const table of tables) {
    try {
      await db.prepare(`DELETE FROM ${table} WHERE member_id = ? OR viewer_id = ? OR candidate_id = ?`).bind(memberId, memberId, memberId).run();
    } catch {
    }
  }
  await db.prepare(
    `UPDATE od_members SET status = 'deleted', updated_at = ? WHERE member_id = ?`
  ).bind(now, memberId).run();
  console.log(`[queue] member ${memberId} deletion cascaded`);
}
async function processProfileUpdated(db, payload) {
  const { memberId } = payload;
  if (!memberId)
    return;
  const now = Math.floor(Date.now() / 1e3);
  await db.prepare(
    `UPDATE od_discovery_index SET updated_at = ? WHERE member_id = ?`
  ).bind(now, memberId).run();
  console.log(`[queue] discovery index synced for member ${memberId}`);
}
var init_queue = __esm({
  "src/cloudflare/queue.ts"() {
    "use strict";
    __name(processTask, "processTask");
    __name(processReportCreated, "processReportCreated");
    __name(processMatchNotification, "processMatchNotification");
    __name(processMemberDeleted, "processMemberDeleted");
    __name(processProfileUpdated, "processProfileUpdated");
  }
});

// src/cloudflare/cache.ts
function nip11Key() {
  return "cache:nip11";
}
async function getCachedNip11(kv) {
  if (!kv)
    return null;
  try {
    return await kv.get(nip11Key());
  } catch (err) {
    console.error("[cache] nip11 get failed:", err);
    return null;
  }
}
async function setCachedNip11(kv, json2) {
  if (!kv)
    return;
  try {
    await kv.put(nip11Key(), json2, { expirationTtl: NIP11_CACHE_TTL });
  } catch (err) {
    console.error("[cache] nip11 set failed:", err);
  }
}
var NIP11_CACHE_TTL;
var init_cache = __esm({
  "src/cloudflare/cache.ts"() {
    "use strict";
    NIP11_CACHE_TTL = 3600;
    __name(nip11Key, "nip11Key");
    __name(getCachedNip11, "getCachedNip11");
    __name(setCachedNip11, "setCachedNip11");
  }
});

// src/relay-worker.ts
var relay_worker_exports = {};
__export(relay_worker_exports, {
  RelayWebSocket: () => RelayWebSocket,
  calculateQueryComplexity: () => calculateQueryComplexity,
  default: () => relay_worker_default,
  hasPaidForRelay: () => hasPaidForRelay,
  processEvent: () => processEvent,
  queryEvents: () => queryEvents,
  verifyEventSignature: () => verifyEventSignature
});
function ensureODInit(env) {
  if (!odInitialized) {
    try {
      initOpenDating(env, env.RELAY_DATABASE);
      odInitialized = true;
    } catch (e) {
      console.error("OpenDating init error:", e);
    }
  }
}
async function initializeDatabase(db) {
  const dropSession = db.withSession("first-primary");
  try {
    await dropSession.prepare(`
      CREATE TABLE IF NOT EXISTS system_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `).run();
  } catch (_) {
  }
  const cleanupDone = await dropSession.prepare(
    "SELECT value FROM system_config WHERE key = 'cleanup_v1' LIMIT 1"
  ).first().catch(() => null);
  if (!cleanupDone || cleanupDone.value !== "1") {
    const dropIndexes = [
      "idx_events_pubkey",
      "idx_events_kind",
      "idx_events_created_at_kind",
      "idx_events_authors_kinds",
      "idx_events_tag_p_created_at",
      "idx_events_tag_e_created_at",
      "idx_events_tag_a_created_at",
      "idx_events_tag_t_created_at",
      "idx_events_tag_d_created_at",
      "idx_events_tag_r_created_at",
      "idx_events_tag_L_created_at",
      "idx_events_tag_s_created_at",
      "idx_events_tag_u_created_at",
      "idx_events_kind_tag_p",
      "idx_events_kind_tag_e",
      "idx_events_kind_tag_a",
      "idx_events_kind_tag_t",
      "idx_events_kind_tag_L",
      "idx_events_kind_tag_s",
      "idx_events_reply_to",
      "idx_events_root_thread",
      "idx_events_kind_created_at_covering",
      "idx_events_pubkey_kind_created_at_covering",
      "idx_events_created_at_covering",
      "idx_events_kind_pubkey_created_at_covering",
      "idx_tags_name_value",
      "idx_tags_value",
      "idx_tags_name_value_event_created"
    ];
    for (const idx of dropIndexes) {
      await dropSession.prepare(`DROP INDEX IF EXISTS ${idx}`).run();
    }
    const dropTables = ["event_tags_cache", "mv_follow_graph", "mv_recent_notes", "mv_timeline_cache"];
    for (const tbl of dropTables) {
      await dropSession.prepare(`DROP TABLE IF EXISTS ${tbl}`).run();
    }
    await dropSession.prepare(
      "INSERT OR REPLACE INTO system_config (key, value) VALUES ('cleanup_v1', '1')"
    ).run();
  }
  try {
    const initCheck = await dropSession.prepare(
      "SELECT value FROM system_config WHERE key = 'db_initialized' LIMIT 1"
    ).first().catch(() => null);
    if (initCheck && initCheck.value === "1") {
      console.log("Database already initialized");
      return;
    }
  } catch (error2) {
    console.log("Database not initialized, creating schema...");
  }
  const session = db.withSession("first-primary");
  try {
    await session.prepare(`
      CREATE TABLE IF NOT EXISTS system_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `).run();
    const statements = [
      `CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        pubkey TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        kind INTEGER NOT NULL,
        tags TEXT NOT NULL,
        content TEXT NOT NULL,
        sig TEXT NOT NULL,
        created_timestamp INTEGER DEFAULT (strftime('%s', 'now')),
        tag_p TEXT,
        tag_e TEXT,
        tag_a TEXT,
        tag_t TEXT,
        tag_d TEXT,
        tag_r TEXT,
        tag_L TEXT,
        tag_s TEXT,
        tag_u TEXT,
        reply_to_event_id TEXT,
        root_event_id TEXT,
        content_preview TEXT
      )`,
      `CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_events_kind_created_at ON events(kind, created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_events_pubkey_created_at ON events(pubkey, created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_events_pubkey_kind_created_at ON events(pubkey, kind, created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_events_kind_pubkey_created_at ON events(kind, pubkey, created_at DESC)`,
      `CREATE TABLE IF NOT EXISTS tags (
        event_id TEXT NOT NULL,
        tag_name TEXT NOT NULL,
        tag_value TEXT NOT NULL,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      )`,
      `CREATE INDEX IF NOT EXISTS idx_tags_name_value_event ON tags(tag_name, tag_value, event_id)`,
      `CREATE INDEX IF NOT EXISTS idx_tags_event_id ON tags(event_id)`,
      `CREATE TABLE IF NOT EXISTS event_tags_cache_multi (
        event_id TEXT NOT NULL,
        pubkey TEXT NOT NULL,
        kind INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        tag_type TEXT NOT NULL CHECK(tag_type IN ('p', 'e', 'a', 't', 'd', 'r', 'L', 's', 'u')),
        tag_value TEXT NOT NULL,
        PRIMARY KEY (event_id, tag_type, tag_value)
      )`,
      `CREATE INDEX IF NOT EXISTS idx_cache_multi_type_value_time ON event_tags_cache_multi(tag_type, tag_value, created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_cache_multi_type_value_event ON event_tags_cache_multi(tag_type, tag_value, event_id)`,
      `CREATE INDEX IF NOT EXISTS idx_cache_multi_kind_type_value ON event_tags_cache_multi(kind, tag_type, tag_value, created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_cache_multi_event_id ON event_tags_cache_multi(event_id)`,
      `CREATE TABLE IF NOT EXISTS paid_pubkeys (
        pubkey TEXT PRIMARY KEY,
        paid_at INTEGER NOT NULL,
        amount_sats INTEGER,
        created_timestamp INTEGER DEFAULT (strftime('%s', 'now'))
      )`,
      `CREATE TABLE IF NOT EXISTS content_hashes (
        hash TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        pubkey TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      )`,
      `CREATE INDEX IF NOT EXISTS idx_content_hashes_pubkey ON content_hashes(pubkey)`,
      `CREATE INDEX IF NOT EXISTS idx_content_hashes_created_at ON content_hashes(created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_content_hashes_pubkey_created ON content_hashes(pubkey, created_at DESC)`
    ];
    for (const statement of statements) {
      await session.prepare(statement).run();
    }
    await session.prepare("PRAGMA foreign_keys = ON").run();
    await session.prepare(
      "INSERT OR REPLACE INTO system_config (key, value) VALUES ('db_initialized', '1')"
    ).run();
    const versionResult = await session.prepare(
      "SELECT value FROM system_config WHERE key = 'schema_version'"
    ).first();
    const currentVersion = versionResult ? parseInt(versionResult.value) : 0;
    if (currentVersion < 5) {
      console.log("Migrating to schema version 5: adding and populating tag columns in events table...");
      const v5Columns = ["tag_p", "tag_e", "tag_a", "tag_t", "tag_d", "tag_r"];
      for (const col of v5Columns) {
        try {
          await session.prepare(`ALTER TABLE events ADD COLUMN ${col} TEXT`).run();
        } catch (e) {
          if (!e.message?.includes("duplicate column"))
            throw e;
        }
      }
      await session.prepare(`
        UPDATE events
        SET
          tag_p = (SELECT tag_value FROM tags WHERE event_id = events.id AND tag_name = 'p' LIMIT 1),
          tag_e = (SELECT tag_value FROM tags WHERE event_id = events.id AND tag_name = 'e' LIMIT 1),
          tag_a = (SELECT tag_value FROM tags WHERE event_id = events.id AND tag_name = 'a' LIMIT 1),
          tag_t = (SELECT tag_value FROM tags WHERE event_id = events.id AND tag_name = 't' LIMIT 1),
          tag_d = (SELECT tag_value FROM tags WHERE event_id = events.id AND tag_name = 'd' LIMIT 1),
          tag_r = (SELECT tag_value FROM tags WHERE event_id = events.id AND tag_name = 'r' LIMIT 1)
        WHERE EXISTS (
          SELECT 1 FROM tags t
          WHERE t.event_id = events.id
          AND t.tag_name IN ('p', 'e', 'a', 't', 'd', 'r')
        )
      `).run();
      console.log("Schema v5 migration completed");
    }
    if (currentVersion < 6) {
      console.log("Migrating to schema version 6: adding L/s/u tags and thread metadata...");
      const v6Columns = ["tag_L", "tag_s", "tag_u", "reply_to_event_id", "root_event_id", "content_preview"];
      for (const col of v6Columns) {
        try {
          await session.prepare(`ALTER TABLE events ADD COLUMN ${col} TEXT`).run();
        } catch (e) {
          if (!e.message?.includes("duplicate column"))
            throw e;
        }
      }
      await session.prepare(`
        UPDATE events
        SET
          tag_L = (SELECT tag_value FROM tags WHERE event_id = events.id AND tag_name = 'L' LIMIT 1),
          tag_s = (SELECT tag_value FROM tags WHERE event_id = events.id AND tag_name = 's' LIMIT 1),
          tag_u = (SELECT tag_value FROM tags WHERE event_id = events.id AND tag_name = 'u' LIMIT 1),
          reply_to_event_id = (SELECT tag_value FROM tags WHERE event_id = events.id AND tag_name = 'e' LIMIT 1),
          root_event_id = (
            SELECT tag_value FROM tags
            WHERE event_id = events.id AND tag_name = 'e'
            AND EXISTS (
              SELECT 1 FROM tags t2
              WHERE t2.event_id = events.id AND t2.tag_name = 'e'
              HAVING COUNT(*) > 1
            )
            ORDER BY ROWID DESC LIMIT 1
          ),
          content_preview = SUBSTR(content, 1, 100)
        WHERE EXISTS (
          SELECT 1 FROM tags t
          WHERE t.event_id = events.id
          AND t.tag_name IN ('L', 's', 'u', 'e')
        ) OR LENGTH(content) > 0
      `).run();
      console.log("Schema v6 migration completed");
    }
    await session.prepare(
      "INSERT OR REPLACE INTO system_config (key, value) VALUES ('schema_version', '6')"
    ).run();
    await session.prepare(`
      INSERT OR IGNORE INTO event_tags_cache_multi (event_id, pubkey, kind, created_at, tag_type, tag_value)
      SELECT
        e.id,
        e.pubkey,
        e.kind,
        e.created_at,
        t.tag_name,
        t.tag_value
      FROM events e
      INNER JOIN tags t ON e.id = t.event_id
      WHERE t.tag_name IN ('p', 'e', 'a', 't', 'd', 'r', 'L', 's', 'u')
    `).run();
    await session.prepare("ANALYZE events").run();
    await session.prepare("ANALYZE tags").run();
    await session.prepare("ANALYZE event_tags_cache_multi").run();
    console.log("Database initialization completed!");
  } catch (error2) {
    console.error("Failed to initialize database:", error2);
    throw error2;
  }
}
async function verifyEventSignature(event) {
  try {
    const signatureBytes = hexToBytes3(event.sig);
    const serializedEventData = serializeEventForSigning(event);
    const messageHashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(serializedEventData)
    );
    const messageHash = new Uint8Array(messageHashBuffer);
    const publicKeyBytes = hexToBytes3(event.pubkey);
    return schnorr.verify(signatureBytes, messageHash, publicKeyBytes);
  } catch (error2) {
    console.error("Error verifying event signature:", error2);
    return false;
  }
}
function serializeEventForSigning(event) {
  return JSON.stringify([
    0,
    event.pubkey,
    event.created_at,
    event.kind,
    event.tags,
    event.content
  ]);
}
function hexToBytes3(hexString) {
  if (hexString.length % 2 !== 0)
    throw new Error("Invalid hex string");
  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hexString.substr(i * 2, 2), 16);
  }
  return bytes;
}
function bytesToHex3(bytes) {
  return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
async function hashContent(event) {
  const contentToHash = enableGlobalDuplicateCheck2 ? JSON.stringify({ kind: event.kind, tags: event.tags, content: event.content }) : JSON.stringify({ pubkey: event.pubkey, kind: event.kind, tags: event.tags, content: event.content });
  const buffer = new TextEncoder().encode(contentToHash);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return bytesToHex3(new Uint8Array(hashBuffer));
}
function shouldCheckForDuplicates(kind) {
  return enableAntiSpam2 && antiSpamKinds2.has(kind);
}
async function hasPaidForRelay(pubkey, env) {
  if (!PAY_TO_RELAY_ENABLED2)
    return true;
  try {
    const session = env.RELAY_DATABASE.withSession("first-unconstrained");
    const result = await session.prepare(
      "SELECT pubkey FROM paid_pubkeys WHERE pubkey = ? LIMIT 1"
    ).bind(pubkey).first();
    return result !== null;
  } catch (error2) {
    console.error(`Error checking paid status for ${pubkey}:`, error2);
    return null;
  }
}
async function savePaidPubkey(pubkey, env) {
  try {
    const session = env.RELAY_DATABASE.withSession("first-primary");
    await session.prepare(`
      INSERT INTO paid_pubkeys (pubkey, paid_at, amount_sats)
      VALUES (?, ?, ?)
      ON CONFLICT(pubkey) DO UPDATE SET
        paid_at = excluded.paid_at,
        amount_sats = excluded.amount_sats
    `).bind(pubkey, Math.floor(Date.now() / 1e3), RELAY_ACCESS_PRICE_SATS2).run();
    return true;
  } catch (error2) {
    console.error(`Error saving paid pubkey ${pubkey}:`, error2);
    return false;
  }
}
function fetchEventFromFallbackRelay(pubkey) {
  return new Promise((resolve, reject) => {
    const fallbackRelayUrl = "wss://relay.primal.net";
    const ws = new WebSocket(fallbackRelayUrl);
    let hasClosed = false;
    const closeWebSocket = /* @__PURE__ */ __name((subscriptionId) => {
      if (!hasClosed && ws.readyState === WebSocket.OPEN) {
        if (subscriptionId) {
          ws.send(JSON.stringify(["CLOSE", subscriptionId]));
        }
        ws.close();
        hasClosed = true;
        console.log("WebSocket connection to fallback relay closed");
      }
    }, "closeWebSocket");
    ws.addEventListener("open", () => {
      console.log("WebSocket connection to fallback relay opened.");
      const subscriptionId = Math.random().toString(36).substr(2, 9);
      const filters = {
        kinds: [0],
        authors: [pubkey],
        limit: 1
      };
      const reqMessage = JSON.stringify(["REQ", subscriptionId, filters]);
      ws.send(reqMessage);
    });
    ws.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message[0] === "EVENT" && message[1]) {
          const eventData = message[2];
          if (eventData.kind === 0 && eventData.pubkey === pubkey) {
            console.log("Received kind 0 event from fallback relay.");
            closeWebSocket(message[1]);
            resolve(eventData);
          }
        } else if (message[0] === "EOSE") {
          console.log("EOSE received from fallback relay, no kind 0 event found.");
          closeWebSocket(message[1]);
          resolve(null);
        }
      } catch (error2) {
        console.error(`Error processing fallback relay event for pubkey ${pubkey}: ${error2}`);
        reject(error2);
      }
    });
    ws.addEventListener("error", (error2) => {
      console.error(`WebSocket error with fallback relay:`, error2);
      ws.close();
      hasClosed = true;
      reject(error2);
    });
    ws.addEventListener("close", () => {
      hasClosed = true;
      console.log("Fallback relay WebSocket connection closed.");
    });
    setTimeout(() => {
      if (!hasClosed) {
        console.log("Timeout reached. Closing WebSocket connection to fallback relay.");
        closeWebSocket(null);
        reject(new Error(`No response from fallback relay for pubkey ${pubkey}`));
      }
    }, 5e3);
  });
}
async function fetchKind0EventForPubkey(pubkey, env) {
  try {
    const filters = [{ kinds: [0], authors: [pubkey], limit: 1 }];
    const result = await queryEvents(filters, "first-unconstrained", env);
    if (result.events && result.events.length > 0) {
      return result.events[0];
    }
    console.log(`No kind 0 event found locally, trying fallback relay: wss://relay.primal.net`);
    const fallbackEvent = await fetchEventFromFallbackRelay(pubkey);
    if (fallbackEvent) {
      return fallbackEvent;
    }
  } catch (error2) {
    console.error(`Error fetching kind 0 event for pubkey ${pubkey}: ${error2}`);
  }
  return null;
}
async function validateNIP05FromKind0(pubkey, env) {
  try {
    const metadataEvent = await fetchKind0EventForPubkey(pubkey, env);
    if (!metadataEvent) {
      console.error(`No kind 0 metadata event found for pubkey: ${pubkey}`);
      return false;
    }
    const metadata = JSON.parse(metadataEvent.content);
    const nip05Address = metadata.nip05;
    if (!nip05Address) {
      console.error(`No NIP-05 address found in kind 0 for pubkey: ${pubkey}`);
      return false;
    }
    const isValid = await validateNIP05(nip05Address, pubkey);
    return isValid;
  } catch (error2) {
    console.error(`Error validating NIP-05 for pubkey ${pubkey}: ${error2}`);
    return false;
  }
}
async function validateNIP05(nip05Address, pubkey) {
  try {
    const [name, domain] = nip05Address.split("@");
    if (!domain) {
      throw new Error(`Invalid NIP-05 address format: ${nip05Address}`);
    }
    if (blockedNip05Domains2.has(domain)) {
      console.error(`NIP-05 domain is blocked: ${domain}`);
      return false;
    }
    if (allowedNip05Domains2.size > 0 && !allowedNip05Domains2.has(domain)) {
      console.error(`NIP-05 domain is not allowed: ${domain}`);
      return false;
    }
    const url = `https://${domain}/.well-known/nostr.json?name=${name}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch NIP-05 data from ${url}: ${response.statusText}`);
      return false;
    }
    const nip05Data = await response.json();
    if (!nip05Data.names || !nip05Data.names[name]) {
      console.error(`NIP-05 data does not contain a matching public key for ${name}`);
      return false;
    }
    const nip05Pubkey = nip05Data.names[name];
    return nip05Pubkey === pubkey;
  } catch (error2) {
    console.error(`Error validating NIP-05 address: ${error2}`);
    return false;
  }
}
function calculateQueryComplexity(filter) {
  let complexity = 0;
  complexity += (filter.ids?.length || 0) * 1;
  complexity += (filter.authors?.length || 0) * 2;
  complexity += (filter.kinds?.length || 0) * 5;
  for (const [key, values] of Object.entries(filter)) {
    if (key.startsWith("#") && Array.isArray(values)) {
      complexity += values.length * 10;
    }
  }
  if (!filter.since && !filter.until) {
    complexity *= 2;
  }
  if ((filter.limit || 0) > 1e3) {
    complexity *= 1.5;
  }
  return complexity;
}
async function processEvent(event, sessionId, env) {
  try {
    if (event.kind !== 1059 && checkValidNip052 && event.kind !== 0) {
      const isValidNIP05 = await validateNIP05FromKind0(event.pubkey, env);
      if (!isValidNIP05) {
        console.error(`Event denied. NIP-05 validation failed for pubkey ${event.pubkey}.`);
        return { success: false, message: "invalid: NIP-05 validation failed" };
      }
    }
    if (event.kind === 5) {
      return await processDeletionEvent(event, env);
    }
    if (event.kind >= 2e4 && event.kind < 3e4) {
      return { success: true, message: "Ephemeral event broadcast" };
    }
    return await saveEventToDatabase(event, env);
  } catch (error2) {
    console.error(`Error processing event: ${error2.message}`);
    return { success: false, message: `error: ${error2.message}` };
  }
}
async function saveEventToDatabase(event, env) {
  try {
    const cache = caches.default;
    const cacheKey = new Request(`https://event-cache/${event.id}`);
    const cached = await cache.match(cacheKey);
    if (cached) {
      return { success: false, message: "duplicate: event already exists" };
    }
    const session = env.RELAY_DATABASE.withSession("first-primary");
    const existingEvent = await session.prepare("SELECT id FROM events WHERE id = ? LIMIT 1").bind(event.id).first();
    if (existingEvent) {
      return { success: false, message: "duplicate: event already exists", bookmark: session.getBookmark() ?? void 0 };
    }
    const isReplaceable = event.kind === 0 || event.kind === 3 || event.kind >= 1e4 && event.kind < 2e4;
    if (isReplaceable) {
      const existing = await session.prepare(
        "SELECT id, created_at FROM events WHERE kind = ? AND pubkey = ? LIMIT 1"
      ).bind(event.kind, event.pubkey).first();
      if (existing) {
        if (event.created_at <= existing.created_at) {
          return { success: false, message: "duplicate: a newer or equal replaceable event already exists", bookmark: session.getBookmark() ?? void 0 };
        }
        const oldId = existing.id;
        await session.batch([
          session.prepare("DELETE FROM tags WHERE event_id = ?").bind(oldId),
          session.prepare("DELETE FROM content_hashes WHERE event_id = ?").bind(oldId),
          session.prepare("DELETE FROM event_tags_cache_multi WHERE event_id = ?").bind(oldId),
          session.prepare("DELETE FROM events WHERE id = ?").bind(oldId)
        ]);
        console.log(`Replaced older event ${oldId} with newer event ${event.id} (kind ${event.kind})`);
      }
    }
    const isParameterizedReplaceable = event.kind >= 3e4 && event.kind < 4e4;
    if (isParameterizedReplaceable) {
      const dTag = event.tags.find((t) => t[0] === "d")?.[1] || "";
      const existing = await session.prepare(
        "SELECT id, created_at FROM events WHERE kind = ? AND pubkey = ? AND tag_d = ? LIMIT 1"
      ).bind(event.kind, event.pubkey, dTag).first();
      if (existing) {
        if (event.created_at <= existing.created_at) {
          return { success: false, message: "duplicate: a newer or equal parameterized replaceable event already exists", bookmark: session.getBookmark() ?? void 0 };
        }
        const oldId = existing.id;
        await session.batch([
          session.prepare("DELETE FROM tags WHERE event_id = ?").bind(oldId),
          session.prepare("DELETE FROM content_hashes WHERE event_id = ?").bind(oldId),
          session.prepare("DELETE FROM event_tags_cache_multi WHERE event_id = ?").bind(oldId),
          session.prepare("DELETE FROM events WHERE id = ?").bind(oldId)
        ]);
        console.log(`Replaced older parameterized event ${oldId} with newer event ${event.id} (kind ${event.kind}, d=${dTag})`);
      }
    }
    let contentHash = null;
    if (shouldCheckForDuplicates(event.kind)) {
      contentHash = await hashContent(event);
      const duplicateContent = enableGlobalDuplicateCheck2 ? await session.prepare("SELECT event_id FROM content_hashes WHERE hash = ? LIMIT 1").bind(contentHash).first() : await session.prepare("SELECT event_id FROM content_hashes WHERE hash = ? AND pubkey = ? LIMIT 1").bind(contentHash, event.pubkey).first();
      if (duplicateContent) {
        return { success: false, message: "duplicate: content already exists", bookmark: session.getBookmark() ?? void 0 };
      }
    }
    const tagInserts = [];
    let tagP = null;
    let tagE = null;
    let tagA = null;
    let tagT = null;
    let tagD = null;
    let tagR = null;
    let tagL = null;
    let tagS = null;
    let tagU = null;
    for (const tag of event.tags) {
      if (tag[0]) {
        tagInserts.push({
          name: tag[0],
          value: tag[1] || ""
        });
        if (tag[0] === "p" && !tagP)
          tagP = tag[1];
        if (tag[0] === "e" && !tagE)
          tagE = tag[1];
        if (tag[0] === "a" && !tagA)
          tagA = tag[1];
        if (tag[0] === "t" && !tagT)
          tagT = tag[1];
        if (tag[0] === "d" && !tagD)
          tagD = tag[1];
        if (tag[0] === "r" && !tagR)
          tagR = tag[1];
        if (tag[0] === "L" && !tagL)
          tagL = tag[1];
        if (tag[0] === "s" && !tagS)
          tagS = tag[1];
        if (tag[0] === "u" && !tagU)
          tagU = tag[1];
      }
    }
    const eTags = tagInserts.filter((t) => t.name === "e").map((t) => t.value);
    const replyToEventId = eTags.length > 0 ? eTags[0] : null;
    const rootEventId = eTags.length > 1 ? eTags[eTags.length - 1] : null;
    const contentPreview = event.content.substring(0, 100);
    const insertResult = await session.prepare(`
      INSERT INTO events (id, pubkey, created_at, kind, tags, content, sig, tag_p, tag_e, tag_a, tag_t, tag_d, tag_r, tag_L, tag_s, tag_u, reply_to_event_id, root_event_id, content_preview)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO NOTHING
    `).bind(
      event.id,
      event.pubkey,
      event.created_at,
      event.kind,
      JSON.stringify(event.tags),
      event.content,
      event.sig,
      tagP,
      tagE,
      tagA,
      tagT,
      tagD,
      tagR,
      tagL,
      tagS,
      tagU,
      replyToEventId,
      rootEventId,
      contentPreview
    ).run();
    if (insertResult.meta.changes === 0) {
      console.log(`Event ${event.id} already exists in database (race condition duplicate)`);
      return { success: false, message: "duplicate: event already exists", bookmark: session.getBookmark() ?? void 0 };
    }
    const postInsertBatch = [];
    for (const t of tagInserts) {
      postInsertBatch.push(
        session.prepare("INSERT INTO tags (event_id, tag_name, tag_value) VALUES (?, ?, ?)").bind(event.id, t.name, t.value)
      );
    }
    const cacheableTags = tagInserts.filter((t) => ["p", "e", "a", "t", "d", "r", "L", "s", "u"].includes(t.name));
    for (const t of cacheableTags) {
      postInsertBatch.push(
        session.prepare(`
          INSERT OR IGNORE INTO event_tags_cache_multi (event_id, pubkey, kind, created_at, tag_type, tag_value)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(event.id, event.pubkey, event.kind, event.created_at, t.name, t.value)
      );
    }
    if (contentHash) {
      postInsertBatch.push(
        session.prepare(`
          INSERT INTO content_hashes (hash, event_id, pubkey, created_at)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(hash) DO NOTHING
        `).bind(contentHash, event.id, event.pubkey, event.created_at)
      );
    }
    for (let i = 0; i < postInsertBatch.length; i += 100) {
      await session.batch(postInsertBatch.slice(i, i + 100));
    }
    await cache.put(cacheKey, new Response("cached", {
      headers: {
        "Cache-Control": "max-age=3600"
      }
    }));
    console.log(`Event ${event.id} saved directly to database`);
    return { success: true, message: "Event saved successfully", bookmark: session.getBookmark() ?? void 0 };
  } catch (error2) {
    console.error(`Error saving event to database: ${error2.message}`);
    console.error(`Event details: ID=${event.id}, Kind=${event.kind}, Tags count=${event.tags.length}`);
    return { success: false, message: `error: ${error2.message}` };
  }
}
async function processDeletionEvent(event, env) {
  console.log(`Processing deletion event ${event.id}`);
  const deletedEventIds = event.tags.filter((tag) => tag[0] === "e").map((tag) => tag[1]);
  const session = env.RELAY_DATABASE.withSession("first-primary");
  if (deletedEventIds.length === 0) {
    return { success: true, message: "No events to delete", bookmark: session.getBookmark() ?? void 0 };
  }
  let deletedCount = 0;
  const errors = [];
  const idsToDelete = [];
  if (deletedEventIds.length > 0) {
    try {
      const ownerPlaceholders = deletedEventIds.map(() => "?").join(",");
      const ownerResult = await session.prepare(
        `SELECT id, pubkey FROM events WHERE id IN (${ownerPlaceholders})`
      ).bind(...deletedEventIds).all();
      const eventOwners = /* @__PURE__ */ new Map();
      for (const row of ownerResult.results) {
        eventOwners.set(row.id, row.pubkey);
      }
      for (const eventId of deletedEventIds) {
        const ownerPubkey = eventOwners.get(eventId);
        if (!ownerPubkey) {
          console.warn(`Event ${eventId} not found in D1. Nothing to delete (may be in queue).`);
          continue;
        }
        if (ownerPubkey !== event.pubkey) {
          console.warn(`Event ${eventId} does not belong to pubkey ${event.pubkey}. Skipping deletion.`);
          errors.push(`unauthorized: cannot delete event ${eventId} - wrong pubkey`);
          continue;
        }
        idsToDelete.push(eventId);
      }
    } catch (error2) {
      console.error("Error checking event ownership:", error2);
      errors.push("error checking event ownership");
    }
  }
  if (idsToDelete.length > 0) {
    try {
      const deleteStatements = [];
      for (const eventId of idsToDelete) {
        deleteStatements.push(
          session.prepare("DELETE FROM tags WHERE event_id = ?").bind(eventId),
          session.prepare("DELETE FROM content_hashes WHERE event_id = ?").bind(eventId),
          session.prepare("DELETE FROM event_tags_cache_multi WHERE event_id = ?").bind(eventId),
          session.prepare("DELETE FROM events WHERE id = ?").bind(eventId)
        );
      }
      for (let i = 0; i < deleteStatements.length; i += 100) {
        await session.batch(deleteStatements.slice(i, i + 100));
      }
      deletedCount = idsToDelete.length;
      console.log(`Batch deleted ${deletedCount} events from D1.`);
    } catch (error2) {
      console.error("Error batch deleting events:", error2);
      errors.push("error batch deleting events");
    }
  }
  const saveResult = await saveEventToDatabase(event, env);
  if (errors.length > 0) {
    return { success: false, message: errors[0], bookmark: saveResult.bookmark ?? (session.getBookmark() ?? void 0) };
  }
  return {
    success: true,
    message: deletedCount > 0 ? `Successfully deleted ${deletedCount} event(s)` : "No matching events found to delete",
    bookmark: saveResult.bookmark ?? (session.getBookmark() ?? void 0)
  };
}
function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}
function buildCountQuery(filter) {
  const params = [];
  const conditions = [];
  const directTags = [];
  const otherTags = [];
  for (const [key, values] of Object.entries(filter)) {
    if (key.startsWith("#") && Array.isArray(values) && values.length > 0) {
      const tagName = key.substring(1);
      if (["p", "e", "a", "t", "d", "r", "L", "s", "u"].includes(tagName)) {
        directTags.push({ name: tagName, values });
      } else {
        otherTags.push({ name: tagName, values });
      }
    }
  }
  if (directTags.length > 0 && otherTags.length === 0) {
    const cacheAlias = directTags.length === 1 ? "m" : "m0";
    if (directTags.length === 1) {
      const tagFilter = directTags[0];
      const hasKinds = filter.kinds && filter.kinds.length > 0;
      const indexHint = hasKinds && filter.kinds.length <= 10 ? " INDEXED BY idx_cache_multi_kind_type_value" : " INDEXED BY idx_cache_multi_type_value_time";
      let sql2 = `SELECT COUNT(DISTINCT m.event_id) as count FROM event_tags_cache_multi m${indexHint}
        WHERE m.tag_type = ? AND m.tag_value IN (${tagFilter.values.map(() => "?").join(",")})`;
      params.push(tagFilter.name, ...tagFilter.values);
      if (filter.authors && filter.authors.length > 0) {
        sql2 += ` AND m.pubkey IN (${filter.authors.map(() => "?").join(",")})`;
        params.push(...filter.authors);
      }
      if (hasKinds) {
        sql2 += ` AND m.kind IN (${filter.kinds.map(() => "?").join(",")})`;
        params.push(...filter.kinds);
      }
      if (filter.since) {
        sql2 += " AND m.created_at >= ?";
        params.push(filter.since);
      }
      if (filter.until) {
        sql2 += " AND m.created_at <= ?";
        params.push(filter.until);
      }
      return { sql: sql2, params };
    } else {
      const hasKindsMulti = filter.kinds && filter.kinds.length > 0;
      const firstTag = directTags[0];
      const firstHint = hasKindsMulti && filter.kinds.length <= 10 ? " INDEXED BY idx_cache_multi_kind_type_value" : " INDEXED BY idx_cache_multi_type_value_time";
      const additionalJoins = directTags.slice(1).map((t, i) => {
        const alias = `m${i + 1}`;
        const placeholders = t.values.map(() => "?").join(",");
        return `INNER JOIN event_tags_cache_multi ${alias} ON m0.event_id = ${alias}.event_id AND ${alias}.tag_type = ? AND ${alias}.tag_value IN (${placeholders})`;
      }).join("\n        ");
      let sql2 = `SELECT COUNT(DISTINCT m0.event_id) as count FROM event_tags_cache_multi m0${firstHint}
        ${additionalJoins}
        WHERE m0.tag_type = ? AND m0.tag_value IN (${firstTag.values.map(() => "?").join(",")})`;
      params.push(firstTag.name, ...firstTag.values);
      for (const tagFilter of directTags.slice(1)) {
        params.push(tagFilter.name, ...tagFilter.values);
      }
      if (filter.authors && filter.authors.length > 0) {
        sql2 += ` AND m0.pubkey IN (${filter.authors.map(() => "?").join(",")})`;
        params.push(...filter.authors);
      }
      if (hasKindsMulti) {
        sql2 += ` AND m0.kind IN (${filter.kinds.map(() => "?").join(",")})`;
        params.push(...filter.kinds);
      }
      if (filter.since) {
        sql2 += " AND m0.created_at >= ?";
        params.push(filter.since);
      }
      if (filter.until) {
        sql2 += " AND m0.created_at <= ?";
        params.push(filter.until);
      }
      return { sql: sql2, params };
    }
  }
  if (directTags.length > 0 || otherTags.length > 0) {
    const allTags = [...directTags, ...otherTags];
    if (allTags.length === 1) {
      const tagFilter = allTags[0];
      let sql2 = `SELECT COUNT(DISTINCT e.id) as count FROM events e
        INNER JOIN tags t ON e.id = t.event_id
        WHERE t.tag_name = ? AND t.tag_value IN (${tagFilter.values.map(() => "?").join(",")})`;
      params.push(tagFilter.name, ...tagFilter.values);
      if (filter.authors && filter.authors.length > 0) {
        sql2 += ` AND e.pubkey IN (${filter.authors.map(() => "?").join(",")})`;
        params.push(...filter.authors);
      }
      if (filter.kinds && filter.kinds.length > 0) {
        sql2 += ` AND e.kind IN (${filter.kinds.map(() => "?").join(",")})`;
        params.push(...filter.kinds);
      }
      if (filter.since) {
        sql2 += " AND e.created_at >= ?";
        params.push(filter.since);
      }
      if (filter.until) {
        sql2 += " AND e.created_at <= ?";
        params.push(filter.until);
      }
      return { sql: sql2, params };
    } else {
      const tagConditions = allTags.map((t) => {
        const placeholders = t.values.map(() => "?").join(",");
        return `(t.tag_name = ? AND t.tag_value IN (${placeholders}))`;
      }).join(" OR ");
      for (const tagFilter of allTags) {
        params.push(tagFilter.name, ...tagFilter.values);
      }
      let sql2 = `SELECT COUNT(DISTINCT e.id) as count FROM events e
        INNER JOIN tags t ON e.id = t.event_id
        WHERE ${tagConditions}`;
      if (filter.authors && filter.authors.length > 0) {
        sql2 += ` AND e.pubkey IN (${filter.authors.map(() => "?").join(",")})`;
        params.push(...filter.authors);
      }
      if (filter.kinds && filter.kinds.length > 0) {
        sql2 += ` AND e.kind IN (${filter.kinds.map(() => "?").join(",")})`;
        params.push(...filter.kinds);
      }
      if (filter.since) {
        sql2 += " AND e.created_at >= ?";
        params.push(filter.since);
      }
      if (filter.until) {
        sql2 += " AND e.created_at <= ?";
        params.push(filter.until);
      }
      sql2 += ` GROUP BY e.id HAVING COUNT(DISTINCT t.tag_name) = ?`;
      params.push(allTags.length);
      sql2 = `SELECT COUNT(*) as count FROM (${sql2})`;
      return { sql: sql2, params };
    }
  }
  let sql = "SELECT COUNT(*) as count FROM events";
  if (filter.ids && filter.ids.length > 0) {
    conditions.push(`id IN (${filter.ids.map(() => "?").join(",")})`);
    params.push(...filter.ids);
  }
  if (filter.authors && filter.authors.length > 0) {
    conditions.push(`pubkey IN (${filter.authors.map(() => "?").join(",")})`);
    params.push(...filter.authors);
  }
  if (filter.kinds && filter.kinds.length > 0) {
    conditions.push(`kind IN (${filter.kinds.map(() => "?").join(",")})`);
    params.push(...filter.kinds);
  }
  if (filter.since) {
    conditions.push("created_at >= ?");
    params.push(filter.since);
  }
  if (filter.until) {
    conditions.push("created_at <= ?");
    params.push(filter.until);
  }
  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ");
  }
  return { sql, params };
}
function buildQuery(filter) {
  const params = [];
  const conditions = [];
  let tagCount = 0;
  const directTags = [];
  const otherTags = [];
  for (const [key, values] of Object.entries(filter)) {
    if (key.startsWith("#") && Array.isArray(values) && values.length > 0) {
      tagCount += values.length;
      const tagName = key.substring(1);
      if (["p", "e", "a", "t", "d", "r", "L", "s", "u"].includes(tagName)) {
        directTags.push({ name: tagName, values });
      } else {
        otherTags.push({ name: tagName, values });
      }
    }
  }
  if (directTags.length > 0 && otherTags.length === 0) {
    let sql2;
    const whereConditions = [];
    const cacheAlias = directTags.length === 1 ? "m" : "m0";
    if (directTags.length === 1) {
      const tagFilter = directTags[0];
      const hasKinds2 = filter.kinds && filter.kinds.length > 0;
      let indexHint2 = "";
      if (hasKinds2 && filter.kinds.length <= 10) {
        indexHint2 = " INDEXED BY idx_cache_multi_kind_type_value";
      } else {
        indexHint2 = " INDEXED BY idx_cache_multi_type_value_time";
      }
      sql2 = `SELECT DISTINCT ${EVENT_COLS} FROM events e
        INNER JOIN event_tags_cache_multi m${indexHint2} ON e.id = m.event_id
        WHERE m.tag_type = ? AND m.tag_value IN (${tagFilter.values.map(() => "?").join(",")})`;
      params.push(tagFilter.name, ...tagFilter.values);
    } else {
      const hasKindsMulti = filter.kinds && filter.kinds.length > 0;
      const tagConditions = directTags.map((t, i) => {
        const alias = `m${i}`;
        const placeholders = t.values.map(() => "?").join(",");
        const hint = i === 0 ? hasKindsMulti && filter.kinds.length <= 10 ? " INDEXED BY idx_cache_multi_kind_type_value" : " INDEXED BY idx_cache_multi_type_value_time" : "";
        return `INNER JOIN event_tags_cache_multi ${alias}${hint} ON e.id = ${alias}.event_id AND ${alias}.tag_type = ? AND ${alias}.tag_value IN (${placeholders})`;
      }).join("\n        ");
      sql2 = `SELECT DISTINCT ${EVENT_COLS} FROM events e
        ${tagConditions}
        WHERE 1=1`;
      for (const tagFilter of directTags) {
        params.push(tagFilter.name, ...tagFilter.values);
      }
    }
    if (filter.ids && filter.ids.length > 0) {
      whereConditions.push(`e.id IN (${filter.ids.map(() => "?").join(",")})`);
      params.push(...filter.ids);
    }
    if (filter.authors && filter.authors.length > 0) {
      whereConditions.push(`e.pubkey IN (${filter.authors.map(() => "?").join(",")})`);
      params.push(...filter.authors);
    }
    if (filter.kinds && filter.kinds.length > 0) {
      whereConditions.push(`${cacheAlias}.kind IN (${filter.kinds.map(() => "?").join(",")})`);
      params.push(...filter.kinds);
    }
    if (filter.since) {
      whereConditions.push(`${cacheAlias}.created_at >= ?`);
      params.push(filter.since);
    }
    if (filter.until) {
      whereConditions.push(`${cacheAlias}.created_at <= ?`);
      params.push(filter.until);
    }
    if (filter.cursor) {
      const [timestamp, lastId] = filter.cursor.split(":");
      whereConditions.push(`(${cacheAlias}.created_at < ? OR (${cacheAlias}.created_at = ? AND e.id > ?))`);
      params.push(parseInt(timestamp), parseInt(timestamp), lastId);
    }
    if (whereConditions.length > 0) {
      sql2 += " AND " + whereConditions.join(" AND ");
    }
    sql2 += ` ORDER BY ${cacheAlias}.created_at DESC LIMIT ?`;
    params.push(Math.min(filter.limit || 500, 500));
    return { sql: sql2, params };
  }
  if (tagCount > 0) {
    const allTags = [...directTags, ...otherTags];
    if (allTags.length === 1) {
      const tagFilter = allTags[0];
      let sql3 = `SELECT ${EVENT_COLS} FROM events e
        INNER JOIN tags t ON e.id = t.event_id
        WHERE t.tag_name = ? AND t.tag_value IN (${tagFilter.values.map(() => "?").join(",")})`;
      params.push(tagFilter.name, ...tagFilter.values);
      const whereConditions2 = [];
      if (filter.ids && filter.ids.length > 0) {
        whereConditions2.push(`e.id IN (${filter.ids.map(() => "?").join(",")})`);
        params.push(...filter.ids);
      }
      if (filter.authors && filter.authors.length > 0) {
        whereConditions2.push(`e.pubkey IN (${filter.authors.map(() => "?").join(",")})`);
        params.push(...filter.authors);
      }
      if (filter.kinds && filter.kinds.length > 0) {
        whereConditions2.push(`e.kind IN (${filter.kinds.map(() => "?").join(",")})`);
        params.push(...filter.kinds);
      }
      if (filter.since) {
        whereConditions2.push("e.created_at >= ?");
        params.push(filter.since);
      }
      if (filter.until) {
        whereConditions2.push("e.created_at <= ?");
        params.push(filter.until);
      }
      if (filter.cursor) {
        const [timestamp, lastId] = filter.cursor.split(":");
        whereConditions2.push("(e.created_at < ? OR (e.created_at = ? AND e.id > ?))");
        params.push(parseInt(timestamp), parseInt(timestamp), lastId);
      }
      if (whereConditions2.length > 0) {
        sql3 += " AND " + whereConditions2.join(" AND ");
      }
      sql3 += " ORDER BY e.created_at DESC";
      sql3 += " LIMIT ?";
      params.push(Math.min(filter.limit || 500, 500));
      return { sql: sql3, params };
    }
    const tagConditions = allTags.map((t) => {
      const placeholders = t.values.map(() => "?").join(",");
      return `(t.tag_name = ? AND t.tag_value IN (${placeholders}))`;
    }).join(" OR ");
    for (const tagFilter of allTags) {
      params.push(tagFilter.name, ...tagFilter.values);
    }
    let sql2 = `SELECT ${EVENT_COLS} FROM events e
      INNER JOIN tags t ON e.id = t.event_id
      WHERE ${tagConditions}`;
    const whereConditions = [];
    if (filter.ids && filter.ids.length > 0) {
      whereConditions.push(`e.id IN (${filter.ids.map(() => "?").join(",")})`);
      params.push(...filter.ids);
    }
    if (filter.authors && filter.authors.length > 0) {
      whereConditions.push(`e.pubkey IN (${filter.authors.map(() => "?").join(",")})`);
      params.push(...filter.authors);
    }
    if (filter.kinds && filter.kinds.length > 0) {
      whereConditions.push(`e.kind IN (${filter.kinds.map(() => "?").join(",")})`);
      params.push(...filter.kinds);
    }
    if (filter.since) {
      whereConditions.push("e.created_at >= ?");
      params.push(filter.since);
    }
    if (filter.until) {
      whereConditions.push("e.created_at <= ?");
      params.push(filter.until);
    }
    if (filter.cursor) {
      const [timestamp, lastId] = filter.cursor.split(":");
      whereConditions.push("(e.created_at < ? OR (e.created_at = ? AND e.id > ?))");
      params.push(parseInt(timestamp), parseInt(timestamp), lastId);
    }
    if (whereConditions.length > 0) {
      sql2 += " AND " + whereConditions.join(" AND ");
    }
    sql2 += " GROUP BY e.id, e.pubkey, e.created_at, e.kind, e.tags, e.content, e.sig";
    sql2 += ` HAVING COUNT(DISTINCT t.tag_name) = ?`;
    params.push(allTags.length);
    sql2 += " ORDER BY e.created_at DESC";
    sql2 += " LIMIT ?";
    params.push(Math.min(filter.limit || 500, 500));
    return { sql: sql2, params };
  }
  let indexHint = "";
  const hasAuthors = filter.authors && filter.authors.length > 0;
  const hasKinds = filter.kinds && filter.kinds.length > 0;
  const hasTimeRange = filter.since || filter.until;
  const authorCount = filter.authors?.length || 0;
  const kindCount = filter.kinds?.length || 0;
  if (hasAuthors && hasKinds && authorCount <= 10 && kindCount <= 10) {
    if (authorCount <= kindCount) {
      indexHint = " INDEXED BY idx_events_pubkey_kind_created_at";
    } else {
      indexHint = " INDEXED BY idx_events_kind_pubkey_created_at";
    }
  } else if (hasAuthors && authorCount <= 5 && !hasKinds) {
    indexHint = " INDEXED BY idx_events_pubkey_created_at";
  } else if (hasKinds && kindCount <= 5 && !hasAuthors) {
    indexHint = " INDEXED BY idx_events_kind_created_at";
  } else if (hasAuthors && hasKinds && authorCount > 10) {
    indexHint = " INDEXED BY idx_events_kind_created_at";
  } else if (!hasAuthors && !hasKinds && hasTimeRange) {
    indexHint = " INDEXED BY idx_events_created_at";
  }
  let sql = `SELECT ${EVENT_COLS_BARE} FROM events${indexHint}`;
  if (filter.ids && filter.ids.length > 0) {
    conditions.push(`id IN (${filter.ids.map(() => "?").join(",")})`);
    params.push(...filter.ids);
  }
  if (filter.authors && filter.authors.length > 0) {
    conditions.push(`pubkey IN (${filter.authors.map(() => "?").join(",")})`);
    params.push(...filter.authors);
  }
  if (filter.kinds && filter.kinds.length > 0) {
    conditions.push(`kind IN (${filter.kinds.map(() => "?").join(",")})`);
    params.push(...filter.kinds);
  }
  if (filter.since) {
    conditions.push("created_at >= ?");
    params.push(filter.since);
  }
  if (filter.until) {
    conditions.push("created_at <= ?");
    params.push(filter.until);
  }
  if (filter.cursor) {
    const [timestamp, lastId] = filter.cursor.split(":");
    conditions.push("(created_at < ? OR (created_at = ? AND id > ?))");
    params.push(parseInt(timestamp), parseInt(timestamp), lastId);
  }
  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ");
  }
  sql += " ORDER BY created_at DESC";
  sql += " LIMIT ?";
  params.push(Math.min(filter.limit || 500, 500));
  return { sql, params };
}
async function queryDatabaseChunked(filter, bookmark, env) {
  const session = env.RELAY_DATABASE.withSession(bookmark);
  const allRows = /* @__PURE__ */ new Map();
  const baseFilter = { ...filter };
  const needsChunking = {
    ids: false,
    authors: false,
    kinds: false,
    tags: {}
  };
  if (filter.ids && filter.ids.length > CHUNK_SIZE) {
    needsChunking.ids = true;
    delete baseFilter.ids;
  }
  if (filter.authors && filter.authors.length > CHUNK_SIZE) {
    needsChunking.authors = true;
    delete baseFilter.authors;
  }
  if (filter.kinds && filter.kinds.length > CHUNK_SIZE) {
    needsChunking.kinds = true;
    delete baseFilter.kinds;
  }
  for (const [key, values] of Object.entries(filter)) {
    if (key.startsWith("#") && Array.isArray(values) && values.length > CHUNK_SIZE) {
      needsChunking.tags[key] = true;
      delete baseFilter[key];
    }
  }
  const processStringChunks = /* @__PURE__ */ __name(async (filterType, values) => {
    const chunks = chunkArray(values, CHUNK_SIZE);
    for (const chunk of chunks) {
      const chunkFilter = { ...baseFilter };
      if (filterType === "ids") {
        chunkFilter.ids = chunk;
      } else if (filterType === "authors") {
        chunkFilter.authors = chunk;
      } else if (filterType.startsWith("#")) {
        chunkFilter[filterType] = chunk;
      }
      const query = buildQuery(chunkFilter);
      try {
        const result = await session.prepare(query.sql).bind(...query.params).all();
        for (const row of result.results) {
          allRows.set(row.id, row);
        }
      } catch (error2) {
        console.error(`Error in chunk query: ${error2}`);
      }
    }
  }, "processStringChunks");
  const processNumberChunks = /* @__PURE__ */ __name(async (filterType, values) => {
    const chunks = chunkArray(values, CHUNK_SIZE);
    for (const chunk of chunks) {
      const chunkFilter = { ...baseFilter };
      chunkFilter.kinds = chunk;
      const query = buildQuery(chunkFilter);
      try {
        const result = await session.prepare(query.sql).bind(...query.params).all();
        for (const row of result.results) {
          allRows.set(row.id, row);
        }
      } catch (error2) {
        console.error(`Error in chunk query: ${error2}`);
      }
    }
  }, "processNumberChunks");
  if (needsChunking.ids && filter.ids) {
    await processStringChunks("ids", filter.ids);
  }
  if (needsChunking.authors && filter.authors) {
    await processStringChunks("authors", filter.authors);
  }
  if (needsChunking.kinds && filter.kinds) {
    await processNumberChunks("kinds", filter.kinds);
  }
  for (const [tagKey, _] of Object.entries(needsChunking.tags)) {
    const tagValues2 = filter[tagKey];
    if (Array.isArray(tagValues2) && tagValues2.every((v) => typeof v === "string")) {
      await processStringChunks(tagKey, tagValues2);
    }
  }
  if (!needsChunking.ids && !needsChunking.authors && !needsChunking.kinds && Object.keys(needsChunking.tags).length === 0) {
    const query = buildQuery(filter);
    try {
      const result = await session.prepare(query.sql).bind(...query.params).all();
      for (const row of result.results) {
        allRows.set(row.id, row);
      }
    } catch (error2) {
      console.error(`Error in query: ${error2}`);
    }
  }
  const events = Array.from(allRows.values()).map((row) => ({
    id: row.id,
    pubkey: row.pubkey,
    created_at: row.created_at,
    kind: row.kind,
    tags: JSON.parse(row.tags),
    content: row.content,
    sig: row.sig
  }));
  console.log(`Found ${events.length} events (chunked)`);
  return { events };
}
async function queryEvents(filters, bookmark, env) {
  try {
    console.log(`Processing query with ${filters.length} filters and bookmark: ${bookmark}`);
    const session = env.RELAY_DATABASE.withSession(bookmark);
    const eventSet = /* @__PURE__ */ new Map();
    const chunkedFilters = [];
    const batchableFilters = [];
    for (const filter of filters) {
      const complexity = calculateQueryComplexity(filter);
      if (complexity > MAX_QUERY_COMPLEXITY) {
        console.warn(`Query too complex (complexity: ${complexity}), skipping filter`);
        continue;
      }
      const needsChunking = filter.ids && filter.ids.length > CHUNK_SIZE || filter.authors && filter.authors.length > CHUNK_SIZE || filter.kinds && filter.kinds.length > CHUNK_SIZE || Object.entries(filter).some(
        ([key, values]) => key.startsWith("#") && Array.isArray(values) && values.length > CHUNK_SIZE
      );
      if (needsChunking) {
        chunkedFilters.push(filter);
      } else {
        batchableFilters.push(filter);
      }
    }
    let totalEventsRead = 0;
    for (const filter of chunkedFilters) {
      if (totalEventsRead >= GLOBAL_MAX_EVENTS) {
        console.warn(`Global event limit reached (${GLOBAL_MAX_EVENTS}), stopping query`);
        break;
      }
      console.log(`Filter has arrays >${CHUNK_SIZE} items, using chunked query...`);
      const chunkedResult = await queryDatabaseChunked(filter, bookmark, env);
      for (const event of chunkedResult.events) {
        if (totalEventsRead >= GLOBAL_MAX_EVENTS)
          break;
        eventSet.set(event.id, event);
        totalEventsRead++;
      }
    }
    if (batchableFilters.length > 0 && totalEventsRead < GLOBAL_MAX_EVENTS) {
      const validFilters = [];
      for (const filter of batchableFilters) {
        const hasTagFilters = Object.keys(filter).some((key) => key.startsWith("#"));
        if (hasTagFilters) {
          const countQuery = buildCountQuery(filter);
          const countResult = await session.prepare(countQuery.sql).bind(...countQuery.params).first();
          const estimatedRows = countResult?.count || 0;
          if (estimatedRows > 1e4) {
            console.warn(`Query precheck: estimated ${estimatedRows} rows, skipping filter to prevent timeout`);
            continue;
          } else {
            console.log(`Query precheck: estimated ${estimatedRows} rows, proceeding`);
          }
        }
        validFilters.push(filter);
      }
      if (validFilters.length === 0) {
        console.warn("All filters were too expensive after COUNT precheck");
      } else {
        const queries = validFilters.map((filter) => {
          const query = buildQuery(filter);
          return session.prepare(query.sql).bind(...query.params);
        });
        try {
          const results = await session.batch(queries);
          const allRows = [];
          for (let i = 0; i < results.length; i++) {
            const result = results[i];
            if (i === 0 && result.meta) {
              console.log({
                servedByRegion: result.meta.served_by_region ?? "",
                servedByPrimary: result.meta.served_by_primary ?? false,
                batchSize: results.length
              });
            }
            if (result.success && result.results) {
              for (const row of result.results) {
                if (totalEventsRead >= GLOBAL_MAX_EVENTS)
                  break;
                allRows.push(row);
                totalEventsRead++;
              }
            } else if (!result.success) {
              console.error(`Batch query ${i} failed:`, result.error);
            }
          }
          for (const row of allRows) {
            const event = {
              id: row.id,
              pubkey: row.pubkey,
              created_at: row.created_at,
              kind: row.kind,
              tags: JSON.parse(row.tags),
              content: row.content,
              sig: row.sig
            };
            eventSet.set(event.id, event);
          }
        } catch (error2) {
          console.error(`Batch query execution error: ${error2.message}`);
          throw error2;
        }
      }
    }
    const events = Array.from(eventSet.values()).sort((a, b) => {
      if (b.created_at !== a.created_at) {
        return b.created_at - a.created_at;
      }
      return a.id.localeCompare(b.id);
    });
    const newBookmark = session.getBookmark();
    console.log(`Found ${events.length} events. New bookmark: ${newBookmark}`);
    return { events, bookmark: newBookmark };
  } catch (error2) {
    console.error(`Error querying events: ${error2.message}`);
    return { events: [], bookmark: null };
  }
}
async function handleRelayInfoRequest(request, env) {
  const cached = await getCachedNip11(env.RELAY_CACHE);
  if (cached) {
    return new Response(cached, {
      status: 200,
      headers: {
        "Content-Type": "application/nostr+json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Accept",
        "Access-Control-Allow-Methods": "GET",
        "Cache-Control": "public, max-age=300"
      }
    });
  }
  const responseInfo = { ...relayInfo2 };
  if (PAY_TO_RELAY_ENABLED2) {
    const url = new URL(request.url);
    responseInfo.payments_url = `${url.protocol}//${url.host}`;
    responseInfo.fees = {
      admission: [{ amount: RELAY_ACCESS_PRICE_SATS2 * 1e3, unit: "msats" }]
    };
  }
  try {
    const odAd = getOpenDatingNip11Advertisement();
    if (odAd && odAd.opendating) {
      Object.assign(responseInfo, odAd);
    }
  } catch (_) {
  }
  const body = JSON.stringify(responseInfo);
  setCachedNip11(env.RELAY_CACHE, body).catch(() => {
  });
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/nostr+json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Accept",
      "Access-Control-Allow-Methods": "GET",
      "Cache-Control": "public, max-age=300"
    }
  });
}
function serveLandingPage() {
  const payToRelaySection = PAY_TO_RELAY_ENABLED2 ? `
    <div class="pay-section" id="paySection">
      <p style="margin-bottom: 1rem;">Pay to access this relay:</p>
      <button id="payButton" class="pay-button" data-npub="${relayNpub2}" data-relays="wss://relay.damus.io,wss://relay.primal.net,wss://opendating-relay.jonathang132298.workers.dev" data-sats-amount="${RELAY_ACCESS_PRICE_SATS2}">
        <img src="images/pwb-button-min.png" alt="Pay with Bitcoin" style="height: 60px;">
      </button>
      <p class="price-info">${RELAY_ACCESS_PRICE_SATS2.toLocaleString()} sats</p>
    </div>
    <div class="info-box" id="accessSection" style="display: none;">
      <p style="margin-bottom: 1rem;">Connect your Nostr client to:</p>
      <div class="url-display" onclick="copyToClipboard()" id="relay-url">
        <!-- URL will be inserted by JavaScript -->
      </div>
      <p class="copy-hint">Click to copy</p>
    </div>
  ` : `
    <div class="info-box">
      <p style="margin-bottom: 1rem;">Connect your Nostr client to:</p>
      <div class="url-display" onclick="copyToClipboard()" id="relay-url">
        <!-- URL will be inserted by JavaScript -->
      </div>
      <p class="copy-hint">Click to copy</p>
    </div>
  `;
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="A serverless Nostr relay through Cloudflare Worker and D1 database" />
    <title>OpenDating \u2014 Privacy-First Decentralized Dating</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #0a0a0a;
            color: #ffffff;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
        }
        
        body::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 20% 50%, rgba(255, 69, 0, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 80% 50%, rgba(255, 140, 0, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 50% 100%, rgba(255, 0, 0, 0.05) 0%, transparent 50%);
            animation: pulse 10s ease-in-out infinite;
            z-index: -1;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 0.7; }
            50% { opacity: 1; }
        }
        
        .container {
            text-align: center;
            padding: 2rem;
            max-width: 600px;
            z-index: 1;
        }
        
        .logo {
            width: 400px;
            height: auto;
            filter: drop-shadow(0 0 30px rgba(255, 69, 0, 0.5));
        }
        
        .tagline {
            font-size: 1.2rem;
            color: #999;
            margin-bottom: 3rem;
        }
        
        .info-box, .pay-section {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 2rem;
            backdrop-filter: blur(10px);
        }
        
        .pay-button {
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
            margin: 1rem 0;
            transition: transform 0.3s ease;
        }
        
        .pay-button:hover {
            transform: scale(1.05);
        }
        
        .price-info {
            font-size: 1.2rem;
            color: #ff8c00;
            font-weight: 600;
        }
        
        .url-display {
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(255, 69, 0, 0.3);
            border-radius: 8px;
            padding: 1rem;
            font-family: 'Courier New', monospace;
            font-size: 1.1rem;
            color: #ff8c00;
            margin: 1rem 0;
            word-break: break-all;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .url-display:hover {
            border-color: #ff4500;
            background: rgba(255, 69, 0, 0.1);
        }
        
        .copy-hint {
            font-size: 0.9rem;
            color: #666;
            margin-top: 0.5rem;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            margin-top: 2rem;
        }
        
        .stat-item {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 1rem;
        }
        
        .stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: #ff4500;
        }
        
        .stat-label {
            font-size: 0.9rem;
            color: #999;
            margin-top: 0.25rem;
        }
        
        .links {
            margin-top: 3rem;
            display: flex;
            gap: 2rem;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .link {
            color: #ff8c00;
            text-decoration: none;
            font-size: 1rem;
            transition: color 0.3s ease;
        }
        
        .link:hover {
            color: #ff4500;
        }
        
        .toast {
            position: fixed;
            bottom: 2rem;
            background: #ff4500;
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            transform: translateY(100px);
            transition: transform 0.3s ease;
            z-index: 1000;
        }
        
        .toast.show {
            transform: translateY(0);
        }
    </style>
</head>
<body>
    <div class="container">
        <img src="images/brand-mark-coral.svg" alt="OpenDating" class="logo">
        <p class="tagline">A serverless Nostr relay powered by Cloudflare</p>
        
        ${payToRelaySection}
        
        <div class="stats">
            <div class="stat-item">
                <div class="stat-value">${relayInfo2.supported_nips.length}</div>
                <div class="stat-label">Supported NIPs</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${relayInfo2.version}</div>
                <div class="stat-label">Version</div>
            </div>
        </div>
        
        <div class="links">
            <a href="https://github.com/jongan69/OpenDating" class="link" target="_blank">GitHub</a>
            <a href="https://nostr.com" class="link" target="_blank">Learn about Nostr</a>
        </div>
    </div>
    
    <div class="toast" id="toast">Copied to clipboard!</div>
    
    <script>
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const relayUrl = protocol + '//' + window.location.host;
        const relayUrlElement = document.getElementById('relay-url');
        if (relayUrlElement) {
            relayUrlElement.textContent = relayUrl;
        }
        
        function copyToClipboard() {
            const relayUrl = document.getElementById('relay-url').textContent;
            navigator.clipboard.writeText(relayUrl).then(() => {
                const toast = document.getElementById('toast');
                toast.classList.add('show');
                setTimeout(() => {
                    toast.classList.remove('show');
                }, 2000);
            });
        }
        
        ${PAY_TO_RELAY_ENABLED2 ? `
        // Payment handling code
        let paymentCheckInterval;

        async function checkPaymentStatus() {
            if (!window.nostr || !window.nostr.getPublicKey) return false;
            
            try {
                const pubkey = await window.nostr.getPublicKey();
                const response = await fetch('/api/check-payment?pubkey=' + pubkey);
                const data = await response.json();
                
                if (data.paid) {
                    showRelayAccess();
                    return true;
                }
                return false;
            } catch (error) {
                console.error('Error checking payment status:', error);
                return false;
            }
        }

        function showRelayAccess() {
            const paySection = document.getElementById('paySection');
            const accessSection = document.getElementById('accessSection');
            
            if (paySection && accessSection) {
                paySection.style.transition = 'opacity 0.3s ease-out';
                paySection.style.opacity = '0';
                
                setTimeout(() => {
                    paySection.style.display = 'none';
                    accessSection.style.display = 'block';
                    accessSection.style.opacity = '0';
                    accessSection.style.transition = 'opacity 0.3s ease-in';
                    
                    void accessSection.offsetHeight;
                    
                    accessSection.style.opacity = '1';
                }, 300);
            }
            
            if (paymentCheckInterval) {
                clearInterval(paymentCheckInterval);
                paymentCheckInterval = null;
            }
        }

        window.addEventListener('payment-success', async (event) => {
            console.log('Payment success event received');
            setTimeout(() => {
                showRelayAccess();
            }, 500);
        });

        async function initPayment() {
            const script = document.createElement('script');
            script.src = 'nostr-zap.js';
            script.onload = () => {
                if (window.nostrZap) {
                    window.nostrZap.initTargets('#payButton');
                    
                    document.getElementById('payButton').addEventListener('click', () => {
                        if (!paymentCheckInterval) {
                            paymentCheckInterval = setInterval(async () => {
                                await checkPaymentStatus();
                            }, 3000);
                        }
                    });
                }
            };
            document.head.appendChild(script);
            
            await checkPaymentStatus();
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initPayment);
        } else {
            initPayment();
        }
        ` : ""}
    </script>
    ${PAY_TO_RELAY_ENABLED2 ? '<script src="https://unpkg.com/nostr-login@latest/dist/unpkg.js" data-perms="sign_event:1" data-methods="connect,extension,local" data-dark-mode="true"></script>' : ""}
</body>
</html>
  `;
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html;charset=UTF-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
async function serveFavicon() {
  const response = await fetch(relayInfo2.icon);
  if (response.ok) {
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "max-age=3600");
    return new Response(response.body, {
      status: response.status,
      headers
    });
  }
  return new Response(null, { status: 404 });
}
function handleNIP05Request(url) {
  const name = url.searchParams.get("name");
  if (!name) {
    return new Response(JSON.stringify({ error: "Missing 'name' parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const pubkey = nip05Users2[name.toLowerCase()];
  if (!pubkey) {
    return new Response(JSON.stringify({ error: "User not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
  const response = {
    names: { [name]: pubkey },
    relays: { [pubkey]: [] }
  };
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
async function handleCheckPayment(request, env) {
  const url = new URL(request.url);
  const pubkey = url.searchParams.get("pubkey");
  if (!pubkey) {
    return new Response(JSON.stringify({ error: "Missing pubkey" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const paid = await hasPaidForRelay(pubkey, env);
  if (paid === null) {
    return new Response(JSON.stringify({ error: "Unable to verify payment status" }), {
      status: 503,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
  return new Response(JSON.stringify({ paid }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
async function handlePaymentNotification(request, env) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  try {
    const url = new URL(request.url);
    const pubkey = url.searchParams.get("npub");
    if (!pubkey) {
      return new Response(JSON.stringify({ error: "Missing pubkey" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    const success = await savePaidPubkey(pubkey, env);
    return new Response(JSON.stringify({
      success,
      message: success ? "Payment recorded successfully" : "Failed to save payment"
    }), {
      status: success ? 200 : 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error2) {
    console.error("Error processing payment notification:", error2);
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}
async function getOptimalDO(cf, env, url) {
  const continent = cf?.continent || "NA";
  const country = cf?.country || "US";
  const region = cf?.region || "unknown";
  const colo = cf?.colo || "unknown";
  console.log(`User location: continent=${continent}, country=${country}, region=${region}, colo=${colo}`);
  const ALL_ENDPOINTS = [
    { name: "relay-WNAM-primary", hint: "wnam" },
    { name: "relay-ENAM-primary", hint: "enam" },
    { name: "relay-WEUR-primary", hint: "weur" },
    { name: "relay-EEUR-primary", hint: "eeur" },
    { name: "relay-APAC-primary", hint: "apac" },
    { name: "relay-OC-primary", hint: "oc" },
    { name: "relay-SAM-primary", hint: "sam" },
    { name: "relay-AFR-primary", hint: "afr" },
    { name: "relay-ME-primary", hint: "me" }
  ];
  const countryToHint = {
    // North America
    "US": "enam",
    "CA": "enam",
    "MX": "wnam",
    // Central America & Caribbean (route to WNAM)
    "GT": "wnam",
    "BZ": "wnam",
    "SV": "wnam",
    "HN": "wnam",
    "NI": "wnam",
    "CR": "wnam",
    "PA": "wnam",
    "CU": "wnam",
    "DO": "wnam",
    "HT": "wnam",
    "JM": "wnam",
    "PR": "wnam",
    "TT": "wnam",
    "BB": "wnam",
    // South America
    "BR": "sam",
    "AR": "sam",
    "CL": "sam",
    "CO": "sam",
    "PE": "sam",
    "VE": "sam",
    "EC": "sam",
    "BO": "sam",
    "PY": "sam",
    "UY": "sam",
    "GY": "sam",
    "SR": "sam",
    "GF": "sam",
    // Western Europe
    "GB": "weur",
    "FR": "weur",
    "DE": "weur",
    "ES": "weur",
    "IT": "weur",
    "NL": "weur",
    "BE": "weur",
    "CH": "weur",
    "AT": "weur",
    "PT": "weur",
    "IE": "weur",
    "LU": "weur",
    "MC": "weur",
    "AD": "weur",
    "SM": "weur",
    "VA": "weur",
    "LI": "weur",
    "MT": "weur",
    // Nordic countries (route to WEUR)
    "SE": "weur",
    "NO": "weur",
    "DK": "weur",
    "FI": "weur",
    "IS": "weur",
    // Eastern Europe
    "PL": "eeur",
    "RU": "eeur",
    "UA": "eeur",
    "RO": "eeur",
    "CZ": "eeur",
    "HU": "eeur",
    "GR": "eeur",
    "BG": "eeur",
    "SK": "eeur",
    "HR": "eeur",
    "RS": "eeur",
    "SI": "eeur",
    "BA": "eeur",
    "AL": "eeur",
    "MK": "eeur",
    "ME": "eeur",
    "XK": "eeur",
    "BY": "eeur",
    "MD": "eeur",
    "LT": "eeur",
    "LV": "eeur",
    "EE": "eeur",
    "CY": "eeur",
    // Asia-Pacific
    "JP": "apac",
    "CN": "apac",
    "KR": "apac",
    "IN": "apac",
    "SG": "apac",
    "TH": "apac",
    "ID": "apac",
    "MY": "apac",
    "VN": "apac",
    "PH": "apac",
    "TW": "apac",
    "HK": "apac",
    "MO": "apac",
    "KH": "apac",
    "LA": "apac",
    "MM": "apac",
    "BD": "apac",
    "LK": "apac",
    "NP": "apac",
    "BT": "apac",
    "MV": "apac",
    "PK": "apac",
    "AF": "apac",
    "MN": "apac",
    "KP": "apac",
    "BN": "apac",
    "TL": "apac",
    "PG": "apac",
    "FJ": "apac",
    "SB": "apac",
    "VU": "apac",
    "NC": "apac",
    "PF": "apac",
    "WS": "apac",
    "TO": "apac",
    "KI": "apac",
    "PW": "apac",
    "MH": "apac",
    "FM": "apac",
    "NR": "apac",
    "TV": "apac",
    "CK": "apac",
    "NU": "apac",
    "TK": "apac",
    "GU": "apac",
    "MP": "apac",
    "AS": "apac",
    // Oceania
    "AU": "oc",
    "NZ": "oc",
    // Middle East
    "AE": "me",
    "SA": "me",
    "IL": "me",
    "TR": "me",
    "EG": "me",
    "IQ": "me",
    "IR": "me",
    "SY": "me",
    "JO": "me",
    "LB": "me",
    "KW": "me",
    "QA": "me",
    "BH": "me",
    "OM": "me",
    "YE": "me",
    "PS": "me",
    "GE": "me",
    "AM": "me",
    "AZ": "me",
    // Africa
    "ZA": "afr",
    "NG": "afr",
    "KE": "afr",
    "MA": "afr",
    "TN": "afr",
    "DZ": "afr",
    "LY": "afr",
    "ET": "afr",
    "GH": "afr",
    "TZ": "afr",
    "UG": "afr",
    "SD": "afr",
    "AO": "afr",
    "MZ": "afr",
    "MG": "afr",
    "CM": "afr",
    "CI": "afr",
    "NE": "afr",
    "BF": "afr",
    "ML": "afr",
    "MW": "afr",
    "ZM": "afr",
    "SN": "afr",
    "SO": "afr",
    "TD": "afr",
    "ZW": "afr",
    "GN": "afr",
    "RW": "afr",
    "BJ": "afr",
    "BI": "afr",
    "TG": "afr",
    "SL": "afr",
    "LR": "afr",
    "MR": "afr",
    "CF": "afr",
    "ER": "afr",
    "GM": "afr",
    "BW": "afr",
    "NA": "afr",
    "GA": "afr",
    "LS": "afr",
    "GW": "afr",
    "GQ": "afr",
    "MU": "afr",
    "SZ": "afr",
    "DJ": "afr",
    "KM": "afr",
    "CV": "afr",
    "SC": "afr",
    "ST": "afr",
    "SS": "afr",
    "EH": "afr",
    "CG": "afr",
    "CD": "afr",
    // Central Asia (route to APAC)
    "KZ": "apac",
    "UZ": "apac",
    "TM": "apac",
    "TJ": "apac",
    "KG": "apac"
  };
  const usStateToHint = {
    // Western states -> WNAM
    "California": "wnam",
    "Oregon": "wnam",
    "Washington": "wnam",
    "Nevada": "wnam",
    "Arizona": "wnam",
    "Utah": "wnam",
    "Idaho": "wnam",
    "Montana": "wnam",
    "Wyoming": "wnam",
    "Colorado": "wnam",
    "New Mexico": "wnam",
    "Alaska": "wnam",
    "Hawaii": "wnam",
    // Eastern states -> ENAM
    "New York": "enam",
    "Florida": "enam",
    "Texas": "enam",
    "Illinois": "enam",
    "Georgia": "enam",
    "Pennsylvania": "enam",
    "Ohio": "enam",
    "Michigan": "enam",
    "North Carolina": "enam",
    "Virginia": "enam",
    "Massachusetts": "enam",
    "New Jersey": "enam",
    "Maryland": "enam",
    "Connecticut": "enam",
    "Maine": "enam",
    "New Hampshire": "enam",
    "Vermont": "enam",
    "Rhode Island": "enam",
    "South Carolina": "enam",
    "Tennessee": "enam",
    "Alabama": "enam",
    "Mississippi": "enam",
    "Louisiana": "enam",
    "Arkansas": "enam",
    "Missouri": "enam",
    "Iowa": "enam",
    "Minnesota": "enam",
    "Wisconsin": "enam",
    "Indiana": "enam",
    "Kentucky": "enam",
    "West Virginia": "enam",
    "Delaware": "enam",
    "Oklahoma": "enam",
    "Kansas": "enam",
    "Nebraska": "enam",
    "South Dakota": "enam",
    "North Dakota": "enam",
    // DC
    "District of Columbia": "enam"
  };
  const continentToHint = {
    "NA": "enam",
    "SA": "sam",
    "EU": "weur",
    "AS": "apac",
    "AF": "afr",
    "OC": "oc"
  };
  let bestHint;
  if (country === "US" && region && region !== "unknown") {
    bestHint = usStateToHint[region] || "enam";
  } else {
    bestHint = countryToHint[country] || continentToHint[continent] || "enam";
  }
  const primaryEndpoint = ALL_ENDPOINTS.find((ep) => ep.hint === bestHint) || ALL_ENDPOINTS[1];
  const orderedEndpoints = [
    primaryEndpoint,
    ...ALL_ENDPOINTS.filter((ep) => ep.name !== primaryEndpoint.name)
  ];
  for (const endpoint of orderedEndpoints) {
    try {
      const id2 = env.RELAY_WEBSOCKET.idFromName(endpoint.name);
      const stub2 = env.RELAY_WEBSOCKET.get(id2, { locationHint: endpoint.hint });
      console.log(`Connected to DO: ${endpoint.name} (hint: ${endpoint.hint})`);
      return { stub: stub2, doName: endpoint.name };
    } catch (error2) {
      console.log(`Failed to connect to ${endpoint.name}: ${error2}`);
    }
  }
  const fallback = ALL_ENDPOINTS[1];
  const id = env.RELAY_WEBSOCKET.idFromName(fallback.name);
  const stub = env.RELAY_WEBSOCKET.get(id, { locationHint: fallback.hint });
  console.log(`Fallback to DO: ${fallback.name} (hint: ${fallback.hint})`);
  return { stub, doName: fallback.name };
}
async function getDatabaseSizeBytes(session) {
  try {
    const result = await session.prepare("SELECT 1").run();
    const sizeAfter = result.meta?.size_after;
    if (typeof sizeAfter === "number" && sizeAfter > 0) {
      return sizeAfter;
    }
    return 0;
  } catch (error2) {
    console.error("Error getting database size:", error2);
    return 0;
  }
}
async function pruneOldEvents(session, targetSizeBytes) {
  let totalEventsDeleted = 0;
  let currentSize = await getDatabaseSizeBytes(session);
  console.log(`Starting database pruning. Current size: ${(currentSize / (1024 * 1024 * 1024)).toFixed(2)} GB, Target: ${(targetSizeBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`);
  const protectedKindsArray = Array.from(pruneProtectedKinds2);
  const protectedKindsClause = protectedKindsArray.length > 0 ? `AND kind NOT IN (${protectedKindsArray.join(",")})` : "";
  while (currentSize > targetSizeBytes) {
    const oldestEvents = await session.prepare(`
      SELECT id FROM events
      WHERE 1=1 ${protectedKindsClause}
      ORDER BY created_at ASC
      LIMIT ?
    `).bind(DB_PRUNE_BATCH_SIZE2).all();
    if (!oldestEvents.results || oldestEvents.results.length === 0) {
      console.log("No more events eligible for pruning");
      break;
    }
    const eventIds = oldestEvents.results.map((row) => row.id);
    const placeholders = eventIds.map(() => "?").join(",");
    const pruneResults = await session.batch([
      session.prepare(`DELETE FROM event_tags_cache_multi WHERE event_id IN (${placeholders})`).bind(...eventIds),
      session.prepare(`DELETE FROM events WHERE id IN (${placeholders})`).bind(...eventIds)
    ]);
    const deletedCount = pruneResults[1]?.meta?.changes || eventIds.length;
    totalEventsDeleted += deletedCount;
    console.log(`Pruned ${deletedCount} events (total: ${totalEventsDeleted})`);
    currentSize = await getDatabaseSizeBytes(session);
    console.log(`Current database size: ${(currentSize / (1024 * 1024 * 1024)).toFixed(2)} GB`);
    if (totalEventsDeleted >= 1e5) {
      console.log("Reached maximum pruning limit for this run (100,000 events)");
      break;
    }
  }
  return { eventsDeleted: totalEventsDeleted, finalSizeBytes: currentSize };
}
var odInitialized, relayInfo2, PAY_TO_RELAY_ENABLED2, RELAY_ACCESS_PRICE_SATS2, relayNpub2, nip05Users2, enableAntiSpam2, enableGlobalDuplicateCheck2, antiSpamKinds2, checkValidNip052, blockedNip05Domains2, allowedNip05Domains2, DB_PRUNING_ENABLED2, DB_SIZE_THRESHOLD_GB2, DB_PRUNE_BATCH_SIZE2, DB_PRUNE_TARGET_GB2, pruneProtectedKinds2, GLOBAL_MAX_EVENTS, MAX_QUERY_COMPLEXITY, CHUNK_SIZE, EVENT_COLS, EVENT_COLS_BARE, relay_worker_default;
var init_relay_worker = __esm({
  "src/relay-worker.ts"() {
    "use strict";
    init_secp256k1();
    init_config();
    init_durable_object();
    init_opendating();
    init_server();
    init_queue();
    init_cache();
    odInitialized = false;
    __name(ensureODInit, "ensureODInit");
    ({
      relayInfo: relayInfo2,
      PAY_TO_RELAY_ENABLED: PAY_TO_RELAY_ENABLED2,
      RELAY_ACCESS_PRICE_SATS: RELAY_ACCESS_PRICE_SATS2,
      relayNpub: relayNpub2,
      nip05Users: nip05Users2,
      enableAntiSpam: enableAntiSpam2,
      enableGlobalDuplicateCheck: enableGlobalDuplicateCheck2,
      antiSpamKinds: antiSpamKinds2,
      checkValidNip05: checkValidNip052,
      blockedNip05Domains: blockedNip05Domains2,
      allowedNip05Domains: allowedNip05Domains2,
      DB_PRUNING_ENABLED: DB_PRUNING_ENABLED2,
      DB_SIZE_THRESHOLD_GB: DB_SIZE_THRESHOLD_GB2,
      DB_PRUNE_BATCH_SIZE: DB_PRUNE_BATCH_SIZE2,
      DB_PRUNE_TARGET_GB: DB_PRUNE_TARGET_GB2,
      pruneProtectedKinds: pruneProtectedKinds2
    } = config_exports);
    GLOBAL_MAX_EVENTS = 500;
    MAX_QUERY_COMPLEXITY = 1e3;
    CHUNK_SIZE = 500;
    __name(initializeDatabase, "initializeDatabase");
    __name(verifyEventSignature, "verifyEventSignature");
    __name(serializeEventForSigning, "serializeEventForSigning");
    __name(hexToBytes3, "hexToBytes");
    __name(bytesToHex3, "bytesToHex");
    __name(hashContent, "hashContent");
    __name(shouldCheckForDuplicates, "shouldCheckForDuplicates");
    __name(hasPaidForRelay, "hasPaidForRelay");
    __name(savePaidPubkey, "savePaidPubkey");
    __name(fetchEventFromFallbackRelay, "fetchEventFromFallbackRelay");
    __name(fetchKind0EventForPubkey, "fetchKind0EventForPubkey");
    __name(validateNIP05FromKind0, "validateNIP05FromKind0");
    __name(validateNIP05, "validateNIP05");
    __name(calculateQueryComplexity, "calculateQueryComplexity");
    __name(processEvent, "processEvent");
    __name(saveEventToDatabase, "saveEventToDatabase");
    __name(processDeletionEvent, "processDeletionEvent");
    __name(chunkArray, "chunkArray");
    EVENT_COLS = "e.id, e.pubkey, e.created_at, e.kind, e.tags, e.content, e.sig";
    EVENT_COLS_BARE = "id, pubkey, created_at, kind, tags, content, sig";
    __name(buildCountQuery, "buildCountQuery");
    __name(buildQuery, "buildQuery");
    __name(queryDatabaseChunked, "queryDatabaseChunked");
    __name(queryEvents, "queryEvents");
    __name(handleRelayInfoRequest, "handleRelayInfoRequest");
    __name(serveLandingPage, "serveLandingPage");
    __name(serveFavicon, "serveFavicon");
    __name(handleNIP05Request, "handleNIP05Request");
    __name(handleCheckPayment, "handleCheckPayment");
    __name(handlePaymentNotification, "handlePaymentNotification");
    __name(getOptimalDO, "getOptimalDO");
    __name(getDatabaseSizeBytes, "getDatabaseSizeBytes");
    __name(pruneOldEvents, "pruneOldEvents");
    relay_worker_default = {
      async fetch(request, env, ctx) {
        try {
          const url = new URL(request.url);
          if (request.method === "POST" && url.searchParams.has("notify-zap") && PAY_TO_RELAY_ENABLED2) {
            return await handlePaymentNotification(request, env);
          }
          if (url.pathname === "/api/check-payment" && PAY_TO_RELAY_ENABLED2) {
            return await handleCheckPayment(request, env);
          }
          if (url.pathname === "/") {
            if (request.headers.get("Upgrade") === "websocket") {
              const cf = request.cf;
              const { stub, doName } = await getOptimalDO(cf, env, url);
              const newUrl = new URL(request.url);
              newUrl.searchParams.set("region", cf?.region || "unknown");
              newUrl.searchParams.set("colo", cf?.colo || "unknown");
              newUrl.searchParams.set("continent", cf?.continent || "unknown");
              newUrl.searchParams.set("country", cf?.country || "unknown");
              newUrl.searchParams.set("doName", doName);
              return stub.fetch(new Request(newUrl, request));
            } else if (request.headers.get("Accept") === "application/nostr+json") {
              ensureODInit(env);
              return handleRelayInfoRequest(request, env);
            } else {
              ctx.waitUntil(
                initializeDatabase(env.RELAY_DATABASE).catch((e) => console.error("DB init error:", e))
              );
              ctx.waitUntil(
                (async () => {
                  try {
                    initOpenDating(env, env.RELAY_DATABASE);
                  } catch (e) {
                    console.error("OpenDating init error:", e);
                  }
                })()
              );
              return serveLandingPage();
            }
          } else if (url.pathname === "/.well-known/nostr.json") {
            return handleNIP05Request(url);
          } else if (url.pathname === "/favicon.ico") {
            return await serveFavicon();
          } else if (isBlossomPath(url.pathname)) {
            return await handleBlossomRequest(request, env);
          } else {
            return new Response("Invalid request", { status: 400 });
          }
        } catch (error2) {
          console.error("Error in fetch handler:", error2);
          return new Response("Internal Server Error", { status: 500 });
        }
      },
      // Scheduled handler for 24hr database maintenance (runs daily at 00:00 UTC)
      async scheduled(event, env, ctx) {
        console.log("Running scheduled 24hr database maintenance...");
        try {
          const session = env.RELAY_DATABASE.withSession("first-primary");
          if (DB_PRUNING_ENABLED2) {
            const currentSizeBytes = await getDatabaseSizeBytes(session);
            const currentSizeGB = currentSizeBytes / (1024 * 1024 * 1024);
            console.log(`Current database size: ${currentSizeGB.toFixed(2)} GB (threshold: ${DB_SIZE_THRESHOLD_GB2} GB)`);
            if (currentSizeGB >= DB_SIZE_THRESHOLD_GB2) {
              console.log(`Database size (${currentSizeGB.toFixed(2)} GB) exceeds threshold (${DB_SIZE_THRESHOLD_GB2} GB). Starting pruning...`);
              const targetSizeBytes = DB_PRUNE_TARGET_GB2 * 1024 * 1024 * 1024;
              const pruneResult = await pruneOldEvents(session, targetSizeBytes);
              console.log(`Pruning completed. Deleted ${pruneResult.eventsDeleted} events. Final size: ${(pruneResult.finalSizeBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`);
            } else {
              console.log("Database size is within limits. No pruning needed.");
            }
          } else {
            console.log("Database pruning is disabled.");
          }
          console.log("Running PRAGMA optimize...");
          await session.prepare("PRAGMA optimize").run();
          console.log("PRAGMA optimize completed");
          console.log("Running ANALYZE on all tables...");
          await session.prepare("ANALYZE events").run();
          await session.prepare("ANALYZE tags").run();
          await session.prepare("ANALYZE event_tags_cache_multi").run();
          await session.prepare("ANALYZE content_hashes").run();
          console.log("ANALYZE completed - query planner statistics updated");
          console.log("Scheduled 24hr database maintenance completed successfully");
        } catch (error2) {
          console.error("Scheduled maintenance failed:", error2);
        }
      },
      // Queue consumer — processes async background tasks (reports, notifications, etc.)
      async queue(batch, env, ctx) {
        for (const message of batch.messages) {
          try {
            await processTask(message.body, env.RELAY_DATABASE, env.AI);
            message.ack();
          } catch (err) {
            console.error(`[queue] message ${message.id} failed, retrying:`, err);
            message.retry({ delaySeconds: 30 });
          }
        }
      }
    };
  }
});

// src/cloudflare/housekeeper.ts
async function runHousekeeperTick(db) {
  const now = Date.now();
  if (now - lastMaintenanceAt < MAINTENANCE_INTERVAL_MS) {
    return { grantsPruned: 0, idempotencyPruned: 0, quotasReset: 0, seenPurged: 0 };
  }
  lastMaintenanceAt = now;
  const counts = { grantsPruned: 0, idempotencyPruned: 0, quotasReset: 0, seenPurged: 0 };
  try {
    counts.grantsPruned = await pruneExpiredGrants(db);
    counts.idempotencyPruned = await pruneExpiredIdempotency(db);
    counts.quotasReset = await resetDailyQuotas(db);
    counts.seenPurged = await purgeStaleSeenCandidates(db);
    if (counts.grantsPruned + counts.idempotencyPruned + counts.quotasReset + counts.seenPurged > 0) {
      console.log(`[housekeeper] pruned grants=${counts.grantsPruned} idem=${counts.idempotencyPruned} quotas=${counts.quotasReset} seen=${counts.seenPurged}`);
    }
  } catch (err) {
    console.error("[housekeeper] tick failed:", err);
  }
  return counts;
}
async function pruneExpiredGrants(db) {
  try {
    const now = Math.floor(Date.now() / 1e3);
    const result = await db.prepare(
      `DELETE FROM od_candidate_grants WHERE expires_at IS NOT NULL AND expires_at < ? LIMIT ?`
    ).bind(now, MAINTENANCE_BATCH_SIZE).run();
    return result.meta.changes;
  } catch {
    return 0;
  }
}
async function pruneExpiredIdempotency(db) {
  try {
    const result = await db.prepare(
      `DELETE FROM od_idempotency WHERE expires_at < ? LIMIT ?`
    ).bind(Math.floor(Date.now() / 1e3), MAINTENANCE_BATCH_SIZE).run();
    return result.meta.changes;
  } catch {
    return 0;
  }
}
async function resetDailyQuotas(db) {
  try {
    const now = Math.floor(Date.now() / 1e3);
    const result = await db.prepare(
      `UPDATE od_discovery_quotas
          SET daily_candidates_served = 0,
              daily_likes_sent = 0,
              daily_reset_at = ?,
              updated_at = ?
        WHERE daily_reset_at < ?`
    ).bind(now + 86400, now, now).run();
    return result.meta.changes;
  } catch {
    return 0;
  }
}
async function purgeStaleSeenCandidates(db) {
  try {
    const cutoff = Math.floor(Date.now() / 1e3) - 7 * 86400;
    const result = await db.prepare(
      `DELETE FROM od_seen_candidates WHERE seen_at < ? LIMIT ?`
    ).bind(cutoff, MAINTENANCE_BATCH_SIZE).run();
    return result.meta.changes;
  } catch {
    return 0;
  }
}
var MAINTENANCE_BATCH_SIZE, MAINTENANCE_INTERVAL_MS, lastMaintenanceAt;
var init_housekeeper = __esm({
  "src/cloudflare/housekeeper.ts"() {
    "use strict";
    MAINTENANCE_BATCH_SIZE = 200;
    MAINTENANCE_INTERVAL_MS = 5 * 60 * 1e3;
    lastMaintenanceAt = 0;
    __name(runHousekeeperTick, "runHousekeeperTick");
    __name(pruneExpiredGrants, "pruneExpiredGrants");
    __name(pruneExpiredIdempotency, "pruneExpiredIdempotency");
    __name(resetDailyQuotas, "resetDailyQuotas");
    __name(purgeStaleSeenCandidates, "purgeStaleSeenCandidates");
  }
});

// src/durable-object.ts
var _RelayWebSocket, RelayWebSocket;
var init_durable_object = __esm({
  "src/durable-object.ts"() {
    "use strict";
    init_types();
    init_config();
    init_relay_worker();
    init_registry();
    init_opendating();
    init_housekeeper();
    _RelayWebSocket = class _RelayWebSocket {
      constructor(state, env) {
        this.processedEvents = /* @__PURE__ */ new Map();
        // eventId -> timestamp
        // Query cache for REQ messages
        this.queryCache = /* @__PURE__ */ new Map();
        this.QUERY_CACHE_TTL = 6e4;
        this.MAX_CACHE_SIZE = 100;
        // Query cache index for efficient invalidation (kind:X, author:Y, etc.)
        this.queryCacheIndex = /* @__PURE__ */ new Map();
        // Active queries for deduplication (prevent duplicate work)
        this.activeQueries = /* @__PURE__ */ new Map();
        // Payment status cache
        this.paymentCache = /* @__PURE__ */ new Map();
        this.PAYMENT_CACHE_TTL = 6e4;
        // Alarm and cleanup configuration
        this.IDLE_TIMEOUT = 5 * 60 * 1e3;
        // 5 minutes
        this.lastActivityTime = Date.now();
        this.state = state;
        this.sessions = /* @__PURE__ */ new Map();
        this.env = env;
        this.doId = crypto.randomUUID();
        this.region = "unknown";
        this.doName = "unknown";
        this.processedEvents = /* @__PURE__ */ new Map();
        this.queryCache = /* @__PURE__ */ new Map();
        this.queryCacheIndex = /* @__PURE__ */ new Map();
        this.activeQueries = /* @__PURE__ */ new Map();
        this.paymentCache = /* @__PURE__ */ new Map();
        this.lastActivityTime = Date.now();
        try {
          initOpenDating(env, env.RELAY_DATABASE);
        } catch (e) {
          console.error("[OpenDating] DO init error:", e);
        }
      }
      // Alarm handler - called when scheduled alarm fires
      async alarm() {
        console.log(`Alarm triggered for DO ${this.doName}`);
        const now = Date.now();
        const idleTime = now - this.lastActivityTime;
        const activeWebSockets = this.state.getWebSockets();
        const activeCount = activeWebSockets.length;
        console.log(`DO ${this.doName} - Active WebSockets: ${activeCount}, Idle time: ${idleTime}ms`);
        if (this.env.RELAY_DATABASE) {
          try {
            const counts = await runHousekeeperTick(this.env.RELAY_DATABASE);
            if (counts.grantsPruned + counts.idempotencyPruned + counts.quotasReset + counts.seenPurged > 0) {
              console.log(`[DO:${this.doName}] housekeeper: ${JSON.stringify(counts)}`);
            }
          } catch (err) {
            console.error(`[DO:${this.doName}] housekeeper error:`, err);
          }
        }
        if (activeCount === 0) {
          console.log(`Cleaning up DO ${this.doName} - no active connections`);
          await this.cleanup();
          return;
        }
        const nextAlarm = now + this.IDLE_TIMEOUT;
        await this.state.storage.setAlarm(nextAlarm);
        console.log(`Next alarm scheduled for DO ${this.doName} in ${this.IDLE_TIMEOUT}ms`);
      }
      // Cleanup method to clear caches and sessions
      async cleanup() {
        console.log(`Running cleanup for DO ${this.doName}`);
        this.queryCache.clear();
        this.queryCacheIndex.clear();
        this.activeQueries.clear();
        this.paymentCache.clear();
        this.processedEvents.clear();
        this.sessions.clear();
        await this.cleanupOrphanedSubscriptions();
        console.log(`Cleanup complete for DO ${this.doName}`);
      }
      // Remove orphaned subscription data from storage
      async cleanupOrphanedSubscriptions() {
        try {
          const allKeys = await this.state.storage.list();
          const activeWebSockets = this.state.getWebSockets();
          const activeSessionIds = /* @__PURE__ */ new Set();
          for (const ws of activeWebSockets) {
            const attachment = ws.deserializeAttachment();
            if (attachment) {
              activeSessionIds.add(attachment.sessionId);
            }
          }
          const keysToDelete = [];
          for (const [key] of allKeys) {
            if (key.startsWith("subs:")) {
              const sessionId = key.substring(5);
              if (!activeSessionIds.has(sessionId)) {
                keysToDelete.push(key);
              }
            }
          }
          if (keysToDelete.length > 0) {
            await this.state.storage.delete(keysToDelete);
            console.log(`Cleaned up ${keysToDelete.length} orphaned subscription entries`);
          }
        } catch (error2) {
          console.error("Error cleaning up orphaned subscriptions:", error2);
        }
      }
      // Schedule alarm if one doesn't exist
      async scheduleAlarmIfNeeded() {
        const existingAlarm = await this.state.storage.getAlarm();
        if (existingAlarm === null) {
          const alarmTime = Date.now() + this.IDLE_TIMEOUT;
          await this.state.storage.setAlarm(alarmTime);
          console.log(`Scheduled first alarm for DO ${this.doName}`);
        }
      }
      // Storage helper methods for subscriptions
      async saveSubscriptions(sessionId, subscriptions) {
        const key = `subs:${sessionId}`;
        const data = Array.from(subscriptions.entries());
        await this.state.storage.put(key, data);
      }
      async loadSubscriptions(sessionId) {
        const key = `subs:${sessionId}`;
        const data = await this.state.storage.get(key);
        return new Map(data || []);
      }
      async deleteSubscriptions(sessionId) {
        const key = `subs:${sessionId}`;
        await this.state.storage.delete(key);
      }
      // Payment cache methods
      async getCachedPaymentStatus(pubkey) {
        const cached = this.paymentCache.get(pubkey);
        if (cached && Date.now() - cached.timestamp < this.PAYMENT_CACHE_TTL) {
          return cached.hasPaid;
        }
        if (cached) {
          this.paymentCache.delete(pubkey);
        }
        return null;
      }
      setCachedPaymentStatus(pubkey, hasPaid) {
        this.paymentCache.set(pubkey, {
          hasPaid,
          timestamp: Date.now()
        });
        if (this.paymentCache.size > 1e3) {
          const sortedEntries = Array.from(this.paymentCache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
          const toRemove = Math.floor(this.paymentCache.size * 0.2);
          for (let i = 0; i < toRemove; i++) {
            this.paymentCache.delete(sortedEntries[i][0]);
          }
        }
      }
      // Helper to generate global cache key
      async generateGlobalCacheKey(filters, bookmark) {
        const cacheData = JSON.stringify({ filters, bookmark });
        const buffer = new TextEncoder().encode(cacheData);
        const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
        return `https://opendating-query-cache/${hashHex}`;
      }
      // Query cache methods with deduplication and global caching
      async getCachedOrQuery(filters, bookmark) {
        const cacheKey = JSON.stringify({ filters, bookmark });
        if (this.activeQueries.has(cacheKey)) {
          console.log("Returning in-flight query result (deduplication)");
          return await this.activeQueries.get(cacheKey);
        }
        try {
          const globalCache = caches.default;
          const globalCacheKey = await this.generateGlobalCacheKey(filters, bookmark);
          const globalCached = await globalCache.match(globalCacheKey);
          if (globalCached) {
            const cachedDate = globalCached.headers.get("X-Cache-Time");
            if (cachedDate && Date.now() - parseInt(cachedDate) > 3e5) {
              console.log("Global cache entry expired, deleting");
              await globalCache.delete(globalCacheKey);
            } else {
              console.log("Returning globally cached query result");
              const result = await globalCached.json();
              this.queryCache.set(cacheKey, {
                result,
                timestamp: Date.now(),
                accessCount: 1,
                lastAccessed: Date.now()
              });
              this.addToCacheIndex(cacheKey, filters);
              return result;
            }
          }
        } catch (error2) {
          console.error("Error checking global cache:", error2);
        }
        const cached = this.queryCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.QUERY_CACHE_TTL) {
          console.log("Returning locally cached query result");
          cached.accessCount++;
          cached.lastAccessed = Date.now();
          return cached.result;
        }
        const queryPromise = queryEvents(filters, bookmark, this.env);
        this.activeQueries.set(cacheKey, queryPromise);
        try {
          const result = await queryPromise;
          this.queryCache.set(cacheKey, {
            result,
            timestamp: Date.now(),
            accessCount: 1,
            lastAccessed: Date.now()
          });
          this.addToCacheIndex(cacheKey, filters);
          if (this.queryCache.size > this.MAX_CACHE_SIZE) {
            this.cleanupQueryCache();
          }
          try {
            const globalCache = caches.default;
            const globalCacheKey = await this.generateGlobalCacheKey(filters, bookmark);
            const response = new Response(JSON.stringify(result), {
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "public, max-age=300",
                "X-Cache-Time": Date.now().toString()
              }
            });
            await globalCache.put(globalCacheKey, response);
            console.log("Stored query result in global cache");
          } catch (error2) {
            console.error("Error storing in global cache:", error2);
          }
          return result;
        } finally {
          this.activeQueries.delete(cacheKey);
        }
      }
      cleanupQueryCache() {
        const now = Date.now();
        for (const [key, entry] of this.queryCache.entries()) {
          if (now - entry.timestamp > this.QUERY_CACHE_TTL) {
            this.queryCache.delete(key);
            this.removeFromCacheIndex(key);
          }
        }
        if (this.queryCache.size > this.MAX_CACHE_SIZE) {
          const entries = Array.from(this.queryCache.entries());
          const scoredEntries = entries.map(([key, entry]) => {
            const recencyScore = (now - entry.lastAccessed) / 1e3;
            const frequencyScore = entry.accessCount * 10;
            const evictionScore = frequencyScore - recencyScore / 60;
            return { key, score: evictionScore };
          });
          scoredEntries.sort((a, b) => a.score - b.score);
          const toRemove = Math.floor(this.MAX_CACHE_SIZE * 0.2);
          for (let i = 0; i < toRemove; i++) {
            const key = scoredEntries[i].key;
            this.queryCache.delete(key);
            this.removeFromCacheIndex(key);
          }
          console.log(`Evicted ${toRemove} low-scoring cache entries (LFU)`);
        }
      }
      // Add cache entry to index for efficient invalidation
      addToCacheIndex(cacheKey, filters) {
        for (const filter of filters) {
          if (filter.kinds) {
            for (const kind of filter.kinds) {
              const indexKey2 = `kind:${kind}`;
              if (!this.queryCacheIndex.has(indexKey2)) {
                this.queryCacheIndex.set(indexKey2, /* @__PURE__ */ new Set());
              }
              this.queryCacheIndex.get(indexKey2).add(cacheKey);
            }
          }
          if (filter.authors) {
            for (const author of filter.authors) {
              const indexKey2 = `author:${author}`;
              if (!this.queryCacheIndex.has(indexKey2)) {
                this.queryCacheIndex.set(indexKey2, /* @__PURE__ */ new Set());
              }
              this.queryCacheIndex.get(indexKey2).add(cacheKey);
            }
          }
          for (const [key, values] of Object.entries(filter)) {
            if (key.startsWith("#") && Array.isArray(values)) {
              const tagName = key.substring(1);
              for (const value of values) {
                const indexKey2 = `tag:${tagName}:${value}`;
                if (!this.queryCacheIndex.has(indexKey2)) {
                  this.queryCacheIndex.set(indexKey2, /* @__PURE__ */ new Set());
                }
                this.queryCacheIndex.get(indexKey2).add(cacheKey);
              }
            }
          }
        }
      }
      // Remove cache entry from index
      removeFromCacheIndex(cacheKey) {
        for (const [indexKey2, cacheKeys] of this.queryCacheIndex.entries()) {
          cacheKeys.delete(cacheKey);
          if (cacheKeys.size === 0) {
            this.queryCacheIndex.delete(indexKey2);
          }
        }
      }
      invalidateRelevantCaches(event) {
        const keysToInvalidate = /* @__PURE__ */ new Set();
        const kindKey = `kind:${event.kind}`;
        if (this.queryCacheIndex.has(kindKey)) {
          for (const cacheKey of this.queryCacheIndex.get(kindKey)) {
            keysToInvalidate.add(cacheKey);
          }
        }
        const authorKey = `author:${event.pubkey}`;
        if (this.queryCacheIndex.has(authorKey)) {
          for (const cacheKey of this.queryCacheIndex.get(authorKey)) {
            keysToInvalidate.add(cacheKey);
          }
        }
        for (const tag of event.tags) {
          if (tag.length >= 2) {
            const tagKey = `tag:${tag[0]}:${tag[1]}`;
            if (this.queryCacheIndex.has(tagKey)) {
              for (const cacheKey of this.queryCacheIndex.get(tagKey)) {
                keysToInvalidate.add(cacheKey);
              }
            }
          }
        }
        for (const key of keysToInvalidate) {
          this.queryCache.delete(key);
          this.removeFromCacheIndex(key);
        }
        if (keysToInvalidate.size > 0) {
          console.log(`Invalidated ${keysToInvalidate.size} local cache entries for event ${event.id} (kind:${event.kind}, author:${event.pubkey.substring(0, 8)}...)`);
        }
      }
      async fetch(request) {
        const url = new URL(request.url);
        const urlDoName = url.searchParams.get("doName");
        if (urlDoName && urlDoName !== "unknown" && _RelayWebSocket.ALLOWED_ENDPOINTS.includes(urlDoName)) {
          this.doName = urlDoName;
        }
        if (url.pathname === "/do-broadcast") {
          return await this.handleDOBroadcast(request);
        }
        const upgradeHeader = request.headers.get("Upgrade");
        if (!upgradeHeader || upgradeHeader !== "websocket") {
          return new Response("Expected Upgrade: websocket", { status: 426 });
        }
        this.region = url.searchParams.get("region") || this.region || "unknown";
        const colo = url.searchParams.get("colo") || "default";
        console.log(`WebSocket connection to DO: ${this.doName} (region: ${this.region}, colo: ${colo})`);
        const webSocketPair = new WebSocketPair();
        const [client, server] = Object.values(webSocketPair);
        const sessionId = crypto.randomUUID();
        const host = request.headers.get("host") || url.host;
        const session = {
          id: sessionId,
          webSocket: server,
          subscriptions: /* @__PURE__ */ new Map(),
          pubkeyRateLimiter: new RateLimiter(PUBKEY_RATE_LIMIT.rate, PUBKEY_RATE_LIMIT.capacity),
          reqRateLimiter: new RateLimiter(REQ_RATE_LIMIT.rate, REQ_RATE_LIMIT.capacity),
          bookmark: "first-unconstrained",
          host,
          challenge: AUTH_REQUIRED ? this.generateAuthChallenge() : void 0,
          authenticatedPubkeys: /* @__PURE__ */ new Set()
        };
        this.sessions.set(sessionId, session);
        const attachment = {
          sessionId,
          bookmark: session.bookmark,
          host,
          doName: this.doName,
          // NIP-42: Persist auth state for hibernation survival
          authenticatedPubkeys: [],
          challenge: session.challenge
        };
        server.serializeAttachment(attachment);
        this.state.acceptWebSocket(server);
        if (AUTH_REQUIRED && session.challenge) {
          this.sendAuth(server, session.challenge);
        }
        this.lastActivityTime = Date.now();
        await this.scheduleAlarmIfNeeded();
        console.log(`New WebSocket session: ${sessionId} on DO ${this.doName}`);
        return new Response(null, {
          status: 101,
          webSocket: client
        });
      }
      // WebSocket Hibernation API handler methods
      async webSocketMessage(ws, message) {
        this.lastActivityTime = Date.now();
        const attachment = ws.deserializeAttachment();
        if (!attachment) {
          console.error("No session attachment found");
          ws.close(1011, "Session not found");
          return;
        }
        let session = this.sessions.get(attachment.sessionId);
        if (!session) {
          if (attachment.doName && this.doName === "unknown") {
            this.doName = attachment.doName;
          }
          const subscriptions = await this.loadSubscriptions(attachment.sessionId);
          const restoredPubkeys = new Set(attachment.authenticatedPubkeys || []);
          const isAuthenticated = restoredPubkeys.size > 0;
          session = {
            id: attachment.sessionId,
            webSocket: ws,
            subscriptions,
            pubkeyRateLimiter: new RateLimiter(PUBKEY_RATE_LIMIT.rate, PUBKEY_RATE_LIMIT.capacity),
            reqRateLimiter: new RateLimiter(REQ_RATE_LIMIT.rate, REQ_RATE_LIMIT.capacity),
            bookmark: attachment.bookmark,
            host: attachment.host,
            // NIP-42: Restore challenge from attachment, or generate new one if not present
            challenge: attachment.challenge || (AUTH_REQUIRED ? this.generateAuthChallenge() : void 0),
            authenticatedPubkeys: restoredPubkeys,
            // Restore payment status from attachment (survives hibernation)
            hasPaid: attachment.hasPaid
          };
          this.sessions.set(attachment.sessionId, session);
          if (AUTH_REQUIRED && !isAuthenticated && session.challenge) {
            this.sendAuth(ws, session.challenge);
          }
        }
        try {
          let parsedMessage;
          if (typeof message === "string") {
            parsedMessage = JSON.parse(message);
          } else {
            const decoder = new TextDecoder();
            const text = decoder.decode(message);
            parsedMessage = JSON.parse(text);
          }
          await this.handleMessage(session, parsedMessage);
          const updatedAttachment = {
            sessionId: session.id,
            bookmark: session.bookmark,
            host: session.host,
            doName: this.doName,
            hasPaid: session.hasPaid,
            authenticatedPubkeys: Array.from(session.authenticatedPubkeys),
            challenge: session.challenge
          };
          ws.serializeAttachment(updatedAttachment);
        } catch (error2) {
          console.error("Error handling message:", error2);
          if (error2 instanceof SyntaxError) {
            this.sendError(ws, "Invalid JSON format");
          } else {
            this.sendError(ws, "Failed to process message");
          }
        }
      }
      async webSocketClose(ws, code, reason, wasClean) {
        const attachment = ws.deserializeAttachment();
        if (attachment) {
          console.log(`WebSocket closed: ${attachment.sessionId} on DO ${this.doName}`);
          this.sessions.delete(attachment.sessionId);
          await this.deleteSubscriptions(attachment.sessionId);
          const activeWebSockets = this.state.getWebSockets();
          if (activeWebSockets.length === 0) {
            await this.state.storage.deleteAlarm();
            console.log(`Deleted alarm for DO ${this.doName} - no active connections remaining`);
          }
        }
      }
      async webSocketError(ws, error2) {
        const attachment = ws.deserializeAttachment();
        if (attachment) {
          console.error(`WebSocket error for session ${attachment.sessionId}:`, error2);
          this.sessions.delete(attachment.sessionId);
        }
      }
      async handleDOBroadcast(request) {
        try {
          const data = await request.json();
          const { event, sourceDoId } = data;
          if (this.processedEvents.has(event.id)) {
            return new Response(JSON.stringify({ success: true, duplicate: true }));
          }
          this.processedEvents.set(event.id, Date.now());
          console.log(`DO ${this.doName} received event ${event.id} from ${sourceDoId}`);
          this.invalidateRelevantCaches(event);
          await this.broadcastToLocalSessions(event);
          const fiveMinutesAgo = Date.now() - 3e5;
          let cleaned = 0;
          for (const [eventId, timestamp] of this.processedEvents) {
            if (timestamp < fiveMinutesAgo) {
              this.processedEvents.delete(eventId);
              cleaned++;
            }
          }
          return new Response(JSON.stringify({ success: true }));
        } catch (error2) {
          console.error("Error handling DO broadcast:", error2);
          return new Response(JSON.stringify({ success: false, error: error2.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
      async handleMessage(session, message) {
        if (!Array.isArray(message)) {
          this.sendError(session.webSocket, "Invalid message format: expected JSON array");
          return;
        }
        const [type, ...args] = message;
        try {
          switch (type) {
            case "EVENT":
              await this.handleEvent(session, args[0]);
              break;
            case "REQ":
              await this.handleReq(session, message);
              break;
            case "CLOSE":
              await this.handleCloseSubscription(session, args[0]);
              break;
            case "AUTH":
              await this.handleAuth(session, args[0]);
              break;
            default:
              this.sendError(session.webSocket, `Unknown message type: ${type}`);
          }
        } catch (error2) {
          console.error(`Error handling ${type} message:`, error2);
          this.sendError(session.webSocket, `Failed to process ${type} message`);
        }
      }
      async handleEvent(session, event) {
        try {
          if (!event || typeof event !== "object") {
            this.sendOK(session.webSocket, "", false, "invalid: event object required");
            return;
          }
          if (!event.id || !event.pubkey || !event.sig || !event.created_at || event.kind === void 0 || !Array.isArray(event.tags) || event.content === void 0 || event.content === null) {
            this.sendOK(session.webSocket, event.id || "", false, "invalid: missing required fields");
            return;
          }
          if (event.kind === 22242) {
            this.sendOK(session.webSocket, event.id, false, "invalid: kind 22242 events are for authentication only");
            return;
          }
          if (AUTH_REQUIRED) {
            if (session.authenticatedPubkeys.size === 0) {
              this.sendOK(session.webSocket, event.id, false, "auth-required: authenticate to publish events");
              return;
            }
            if (event.kind !== 1059 && !session.authenticatedPubkeys.has(event.pubkey)) {
              this.sendOK(session.webSocket, event.id, false, "restricted: event pubkey does not match authenticated pubkey");
              return;
            }
          }
          if (!excludedRateLimitKinds.has(event.kind)) {
            if (!session.pubkeyRateLimiter.removeToken()) {
              console.log(`Rate limit exceeded for pubkey ${event.pubkey}`);
              this.sendOK(session.webSocket, event.id, false, "rate-limited: slow down there chief");
              return;
            }
          }
          const isValidSignature = await verifyEventSignature(event);
          if (!isValidSignature) {
            console.error(`Signature verification failed for event ${event.id}`);
            this.sendOK(session.webSocket, event.id, false, "invalid: signature verification failed");
            return;
          }
          if (PAY_TO_RELAY_ENABLED && event.kind !== 1059) {
            let hasPaid = await this.getCachedPaymentStatus(event.pubkey);
            if (hasPaid === null) {
              hasPaid = await hasPaidForRelay(event.pubkey, this.env);
              if (hasPaid !== null) {
                this.setCachedPaymentStatus(event.pubkey, hasPaid);
              }
            }
            if (hasPaid !== true) {
              const protocol = "https:";
              const relayUrl = `${protocol}//${session.host}`;
              console.error(`Event denied. Pubkey ${event.pubkey} has not paid for relay access.`);
              this.sendOK(session.webSocket, event.id, false, `blocked: payment required. Visit ${relayUrl} to pay for relay access.`);
              return;
            }
          }
          if (event.kind !== 1059 && !isPubkeyAllowed(event.pubkey)) {
            console.error(`Event denied. Pubkey ${event.pubkey} is not allowed.`);
            this.sendOK(session.webSocket, event.id, false, "blocked: pubkey not allowed");
            return;
          }
          if (!isEventKindAllowed(event.kind)) {
            console.error(`Event denied. Event kind ${event.kind} is not allowed.`);
            this.sendOK(session.webSocket, event.id, false, `blocked: event kind ${event.kind} not allowed`);
            return;
          }
          if (containsBlockedContent(event)) {
            console.error("Event denied. Content contains blocked phrases.");
            this.sendOK(session.webSocket, event.id, false, "blocked: content contains blocked phrases");
            return;
          }
          for (const tag of event.tags) {
            if (!isTagAllowed(tag[0])) {
              console.error(`Event denied. Tag '${tag[0]}' is not allowed.`);
              this.sendOK(session.webSocket, event.id, false, `blocked: tag '${tag[0]}' not allowed`);
              return;
            }
          }
          const relayCtx = {
            sessionId: session.id,
            authenticatedPubkey: session.authenticatedPubkeys.size > 0 ? Array.from(session.authenticatedPubkeys)[0] : void 0,
            relayUrl: `wss://${session.host}`,
            connection: { userAgent: "websocket" },
            _env: this.env
          };
          const extension = extensionRegistry.findHandler(event, relayCtx);
          if (extension && extension.handleEvent) {
            const extResult = await extension.handleEvent(event, relayCtx);
            if (extResult.publish?.length) {
              for (const produced of extResult.publish) {
                await this.broadcastEvent(produced);
              }
            }
            if (extResult.handled && extResult.storeNormally === false) {
              this.sendOK(session.webSocket, event.id, true, extResult.message || "");
              return;
            }
          }
          const result = await processEvent(event, session.id, this.env);
          if (result.bookmark) {
            session.bookmark = result.bookmark;
          }
          if (result.success) {
            this.sendOK(session.webSocket, event.id, true, result.message);
            this.processedEvents.set(event.id, Date.now());
            this.invalidateRelevantCaches(event);
            console.log(`DO ${this.doName} broadcasting event ${event.id}`);
            await this.broadcastEvent(event);
          } else {
            this.sendOK(session.webSocket, event.id, false, result.message);
          }
        } catch (error2) {
          console.error("Error handling event:", error2);
          this.sendOK(session.webSocket, event?.id || "", false, `error: ${error2.message}`);
        }
      }
      async handleReq(session, message) {
        const [_, subscriptionId, ...filters] = message;
        if (!subscriptionId || typeof subscriptionId !== "string" || subscriptionId === "" || subscriptionId.length > 64) {
          this.sendError(session.webSocket, "Invalid subscription ID: must be non-empty string of max 64 chars");
          return;
        }
        if (AUTH_REQUIRED && session.authenticatedPubkeys.size === 0) {
          this.sendClosed(session.webSocket, subscriptionId, "auth-required: authentication required to subscribe");
          return;
        }
        if (!session.reqRateLimiter.removeToken()) {
          console.error(`REQ rate limit exceeded for subscription: ${subscriptionId}`);
          this.sendClosed(session.webSocket, subscriptionId, "rate-limited: slow down there chief");
          return;
        }
        if (filters.length === 0) {
          this.sendClosed(session.webSocket, subscriptionId, "error: at least one filter required");
          return;
        }
        for (const filter of filters) {
          if (typeof filter !== "object" || filter === null) {
            this.sendClosed(session.webSocket, subscriptionId, "invalid: filter must be an object");
            return;
          }
          if (filter.ids) {
            for (const id of filter.ids) {
              if (!/^[a-f0-9]{64}$/.test(id)) {
                this.sendClosed(session.webSocket, subscriptionId, `invalid: Invalid event ID format: ${id}`);
                return;
              }
            }
          }
          if (filter.authors) {
            for (const author of filter.authors) {
              if (!/^[a-f0-9]{64}$/.test(author)) {
                this.sendClosed(session.webSocket, subscriptionId, `invalid: Invalid author pubkey format: ${author}`);
                return;
              }
            }
          }
          if (filter.kinds) {
            const blockedKinds = filter.kinds.filter((kind) => !isEventKindAllowed(kind));
            if (blockedKinds.length > 0) {
              console.error(`Blocked kinds in subscription: ${blockedKinds.join(", ")}`);
              this.sendClosed(session.webSocket, subscriptionId, `blocked: kinds ${blockedKinds.join(", ")} not allowed`);
              return;
            }
          }
          if (filter.ids && filter.ids.length > 5e3) {
            this.sendClosed(session.webSocket, subscriptionId, "invalid: too many event IDs (max 5000)");
            return;
          }
          if (filter.limit && filter.limit > 500) {
            filter.limit = 500;
          } else if (!filter.limit) {
            filter.limit = 500;
          }
        }
        session.subscriptions.set(subscriptionId, filters);
        await this.saveSubscriptions(session.id, session.subscriptions);
        console.log(`New subscription ${subscriptionId} for session ${session.id} on DO ${this.doName}`);
        try {
          const result = await this.getCachedOrQuery(filters, session.bookmark);
          if (result.bookmark) {
            session.bookmark = result.bookmark;
          }
          for (const event of result.events) {
            this.sendEvent(session.webSocket, subscriptionId, event);
          }
          this.sendEOSE(session.webSocket, subscriptionId);
        } catch (error2) {
          console.error(`Error processing REQ for subscription ${subscriptionId}:`, error2);
          this.sendClosed(session.webSocket, subscriptionId, "error: could not connect to the database");
        }
      }
      async handleCloseSubscription(session, subscriptionId) {
        if (!subscriptionId) {
          this.sendError(session.webSocket, "Invalid subscription ID for CLOSE");
          return;
        }
        const deleted = session.subscriptions.delete(subscriptionId);
        if (deleted) {
          await this.saveSubscriptions(session.id, session.subscriptions);
          console.log(`Closed subscription ${subscriptionId} for session ${session.id} on DO ${this.doName}`);
          this.sendClosed(session.webSocket, subscriptionId, "Subscription closed");
        } else {
          this.sendClosed(session.webSocket, subscriptionId, "Subscription not found");
        }
      }
      // NIP-42: Handle AUTH message from client
      async handleAuth(session, authEvent) {
        try {
          if (!authEvent || typeof authEvent !== "object") {
            this.sendOK(session.webSocket, "", false, "invalid: auth event object required");
            return;
          }
          if (!authEvent.id || !authEvent.pubkey || !authEvent.sig || !authEvent.created_at || authEvent.kind === void 0 || !Array.isArray(authEvent.tags) || authEvent.content === void 0) {
            this.sendOK(session.webSocket, authEvent.id || "", false, "invalid: missing required fields");
            return;
          }
          if (authEvent.kind !== 22242) {
            this.sendOK(session.webSocket, authEvent.id, false, "invalid: auth event must be kind 22242");
            return;
          }
          const isValidSignature = await verifyEventSignature(authEvent);
          if (!isValidSignature) {
            this.sendOK(session.webSocket, authEvent.id, false, "invalid: signature verification failed");
            return;
          }
          const now = Math.floor(Date.now() / 1e3);
          const timeDiff = Math.abs(now - authEvent.created_at);
          const timeoutSeconds = AUTH_TIMEOUT_MS / 1e3;
          if (timeDiff > timeoutSeconds) {
            this.sendOK(session.webSocket, authEvent.id, false, "invalid: auth event created_at is too far from current time");
            return;
          }
          const challengeTag = authEvent.tags.find((tag) => tag[0] === "challenge");
          if (!challengeTag || !challengeTag[1]) {
            this.sendOK(session.webSocket, authEvent.id, false, "invalid: missing challenge tag");
            return;
          }
          if (!session.challenge) {
            this.sendOK(session.webSocket, authEvent.id, false, "invalid: no challenge was issued");
            return;
          }
          if (challengeTag[1] !== session.challenge) {
            this.sendOK(session.webSocket, authEvent.id, false, "invalid: challenge mismatch");
            return;
          }
          const relayTag = authEvent.tags.find((tag) => tag[0] === "relay");
          if (!relayTag || !relayTag[1]) {
            this.sendOK(session.webSocket, authEvent.id, false, "invalid: missing relay tag");
            return;
          }
          try {
            const authRelayUrl = new URL(relayTag[1]);
            const sessionHost = session.host.toLowerCase().replace(/:\d+$/, "");
            const authHost = authRelayUrl.host.toLowerCase().replace(/:\d+$/, "");
            if (authHost !== sessionHost) {
              this.sendOK(session.webSocket, authEvent.id, false, `invalid: relay URL mismatch (expected ${sessionHost})`);
              return;
            }
          } catch {
            this.sendOK(session.webSocket, authEvent.id, false, "invalid: malformed relay URL");
            return;
          }
          session.authenticatedPubkeys.add(authEvent.pubkey);
          session.challenge = this.generateAuthChallenge();
          if (PAY_TO_RELAY_ENABLED) {
            const paid = await hasPaidForRelay(authEvent.pubkey, this.env);
            if (paid !== null) {
              session.hasPaid = paid;
              this.setCachedPaymentStatus(authEvent.pubkey, paid);
            }
          }
          this.sendOK(session.webSocket, authEvent.id, true, "");
        } catch (error2) {
          console.error("Error handling AUTH:", error2);
          this.sendOK(session.webSocket, authEvent?.id || "", false, `error: ${error2.message}`);
        }
      }
      async broadcastEvent(event) {
        await this.broadcastToLocalSessions(event);
        await this.broadcastToOtherDOs(event);
      }
      async broadcastToLocalSessions(event) {
        let broadcastCount = 0;
        const activeWebSockets = this.state.getWebSockets();
        for (const ws of activeWebSockets) {
          const attachment = ws.deserializeAttachment();
          if (!attachment)
            continue;
          let session = this.sessions.get(attachment.sessionId);
          if (!session) {
            const subscriptions = await this.loadSubscriptions(attachment.sessionId);
            session = {
              id: attachment.sessionId,
              webSocket: ws,
              subscriptions,
              pubkeyRateLimiter: new RateLimiter(PUBKEY_RATE_LIMIT.rate, PUBKEY_RATE_LIMIT.capacity),
              reqRateLimiter: new RateLimiter(REQ_RATE_LIMIT.rate, REQ_RATE_LIMIT.capacity),
              bookmark: attachment.bookmark,
              host: attachment.host,
              challenge: attachment.challenge || (AUTH_REQUIRED ? this.generateAuthChallenge() : void 0),
              authenticatedPubkeys: new Set(attachment.authenticatedPubkeys || []),
              hasPaid: attachment.hasPaid
            };
            this.sessions.set(attachment.sessionId, session);
          }
          for (const [subscriptionId, filters] of session.subscriptions) {
            if (this.matchesFilters(event, filters)) {
              try {
                this.sendEvent(ws, subscriptionId, event);
                broadcastCount++;
              } catch (error2) {
                console.error(`Error broadcasting to subscription ${subscriptionId}:`, error2);
              }
            }
          }
        }
        if (broadcastCount > 0) {
          console.log(`Event ${event.id} broadcast to ${broadcastCount} local subscriptions on DO ${this.doName}`);
        }
      }
      async broadcastToOtherDOs(event) {
        const broadcasts = [];
        for (const endpoint of _RelayWebSocket.ALLOWED_ENDPOINTS) {
          if (endpoint === this.doName)
            continue;
          broadcasts.push(this.sendToSpecificDO(endpoint, event));
        }
        const results = await Promise.allSettled(
          broadcasts.map((p) => Promise.race([
            p,
            new Promise(
              (_, reject) => setTimeout(() => reject(new Error("Broadcast timeout")), 3e3)
            )
          ]))
        );
        const successful = results.filter((r) => r.status === "fulfilled").length;
        console.log(`Event ${event.id} broadcast from DO ${this.doName} to ${successful}/${broadcasts.length} remote DOs`);
      }
      async sendToSpecificDO(doName, event) {
        try {
          if (!_RelayWebSocket.ALLOWED_ENDPOINTS.includes(doName)) {
            throw new Error(`Invalid DO name: ${doName}`);
          }
          const id = this.env.RELAY_WEBSOCKET.idFromName(doName);
          const locationHint = _RelayWebSocket.ENDPOINT_HINTS[doName] || "auto";
          const stub = this.env.RELAY_WEBSOCKET.get(id, { locationHint });
          const url = new URL("https://internal/do-broadcast");
          url.searchParams.set("doName", doName);
          return await stub.fetch(new Request(url.toString(), {
            method: "POST",
            body: JSON.stringify({
              event,
              sourceDoId: this.doId
            })
          }));
        } catch (error2) {
          console.error(`Failed to broadcast to ${doName}:`, error2);
          throw error2;
        }
      }
      matchesFilters(event, filters) {
        return filters.some((filter) => this.matchesFilter(event, filter));
      }
      matchesFilter(event, filter) {
        if (filter.ids && filter.ids.length > 0 && !filter.ids.includes(event.id)) {
          return false;
        }
        if (filter.authors && filter.authors.length > 0 && !filter.authors.includes(event.pubkey)) {
          return false;
        }
        if (filter.kinds && filter.kinds.length > 0 && !filter.kinds.includes(event.kind)) {
          return false;
        }
        if (filter.since && event.created_at < filter.since) {
          return false;
        }
        if (filter.until && event.created_at > filter.until) {
          return false;
        }
        for (const [key, values] of Object.entries(filter)) {
          if (key.startsWith("#") && Array.isArray(values) && values.length > 0) {
            const tagName = key.substring(1);
            const eventTagValues = event.tags.filter((tag) => tag[0] === tagName).map((tag) => tag[1]);
            const hasMatch = values.some((v) => eventTagValues.includes(v));
            if (!hasMatch) {
              return false;
            }
          }
        }
        return true;
      }
      // NIP-42: Send AUTH challenge to client
      sendAuth(ws, challenge2) {
        try {
          const authMessage = ["AUTH", challenge2];
          ws.send(JSON.stringify(authMessage));
        } catch (error2) {
          console.error("Error sending AUTH:", error2);
        }
      }
      // NIP-42: Generate a cryptographically secure challenge string
      generateAuthChallenge() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
      }
      sendOK(ws, eventId, status, message) {
        try {
          const okMessage = ["OK", eventId, status, message || ""];
          ws.send(JSON.stringify(okMessage));
        } catch (error2) {
          console.error("Error sending OK:", error2);
        }
      }
      sendError(ws, message) {
        try {
          const noticeMessage = ["NOTICE", message];
          ws.send(JSON.stringify(noticeMessage));
        } catch (error2) {
          console.error("Error sending NOTICE:", error2);
        }
      }
      sendEOSE(ws, subscriptionId) {
        try {
          const eoseMessage = ["EOSE", subscriptionId];
          ws.send(JSON.stringify(eoseMessage));
        } catch (error2) {
          console.error("Error sending EOSE:", error2);
        }
      }
      sendClosed(ws, subscriptionId, message) {
        try {
          const closedMessage = ["CLOSED", subscriptionId, message];
          ws.send(JSON.stringify(closedMessage));
        } catch (error2) {
          console.error("Error sending CLOSED:", error2);
        }
      }
      sendEvent(ws, subscriptionId, event) {
        try {
          const eventMessage = ["EVENT", subscriptionId, event];
          ws.send(JSON.stringify(eventMessage));
        } catch (error2) {
          console.error("Error sending EVENT:", error2);
        }
      }
    };
    __name(_RelayWebSocket, "RelayWebSocket");
    // Define allowed endpoints
    _RelayWebSocket.ALLOWED_ENDPOINTS = [
      "relay-WNAM-primary",
      // Western North America
      "relay-ENAM-primary",
      // Eastern North America
      "relay-WEUR-primary",
      // Western Europe
      "relay-EEUR-primary",
      // Eastern Europe
      "relay-APAC-primary",
      // Asia-Pacific
      "relay-OC-primary",
      // Oceania
      "relay-SAM-primary",
      // South America (redirects to enam)
      "relay-AFR-primary",
      // Africa (redirects to weur)
      "relay-ME-primary"
      // Middle East (redirects to eeur)
    ];
    // Map endpoints to their proper location hints
    _RelayWebSocket.ENDPOINT_HINTS = {
      "relay-WNAM-primary": "wnam",
      "relay-ENAM-primary": "enam",
      "relay-WEUR-primary": "weur",
      "relay-EEUR-primary": "eeur",
      "relay-APAC-primary": "apac",
      "relay-OC-primary": "oc",
      "relay-SAM-primary": "enam",
      // SAM redirects to ENAM
      "relay-AFR-primary": "weur",
      // AFR redirects to WEUR
      "relay-ME-primary": "eeur"
      // ME redirects to EEUR
    };
    RelayWebSocket = _RelayWebSocket;
  }
});

// src/index.ts
init_durable_object();
init_relay_worker();
export {
  RelayWebSocket,
  relay_worker_default as default
};
/*! Bundled license information:

@noble/hashes/esm/utils.js:
  (*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@noble/curves/esm/utils.js:
  (*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@noble/curves/esm/abstract/modular.js:
  (*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@noble/curves/esm/abstract/curve.js:
  (*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@noble/curves/esm/abstract/weierstrass.js:
  (*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@noble/curves/esm/_shortw_utils.js:
  (*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@noble/curves/esm/secp256k1.js:
  (*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@noble/ciphers/utils.js:
  (*! noble-ciphers - MIT License (c) 2023 Paul Miller (paulmillr.com) *)
*/
