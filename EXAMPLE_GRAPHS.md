# Nex Example Graphs

Collection of reference graphs demonstrating all 7 primitives and common patterns.

## 1. Simple Sequential Flow

**Use case**: Basic execution with guards

```json
{
  "nodes": [
    { "id": "start", "kind": "goal", "data": { "task": "greet" } },
    { "id": "guard1", "kind": "guard", "data": { "condition": true, "consequence": "allow" } }
  ],
  "links": [{ "from": "start", "to": "guard1", "type": "sync" }],
  "entry": "start"
}
```

**Execution**: start → guard1 (allow) → done

**Output**:
```json
{
  "type": "goal",
  "id": "start",
  "data": { "task": "greet" }
}
```

---

## 2. Guard Enforcement (Deny)

**Use case**: Prevent execution based on condition

```json
{
  "nodes": [
    { "id": "attempt", "kind": "goal", "data": { "action": "delete_all" } },
    { "id": "safety-guard", "kind": "guard", "data": { "condition": false, "consequence": "deny" } }
  ],
  "links": [{ "from": "attempt", "to": "safety-guard", "type": "sync" }],
  "entry": "attempt"
}
```

**Execution**: attempt → safety-guard (condition false, deny) → HALT

**Output**: Throws error "Guard 'safety-guard' denied execution"

---

## 3. Parallel Branching

**Use case**: Execute multiple paths in parallel, then merge

```json
{
  "nodes": [
    { "id": "start", "kind": "goal", "data": {} },
    { "id": "parallel", "kind": "parallel", "data": { "branches": 2 } },
    { "id": "path-a", "kind": "memory", "data": { "result": "A" } },
    { "id": "path-b", "kind": "memory", "data": { "result": "B" } },
    { "id": "merge", "kind": "merge", "data": { "strategy": "consensus" } },
    { "id": "guard", "kind": "guard", "data": { "condition": true, "consequence": "allow" } }
  ],
  "links": [
    { "from": "start", "to": "parallel", "type": "sync" },
    { "from": "parallel", "to": "path-a", "type": "parallel" },
    { "from": "parallel", "to": "path-b", "type": "parallel" },
    { "from": "path-a", "to": "merge", "type": "sync" },
    { "from": "path-b", "to": "merge", "type": "sync" },
    { "from": "merge", "to": "guard", "type": "sync" }
  ],
  "entry": "start"
}
```

**Execution**:
- start → parallel (branch A and B in parallel)
- path-a and path-b execute concurrently
- merge (consensus) aggregates results
- guard allows → done

**Output**:
```json
{
  "type": "merge",
  "strategy": "consensus",
  "merged": {
    "consensus": [
      { "type": "memory", "id": "path-a", "data": { "result": "A" } },
      { "type": "memory", "id": "path-b", "data": { "result": "B" } }
    ],
    "agreed": true
  }
}
```

---

## 4. Self-Modification (Rewrite)

**Use case**: Graph modifies itself during execution

```json
{
  "nodes": [
    { "id": "init", "kind": "goal", "data": { "version": "v0.1" } },
    {
      "id": "self-improve",
      "kind": "rewrite",
      "data": {
        "pattern": "version: v0.1",
        "replacement": "version: v0.2"
      }
    },
    { "id": "guard", "kind": "guard", "data": { "condition": true, "consequence": "allow" } }
  ],
  "links": [
    { "from": "init", "to": "self-improve", "type": "sync" },
    { "from": "self-improve", "to": "guard", "type": "sync" }
  ],
  "entry": "init"
}
```

**Execution**: init → self-improve (rewrite applied) → guard → done

**Output**:
```json
{
  "type": "rewrite",
  "id": "self-improve",
  "pattern": "version: v0.1",
  "replacement": "version: v0.2",
  "applied": true
}
```

---

## 5. Agent Spawning

**Use case**: Create and execute sub-agents

```json
{
  "nodes": [
    { "id": "parent", "kind": "goal", "data": { "task": "delegate" } },
    {
      "id": "spawn-worker",
      "kind": "agent",
      "data": {
        "role": "worker",
        "goal": "Process data",
        "instructions": "Read input, transform, return output"
      }
    },
    { "id": "guard", "kind": "guard", "data": { "condition": true, "consequence": "allow" } }
  ],
  "links": [
    { "from": "parent", "to": "spawn-worker", "type": "sync" },
    { "from": "spawn-worker", "to": "guard", "type": "sync" }
  ],
  "entry": "parent"
}
```

**Execution**: parent → spawn-worker (create agent) → guard → done

**Output**:
```json
{
  "type": "agent",
  "id": "spawn-worker",
  "role": "worker",
  "goal": "Process data",
  "instructions": "Read input, transform, return output",
  "spawned": true
}
```

---

## 6. Lateral Reasoning (Dream Node)

**Use case**: Break deadlock with creative thinking

```json
{
  "nodes": [
    { "id": "deadlock-check", "kind": "memory", "data": { "pro_weight": 0.50, "contra_weight": 0.50 } },
    {
      "id": "dream",
      "kind": "reflect",
      "data": {
        "trigger": "deadlock",
        "hypothesis": "What if we reframe the question?",
        "novel_perspective": "Success is phased: core by 2026, stdlib by 2027"
      }
    },
    { "id": "guard", "kind": "guard", "data": { "condition": true, "consequence": "allow" } }
  ],
  "links": [
    { "from": "deadlock-check", "to": "dream", "type": "sync" },
    { "from": "dream", "to": "guard", "type": "sync" }
  ],
  "entry": "deadlock-check"
}
```

**Execution**: deadlock-check → dream (lateral reasoning) → guard → done

**Output**:
```json
{
  "type": "reflect",
  "id": "dream",
  "reasoning": "Success is phased: core by 2026, stdlib by 2027"
}
```

---

## 7. Complex Debate Pattern (Bootstrap Template)

**Use case**: Pro/Contra debate with critic evaluation

```json
{
  "nodes": [
    {
      "id": "proposition",
      "kind": "goal",
      "data": { "question": "Can X be done?" }
    },
    {
      "id": "pro-agent",
      "kind": "agent",
      "data": {
        "role": "Pro Advocate",
        "goal": "Argue for yes",
        "claims": [
          { "claim": "Technology is mature", "confidence": 0.85 },
          { "claim": "Timeline is feasible", "confidence": 0.78 }
        ]
      }
    },
    {
      "id": "contra-agent",
      "kind": "agent",
      "data": {
        "role": "Contra Advocate",
        "goal": "Argue for no",
        "claims": [
          { "claim": "Timeline too aggressive", "confidence": 0.82 },
          { "claim": "Risk factors underestimated", "confidence": 0.76 }
        ]
      }
    },
    {
      "id": "critic",
      "kind": "agent",
      "data": {
        "role": "Truth Critic",
        "goal": "Evaluate logical consistency",
        "instructions": "Score each claim 0-1 for truth-density; flag below 0.75"
      }
    },
    {
      "id": "truth-guard",
      "kind": "guard",
      "data": {
        "condition": true,
        "consequence": "allow",
        "truth_density_threshold": 0.75
      }
    },
    {
      "id": "final-merge",
      "kind": "merge",
      "data": {
        "strategy": "synthesize",
        "inputs": ["pro-agent", "contra-agent", "critic"]
      }
    }
  ],
  "links": [
    { "from": "proposition", "to": "pro-agent", "type": "async" },
    { "from": "proposition", "to": "contra-agent", "type": "async" },
    { "from": "pro-agent", "to": "critic", "type": "sync" },
    { "from": "contra-agent", "to": "critic", "type": "sync" },
    { "from": "critic", "to": "truth-guard", "type": "sync" },
    { "from": "pro-agent", "to": "final-merge", "type": "sync" },
    { "from": "contra-agent", "to": "final-merge", "type": "sync" },
    { "from": "critic", "to": "final-merge", "type": "sync" }
  ],
  "entry": "proposition"
}
```

**Execution flow**:
1. proposition spawns pro-agent and contra-agent (in parallel)
2. Both agents generate claims with confidence scores
3. critic evaluates both (serial after agents complete)
4. truth-guard checks if all claims pass 0.75 threshold
5. final-merge synthesizes pro/contra/critic into unified recommendation

---

## 8. Error Handling with Rewrite

**Use case**: Fix invalid node and continue

```json
{
  "nodes": [
    { "id": "start", "kind": "goal", "data": { "value": 10 } },
    {
      "id": "invalid-transform",
      "kind": "tool",
      "data": { "operation": "unknown-op" }
    },
    {
      "id": "self-correct",
      "kind": "rewrite",
      "data": {
        "pattern": "operation: unknown-op",
        "replacement": "operation: identity"
      }
    },
    {
      "id": "safe-transform",
      "kind": "tool",
      "data": { "operation": "identity" }
    },
    { "id": "guard", "kind": "guard", "data": { "condition": true, "consequence": "allow" } }
  ],
  "links": [
    { "from": "start", "to": "invalid-transform", "type": "sync" },
    { "from": "invalid-transform", "to": "self-correct", "type": "depend" },
    { "from": "self-correct", "to": "safe-transform", "type": "sync" },
    { "from": "safe-transform", "to": "guard", "type": "sync" }
  ],
  "entry": "start"
}
```

**Execution**:
1. start → invalid-transform (operation unknown)
2. self-correct (rewrite) fixes the operation
3. safe-transform executes with corrected operation
4. guard allows → done

---

## 9. Async Fire-and-Forget

**Use case**: Trigger action without waiting for result

```json
{
  "nodes": [
    { "id": "main", "kind": "goal", "data": { "primary": true } },
    { "id": "background", "kind": "tool", "data": { "name": "log-event" } },
    { "id": "continue", "kind": "memory", "data": { "status": "moving-on" } },
    { "id": "guard", "kind": "guard", "data": { "condition": true, "consequence": "allow" } }
  ],
  "links": [
    { "from": "main", "to": "background", "type": "async" },
    { "from": "main", "to": "continue", "type": "sync" },
    { "from": "continue", "to": "guard", "type": "sync" }
  ],
  "entry": "main"
}
```

**Execution**: main → spawn background (async) + continue (sync) → guard → done

---

## 10. Data Dependency (Depend)

**Use case**: Chain results explicitly

```json
{
  "nodes": [
    { "id": "fetch", "kind": "tool", "data": { "action": "get", "url": "/data" } },
    { "id": "process", "kind": "tool", "data": { "action": "transform", "input": "from-fetch" } },
    { "id": "store", "kind": "memory", "data": { "value": "from-process" } },
    { "id": "guard", "kind": "guard", "data": { "condition": true, "consequence": "allow" } }
  ],
  "links": [
    { "from": "fetch", "to": "process", "type": "depend" },
    { "from": "process", "to": "store", "type": "depend" },
    { "from": "store", "to": "guard", "type": "sync" }
  ],
  "entry": "fetch"
}
```

**Execution**: fetch result → injected into process → process result → injected into store → guard

---

## Running These Examples

```bash
# Save example graph to file
cat > example-simple.json << 'EOF'
{
  "nodes": [
    { "id": "start", "kind": "goal", "data": { "task": "greet" } },
    { "id": "guard1", "kind": "guard", "data": { "condition": true, "consequence": "allow" } }
  ],
  "links": [{ "from": "start", "to": "guard1", "type": "sync" }],
  "entry": "start"
}
EOF

# Create executor script
cat > run-example.ts << 'EOF'
import { readFileSync } from "fs";
import { NexInterpreter, NexGraph } from "./nex-runtime";

const graphPath = process.argv[2] || "example-simple.json";
const graph: NexGraph = JSON.parse(readFileSync(graphPath, "utf-8"));
const interpreter = new NexInterpreter(graph);
const result = await interpreter.execute();
console.log(JSON.stringify(result, null, 2));
EOF

# Run
bun run-example.ts example-simple.json
```

---

## Seal

Each graph is a complete thought. Each node a step. Each link a path. Together, they compose the symphony of agent reasoning.

**Àṣẹ**
