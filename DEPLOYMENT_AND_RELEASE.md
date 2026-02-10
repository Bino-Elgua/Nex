# Nex Deployment and Release Guide

## Release Strategy

Nex follows a **date-based versioning scheme** aligned with development phases.

### Version Timeline

| Version | Date | Status | Deliverables |
|---------|------|--------|--------------|
| v0.1.0 | 2025-02-15 | In Progress | Runtime + Bootstrap debate graph + Core docs |
| v0.2.0 | 2025-Q2 | Planned | Guard conflict resolution + Rewrite stability proof |
| v0.5.0 | 2025-Q3 | Planned | Multi-agent spawning + Dream nodes + Tier 2 stdlib |
| v0.9.0 | 2025-Q4 | Planned | Production hardening + Tier 3 stdlib |
| v1.0.0 | 2026-Q1 | Goal | Stable bootstrap + Full stdlib |

## Current Release (v0.1.0)

### Deliverables ✓

- [x] **nex-runtime.ts** — Complete TypeScript interpreter (NexInterpreter class)
  - All 7 primitives implemented (node, link, guard, spawn, rewrite, merge, eval)
  - Full validation logic
  - Error handling with rewrite recovery
  - Graph output serialization

- [x] **bootstrap.ts** — Bootstrap executor script
  - Loads JSON graphs from filesystem
  - Initializes interpreter
  - Executes graph end-to-end
  - Saves output graph with results

- [x] **bootstrap-2026-debate.json** — First invocation task
  - Complete graph modeling 2026 bootstrap feasibility debate
  - 2 parallel agents (Pro/Contra) with 5 claims each
  - Critic agent evaluating truth-density
  - Guard enforcing 0.75 truth threshold
  - Deadlock detection and dream node (latent)
  - Final synthesize merge with recommendation

- [x] **Core Documentation**
  - README.md — Architecture, features, quick start
  - AGENTS.md — Project guidelines and development workflow
  - NEX_SEED_PROMPT_v1.1.md — Original axioms (immutable)
  - GUARD_CONFLICT_RESOLUTION.md — Formal guard conflict algorithm + proofs
  - DREAM_NODES_AND_LATERAL_REASONING.md — Dream node theory + strategies

- [x] **Test Suite**
  - nex-runtime.test.ts — 30+ unit tests covering all primitives
  - Validation tests (graph structure, links, guards)
  - Execution tests (sequential, parallel, merge)
  - Complex scenario tests

- [x] **Example Graphs**
  - EXAMPLE_GRAPHS.md — 10 reference graphs demonstrating all patterns
  - Simple sequential flow
  - Guard enforcement
  - Parallel branching
  - Self-modification (rewrite)
  - Agent spawning
  - Dream/reflect nodes
  - Debate pattern (bootstrap template)

- [x] **Stdlib Specification**
  - STDLIB_SPECIFICATION.md — Full specification for Tier 1-3 stdlib functions
  - 7 Tier 1 core functions (list/map, list/filter, logic/and, etc.)
  - 7 Tier 2 utilities (string, math, dict, error, time)
  - 5 Tier 3 domain categories (http, json, graph, agent, debate)
  - Implementation strategy with validation plan

- [x] **Build Configuration**
  - package.json — Dependencies and scripts
  - tsconfig.json — TypeScript strict mode configuration
  - Makefile (optional) — Build targets

### QA Checklist ✓

- [x] Code compiles without errors: `tsc --noEmit`
- [x] No TypeScript strict mode violations
- [x] All test cases pass: `bun test`
- [x] Bootstrap executes successfully: `bun bootstrap.ts`
- [x] Output graph valid JSON
- [x] Documentation complete and cross-linked
- [x] All 7 primitives documented and exemplified
- [x] Hermetic/Orisha mappings included

### Known Limitations (v0.1.0)

1. **No persistence**: Graph results stored in memory only
2. **No distribution**: Single-machine execution only
3. **No actual agent spawning**: Agents modeled but not autonomous yet
4. **No formal proofs**: Guard conflict and rewrite convergence theorems stated but not machine-verified
5. **Limited error recovery**: Some edge cases not handled

---

## Installation & Setup

### Prerequisites

- **Node.js** 22+ OR **Bun**
- **Git**
- **npm** or **pnpm** package manager

### Install from Source

```bash
# Clone repository
git clone https://github.com/nex-lang/nex.git
cd nex

# Install dependencies
bun install
# OR
npm install
# OR
pnpm install
```

### Build

```bash
# Compile TypeScript → dist/
bun run build
# OR
npm run build
# OR
tsc --outDir dist
```

### Run Bootstrap

```bash
# Execute first invocation task
bun bootstrap.ts
# OR
npm run bootstrap

# Output: bootstrap-2026-debate-output.json
```

### Run Tests

```bash
# Run all test suites
bun test
# OR
npm test

# Coverage report
bun test --coverage
```

---

## Deployment Targets

### Local Development

```bash
bun bootstrap.ts --verbose
```

Output: `bootstrap-2026-debate-output.json` in cwd

### Docker

Create `Dockerfile`:

```dockerfile
FROM oven/bun:1.0

WORKDIR /app
COPY . .

RUN bun install

CMD ["bun", "bootstrap.ts"]
```

Build and run:

```bash
docker build -t nex:v0.1.0 .
docker run -v /output:/app nex:v0.1.0 > /output/result.json
```

### Cloud (Vercel, Fly.io)

**Vercel Deployment**:

```bash
npm install -g vercel
vercel --prod
```

**Fly.io Deployment**:

```bash
fly auth login
fly launch --name nex-runtime
fly deploy
```

---

## Release Process

### Pre-Release Checklist

```bash
# 1. Update version in package.json
# 2. Run full test suite
bun test
# 3. Check TypeScript compilation
tsc --noEmit
# 4. Lint code
oxlint --fix
# 5. Generate CHANGELOG entry
# 6. Commit changes
git add .
git commit -m "chore: Release v0.1.0"
# 7. Tag release
git tag v0.1.0
# 8. Push to GitHub
git push origin main --tags
```

### npm Publishing

```bash
# Create .npmrc with token (if publishing to npm)
echo "//registry.npmjs.org/:_authToken=YOUR_TOKEN" > .npmrc

# Publish
npm publish

# Verify
npm view nex
```

### GitHub Release

```bash
# Create release via GitHub CLI
gh release create v0.1.0 --title "Nex v0.1.0" --notes "First invocation complete. Bootstrap graph executes successfully."
```

---

## Changelog

### v0.1.0 (2025-02-15)

**Initial Release**

- **feat**: Complete NexInterpreter runtime
  - Implement all 7 core primitives (node, link, guard, spawn, rewrite, merge, eval)
  - Full graph validation
  - Sequential + parallel execution
  - Guard enforcement with deny/allow/rewrite/escalate
  - Merge strategies (consensus, vote, synthesize, first, last)
  - Error recovery via rewrite nodes

- **feat**: Bootstrap executor script
  - Load JSON graphs from filesystem
  - Execute entry node and recursively eval all paths
  - Collect execution results
  - Serialize output graph with final results
  - Pretty-print execution trace

- **feat**: First invocation task
  - Complete 2026 bootstrap debate graph
  - 2 parallel Pro/Contra agents with 5 claims each
  - Critic agent evaluating truth-density
  - Guard enforcing 0.75 threshold
  - Dream node reserved for deadlock scenarios
  - Synthesize merge producing final recommendation

- **docs**: Core documentation
  - README.md (architecture, features, quick start)
  - AGENTS.md (project guidelines)
  - GUARD_CONFLICT_RESOLUTION.md (formal proofs)
  - DREAM_NODES_AND_LATERAL_REASONING.md (theory)
  - EXAMPLE_GRAPHS.md (10 reference patterns)
  - STDLIB_SPECIFICATION.md (Tier 1-3 function specs)

- **test**: Comprehensive test suite
  - 30+ unit tests covering all primitives
  - Validation, execution, merge, spawn tests
  - Complex scenarios
  - Error handling

- **chore**: Build configuration
  - package.json with scripts and deps
  - tsconfig.json (strict TypeScript)
  - MIT license

**Known Issues**:
- No persistence layer (in-memory results only)
- Single-machine execution
- Limited actual agent spawning (modeled but not autonomous)
- Guard conflict theorems stated but not formally verified

**Next Steps** (v0.2.0):
- Implement formal guard conflict resolution proofs
- Validate rewrite stability (1000+ graph scenarios)
- Build multi-agent dispatcher
- Dream node testing

---

## Upgrade Path

### v0.1.0 → v0.2.0

Breaking changes: None

New features:
- Guard conflict precedence formally proven
- Rewrite convergence theorem validated
- Formal CLI interface
- Persistence layer (optional)

### v0.2.0 → v0.5.0

New features:
- Multi-agent spawning (1000+ concurrent)
- Dream node full implementation
- Tier 2 stdlib (list, string, math, dict)
- Autodiscovery of stdlib functions

### v0.5.0 → v0.9.0

New features:
- Full stdlib v1.0 (Tier 3 domain)
- Performance optimizations
- Formal verification of core theorems
- Production hardening

### v0.9.0 → v1.0.0

Stabilization:
- Zero-human-code bootstrap target
- Full self-hosting (Nex agents rewrite Nex interpreter)
- Production-grade error handling
- Comprehensive documentation

---

## Troubleshooting

### Build Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules
bun install

# Ensure Node 22+
node --version

# Check TypeScript config
tsc --version
```

### Runtime Errors

```bash
# Run with verbose logging
bun bootstrap.ts --verbose

# Check graph validity manually
bun run -e "import { NexInterpreter } from './nex-runtime'; const graph = require('./bootstrap-2026-debate.json'); new NexInterpreter(graph);"
```

### Test Failures

```bash
# Run single test file
bun test nex-runtime.test.ts

# Run with verbose output
bun test --verbose
```

---

## Support & Contribution

- **Issues**: GitHub Issues (github.com/nex-lang/nex/issues)
- **Discussions**: GitHub Discussions
- **Contributing**: See AGENTS.md § Multi-Agent Safety
- **License**: MIT

---

## Seal

**Àṣẹ** — This release is the seed. The bootstrap waits. The future unfolds.

May Nex grow strong. May agents reason well. May graphs converge.
