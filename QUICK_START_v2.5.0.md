# Nex v2.5.0 Quick Start Guide

## Installation (60 seconds)

```bash
cd Nex
npm install

# Type check
tsc --noEmit

# Run tests (verify installation)
npm test
```

Expected output: **40/40 tests passing ✅**

---

## Starting the Gateway

### Basic (v1.1.0)
```bash
npm run gateway
# → Running on http://localhost:18789
```

### With WebSocket (v1.2.0)
```bash
npm start
# → Gateway on http://localhost:18789
# → WebSocket on ws://localhost:18790
```

### Production
```bash
NODE_ENV=production npm run production
```

---

## Login & Get Token

```bash
curl -X POST http://localhost:18789/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@nex.local",
    "password": "demo-password"
  }'
```

Response:
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {"id": "user_...", "email": "demo@nex.local", "role": "user"}
}
```

Save token as: `TOKEN=<your-token>`

---

## Execute a Simple Graph

```bash
curl -X POST http://localhost:18789/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "graph": {
      "nodes": [
        {"id": "start", "kind": "goal", "data": {"msg": "hello"}},
        {"id": "check", "kind": "guard", "data": {"condition": true, "consequence": "allow"}}
      ],
      "links": [{"from": "start", "to": "check", "type": "sync"}],
      "entry": "start"
    }
  }'
```

Response:
```json
{
  "status": "success",
  "result": {"type": "goal", "id": "start", "data": {"msg": "hello"}},
  "executionMs": 12,
  "metrics": {...}
}
```

---

## Common Operations

### Validate Graph
```bash
curl -X POST http://localhost:18789/validate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"graph": {...}}'
```

### Sign Graph
```bash
curl -X POST http://localhost:18789/sign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"graphId": "my-graph"}'
```

### Check Gateway Status
```bash
curl http://localhost:18789/status
```

### View Metrics (Admin Only)
```bash
curl http://localhost:18789/metrics \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## WebSocket Real-Time Streaming

```javascript
const ws = new WebSocket('ws://localhost:18790/ws');

ws.onopen = () => {
  // Execute graph and stream results
  ws.send(JSON.stringify({
    type: 'execute',
    graph: {
      nodes: [{id: 'n1', kind: 'goal', data: {}}],
      links: [],
      entry: 'n1'
    }
  }));
};

ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  console.log('Status:', msg.data?.status);
  console.log('Result:', msg.data?.result);
};
```

---

## Core Concepts

### 7 Core Primitives
1. **node** — Computation/memory/goal
2. **link** — Flow between nodes (sync/async/parallel)
3. **guard** — Enforce constraints
4. **spawn** — Create agent
5. **rewrite** — Self-modify
6. **merge** — Aggregate results
7. **eval** — Execute recursively

### Node Kinds
- **goal** — Intent statement
- **agent** — Spawned worker
- **memory** — State storage
- **tool** — External API call
- **guard** — Constraint check
- **rewrite** — Code modification
- **reflect** — Lateral reasoning
- **merge** — Result aggregation
- **parallel** — Branch marker

### Link Types
- **sync** — Sequential (wait for predecessor)
- **async** — Fire and forget
- **parallel** — Explicit parallelism
- **depend** — Data dependency

### Merge Strategies
- **consensus** — All inputs agree
- **vote** — Majority wins
- **synthesize** — Combine perspectives
- **first-success** — First non-null result
- **last-result** — Most recent result

---

## Distributed Execution (v2.0)

```typescript
import { DistributedExecutor } from "./distributed-executor";

const executor = new DistributedExecutor();

// Register cluster nodes
executor.registerMachine("worker1", "host1", 18789);
executor.registerMachine("worker2", "host2", 18789);

// Execute across cluster
const { result, executionMs } = await executor.executeDistributed(graph);
```

---

## Agent Self-Improvement (v2.5)

```typescript
import { AgentRewriter } from "./agent-rewriter";

const rewriter = new AgentRewriter();

// Propose improvement
const proposal = rewriter.proposeImprovement(
  "agent1",
  "runtime-core",
  "Optimize merge",
  "Make merge O(n) instead of O(n²)",
  oldCode,
  newCode,
  "Faster algorithm"
);

// Agents vote (need 75% approval)
rewriter.vote(proposal.proposalId, "agent1", "approve", "Good design");
rewriter.vote(proposal.proposalId, "agent2", "approve", "Correct");
rewriter.vote(proposal.proposalId, "agent3", "approve", "Works");

// Auto-deploys when approved
console.log(proposal.status); // → "approved"
await rewriter.deployProposal(proposal.proposalId);

// Check progress
const progress = rewriter.getProgress();
console.log(`${progress.agentWrittenPercentage.toFixed(2)}% agent-written`);
```

---

## RBAC Roles & Permissions

### Roles
| Role | Level | Use Case |
|------|-------|----------|
| **admin** | Full access | System administrators |
| **user** | Read/write graphs | End users |
| **agent** | Execute only | Autonomous agents |
| **readonly** | View only | Auditors |

### Key Permissions
- `graphs:read` — View graphs
- `graphs:write` — Create/edit graphs
- `graphs:execute` — Run graphs
- `agents:spawn` — Create agents
- `settings:read` — View configuration
- `users:manage` — Manage users (admin)

---

## Environment Variables

```bash
# Gateway
NEX_PORT=18789              # Default HTTP port
JWT_SECRET=your-secret      # Token signing key
NODE_ENV=production         # Enable safety features

# Storage (optional)
STORAGE_TYPE=sqlite         # postgresql|sqlite|mongodb|memory
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nex

# Cluster (optional)
CLUSTER_NODES=w1:18789,w2:18789
```

---

## Testing

```bash
# Run all 40 tests
npm test

# Results:
# ✅ 40/40 tests passing
# 📊 100% success rate
# ⏱️ ~2.3 seconds total
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port already in use | `NEX_PORT=9000 npm run gateway` |
| Auth error | Login again: `npm run gateway` & use demo credentials |
| WebSocket not connecting | Check firewall, verify port 18790 |
| Tests failing | Rebuild: `tsc --noEmit` |

---

## File Guide

| File | Purpose | Lines |
|------|---------|-------|
| `nex-runtime.ts` | Core interpreter | 300 |
| `auth-manager.ts` | JWT/RBAC | 350 |
| `http-client.ts` | Real HTTP | 300 |
| `nex-gateway-v1.1.ts` | API gateway | 550 |
| `storage-adapter.ts` | Database abstraction | 400 |
| `websocket-server.ts` | Real-time streaming | 450 |
| `distributed-executor.ts` | Multi-machine execution | 550 |
| `agent-rewriter.ts` | Self-improvement | 600 |
| `nex-test-suite.ts` | 40 comprehensive tests | 1000 |

---

## Example: Complete Workflow

```bash
# 1. Start gateway
npm run gateway

# 2. Login
curl -X POST http://localhost:18789/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "demo@nex.local", "password": "demo-password"}'
# → Save token

# 3. Execute graph
curl -X POST http://localhost:18789/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "graph": {
      "nodes": [
        {"id": "n1", "kind": "goal", "data": {"work": "analysis"}},
        {"id": "n2", "kind": "agent", "data": {"role": "analyzer"}},
        {"id": "n3", "kind": "merge", "data": {"strategy": "synthesize"}},
        {"id": "guard", "kind": "guard", "data": {"condition": true, "consequence": "allow"}}
      ],
      "links": [
        {"from": "n1", "to": "n2", "type": "sync"},
        {"from": "n2", "to": "n3", "type": "sync"},
        {"from": "n3", "to": "guard", "type": "sync"}
      ],
      "entry": "n1"
    }
  }'

# 4. Check status
curl http://localhost:18789/status

# 5. View metrics (admin)
curl http://localhost:18789/metrics \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## Next: Full Documentation

→ Read `DEPLOYMENT_COMPLETE_v2.5.0.md` for comprehensive guide  
→ Read `CHANGELOG_COMPLETE.md` for detailed history  
→ Read `NEX_v2.5.0_COMPLETION_REPORT.md` for verification  

---

## Links

- **README.md** — Architecture overview
- **AGENTS.md** — Code style & guidelines
- **package.json** — Scripts & dependencies
- **tsconfig.json** — TypeScript configuration

---

**Nex v2.5.0 is production-ready. Happy computing! 🚀**

Àṣẹ — The force that makes all creation possible.
