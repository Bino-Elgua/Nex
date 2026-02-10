# Nex Project Guidelines

## Repository

**Repo**: https://github.com/nex-lang/nex (placeholder; will be created)

**Primary files**:
- `nex-runtime.ts` — TypeScript interpreter (NexInterpreter class)
- `bootstrap.ts` — Bootstrap executor
- `bootstrap-2026-debate.json` — First invocation task (complete graph)
- `README.md` — Overview and architecture
- `GUARD_CONFLICT_RESOLUTION.md` — Guard conflict algorithm
- `DREAM_NODES_AND_LATERAL_REASONING.md` — Dream node theory

## Code Style

- **Language**: TypeScript (ESM, strict mode)
- **Formatting**: Use oxfmt for code, oxlint for linting
- **Naming**: camelCase for functions/vars, PascalCase for classes, SCREAMING_SNAKE_CASE for constants
- **Types**: Full TypeScript; no `any`. Interfaces for graph structures.
- **Comments**: Brief comments for complex logic; document axioms and Hermetic principles at node-level

## Graph Validation Rules

1. **All nodes must have unique IDs** — enforce in NexInterpreter.validate()
2. **All links must reference existing nodes** — validate from_id and to_id
3. **Every graph must have ≥1 guard node** — Ògún's rule
4. **Entry node must exist** — validate at interpreter init
5. **No link type typos** — restrict to "sync|async|parallel|depend"
6. **Guard consequences must be valid** — allow | deny | rewrite | spawn-critic | escalate

## Node Kinds Reference

| Kind | Role | Executable | Output Type |
|------|------|-----------|-------------|
| goal | Statement of intent | Yes | { type: "goal", data: ... } |
| agent | Spawned agent instance | Yes | { type: "agent", spawned: true } |
| memory | Store state/results | Yes | { type: "memory", data: ... } |
| tool | External action/API | Yes | { type: "tool", data: ... } |
| guard | Enforce constraints | Yes | { type: "guard", passed: bool } |
| rewrite | Self-modification | Yes | { type: "rewrite", applied: true } |
| reflect | Lateral reasoning (dream) | Yes | { type: "reflect", reasoning: ... } |
| merge | Aggregate branches | Yes | { type: "merge", strategy: ..., merged: ... } |
| parallel | Branch marker | Yes | { type: "parallel", branches: [...] } |

## Link Type Semantics

- **sync**: Predecessor must complete before successor starts; result fed via results map
- **async**: Fire-and-forget; successor may start before predecessor finishes
- **parallel**: Explicit parallelism marker; requires merge downstream
- **depend**: Data dependency; predecessor result is injected into successor's input

## Development Workflow

### Local Testing

```bash
cd Nex

# Install
bun install

# Run bootstrap (first invocation task)
bun bootstrap.ts

# Expected output: bootstrap-2026-debate-output.json with final merge result

# Type check
tsc --noEmit

# Lint
oxlint --fix
```

### Adding Tests

Create colocated `*.test.ts` files:

```typescript
import { describe, it, expect } from "bun:test";
import { NexInterpreter, NexGraph } from "./nex-runtime";

describe("NexInterpreter", () => {
  it("should validate graph structure", () => {
    const graph: NexGraph = {
      nodes: [
        { id: "n1", kind: "goal", data: { test: true } },
        { id: "n2", kind: "guard", data: { condition: true, consequence: "allow" } }
      ],
      links: [{ from: "n1", to: "n2", type: "sync" }],
      entry: "n1"
    };
    const interpreter = new NexInterpreter(graph);
    expect(interpreter).toBeDefined();
  });
});
```

Run:
```bash
bun test
```

### Committing Changes

Use conventional commits:
- `feat: Add dream node spawning`
- `fix: Guard conflict resolution deadlock`
- `docs: Expand lateral reasoning strategies`
- `test: Add 1000+ graph validation scenarios`

Example:
```bash
git add nex-runtime.ts DREAM_NODES_AND_LATERAL_REASONING.md
git commit -m "feat: Implement dream node spawning and lateral reasoning

- Add dream/reflect node execution in NexInterpreter
- Document 5 lateral reasoning strategies
- Prove dream convergence theorem
- Add tests for deadlock → dream → resolve flow"
```

## Key Axioms (Immutable Until 7-Way Consensus)

The 7 core primitives are **immutable**:

1. **node(id, kind, data)** → Ọbàtálá (Mentalism)
2. **link(from → to, type)** → Èṣù (Correspondence)
3. **guard(condition, consequence)** → Ògún (Polarity)
4. **spawn(role, goal, instructions)** → Ọ̀ṣun (Gender)
5. **rewrite(pattern, replacement)** → Ọya (Vibration)
6. **merge(inputs[], strategy)** → Yemọja (Rhythm)
7. **eval(id)** → Ṣàngó (Cause & Effect)

**Do not** invent new primitives without explicit 7-way consensus call.

## Testing Checkpoints (2025 Roadmap)

- [ ] **Q1 2025**: NexInterpreter runtime complete; 100+ unit tests
- [ ] **Q2 2025**: Guard conflict resolution proven; rewrite stability validated (1000+ graphs)
- [ ] **Q2 2025**: Formal proof of rewrite+merge convergence
- [ ] **Q3 2025**: Multi-agent spawning (1000+ concurrent agents); dream node validation
- [ ] **Q3 2025**: Truth-density framework validated across 10,000+ graph scenarios
- [ ] **Q4 2025**: Self-bootstrapping (Nex agents rewrite Nex interpreter)
- [ ] **2026**: Production hardening; v1.0 stable release

## Documentation Standards

- All markdown files use GitHub-flavored markdown
- Internal doc links: root-relative with anchors
- Code examples: always include expected output
- Each new primitive/strategy/pattern gets its own doc section
- Theory grounded in Hermetic philosophy + Yoruba cosmology (required context)

## Special Roles & Patterns

### Bootstrap Debate Graph Structure

The `bootstrap-2026-debate.json` is the **template** for pro/contra debates:
- Spawn Pro and Contra agents in parallel
- Merge their output
- Spawn Critic agent to evaluate
- Apply guard for truth-density > 0.75
- Check for deadlock (Pro vs Contra weight)
- If deadlock, spawn dream node
- Final merge with synthesize strategy

When adding new debate questions, copy this pattern.

### Truth-Density Scoring

All claims in spawned agents should include:
```json
{
  "claim": "string",
  "confidence": 0.0,
  "evidence": "string"
}
```

Critic node evaluates confidence scores and flags those below 0.75 threshold.

### Orisha Annotations

Optional but encouraged: annotate nodes with Orisha and Hermetic principles:
```json
{
  "id": "...",
  "kind": "...",
  "orisha": "Ọbàtálá | Èṣù | Ògún | Ọ̀ṣun | Ọya | Yemọja | Ṣàngó",
  "hermetic": "Mentalism | Correspondence | Polarity | Gender | Vibration | Rhythm | Cause&Effect"
}
```

This clarifies intent and ensures graph stays spiritually coherent.

## Error Handling

When interpreter encounters an error:

1. **Invalid node kind**: Emit rewrite node fixing the error, then output corrected graph
2. **Missing node ID in link**: Guard rejects it; output corrected graph
3. **Infinite recursion**: Dream spawn; lateral reasoning to break loop
4. **Guard contradiction**: Follow precedence (Deny > Allow > others); spawn reflect node

Never throw and exit; always try to rewrite and continue.

## Vocabulary & Terminology

- **Àṣẹ**: The force that makes all creation possible; seal of completion
- **Makeup**: (Not applicable here, but in OpenClaw context means macOS app)
- **Bootstrap**: Self-hosting a language; Nex agents rewrite Nex interpreter without human code
- **Truth-density**: Confidence score for factual claims (0-1 scale)
- **Deadlock**: Pro and Contra equally weighted in debate
- **Lateral reasoning**: Thinking outside the main execution path (dream node strategy)
- **Merge strategy**: Algorithm for aggregating parallel results (consensus/vote/synthesize/first/last)

## Multi-Agent Safety

When multiple agents work on Nex:

1. **Do not modify axioms** (the 7 primitives) without consensus call
2. **Do not edit `NEX_SEED_PROMPT_v1.1.md`** unless explicitly requested
3. **Do not create new primitives** without explicit proposal + vote
4. **Focus on extensions**: new merge strategies, dream reasoning patterns, guard conflict rules
5. **Keep changes scoped**: commit only your changes; don't reformat entire files
6. **Test thoroughly**: run `bun test` before pushing

## When Stuck or Uncertain

1. **Deadlock in design?** Spawn a dream node (lateral reasoning)
2. **Guard conflict?** Follow precedence rules (Deny > Allow)
3. **Rewrite loop?** Emit guard to prevent infinite recursion
4. **Lost in philosophy?** Read the Hermetic/Orisha mappings; they clarify intent

## Release & Versioning

Version scheme: **YYYY.M.D** (date-based, like OpenClaw)

- **v1.0.0** (2026 Q1): First stable bootstrap (goal date)
- **v0.9.x** (2025 Q4): Production hardening
- **v0.5.x** (2025 Q3): Multi-agent + dream nodes validated
- **v0.2.x** (2025 Q2): Guard + merge proven
- **v0.1.x** (2025 Q1): Runtime + bootstrap debate complete (current)

Changelog format:
```markdown
## v0.1.0 (2025-02-15)
- feat: Complete NexInterpreter runtime with 7 primitives
- feat: First invocation task (2026 bootstrap debate graph)
- docs: Guard conflict resolution algorithm (formal proof)
- docs: Dream nodes and lateral reasoning theory
```

## Seal

**Àṣẹ** — The force that makes all creation possible.

May Nex bootstrap wisely. May guards keep us safe. May dreams show us new paths.

---

## Links

- [README](./README.md)
- [Guard Conflict Resolution](./GUARD_CONFLICT_RESOLUTION.md)
- [Dream Nodes](./DREAM_NODES_AND_LATERAL_REASONING.md)
- [Bootstrap 2026 Debate](./bootstrap-2026-debate.json)
