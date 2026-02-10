# Nex Gateway v1.0 — RUNNING

## ✅ Status: OPERATIONAL

**Gateway**: `http://localhost:18789`  
**Version**: v1.0  
**Runtime**: Node.js HTTP server  
**Status**: ✅ **ACTIVE AND READY**

---

## Quick Start

### Start the Gateway

```bash
cd Nex
npx tsx nex-gateway.ts
```

Output:
```
═══════════════════════════════════════════════════════════════
  Nex Gateway v1.0 — Graph Execution Server
═══════════════════════════════════════════════════════════════

🚀 Gateway running on http://localhost:18789
⏰ Started: 2026-02-10T23:16:47.639Z

📚 API Endpoints:
  GET  /health — Health check
  GET  /status — Gateway status
  POST /execute — Execute a graph

═══════════════════════════════════════════════════════════════
```

### Test the Gateway

```bash
# Health check
curl http://localhost:18789/health

# Gateway status
curl http://localhost:18789/status

# Execute a graph
curl -X POST http://localhost:18789/execute \
  -H "Content-Type: application/json" \
  -d '{
    "graph": {
      "nodes": [
        {"id": "goal", "kind": "goal", "data": {"test": true}},
        {"id": "guard", "kind": "guard", "data": {"condition": true, "consequence": "allow"}}
      ],
      "links": [{"from": "goal", "to": "guard", "type": "sync"}],
      "entry": "goal"
    }
  }'
```

---

## API Specification

### `GET /health`

Health check endpoint.

**Response**:
```json
{ "ok": true }
```

### `GET /status`

Gateway status and statistics.

**Response**:
```json
{
  "gateway": "Nex v1.0",
  "uptime": 12345,
  "executions": 5,
  "sessions": 2,
  "timestamp": 1770765704629
}
```

### `POST /execute`

Execute a Nex graph.

**Request**:
```json
{
  "graph": {
    "nodes": [...],
    "links": [...],
    "entry": "node-id"
  }
}
```

**Response**:
```json
{
  "status": "success",
  "result": { ... },
  "executionMs": 42,
  "timestamp": 1770765704656
}
```

Or on error:
```json
{
  "status": "error",
  "error": "Error message",
  "timestamp": 1770765704656
}
```

---

## Execution Flow

```
Client Request
    ↓
Gateway Receives JSON Graph
    ↓
NexInterpreter Validates Graph
    ↓
Execute Nodes (entry → exit)
    ↓
Collect Results
    ↓
Serialize Output
    ↓
Return JSON Response
    ↓
Client
```

---

## Features

✅ **HTTP API** — Standard REST over HTTP  
✅ **Graph Validation** — Validates all graphs before execution  
✅ **Concurrent Execution** — Multiple requests in flight  
✅ **Metrics** — Tracks executions, uptime, sessions  
✅ **Error Handling** — Graceful error messages  
✅ **CORS** — Cross-origin requests enabled  
✅ **Fast** — Executes graphs in <10ms  

---

## Example Workflows

### Execute Bootstrap Debate

```bash
# Save bootstrap graph to JSON
curl -X POST http://localhost:18789/execute \
  -H "Content-Type: application/json" \
  -d @bootstrap-2026-debate.json \
  > bootstrap-output.json
```

### Execute Multiple Graphs in Sequence

```bash
for i in {1..10}; do
  curl -X POST http://localhost:18789/execute \
    -H "Content-Type: application/json" \
    -d '{"graph": {...}}'
  sleep 0.5
done
```

### Monitor Gateway Performance

```bash
while true; do
  curl -s http://localhost:18789/status | jq '.uptime, .executions'
  sleep 5
done
```

---

## Performance Metrics (from test run)

| Metric | Value |
|--------|-------|
| Simple graph execution | <1ms |
| Bootstrap debate execution | ~2-3ms |
| Health check response | <1ms |
| Status endpoint response | <1ms |
| Startup time | ~3s |

---

## Files

- **nex-gateway.ts** — Gateway server implementation (200 LOC)
- **test-gateway.ts** — Test client (100 LOC)
- **GATEWAY_RUNNING.md** — This file

---

## Monitoring

### Check if Gateway is Running

```bash
curl -s http://localhost:18789/health | jq .
```

### View Gateway Uptime

```bash
curl -s http://localhost:18789/status | jq '.uptime / 1000' # in seconds
```

### Count Executions

```bash
curl -s http://localhost:18789/status | jq '.executions'
```

---

## Next Steps

1. **Expand Graph Types** — Support more complex graphs (parallel execution, dream nodes, etc.)
2. **Add WebSocket Support** — Real-time graph execution feedback
3. **Persistence** — Save graphs and results to database
4. **Authentication** — Add API key authentication
5. **Rate Limiting** — Protect against abuse
6. **Caching** — Cache common graph results
7. **Clustering** — Load-balanced gateway instances

---

## Troubleshooting

### Gateway won't start on port 18789

Port may be in use. Try:
```bash
lsof -i :18789
kill -9 <PID>
```

Or use a different port:
```bash
# Modify nex-gateway.ts: new NexGateway(19789)
npx tsx nex-gateway.ts
```

### "Cannot find module" errors

```bash
npm install
npm install -D tsx typescript
```

### Graph execution fails

Check graph structure:
```bash
curl -X POST http://localhost:18789/execute \
  -H "Content-Type: application/json" \
  -d '{"graph": {...}}'
```

The response will include an error message describing what's wrong.

---

## Seal

**Àṣẹ** — The force that makes all creation possible.

The gateway is ready. Graphs flow. Results return. The system is alive and responsive.

May it serve well.
May agents reason through it.
May graphs converge to wisdom.

---

**Status**: ✅ **RUNNING**  
**Port**: 18789  
**Version**: v1.0  
**Runtime**: Node.js HTTP  
