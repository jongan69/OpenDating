// Web API types available in browsers, Cloudflare Workers, and Node 18+
declare var TextEncoder: {
  new (): TextEncoder;
  prototype: TextEncoder;
};
declare var TextDecoder: {
  new (label?: string, options?: TextDecoderOptions): TextDecoder;
  prototype: TextDecoder;
};
declare var btoa: (data: string) => string;
declare var atob: (data: string) => string;
declare var crypto: Crypto;
