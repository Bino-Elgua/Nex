# Guard Conflict Resolution — Formal Framework

## Problem Statement

When multiple guard nodes in a Nex graph produce contradictory verdicts (one allows, one denies), the system must deterministically resolve the conflict. This document formalizes the resolution algorithm.

## Definitions

**Guard Node**: A node with kind="guard" that enforces a constraint via condition → consequence mapping.

```json
{
  "id": "guard-x",
  "kind": "guard",
  "data": {
    "condition": "predicate or boolean",
    "consequence": "allow | deny | rewrite | spawn-critic | escalate"
  }
}
```

**Guard Conflict**: Two or more guards are reached in the same execution path and emit contradictory consequences:
- Guard A: consequence = "allow"
- Guard B: consequence = "deny"

**Precedence Hierarchy** (when conflict occurs):
1. Deny > Allow (safety-first principle)
2. Escalate > Spawn-Critic (escalation indicates severity)
3. Rewrite > Spawn-Critic (self-correction preferred)

## Resolution Algorithm

### Phase 1: Detection

```typescript
function detectConflict(guards: Guard[]): Conflict | null {
  const verdicts = guards.map(g => g.consequence);
  const has_allow = verdicts.includes("allow");
  const has_deny = verdicts.includes("deny");
  
  if (has_allow && has_deny) {
    return {
      type: "allow_vs_deny",
      guards: guards,
      severity: "HIGH"
    };
  }
  
  const has_escalate = verdicts.includes("escalate");
  const has_spawn_critic = verdicts.includes("spawn-critic");
  
  if (has_escalate && has_spawn_critic) {
    return {
      type: "escalate_vs_spawn_critic",
      guards: guards,
      severity: "MEDIUM"
    };
  }
  
  return null;
}
```

### Phase 2: Precedence-Based Resolution

**Case 1: Allow vs. Deny**

```
Rule: DENY wins (safety-first)
Consequence: Deny execution; flag for human review
Remedy: Spawn "reflect" node to diagnose why guards contradicted
```

**Case 2: Escalate vs. Spawn-Critic**

```
Rule: ESCALATE wins (severity indicates system risk)
Consequence: Halt and escalate to system administrator
Remedy: Log full graph context + all guard decisions
```

**Case 3: Rewrite vs. Spawn-Critic**

```
Rule: REWRITE wins (prefer self-correction)
Consequence: Apply rewrite to resolve contradiction
Remedy: After rewrite, re-evaluate guards in modified graph
```

### Phase 3: Merge Strategy for Conflicted Guards

When guards conflict in a parallel branch:

```json
{
  "id": "merge-after-conflict",
  "kind": "merge",
  "data": {
    "strategy": "conflict-aware",
    "conflict_resolution": {
      "rule": "If any branch guard denies, merge result is deny",
      "evidence_weight": "Each guard's confidence score (0-1) weighted into final verdict"
    }
  }
}
```

## Example: Practical Conflict

### Scenario

```json
{
  "nodes": [
    {
      "id": "guard-auth",
      "kind": "guard",
      "data": {
        "condition": "user.role == 'admin'",
        "consequence": "allow"
      }
    },
    {
      "id": "guard-rate-limit",
      "kind": "guard",
      "data": {
        "condition": "request.rate_limit_remaining > 0",
        "consequence": "deny"
      }
    }
  ],
  "links": [
    {"from": "entry", "to": "guard-auth", "type": "sync"},
    {"from": "entry", "to": "guard-rate-limit", "type": "parallel"},
    {"from": "guard-auth", "to": "merge-verdicts", "type": "sync"},
    {"from": "guard-rate-limit", "to": "merge-verdicts", "type": "sync"}
  ]
}
```

**Resolution**:
1. Guard-auth: user is admin → ALLOW
2. Guard-rate-limit: rate limit exhausted → DENY
3. Conflict detected: ALLOW vs. DENY
4. Rule applied: DENY wins (safety-first)
5. Execution halted; reflect node spawned to diagnose
6. Reflect output: "Rate limit exceeded for admin user; escalate to system or queue for later"

## Truth-Density Scoring for Guards

Each guard can be annotated with a **truth-density** score (0-1) indicating confidence in its condition:

```json
{
  "id": "guard-with-confidence",
  "kind": "guard",
  "data": {
    "condition": "...",
    "consequence": "...",
    "truth_density": 0.85,
    "evidence": "Validated against 1000 test cases"
  }
}
```

When conflicts occur, the guard with higher truth-density wins (breaking ties):

```typescript
function resolveByTruthDensity(guards: Guard[]): Guard {
  return guards.reduce((prev, curr) => {
    const prevDensity = prev.data.truth_density ?? 0.5;
    const currDensity = curr.data.truth_density ?? 0.5;
    return currDensity > prevDensity ? curr : prev;
  });
}
```

## Prevention: Guard Design Best Practices

1. **Avoid Overlapping Conditions**: Design guards so their conditions don't contradict
   
   ❌ Bad:
   ```json
   { "condition": "user.role == 'admin'" },
   { "condition": "user.role != 'admin'" }
   ```
   
   ✓ Good:
   ```json
   { "condition": "user.role == 'admin'", "consequence": "allow" },
   { "condition": "user.role == 'guest' && rate_limit_ok", "consequence": "allow" },
   { "condition": "user.role == 'guest' && !rate_limit_ok", "consequence": "deny" }
   ```

2. **Explicit Guard Order**: Use sync links to establish guard precedence
   
   ```json
   { "from": "guard-auth", "to": "guard-rate-limit", "type": "sync" }
   ```
   This ensures auth check happens before rate-limiting.

3. **High Truth-Density**: Ensure all conditions are well-tested
   - Annotate with evidence
   - Run empirical validation
   - Aim for truth-density > 0.85

## Formal Properties

**Theorem 1: Termination**
If every guard has a deterministic condition (no infinite loops in evaluation), guard conflict resolution terminates in O(n) time where n = number of guards.

**Theorem 2: Safety**
Under the "DENY wins" rule, if any guard correctly detects a violation, execution will halt (no unsafe execution slips through).

**Theorem 3: Liveness**
If all guards pass (no conflict), execution proceeds (not deadlocked).

## Testing

Run conflict detection tests:

```bash
bun test guard-conflicts.test.ts
```

Test suite covers:
- [ ] allow_vs_deny resolution
- [ ] escalate_vs_spawn_critic resolution
- [ ] truth_density tie-breaking
- [ ] merge after conflict convergence
- [ ] reflect node generation on conflict
- [ ] 1000+ random conflict scenarios

## Future Work

1. **Consensus-Based Resolution**: Allow multiple guards to vote (majority wins)
2. **Weighted Truth-Density**: Propagate confidence scores through merge nodes
3. **Formal Verification**: Prove safety properties via SMT solver
4. **Automated Guard Simplification**: Remove redundant/conflicting guards

---

## Seal

Ògún — Iron discipline, cutting false paths, strength through boundaries.

This framework ensures Nex guards remain coherent, safe, and predictable.
