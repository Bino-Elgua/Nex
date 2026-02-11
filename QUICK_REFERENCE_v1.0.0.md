# Nex v1.0.0 Quick Reference

**Version**: 1.0.0  
**Status**: Production Ready ✅  
**Released**: February 10, 2026  

---

## 60-Second Overview

Nex is an **agent-native programming language runtime** where computation is represented as immutable JSON graphs. Agents can read, understand, modify, and execute graphs autonomously—the foundation for self-sustaining AI systems.

```json
{
  "nodes": [
    {"id": "goal", "kind": "goal", "data": {}},
    {"id": "safe", "kind": "guard", "data": {"condition": true, "consequence": "allow"}}
  ],
  "links": [{"from": "goal", "to": "safe", "type": "sync"}],
  "entry": "goal"
}
```

That's a valid Nex graph. Execute it via the gateway.

---

## Getting Started

### 1. Install & Start

```bash
cd Nex
npm install
npx tsx nex-gateway.ts
```

Gateway runs on **http://localhost:18789**

### 2. Check Health

```bash
curl http://localhost:18789/health
# {"ok": true}
```

### 3. Execute a Graph

```bash
curl -X POST http://localhost:18789/execute \
  -H "Content-Type: application/json" \
  -d '{
    "graph": {
      "nodes": [
        {"id": "n1", "kind": "goal", "data": {"x": 1}},
        {"id": "n2", "kind": "guard", "data": {"condition": true, "consequence": "allow"}}
      ],
      "links": [{"from": "n1", "to": "n2", "type": "sync"}],
      "entry": "n1"
    }
  }'
```

Done. That's the basics.

---

## Core Concepts (5 Minutes)

### 1. Graphs Are Data

A Nex graph is pure JSON:

```json
{
  "nodes": [...],      // Array of NexNode objects
  "links": [...],      // Array of NexLink objects
  "entry": "id"        // Start node ID
}
```

### 2. 7 Immutable Primitives

| Primitive | What It Does |
|-----------|--------------|
| **node** | Create a computation node |
| **link** | Connect nodes (data flow) |
| **guard** | Enforce constraints (allow/deny) |
| **spawn** | Create a new agent |
| **rewrite** | Modify graph structure |
| **merge** | Combine parallel results |
| **eval** | Execute a node |

### 3. Node Kinds

```
goal       — Statement of intent
agent      — Spawned agent instance
memory     — Store state
tool       — External action
guard      — Enforce constraints
rewrite    — Self-modification
reflect    — Lateral reasoning (dreams)
merge      — Aggregate branches
parallel   — Branch marker
```

### 4. Link Types

```
sync       — Wait for predecessor, use result
async      — Fire-and-forget
parallel   — Explicit parallelism
depend     — Data dependency injection
```

### 5. Guard Consequences

```
allow            — Let execution proceed
deny             — Block execution
rewrite          — Modify the graph
spawn-critic     — Create evaluator agent
escalate         — Raise to higher level
```

### 6. Merge Strategies

```
consensus        — All results agree
vote             — Majority wins
synthesize       — Combine perspectives
first-success    — First non-null result
last-result      — Final result
```

### 7. Safety Rules

```
✅ Every graph needs ≥1 guard node
✅ Entry node must exist
✅ All links must reference real nodes
✅ Node IDs must be unique
✅ Link types must be valid (sync|async|parallel|depend)
✅ Guard consequences must be valid
```

---

## API Reference (3 Endpoints)

### GET /health

**Purpose**: Health check  
**Response**: `{"ok": true}`

```bash
curl http://localhost:18789/health
```

### GET /status

**Purpose**: Gateway metrics  
**Response**:

```json
{
  "gateway": "Nex v1.0",
  "uptime": 5000,
  "executions": 42,
  "sessions": 3,
  "timestamp": 1707570000000
}
```

```bash
curl http://localhost:18789/status
```

### POST /execute

**Purpose**: Execute a graph  
**Request**:

```json
{
  "graph": {
    "nodes": [...],
    "links": [...],
    "entry": "id"
  }
}
```

**Response**:

```json
{
  "status": "success|error",
  "result": {},
  "executionMs": 2,
  "timestamp": 1707570000000,
  "error": "message if status=error"
}
```

```bash
curl -X POST http://localhost:18789/execute \
  -H "Content-Type: application/json" \
  -d '{"graph": {...}}'
```

---

## Example Patterns

### Pattern 1: Simple Goal + Guard

```json
{
  "nodes": [
    {"id": "goal", "kind": "goal", "data": {"msg": "Hello"}},
    {"id": "guard", "kind": "guard", "data": {"condition": true, "consequence": "allow"}}
  ],
  "links": [{"from": "goal", "to": "guard", "type": "sync"}],
  "entry": "goal"
}
```

**What happens**: Goal executes → Guard evaluates condition (true) → Allows → Done

### Pattern 2: Spawn an Agent

```json
{
  "nodes": [
    {"id": "spawn_node", "kind": "agent", "data": {"role": "optimizer", "goal": "improve code", "instructions": "..."}},
    {"id": "safe", "kind": "guard", "data": {"condition": true, "consequence": "allow"}}
  ],
  "links": [{"from": "spawn_node", "to": "safe", "type": "sync"}],
  "entry": "spawn_node"
}
```

**What happens**: Agent spawned with role/goal → Executes its instructions → Guard validates → Done

### Pattern 3: Parallel Branches + Merge

```json
{
  "nodes": [
    {"id": "fork", "kind": "parallel", "data": {}},
    {"id": "branch1", "kind": "goal", "data": {"name": "pro"}},
    {"id": "branch2", "kind": "goal", "data": {"name": "contra"}},
    {"id": "merge_node", "kind": "merge", "data": {"strategy": "synthesize"}},
    {"id": "safe", "kind": "guard", "data": {"condition": true, "consequence": "allow"}}
  ],
  "links": [
    {"from": "fork", "to": "branch1", "type": "parallel"},
    {"from": "fork", "to": "branch2", "type": "parallel"},
    {"from": "branch1", "to": "merge_node", "type": "sync"},
    {"from": "branch2", "to": "merge_node", "type": "sync"},
    {"from": "merge_node", "to": "safe", "type": "sync"}
  ],
  "entry": "fork"
}
```

**What happens**: Fork → Run branch1 & branch2 simultaneously → Merge results (synthesize) → Guard → Done

### Pattern 4: Guard Conflict (Guard Wins)

```json
{
  "nodes": [
    {"id": "goal", "kind": "goal", "data": {}},
    {"id": "allow_guard", "kind": "guard", "data": {"condition": true, "consequence": "allow"}},
    {"id": "deny_guard", "kind": "guard", "data": {"condition": true, "consequence": "deny"}}
  ],
  "links": [
    {"from": "goal", "to": "allow_guard", "type": "sync"},
    {"from": "allow_guard", "to": "deny_guard", "type": "sync"}
  ],
  "entry": "goal"
}
```

**What happens**: Goal → ALLOW guard passes → DENY guard blocks → Error (Deny > Allow in precedence)

### Pattern 5: Rewrite (Self-Modify)

```json
{
  "nodes": [
    {"id": "original", "kind": "goal", "data": {"value": 1}},
    {"id": "rewrite_node", "kind": "rewrite", "data": {"pattern": "value: 1", "replacement": "value: 2"}},
    {"id": "safe", "kind": "guard", "data": {"condition": true, "consequence": "allow"}}
  ],
  "links": [
    {"from": "original", "to": "rewrite_node", "type": "sync"},
    {"from": "rewrite_node", "to": "safe", "type": "sync"}
  ],
  "entry": "original"
}
```

**What happens**: Execute goal → Apply rewrite (transform graph) → Guard → Done

---

## Production Features

### Circuit Breaker
- Automatic failover after 5 consecutive failures
- State: CLOSED (normal) → OPEN (too many errors) → HALF-OPEN (testing recovery)
- Auto-recovery after 60s

### Timeout
- 30-second limit per graph execution
- Prevents runaway computation
- Logged as error, graceful failure

### Memory Limits
- 256 MB heap usage cap per request
- Prevents out-of-memory crashes
- Tracked per execution

### Metrics
- Execution time, memory, node count, errors
- Available via `/status` endpoint
- Powers monitoring dashboards

### Health Checks
- `/health` — Immediate response
- `/status` — Detailed metrics
- Circuit breaker status included

---

## Standard Library (39 Functions)

### Tier 1 (Core, 7 functions)
```
list/map, list/filter, list/fold
logic/and, logic/or
memory/cache
control/if-then-else
```

### Tier 2 (Utilities, 17 functions)
```
string: concat, split, uppercase, lowercase
math: add, subtract, multiply, divide, modulo
dict: get, set, keys, values
error: try-catch, throw
time: now, sleep
```

### Tier 3 (Domain, 15 functions)
```
http: get, post, request
json: parse, stringify, validate
graph: validate, execute, merge, rewrite
agent: spawn, eval, list
debate: pro-contra, critic-evaluate, synthesize
```

All functions include confidence scores (0-1 scale, avg 0.91).

---

## Formal Proofs (All Proven QED)

1. **Guard Conflict Safety** — Deny guard always wins
2. **Rewrite Convergence** — Terminates in finite steps
3. **Multi-Agent Fairness** — No starvation in FIFO dispatcher
4. **Dream Convergence** — Deadlocks broken in bounded iterations
5. **Zero-Human-Code Bootstrap** — Agents can rewrite the interpreter

See docs for full proofs.

---

## Files You'll Need

| File | Purpose |
|------|---------|
| `nex-gateway.ts` | HTTP server (start here) |
| `nex-runtime.ts` | Core interpreter |
| `v1.0.0-production.ts` | Safety wrapper |
| `self-bootstrap-validator.ts` | 5-stage bootstrap proof |
| `DEPLOYMENT_v1.0.0.md` | Production checklist |
| `RELEASE_v1.0.0.md` | Full release notes |
| `EXAMPLE_GRAPHS.md` | 10 copy-paste patterns |

---

## Troubleshooting

### Port Already in Use
```bash
# Kill existing process
lsof -i :18789
kill -9 <PID>

# Or use different port
NEX_PORT=8080 npx tsx nex-gateway.ts
```

### Graph Validation Failed
```
Missing guard node?       → Add {"id": "g", "kind": "guard", ...}
Invalid link reference?   → Verify from/to node IDs exist
Entry node missing?       → Check "entry" field
```

### Timeout (>30s)
- Graph too complex?
- Too many nodes/links?
- Reduce parallelism or break into smaller graphs

### Circuit Breaker Open
- Too many failures (5+ consecutive)
- Auto-recovery: wait 60s, system tests recovery
- Manual: restart gateway

### Memory Issues
- Graph too large?
- Too many agents?
- Each request capped at 256 MB

---

## Performance Targets

| Operation | Target | Actual |
|-----------|--------|--------|
| Simple graph | <5ms | 1-5ms ✅ |
| Medium graph | <20ms | 5-20ms ✅ |
| Complex graph | <50ms | 10-50ms ✅ |
| 1000+ agents | <10s | 5s ✅ |
| Memory per request | <256MB | ~30-100MB ✅ |

---

## Common Commands

```bash
# Start gateway
npx tsx nex-gateway.ts

# Run tests
npm test

# Type check
tsc --noEmit

# Run bootstrap validator
npx tsx self-bootstrap-validator.ts

# Run bootstrap debate
npx tsx bootstrap.ts
```

---

## Key Facts

- **7 immutable primitives** (locked until 7-way consensus)
- **39 stdlib functions** (all tested, avg confidence 0.91)
- **5 formal proofs** (all with QED)
- **3 HTTP endpoints** (/health, /status, /execute)
- **Production hardened** (circuit breaker, timeout, memory)
- **Fully documented** (15+ files, 5000+ lines)
- **Ready to deploy** (Docker, Kubernetes, bare metal)

---

## Philosophy

Nex is built on:

1. **Hermetic Principles** — 7 universal laws (Mentalism, Correspondence, Polarity, etc.)
2. **Yoruba Cosmology** — 7 Orishas (Ọbàtálá, Èṣù, Ògún, Ọ̀ṣun, Ọya, Yemọja, Ṣàngó)
3. **Agent-Native Computing** — Agents write the code, not humans
4. **Graph-Based Computation** — Data = Code = Graphs

Every primitive maps to a principle + an Orisha. This grounding ensures coherence across 100+ years of development.

---

## Vision

**2026 Goal**: Zero-human-code bootstrap complete. Agents will:

1. Read the Nex interpreter
2. Understand its architecture
3. Design improvements
4. Rewrite the source code
5. Validate the new version
6. Spawn better agents to continue

No human code commits after that. Pure agent autonomy.

---

## Seal

```
Àṣẹ.
```

The force that makes all creation possible.

May Nex bootstrap wisely.
May guards keep us safe.
May dreams show us new paths.

---

**Need more?** Read the full docs:
- **DEPLOYMENT_v1.0.0.md** — Production setup
- **RELEASE_v1.0.0.md** — Full release notes
- **EXAMPLE_GRAPHS.md** — 10 patterns to copy
- **STDLIB_SPECIFICATION.md** — All 39 functions

**Ready to start?**
```bash
cd Nex && npm install && npx tsx nex-gateway.ts
```

That's it. Welcome to Nex.

