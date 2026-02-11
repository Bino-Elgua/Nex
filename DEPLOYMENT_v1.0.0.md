# Nex v1.0.0 Deployment Guide

## Production Readiness Checklist

### Pre-Deployment

- [ ] **Code Review**: All changes reviewed and tested
- [ ] **Tests Pass**: `npm test` runs with 100% pass rate
- [ ] **Type Safety**: `tsc --noEmit` shows zero errors
- [ ] **Dependencies**: `npm audit` shows no critical vulnerabilities
- [ ] **Documentation**: All docs updated for v1.0.0
- [ ] **Changelog**: CHANGELOG.md reflects all changes

### Deployment Steps

#### 1. Install & Build

```bash
cd /data/data/com.termux/files/home/Nex

# Install dependencies (using npm, bun, or pnpm)
npm install

# Type check
tsc --noEmit

# Run tests
npm test
```

#### 2. Start Gateway Server

```bash
# Method 1: Using tsx
npx tsx nex-gateway.ts

# Method 2: Using Node directly (after build)
npm run build
node dist/nex-gateway.js

# Expected output:
# ═══════════════════════════════════════════════════════════════
#   Nex Gateway v1.0 — Graph Execution Server
# ═══════════════════════════════════════════════════════════════
#
# 🚀 Gateway running on http://localhost:18789
# ⏰ Started: 2026-02-10T12:34:56.789Z
```

#### 3. Verify Health

```bash
# Health check
curl http://localhost:18789/health

# Expected response:
# {"ok": true}

# Status check
curl http://localhost:18789/status

# Expected response:
# {
#   "gateway": "Nex v1.0",
#   "uptime": 1234,
#   "executions": 0,
#   "sessions": 0,
#   "timestamp": 1707570896789
# }
```

#### 4. Test Graph Execution

```bash
curl -X POST http://localhost:18789/execute \
  -H "Content-Type: application/json" \
  -d '{
    "graph": {
      "nodes": [
        {"id": "start", "kind": "goal", "data": {"msg": "test"}},
        {"id": "safe", "kind": "guard", "data": {"condition": true, "consequence": "allow"}}
      ],
      "links": [{"from": "start", "to": "safe", "type": "sync"}],
      "entry": "start"
    }
  }'

# Expected response:
# {
#   "status": "success",
#   "result": {"type": "goal", "id": "start", "data": {"msg": "test"}},
#   "executionMs": 2,
#   "timestamp": 1707570896789
# }
```

### Environment Configuration

#### Port Configuration

**Default**: `18789`

To use different port, modify `nex-gateway.ts`:

```typescript
async function main() {
  const port = process.env.NEX_PORT ? parseInt(process.env.NEX_PORT) : 18789;
  const gateway = new NexGateway(port);
  gateway.start();
}
```

Then start with:

```bash
NEX_PORT=8080 npx tsx nex-gateway.ts
```

#### Resource Limits

Edit `v1.0.0-production.ts` to adjust:

```typescript
class ProductionNexInterpreter {
  private readonly TIMEOUT_MS = 30000;           // Max execution time
  private readonly MAX_FAILURES = 5;             // Circuit breaker threshold
  private readonly FAILURE_RESET_MS = 60000;    // Recovery test interval
  private readonly MAX_MEMORY_MB = 256;          // Memory limit
  private readonly CACHE_TTL_MS = 300000;       // 5-minute cache
}
```

### Production Safety Patterns

#### Pattern 1: Graceful Degradation

When circuit breaker opens (too many failures):

```
Request → ProductionNexInterpreter.executeWithSafety()
         → Circuit breaker OPEN? Return error
         → Auto-retry after 60s (FAILURE_RESET_MS)
         → Monitoring logs alert
```

#### Pattern 2: Timeout Protection

Long-running graphs don't hang gateway:

```
Request → setTimeout(30000ms) ← TIMEOUT_MS
         → Execution completes? Clear timeout
         → Timeout fires? Reject + log error
```

#### Pattern 3: Memory Management

Track heap usage per execution:

```
Before: process.memoryUsage().heapUsed
Execute: NexInterpreter.execute()
After: process.memoryUsage().heapUsed
Metrics: Stored in ExecutionMetrics[]
```

### Monitoring & Observability

#### Metrics to Track

1. **Execution Performance**
   - Average execution time per graph
   - P95, P99 latencies
   - Success vs failure rate

2. **Resource Usage**
   - Heap memory consumption
   - Execution timeout incidents
   - Circuit breaker state changes

3. **Availability**
   - Gateway uptime
   - Health check success rate
   - Request throughput

#### Log Levels

```
[ERROR]  Circuit breaker OPEN, guard denied execution, graph validation failed
[ALERT]  Circuit breaker state changes, memory threshold exceeded
[HEALTH] Circuit breaker recovered, startup complete
[INFO]   Request received, execution completed
```

### Health Check Integration

#### Kubernetes Probe

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nex-gateway
spec:
  containers:
  - name: gateway
    image: nex:v1.0.0
    ports:
    - containerPort: 18789
    livenessProbe:
      httpGet:
        path: /health
        port: 18789
      initialDelaySeconds: 5
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /status
        port: 18789
      initialDelaySeconds: 5
      periodSeconds: 5
```

#### Docker Deployment

```dockerfile
FROM node:20-alpine

WORKDIR /nex

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx tsc --outDir dist

EXPOSE 18789

CMD ["node", "dist/nex-gateway.js"]

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:18789/health || exit 1
```

Build and run:

```bash
docker build -t nex:v1.0.0 .
docker run -p 18789:18789 nex:v1.0.0
```

### Scaling Recommendations

#### Single Server

**Resources**: 2+ CPU cores, 512 MB RAM minimum

**Config**: Default settings (30s timeout, 256 MB memory)

**Throughput**: ~100-1000 graphs/second (depends on complexity)

#### Multi-Server (Load Balanced)

**Setup**: Nginx/HAProxy → 3+ Nex Gateway instances

```nginx
upstream nex {
  server localhost:18789;
  server localhost:18790;
  server localhost:18791;
}

server {
  listen 80;
  location / {
    proxy_pass http://nex;
  }
}
```

**Resources**: Same per instance

**Throughput**: Scales linearly with instances

#### Distributed (Multi-Region)

**Setup**: Global load balancer → Regional clusters

**Considerations**:
- Graph state is local (no persistence yet; for v2.0)
- Circuit breakers are per-instance
- Metrics aggregation via monitoring system

### Troubleshooting

#### Gateway Won't Start

```bash
# Check port availability
lsof -i :18789

# Check permissions
netstat -tulpn | grep 18789

# Kill existing process
kill -9 $(lsof -t -i :18789)

# Retry with verbose output
DEBUG=* npx tsx nex-gateway.ts
```

#### High Latency

1. Check graph complexity (node count, rewrite depth)
2. Monitor memory usage (heap growth?)
3. Check for circuit breaker open state
4. Review system resources (CPU, I/O)

#### Circuit Breaker Stuck Open

Automatic recovery: Waits 60s (FAILURE_RESET_MS), then tests with half-open state.

Manual recovery:

```bash
# Restart gateway
npx tsx nex-gateway.ts
```

#### Memory Leaks

Monitor heap with:

```bash
# Continuous memory monitoring
node --inspect nex-gateway.js
# Then open chrome://inspect for profiling
```

#### Validation Errors

Common issues:

| Error | Solution |
|-------|----------|
| Missing guard node | Add ≥1 guard node to graph |
| Invalid link reference | Verify all link from/to IDs exist |
| Unknown node kind | Use valid kind: goal\|agent\|memory\|tool\|guard\|rewrite\|reflect\|merge\|parallel |
| Entry node not found | Verify entry ID matches a node ID |

### Rollback Plan

If v1.0.0 has issues:

```bash
# Switch back to v0.5.0
git checkout v0.5.0
npm install
npx tsx nex-gateway.ts
```

(v1.0.0 is backward compatible; this should be unnecessary)

### Performance Baseline

Expected metrics on modern hardware:

| Operation | Time | Notes |
|-----------|------|-------|
| Graph validation | <1ms | Per graph |
| Simple execution (5 nodes) | 1-5ms | Goal + guard |
| Bootstrap debate (13 nodes) | 2-3ms | Multiple agents |
| Complex graph (100+ nodes) | 10-50ms | Parallel execution |
| Timeout (if exceeded) | 30000ms | Triggers failure |

### Upgrade Path

From v0.5.0 → v1.0.0:

1. **No code changes required** (backward compatible)
2. **Optional**: Wrap execution in `ProductionNexInterpreter` for new safety features
3. **Recommended**: Update monitoring to track new metrics

Existing graphs execute unchanged.

### Support & Escalation

**Issue Types**:
- **Bugs**: File issue on GitHub
- **Performance**: Collect metrics, circuit breaker logs
- **Architecture**: Check GUARD_CONFLICT_RESOLUTION.md, DREAM_NODES_AND_LATERAL_REASONING.md

**Contact**: nex@example.com (placeholder; will be replaced)

---

## Release Gates

### Go/No-Go Criteria

✅ **Must have**:
- Core interpreter tested
- Gateway operational
- Health checks passing
- Documentation complete

✅ **Should have**:
- Production hardening in place
- Metrics collection working
- Deployment tested

✅ **Nice to have**:
- Kubernetes manifests ready
- Docker image built
- Monitoring dashboards

### Sign-Off

- [ ] **Engineering**: Code ready, tests pass
- [ ] **QA**: Deployment tested, performance validated
- [ ] **DevOps**: Infrastructure ready, monitoring configured
- [ ] **Product**: Documentation complete, release notes approved

---

**Release Date**: 2026-02-10  
**Version**: v1.0.0  
**Status**: Production Ready ✅  
**Support**: Maintained until v1.1.0 release
