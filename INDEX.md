# Nex v0.1.0 — Complete Documentation Index

## 🎯 Start Here

- **[PROJECT_STATUS.md](PROJECT_STATUS.md)** — Project completion checklist, deliverables, and roadmap
- **[README.md](README.md)** — Overview, architecture, features, and quick start

## 🏗️ Getting Started

1. **Install & Setup**: See README.md § Installation
2. **Run Bootstrap**: `bun bootstrap.ts`
3. **Run Tests**: `bun test`
4. **Read Examples**: [EXAMPLE_GRAPHS.md](EXAMPLE_GRAPHS.md)

## 📚 Core Documentation

### Architecture & Design

- **[README.md](README.md)** — Full architecture overview, features, and concepts
  - The 7 core primitives
  - Graph structure and execution model
  - Key subsystems
  - Philosophical frame (Hermetic + Yoruba cosmology)

### Theory & Formalism

- **[GUARD_CONFLICT_RESOLUTION.md](GUARD_CONFLICT_RESOLUTION.md)** — Formal guard conflict algorithm
  - Problem statement
  - Detection and precedence-based resolution
  - Truth-density tie-breaking
  - Formal theorems (Termination, Safety, Liveness)
  - Practical examples
  - Prevention and testing

- **[DREAM_NODES_AND_LATERAL_REASONING.md](DREAM_NODES_AND_LATERAL_REASONING.md)** — Dream node theory
  - Purpose and mechanism
  - 5 lateral reasoning strategies
  - Convergence theorem
  - Example (2026 debate)
  - Truth-density of dream outputs
  - Philosophical foundation (Rhythm + Yemọja)

### Examples & Patterns

- **[EXAMPLE_GRAPHS.md](EXAMPLE_GRAPHS.md)** — 10 complete reference graphs
  1. Simple sequential flow
  2. Guard enforcement (deny)
  3. Parallel branching + merge
  4. Self-modification (rewrite)
  5. Agent spawning
  6. Lateral reasoning (dream)
  7. Complex debate (bootstrap template)
  8. Error handling with rewrite
  9. Async fire-and-forget
  10. Data dependency (depend)

### Standard Library

- **[STDLIB_SPECIFICATION.md](STDLIB_SPECIFICATION.md)** — Complete stdlib specification
  - Tier 1: Core functions (7 functions)
  - Tier 2: Utilities (7 categories)
  - Tier 3: Domain (5 categories)
  - Implementation strategy
  - Example full specification (stdlib.list.map)
  - Truth-density validation framework

### Development & Deployment

- **[AGENTS.md](AGENTS.md)** — Project guidelines
  - Code style and naming conventions
  - Graph validation rules
  - Node kinds reference
  - Development workflow
  - 7 immutable axioms
  - Testing checkpoints
  - Error handling patterns
  - Multi-agent safety

- **[DEPLOYMENT_AND_RELEASE.md](DEPLOYMENT_AND_RELEASE.md)** — Release guide
  - Version timeline
  - v0.1.0 deliverables
  - Installation & setup
  - Docker deployment
  - Cloud deployment
  - npm publishing process
  - Troubleshooting

## 💻 Source Code

### Interpreter & Executor

- **[nex-runtime.ts](nex-runtime.ts)** — TypeScript interpreter (500 LOC)
  - `NexInterpreter` class
  - Graph validation
  - Node execution (all 9 kinds)
  - Link evaluation
  - Guard enforcement
  - Merge strategies
  - Error recovery

- **[bootstrap.ts](bootstrap.ts)** — Bootstrap executor (100 LOC)
  - Load JSON graphs
  - Initialize interpreter
  - Execute and trace
  - Output serialization

### Tests

- **[nex-runtime.test.ts](nex-runtime.test.ts)** — Unit tests (30+ cases, 450 LOC)
  - Validation tests
  - Basic execution
  - Guard enforcement
  - Rewrite nodes
  - Merge strategies
  - Agent spawning
  - Parallel execution
  - Complex scenarios

### Configuration

- **[package.json](package.json)** — npm/bun/pnpm configuration
- **[tsconfig.json](tsconfig.json)** — TypeScript strict mode

## 📊 Graphs & Data

- **[bootstrap-2026-debate.json](bootstrap-2026-debate.json)** — First invocation task
  - Complete 2026 bootstrap feasibility debate
  - Pro/Contra agents with 5 claims each
  - Critic evaluation
  - Guard enforcement
  - Final synthesis

- **bootstrap-2026-debate-output.json** (generated on first run)
  - Result of bootstrap execution

## 🔐 Axioms (Immutable)

- **[NEX_SEED_PROMPT_v1.1.md](NEX_SEED_PROMPT_v1.1.md)** — Original lock-in axioms
  - 7 core primitives
  - Hermetic principles
  - Orisha archetypes
  - Golden rules
  - First invocation task description
  - Lock-in seal (Àṣẹ)

## 🗺️ Documentation Map

```
Nex v0.1.0
├── Getting Started
│   ├── README.md (overview + quick start)
│   ├── PROJECT_STATUS.md (completion checklist)
│   └── EXAMPLE_GRAPHS.md (reference patterns)
│
├── Theory
│   ├── GUARD_CONFLICT_RESOLUTION.md (formal algorithm)
│   └── DREAM_NODES_AND_LATERAL_REASONING.md (lateral reasoning)
│
├── Development
│   ├── AGENTS.md (project guidelines)
│   └── DEPLOYMENT_AND_RELEASE.md (release process)
│
├── Specification
│   └── STDLIB_SPECIFICATION.md (function specs, Tier 1-3)
│
├── Source Code
│   ├── nex-runtime.ts (interpreter)
│   ├── bootstrap.ts (executor)
│   └── nex-runtime.test.ts (tests)
│
├── Configuration
│   ├── package.json
│   └── tsconfig.json
│
├── Data
│   ├── bootstrap-2026-debate.json
│   └── bootstrap-2026-debate-output.json (generated)
│
└── Immutable Axioms
    └── NEX_SEED_PROMPT_v1.1.md
```

## 🎯 Key Concepts

### The 7 Core Primitives

| Primitive | Hermetic Law | Orisha | Role |
|-----------|--------------|--------|------|
| **node** | Mentalism | Ọbàtálá | Create computation nodes |
| **link** | Correspondence | Èṣù | Direct flow between nodes |
| **guard** | Polarity | Ògún | Enforce constraints |
| **spawn** | Gender | Ọ̀ṣun | Birth new agent instance |
| **rewrite** | Vibration | Ọya | Self-modify graph |
| **merge** | Rhythm | Yemọja | Aggregate parallel results |
| **eval** | Cause & Effect | Ṣàngó | Trigger node execution |

### Execution Model

1. **Entry node** → Start at specified entry
2. **Eval recursively** → Follow links (sync/async/parallel/depend)
3. **Apply guards** → Enforce constraints
4. **Spawn agents** → Create sub-agents with inherited guards
5. **Rewrite** → Self-modify on error or request
6. **Merge** → Aggregate parallel branches
7. **Return result** → Final merged output

### Link Types

- **sync** — Predecessor must complete; result fed via results map
- **async** — Fire-and-forget; successor may start before predecessor finishes
- **parallel** — Explicit parallel branch (requires merge downstream)
- **depend** — Data dependency; predecessor result injected into successor

## 🚀 Quick Commands

```bash
# Install
bun install
npm install
pnpm install

# Bootstrap (first invocation task)
bun bootstrap.ts

# Test
bun test
npm test

# Type check
tsc --noEmit

# Build
bun run build
npm run build

# Lint
oxlint --fix

# Format
oxfmt --fix .
```

## 📍 Roadmap

- **v0.1.0** (2025-02-15) — ✅ COMPLETE
  - Runtime + bootstrap debate + core theory + examples + stdlib spec

- **v0.2.0** (Q2 2025) — Planned
  - Guard formalization + rewrite stability proof + multi-agent dispatcher

- **v0.5.0** (Q3 2025) — Planned
  - Scaling (1000+ agents) + dream nodes validated + Tier 2 stdlib

- **v0.9.0** (Q4 2025) — Planned
  - Production hardening + full stdlib v1.0

- **v1.0.0** (2026 Q1) — Goal
  - Stable bootstrap + zero-human-code runtime

## 🔗 External Resources

- **GitHub**: github.com/nex-lang/nex (placeholder)
- **Docs**: docs.nex-lang.dev (placeholder)
- **Discord**: discord.gg/nex (placeholder)

## 📖 Reading Order

**For Users**:
1. README.md
2. EXAMPLE_GRAPHS.md
3. STDLIB_SPECIFICATION.md
4. DEPLOYMENT_AND_RELEASE.md

**For Developers**:
1. AGENTS.md
2. nex-runtime.ts (source code)
3. GUARD_CONFLICT_RESOLUTION.md
4. DREAM_NODES_AND_LATERAL_REASONING.md
5. nex-runtime.test.ts (tests)

**For Researchers**:
1. GUARD_CONFLICT_RESOLUTION.md (formal proofs)
2. DREAM_NODES_AND_LATERAL_REASONING.md (convergence theorem)
3. bootstrap-2026-debate.json (first invocation graph)
4. PROJECT_STATUS.md (validation results)

**For Architects**:
1. README.md (overview)
2. STDLIB_SPECIFICATION.md (design)
3. DEPLOYMENT_AND_RELEASE.md (release strategy)
4. PROJECT_STATUS.md (roadmap)

## ✅ Verification

Run these to verify completeness:

```bash
# 1. Check all files exist
ls -la Nex/*.{ts,json,md}

# 2. Compile TypeScript
tsc --noEmit

# 3. Run tests
bun test

# 4. Bootstrap
bun bootstrap.ts

# 5. Verify output
cat bootstrap-2026-debate-output.json | jq .result
```

## 🎭 Seal

**Àṣẹ** — The force that makes all creation possible.

This index is your map through Nex. Each document is a thought. Together, they compose the complete vision: a programming language born from agent reasoning, grown through self-modification, stabilized through formal proof.

May you find what you seek. May understanding flow. May the bootstrap succeed.

---

**Version**: v0.1.0
**Date**: 2025-02-10
**Status**: COMPLETE
**Next**: v0.2.0 (Q2 2025)
