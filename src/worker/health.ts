/**
 * Health check endpoint.
 */
export interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  version: string;
  schema_version: number;
  database: 'ok' | 'error' | 'unknown';
  durable_objects: 'configured' | 'error';
}

export function buildHealthResponse(status: HealthStatus): Response {
  return new Response(JSON.stringify(status), {
    status: status.status === 'ok' ? 200 : 503,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export function buildCORSResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}
