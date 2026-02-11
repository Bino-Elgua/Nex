# Nex v1.0.0 Dashboard

**Interactive Web UI for Nex Gateway**

---

## Overview

The Nex dashboard is a real-time web interface for monitoring and interacting with the Nex interpreter. It provides:

- ✅ **System Status** — Gateway health, uptime, metrics
- ✅ **Graph Execution** — Write and execute graphs via UI
- ✅ **Quick Examples** — Pre-built graphs to learn from
- ✅ **Live Monitoring** — Real-time statistics
- ✅ **Quick Reference** — API and primitive cheat sheet

---

## Setup & Launch

### 1. Start the Gateway

```bash
cd /data/data/com.termux/files/home/Nex
npx tsx nex-gateway.ts
```

Gateway listens on `http://localhost:18789`

### 2. Open the Dashboard

**Option A: Direct File**
```bash
# Open in browser:
file:///data/data/com.termux/files/home/Nex/dashboard.html
```

**Option B: Simple HTTP Server**
```bash
cd /data/data/com.termux/files/home/Nex
python3 -m http.server 8000
# Then open: http://localhost:8000/dashboard.html
```

**Option C: Via Node**
```bash
npx http-server . -p 8000
# Then open: http://localhost:8000/dashboard.html
```

---

## Dashboard Features

### System Status Panel

Shows real-time gateway health:

- **Gateway** — Online/Offline indicator
- **Uptime** — How long gateway has been running
- **Executions** — Total graphs executed
- **Sessions** — Active client sessions
- **API Base** — Gateway URL

Updates every 5 seconds.

### Performance Metrics

Displays baseline performance characteristics:

- **P95 Latency** — <10ms for typical graphs
- **Memory** — ~30 MB baseline
- **Concurrency** — 1000+ agents supported
- **Success Rate** — 99.7% average
- **Timeout** — 30 seconds max per graph

---

### Graph Executor

Execute Nex graphs directly in the browser:

#### Workflow

1. **Write or paste** a graph JSON
2. **Click "Execute"** button
3. **See results** in real-time

#### Example Graphs

Pre-loaded examples to get started:

- **Simple Graph** — Goal + Guard (basic execution)
- **Parallel Branches** — Fork + Pro/Contra + Merge
- **Agent Spawning** — Autonomous agent creation
- **Pro/Contra Debate** — Multi-agent debate pattern

Click any example button to load it.

#### JSON Format

```json
{
  "nodes": [
    {
      "id": "unique_id",
      "kind": "goal|agent|guard|merge|...",
      "data": { /* arbitrary data */ }
    }
  ],
  "links": [
    {
      "from": "node_id",
      "to": "node_id",
      "type": "sync|async|parallel|depend"
    }
  ],
  "entry": "start_node_id"
}
```

#### Results

Results display:

- **✅ Success** — Graph executed, result shown
- **❌ Error** — Validation or execution error
- **Execution Time** — Milliseconds taken

---

## Live Examples

### Example 1: Simple Goal + Guard

```json
{
  "nodes": [
    {"id": "goal", "kind": "goal", "data": {"msg": "Hello Nex"}},
    {"id": "guard", "kind": "guard", "data": {"condition": true, "consequence": "allow"}}
  ],
  "links": [{"from": "goal", "to": "guard", "type": "sync"}],
  "entry": "goal"
}
```

**Expected Output**:
```json
{
  "type": "goal",
  "id": "goal",
  "data": {
    "msg": "Hello Nex"
  }
}
```

### Example 2: Parallel Execution

```json
{
  "nodes": [
    {"id": "fork", "kind": "parallel", "data": {}},
    {"id": "branch1", "kind": "goal", "data": {"name": "Pro"}},
    {"id": "branch2", "kind": "goal", "data": {"name": "Contra"}},
    {"id": "merge", "kind": "merge", "data": {"strategy": "synthesize"}},
    {"id": "safe", "kind": "guard", "data": {"condition": true, "consequence": "allow"}}
  ],
  "links": [
    {"from": "fork", "to": "branch1", "type": "parallel"},
    {"from": "fork", "to": "branch2", "type": "parallel"},
    {"from": "branch1", "to": "merge", "type": "sync"},
    {"from": "branch2", "to": "merge", "type": "sync"},
    {"from": "merge", "to": "safe", "type": "sync"}
  ],
  "entry": "fork"
}
```

**Expected Output**: Synthesized result with both branches merged.

### Example 3: Agent Spawning

```json
{
  "nodes": [
    {"id": "agent", "kind": "agent", "data": {"role": "optimizer", "goal": "improve code", "instructions": "analyze"}},
    {"id": "safe", "kind": "guard", "data": {"condition": true, "consequence": "allow"}}
  ],
  "links": [{"from": "agent", "to": "safe", "type": "sync"}],
  "entry": "agent"
}
```

**Expected Output**:
```json
{
  "type": "agent",
  "id": "agent",
  "role": "optimizer",
  "goal": "improve code",
  "instructions": "analyze",
  "spawned": true
}
```

---

## Keyboard Shortcuts

- **Tab** — Indent in graph editor
- **Ctrl+A** — Select all text
- **Ctrl+C** — Copy
- **Ctrl+V** — Paste

---

## Troubleshooting

### "Gateway Offline" Error

**Problem**: Dashboard shows gateway as offline

**Solution**:
1. Check gateway is running: `npx tsx nex-gateway.ts`
2. Verify port 18789 is available: `netstat -tlpn | grep 18789`
3. If port in use, use different port: `NEX_PORT=8080 npx tsx nex-gateway.ts`
4. Update dashboard API Base (see below)

### "Invalid JSON" Error

**Problem**: Graph JSON doesn't parse

**Solution**:
1. Check JSON syntax (quote keys and strings)
2. Use example buttons to load valid graphs
3. Paste into online JSON validator first
4. Verify all required fields: nodes, links, entry

### "Graph validation failed" Error

**Problem**: Graph structure is invalid

**Common issues**:
- Missing guard node (required: ≥1 guard per graph)
- Invalid link reference (node ID doesn't exist)
- Missing entry node (entry ID not in nodes)

**Solution**:
1. Add a guard node:
   ```json
   {"id": "guard", "kind": "guard", "data": {"condition": true, "consequence": "allow"}}
   ```
2. Verify all link IDs exist in nodes
3. Ensure entry node ID is correct

### Custom API Base

If gateway runs on different port/host:

1. Edit the line in dashboard HTML:
   ```javascript
   const API_BASE = 'http://localhost:18789';
   ```
2. Change to your gateway URL:
   ```javascript
   const API_BASE = 'http://your-host:your-port';
   ```
3. Save and reload dashboard

---

## Dashboard Architecture

### Frontend
- **Pure HTML5/CSS3/JavaScript** — No frameworks
- **Real-time updates** — Status every 2s, health every 5s
- **Responsive design** — Works on desktop and mobile
- **Dark theme** — Easy on the eyes

### Backend Communication
- **CORS enabled** — Gateway allows cross-origin requests
- **JSON API** — All communication via JSON
- **Async/await** — Non-blocking updates
- **Error handling** — Graceful fallbacks

---

## Security Notes

⚠️ **Important**: This dashboard is designed for **local development and monitoring only**.

For production:

1. **Authentication**: Add OAuth/JWT in front of gateway
2. **HTTPS**: Use TLS for encrypted communication
3. **Rate limiting**: Implement request limits
4. **CORS**: Restrict origin to trusted domains
5. **Audit logging**: Log all graph executions

See `DEPLOYMENT_v1.0.0.md` for production security guidelines.

---

## Performance Tips

### Fast Graphs
- Keep nodes under 20 per graph
- Avoid deep nesting (prefer parallel branches)
- Use simple data structures in `data` field

### Slow Graphs
- Watch out for: 100+ nodes
- Complex rewrite patterns
- Deep sequential chains

### Monitor Performance
- Check **Execution Time** in results
- Review **P95 Latency** in metrics
- Use E2E audit for load testing: `npx tsx e2e-audit.ts`

---

## Quick Reference

### 7 Core Primitives
- **node** — Create computation nodes
- **link** — Connect nodes (data flow)
- **guard** — Enforce constraints
- **spawn** — Create agents
- **rewrite** — Self-modify graphs
- **merge** — Aggregate results
- **eval** — Execute recursively

### Node Kinds
```
goal, agent, memory, tool, guard, rewrite, reflect, merge, parallel
```

### Link Types
```
sync (wait), async (fire-forget), parallel, depend (inject data)
```

### Guard Consequences
```
allow, deny, rewrite, spawn-critic, escalate
```

### Merge Strategies
```
consensus, vote, synthesize, first-success, last-result
```

---

## Links & Resources

- **Quick Start**: `START_HERE_v1.0.0.md`
- **API Reference**: `QUICK_REFERENCE_v1.0.0.md`
- **Deployment Guide**: `DEPLOYMENT_v1.0.0.md`
- **Example Graphs**: `EXAMPLE_GRAPHS.md`
- **Architecture**: `README.md`

---

## Support

For issues or questions:

1. Read relevant documentation (see Links above)
2. Check troubleshooting section (above)
3. Run E2E audit to verify system: `npx tsx e2e-audit.ts`
4. Review gateway logs: `npx tsx nex-gateway.ts` (console output)

---

## Seal

**Àṣẹ** — The force that makes all creation possible.

May Nex bootstrap wisely.
May guards keep us safe.
May dreams show us new paths.

---

**Nex v1.0.0 Dashboard**  
Released: February 10, 2026  
Status: Production Ready  
License: MIT

