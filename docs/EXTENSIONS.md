# Extension System

## Overview

The relay supports domain-specific protocol extensions that plug into
the core infrastructure without modifying generic Nostr internals.

## Extension Interface

```ts
interface RelayExtension {
  name: string;

  canHandleEvent(
    event: NostrEvent,
    context: RelayContext
  ): boolean;

  handleEvent?(
    event: NostrEvent,
    context: RelayContext
  ): Promise<ExtensionResult>;

  authorizeQuery?(
    filters: NostrFilter[],
    context: RelayContext
  ): Promise<PolicyDecision>;
}
```

## How to Add a Protocol

### Step 1: Define Event Recognition

```ts
// src/future-protocols/my-protocol/recognition.ts
export function canHandleEvent(event: NostrEvent): boolean {
  return event.kind >= 30000 && event.kind < 40000;
}
```

### Step 2: Implement the Extension

```ts
// src/future-protocols/my-protocol/extension.ts
import type { RelayExtension } from '../../relay/policy/interface.js';

export const myExtension: RelayExtension = {
  name: 'my-protocol',

  canHandleEvent(event, context) {
    return event.kind === 30001;
  },

  async handleEvent(event, context) {
    // Custom event handling
    return { handled: true, storeNormally: true };
  },

  async authorizeQuery(filters, context) {
    // Custom query authorization
    return { allowed: true };
  },
};
```

### Step 3: Register at Startup

```ts
// In your worker entry point
import { extensionRegistry } from './relay/services/registry.js';
import { myExtension } from './future-protocols/my-protocol/extension.js';

extensionRegistry.register(myExtension);
```

### Step 4: Add Authorization Policy

Use the `RelayPolicy` interface to add domain-specific rules:

```ts
const myPolicy: RelayPolicy = {
  async canPublish(event, context) {
    if (event.kind === 30001) {
      // Custom validation
      return { allowed: true };
    }
    return { allowed: true };
  },
  async canQuery(filters, context) {
    return { allowed: true };
  },
};
```

### Step 5: Add Storage (if needed)

Use the `EventStore` interface for domain-specific storage:

```ts
interface EventStore {
  save(event: NostrEvent): Promise<...>;
  query(plan: QueryPlan): Promise<...>;
}
```

## What Extensions MUST NOT Do

- Modify signature verification
- Modify NIP-42 auth
- Modify WebSocket handling
- Modify base event storage
- Modify base subscription handling
- Access other users' private data

## What Extensions CAN Do

- Handle domain-specific event kinds
- Add custom validation rules
- Add custom query authorization
- Create secondary indexes
- Process events asynchronously
- Emit derived events

## Future Protocol Locations

```
src/future-protocols/
├── README.md
└── opendating/         (planned)
    ├── extension.ts
    ├── policy.ts
    ├── storage.ts
    └── events.ts
```
