#!/bin/bash
# D1 query cost analysis.
# Run EXPLAIN QUERY PLAN on representative queries to verify index usage.
#
# Usage:
#   bash scripts/d1-query-analysis.sh

echo "=== D1 Query Analysis ==="
echo ""
echo "Target: Verify indexed queries, bounded scans, no accidental SELECT-all paths."
echo ""

# These queries mirror the patterns in buildQuery() in src/relay-worker.ts

echo "--- Query 1: By ID (primary key lookup) ---"
echo "SELECT * FROM events WHERE id = '<64-char-hex>';"
echo "Expected: SEARCH events USING PRIMARY KEY"
echo ""

echo "--- Query 2: By kind + time ---"
echo "SELECT * FROM events WHERE kind = 1 ORDER BY created_at DESC LIMIT 100;"
echo "Expected: SEARCH events USING INDEX idx_events_kind_created_at"
echo ""

echo "--- Query 3: By pubkey + kind + time ---"
echo "SELECT * FROM events WHERE pubkey = '<hex>' AND kind = 1 ORDER BY created_at DESC LIMIT 100;"
echo "Expected: SEARCH events USING INDEX idx_events_pubkey_kind_created_at"
echo ""

echo "--- Query 4: Tag lookup via cache ---"
echo "SELECT e.* FROM events e"
echo "  INNER JOIN event_tags_cache_multi m ON e.id = m.event_id"
echo "  WHERE m.tag_type = 'p' AND m.tag_value = '<hex>'"
echo "  ORDER BY m.created_at DESC LIMIT 100;"
echo "Expected: SEARCH m USING INDEX idx_cache_multi_type_value_time"
echo ""

echo "--- Query 5: Tag lookup via tags table (non-cached tag) ---"
echo "SELECT e.* FROM events e"
echo "  INNER JOIN tags t ON e.id = t.event_id"
echo "  WHERE t.tag_name = 'x' AND t.tag_value = '<value>'"
echo "  ORDER BY e.created_at DESC LIMIT 100;"
echo "Expected: SEARCH t USING INDEX idx_tags_name_value_event"
echo ""

echo "--- Query 6: Count precheck ---"
echo "SELECT COUNT(DISTINCT m.event_id) FROM event_tags_cache_multi m"
echo "  WHERE m.tag_type = 'p' AND m.tag_value IN ('<hex1>', '<hex2>');"
echo "Expected: SEARCH m USING INDEX idx_cache_multi_type_value_time"
echo ""

echo "=== Done ==="
echo "Run these queries against your D1 database with EXPLAIN QUERY PLAN to verify."
echo "Command: wrangler d1 execute nostr-relay --local --command=\"EXPLAIN QUERY PLAN <query>\""
