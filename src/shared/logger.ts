/**
 * Structured logging for the relay.
 *
 * Levels: debug, info, warn, error, security
 *
 * Never log:
 * - private keys
 * - auth signatures unnecessarily
 * - DM plaintext
 * - decrypted application payloads
 * - sensitive moderation evidence
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'security';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  sessionId?: string;
  requestId?: string;
  pubkey?: string;
  eventKind?: number;
  data?: Record<string, unknown>;
}

function formatLog(entry: LogEntry): string {
  const parts = [
    `[${entry.timestamp}]`,
    `[${entry.level.toUpperCase()}]`,
  ];
  if (entry.sessionId) parts.push(`[sess:${entry.sessionId.substring(0, 8)}]`);
  if (entry.pubkey) parts.push(`[pk:${entry.pubkey.substring(0, 8)}]`);
  parts.push(entry.message);
  if (entry.data) parts.push(JSON.stringify(entry.data));
  return parts.join(' ');
}

export function log(
  level: LogLevel,
  message: string,
  context?: Partial<Omit<LogEntry, 'level' | 'message' | 'timestamp'>>
): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  const formatted = formatLog(entry);

  switch (level) {
    case 'debug':
      console.debug(formatted);
      break;
    case 'info':
      console.log(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'error':
    case 'security':
      console.error(formatted);
      break;
  }
}

export const logger = {
  debug: (msg: string, ctx?: object) => log('debug', msg, ctx),
  info: (msg: string, ctx?: object) => log('info', msg, ctx),
  warn: (msg: string, ctx?: object) => log('warn', msg, ctx),
  error: (msg: string, ctx?: object) => log('error', msg, ctx),
  security: (msg: string, ctx?: object) => log('security', msg, ctx),
};
