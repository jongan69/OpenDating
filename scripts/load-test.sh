#!/bin/bash
# Load test script for the Nosflare relay.
# Requires: websocat (brew install websocat) or similar WebSocket CLI.
#
# Usage:
#   bash scripts/load-test.sh [RELAY_URL]
#
# Default relay URL: ws://localhost:8787

RELAY_URL="${1:-ws://localhost:8787}"
NUM_CLIENTS="${2:-50}"
DURATION="${3:-30}"

echo "=== Nosflare Load Test ==="
echo "Relay: $RELAY_URL"
echo "Clients: $NUM_CLIENTS"
echo "Duration: ${DURATION}s"
echo ""

# Test 1: Connection burst
echo "[1/4] Connection burst test ($NUM_CLIENTS connections)..."
CONNECTED=0
FAILED=0
for i in $(seq 1 $NUM_CLIENTS); do
  if timeout 5 websocat -1 "$RELAY_URL" <<< "" > /dev/null 2>&1; then
    CONNECTED=$((CONNECTED + 1))
  else
    FAILED=$((FAILED + 1))
  fi
done
echo "  Connected: $CONNECTED, Failed: $FAILED"

# Test 2: REQ burst
echo "[2/4] REQ burst test..."
# Send a subscription via websocat, check for EOSE
REQ='["REQ","test-sub",{"kinds":[1],"limit":5}]'
RESPONSE=$(timeout 10 websocat -1 "$RELAY_URL" <<< "$REQ" 2>/dev/null | head -20)
if echo "$RESPONSE" | grep -q "EOSE"; then
  echo "  REQ test: PASSED (received EOSE)"
else
  echo "  REQ test: No EOSE received (relay may require auth)"
fi

# Test 3: Query complexity protection
echo "[3/4] Query complexity test..."
# Send an expensive query
EXPENSIVE_REQ='["REQ","test-complex",{"#p":["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"],"since":0}]'
RESPONSE2=$(timeout 10 websocat -1 "$RELAY_URL" <<< "$EXPENSIVE_REQ" 2>/dev/null)
if echo "$RESPONSE2" | grep -qi "rate-limited\|restricted\|closed"; then
  echo "  Complexity test: PASSED (query rejected)"
else
  echo "  Complexity test: Query processed (relay may accept it)"
fi

# Test 4: Event validation
echo "[4/4] Event validation test..."
# Send invalid event (bad signature)
INVALID_EVENT='["EVENT",{"id":"0000000000000000000000000000000000000000000000000000000000000000","pubkey":"0000000000000000000000000000000000000000000000000000000000000000","created_at":0,"kind":1,"tags":[],"content":"test","sig":"00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"}]'
RESPONSE3=$(timeout 5 websocat -1 "$RELAY_URL" <<< "$INVALID_EVENT" 2>/dev/null)
if echo "$RESPONSE3" | grep -q "false"; then
  echo "  Validation test: PASSED (invalid event rejected)"
else
  echo "  Validation test: Response: $RESPONSE3"
fi

echo ""
echo "=== Load Test Complete ==="
