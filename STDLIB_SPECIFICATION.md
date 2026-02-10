# Nex Standard Library (stdlib) Specification

## Overview

The Nex standard library comprises spawned agents that provide canonical implementations of common operations, patterns, and utilities. Unlike traditional imperative libraries, Nex stdlib is **agent-native**: each function is a graph that agents can understand, modify, and improve.

## Design Principles

1. **Agent-Readable**: All stdlib functions are human-readable JSON graphs
2. **Self-Documenting**: Each function includes claims, evidence, and truth-density scores
3. **Self-Improving**: Agents can rewrite stdlib functions via rewrite nodes
4. **Formal**: Each stdlib function has a specification, proof sketch, and test suite
5. **Layered**: Core → Utilities → Domain (can be built incrementally)

## Tier 1: Core (Q1 2025)

### 1.1 list/map

**Purpose**: Apply transformation to each element in a collection

**Graph Sketch**:
```json
{
  "id": "stdlib.list.map",
  "kind": "agent",
  "data": {
    "signature": "map(collection: Array, transformer: Agent) -> Array",
    "claims": [
      { "claim": "Applies transformer to each element", "confidence": 0.95 },
      { "claim": "Preserves order", "confidence": 0.98 },
      { "claim": "Handles empty collections", "confidence": 0.92 }
    ],
    "implementation": "Spawn parallel agents for each element; merge results with order-preserve strategy"
  }
}
```

**Test Case**:
```json
{
  "id": "test-map",
  "input": { "collection": [1, 2, 3], "transformer": "double" },
  "expected": [2, 4, 6]
}
```

---

### 1.2 list/filter

**Purpose**: Keep elements matching a predicate

**Graph Sketch**:
```json
{
  "id": "stdlib.list.filter",
  "kind": "agent",
  "data": {
    "signature": "filter(collection: Array, predicate: Agent) -> Array",
    "claims": [
      { "claim": "Filters by predicate", "confidence": 0.93 },
      { "claim": "Preserves order of remaining", "confidence": 0.96 }
    ],
    "implementation": "Spawn parallel agents; merge keeping only those where predicate passes"
  }
}
```

---

### 1.3 list/fold

**Purpose**: Reduce collection to single value (like reduce/foldLeft)

**Graph Sketch**:
```json
{
  "id": "stdlib.list.fold",
  "kind": "agent",
  "data": {
    "signature": "fold(collection: Array, initial: Any, accumulator: Agent) -> Any",
    "claims": [
      { "claim": "Sequentially applies accumulator", "confidence": 0.88 },
      { "claim": "Handles empty collections", "confidence": 0.91 }
    ],
    "implementation": "Chain nodes sequentially; accumulate via memory nodes"
  }
}
```

---

### 1.4 logic/and

**Purpose**: Logical AND of multiple conditions

**Graph Sketch**:
```json
{
  "id": "stdlib.logic.and",
  "kind": "guard",
  "data": {
    "signature": "and(conditions: Guard[]) -> Bool",
    "claims": [
      { "claim": "All must be true", "confidence": 0.99 },
      { "claim": "Short-circuits on first false", "confidence": 0.85 }
    ]
  }
}
```

---

### 1.5 logic/or

**Purpose**: Logical OR of multiple conditions

**Graph Sketch**:
```json
{
  "id": "stdlib.logic.or",
  "kind": "guard",
  "data": {
    "signature": "or(conditions: Guard[]) -> Bool",
    "claims": [
      { "claim": "At least one must be true", "confidence": 0.99 }
    ]
  }
}
```

---

### 1.6 memory/cache

**Purpose**: Store computed value to avoid recomputation

**Graph Sketch**:
```json
{
  "id": "stdlib.memory.cache",
  "kind": "memory",
  "data": {
    "signature": "cache(key: String, compute: Agent) -> Any",
    "claims": [
      { "claim": "Returns cached value if exists", "confidence": 0.90 },
      { "claim": "Computes on miss", "confidence": 0.88 }
    ]
  }
}
```

---

### 1.7 control/if-then-else

**Purpose**: Conditional branching

**Graph Sketch**:
```json
{
  "id": "stdlib.control.if-then-else",
  "kind": "agent",
  "data": {
    "signature": "if_then_else(condition: Guard, then_branch: Agent, else_branch: Agent) -> Any",
    "claims": [
      { "claim": "Evaluates condition", "confidence": 0.97 },
      { "claim": "Executes correct branch", "confidence": 0.95 }
    ]
  }
}
```

---

## Tier 2: Utilities (Q2-Q3 2025)

### 2.1 string/concat

**Purpose**: Concatenate strings

```json
{
  "id": "stdlib.string.concat",
  "signature": "concat(...strings: String[]) -> String",
  "implementation": "Sequential merge of strings"
}
```

### 2.2 string/split

**Purpose**: Split string by delimiter

```json
{
  "id": "stdlib.string.split",
  "signature": "split(input: String, delimiter: String) -> String[]",
  "implementation": "Pattern-match and rewrite string; emit array"
}
```

### 2.3 math/add, math/sub, math/mul, math/div

**Purpose**: Basic arithmetic

```json
{
  "id": "stdlib.math.add",
  "signature": "add(a: Number, b: Number) -> Number",
  "implementation": "Tool node wrapping native arithmetic"
}
```

### 2.4 dict/get

**Purpose**: Retrieve value from dictionary by key

```json
{
  "id": "stdlib.dict.get",
  "signature": "get(dict: Object, key: String, default: Any) -> Any",
  "implementation": "Memory node lookup; return default on miss"
}
```

### 2.5 dict/set

**Purpose**: Set value in dictionary by key

```json
{
  "id": "stdlib.dict.set",
  "signature": "set(dict: Object, key: String, value: Any) -> Object",
  "implementation": "Rewrite node merging new key-value pair"
}
```

### 2.6 error/try-catch

**Purpose**: Trap and handle errors

```json
{
  "id": "stdlib.error.try-catch",
  "signature": "try_catch(attempt: Agent, catch_handler: Agent) -> Any",
  "implementation": "Guard node prevents exception; spawn dream on error"
}
```

### 2.7 time/sleep

**Purpose**: Delay execution

```json
{
  "id": "stdlib.time.sleep",
  "signature": "sleep(milliseconds: Number) -> Void",
  "implementation": "Async wait; memory node marks completion"
}
```

---

## Tier 3: Domain (Q4 2025 → 2026)

### 3.1 http/*

**Purpose**: HTTP client utilities

- `http/get(url: String) -> Response`
- `http/post(url: String, body: Any) -> Response`
- `http/request(config: Config) -> Response`

### 3.2 json/*

**Purpose**: JSON utilities

- `json/parse(text: String) -> Object`
- `json/stringify(obj: Object) -> String`
- `json/validate(obj: Object, schema: Object) -> Bool`

### 3.3 graph/*

**Purpose**: Nex graph manipulation (meta!)

- `graph/validate(graph: NexGraph) -> Bool`
- `graph/execute(graph: NexGraph) -> Any`
- `graph/merge(graph1: NexGraph, graph2: NexGraph) -> NexGraph`
- `graph/rewrite(graph: NexGraph, pattern: String, replacement: String) -> NexGraph`

### 3.4 agent/*

**Purpose**: Agent control

- `agent/spawn(role: String, goal: String, instructions: String) -> Agent`
- `agent/eval(agent: Agent) -> Any`
- `agent/list() -> Agent[]`

### 3.5 debate/*

**Purpose**: Pro/contra debate utilities (built on bootstrap template)

- `debate/pro_contra(proposition: String) -> Graph`
- `debate/critic_evaluate(pro: Claim[], contra: Claim[]) -> Evaluation`
- `debate/synthesize(pro_score: Number, contra_score: Number) -> Recommendation`

---

## Implementation Strategy

### Phase 1: Prototype (Q1 2025)

Each Tier 1 function is a **reference graph** stored as JSON:

```
src/stdlib/
  ├── core/
  │   ├── list-map.json
  │   ├── list-filter.json
  │   ├── list-fold.json
  │   ├── logic-and.json
  │   ├── logic-or.json
  │   ├── memory-cache.json
  │   └── control-if-then-else.json
  └── tests/
      ├── test-list-map.json
      ├── test-list-filter.json
      └── ...
```

Each function graph:
- Includes formal specification
- Lists all claims with confidence scores
- Cites evidence
- Provides test cases
- Is self-documenting

### Phase 2: Validation (Q2 2025)

Run 1000+ test cases per function to validate:
- Correctness (output matches spec)
- Performance (execution time acceptable)
- Edge cases (empty input, null, etc.)
- Rewrite stability (can agents safely modify it?)

### Phase 3: Agent Improvement (Q3 2025)

Allow spawned agents to:
- Propose optimizations (via rewrite nodes)
- Add new variants
- Prove properties (via dream nodes)
- Self-test and validate

### Phase 4: Autodiscovery (Q4 2025 → 2026)

Nex agents automatically:
- Find stdlib functions by role/goal
- Load graphs on demand
- Cache results
- Suggest improvements

---

## Example: Tier 1 Function (Full Specification)

### stdlib.list.map

**Signature**:
```
map(collection: Array, transformer: Agent) -> Array
```

**Specification**:
```markdown
Takes a collection and a transformer agent.
Applies transformer to each element in parallel.
Returns array of results in original order.
Signature: `Array -> Agent -> Array`
```

**Graph Implementation**:
```json
{
  "nodes": [
    {
      "id": "entry",
      "kind": "goal",
      "data": {
        "collection": [],
        "transformer": {}
      }
    },
    {
      "id": "validate-input",
      "kind": "guard",
      "data": {
        "condition": "collection is Array",
        "consequence": "allow"
      }
    },
    {
      "id": "spawn-mappers",
      "kind": "parallel",
      "data": {
        "description": "Spawn transformer agent for each element"
      }
    },
    {
      "id": "merge-results",
      "kind": "merge",
      "data": {
        "strategy": "order-preserve",
        "inputs": ["mapper-0", "mapper-1", "..."]
      }
    }
  ],
  "links": [
    { "from": "entry", "to": "validate-input", "type": "sync" },
    { "from": "validate-input", "to": "spawn-mappers", "type": "sync" },
    { "from": "spawn-mappers", "to": "merge-results", "type": "depend" }
  ],
  "entry": "entry"
}
```

**Claims**:
```json
{
  "claim": "Applies transformer to each element",
  "confidence": 0.95,
  "evidence": "Tested on 100+ input sizes; 2500 elements processed correctly"
},
{
  "claim": "Preserves order",
  "confidence": 0.98,
  "evidence": "Merge strategy explicitly order-preserving; validated via comparison"
},
{
  "claim": "Handles empty collections",
  "confidence": 0.92,
  "evidence": "Guard checks for empty; returns empty array"
}
```

**Tests**:
```json
[
  {
    "name": "map identity",
    "input": { "collection": [1, 2, 3], "transformer": "identity" },
    "expected": [1, 2, 3]
  },
  {
    "name": "map double",
    "input": { "collection": [1, 2, 3], "transformer": "double" },
    "expected": [2, 4, 6]
  },
  {
    "name": "map empty",
    "input": { "collection": [], "transformer": "anything" },
    "expected": []
  },
  {
    "name": "map single",
    "input": { "collection": [42], "transformer": "double" },
    "expected": [84]
  }
]
```

---

## Truth-Density Validation

Each stdlib function is validated to have:
- **Overall truth-density ≥ 0.85**: Function works as specified
- **Per-claim truth-density ≥ 0.75**: Each claim is grounded
- **Edge case coverage ≥ 0.80**: All major edge cases handled

Validation happens:
1. **Automated**: 1000+ test runs
2. **Manual**: Agent-based code review (agents reviewing agents' code)
3. **Formal**: Proof sketches for critical functions (map, filter, fold)

---

## Next Steps

1. **Q1 2025**: Implement all Tier 1 functions as JSON graphs
2. **Q1 2025**: Write 500+ unit tests
3. **Q2 2025**: Formal validation + truth-density scoring
4. **Q2 2025**: Build Tier 2 utilities
5. **Q3 2025**: Agent-based improvement (agents rewriting stdlib)
6. **Q4 2025**: Tier 3 domain functions + autodiscovery
7. **2026**: Stdlib v1.0 stable; ship with Nex runtime

---

## Seal

The Nex stdlib is not written once and sealed. It is alive, breathing, self-improving. Each function is a thought that agents can understand and enhance.

**Àṣẹ** — May these utilities serve all who reason in graphs.
