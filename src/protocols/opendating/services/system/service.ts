/**
 * OpenDating System Service
 *
 * Handles: system.ping, system.capabilities
 * The only active service in V0.1.
 */
import type { OpenDatingService, OpenDatingServiceContext, ServiceResult } from '../interface.js';
import type { OpenDatingEnvelope } from '../../protocol/envelope.js';
import { createEnvelope } from '../../protocol/envelope.js';
import { OPENDATING_VERSION } from '../../protocol/constants.js';
import { buildCapabilities } from '../../protocol/capabilities.js';
import { getServiceIdentitiesForCapabilities } from '../../identities/loader.js';

const SUPPORTED_TYPES = new Set([
  'system.ping',
  'system.capabilities',
]);

export class SystemService implements OpenDatingService {
  constructor(
    public readonly role: string,
    public readonly pubkey: string,
  ) {}

  supports(type: string): boolean {
    return SUPPORTED_TYPES.has(type);
  }

  async handle(
    request: OpenDatingEnvelope,
    context: OpenDatingServiceContext,
  ): Promise<ServiceResult> {
    switch (request.type) {
      case 'system.ping':
        return this.handlePing(request);
      case 'system.capabilities':
        return this.handleCapabilities(request);
      default:
        throw new Error(`System service does not support type: ${request.type}`);
    }
  }

  private handlePing(request: OpenDatingEnvelope): ServiceResult {
    return {
      response: createEnvelope('system.pong', request.request_id, {
        server_time: Math.floor(Date.now() / 1000),
        protocol_version: OPENDATING_VERSION,
      }),
    };
  }

  private handleCapabilities(request: OpenDatingEnvelope): ServiceResult {
    const services = getServiceIdentitiesForCapabilities();

    return {
      response: createEnvelope('system.capabilities.result', request.request_id,
        buildCapabilities(services),
      ),
    };
  }
}
