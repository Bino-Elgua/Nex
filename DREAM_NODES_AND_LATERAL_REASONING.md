# Dream Nodes and Lateral Reasoning

## Purpose

**Dream nodes** are special "reflect" kind nodes that trigger when:
1. A graph reaches deadlock (Pro = Contra in equal weight)
2. A guard contradiction cannot be resolved deterministically
3. An agent spawns contradictory sub-graphs
4. The merge strategy cannot find consensus

Dream nodes invoke **lateral reasoning**: thinking outside the graph structure to find novel solutions that the main execution path couldn't discover.

## Mechanism

### Normal Path (Execution)

```
Entry → Agent Pro → Guard → Merge → Result
        Agent Contra ↗
```

### Deadlock Path (Dream Triggered)

```
Entry → Agent Pro → Guard → Check Deadlock → DEADLOCK DETECTED
        Agent Contra ↗                       ↓
                                      Spawn Dream Node
                                            ↓
                                      Lateral Reasoning
                                            ↓
                                      Novel Hypothesis
                                            ↓
                                      Re-merge with Dream Output
```

## Dream Node Structure

```json
{
  "id": "dream-x",
  "kind": "reflect",
  "data": {
    "trigger": "deadlock|contradiction|spawning_failure",
    "context": {
      "competing_claims": ["Pro: X", "Contra: Y"],
      "weight_pro": 0.50,
      "weight_contra": 0.50,
      "difference": 0.0
    },
    "reasoning_mode": "lateral",
    "hypothesis_space": ["assumption_1", "assumption_2", "..."],
    "output": {
      "novel_perspective": "...",
      "breaks_symmetry": true,
      "confidence": 0.0
    }
  },
  "orisha": "Yemọja",
  "hermetic": "Rhythm"
}
```

## Lateral Reasoning Strategies

### 1. **Assumption Inversion**

**Problem**: Pro and Contra equally weighted.

**Strategy**: Invert core assumptions and re-argue.

**Example**:
- **Original**: "Is 2026 bootstrap feasible?"
  - Pro: Yes, LLM maturity sufficient
  - Contra: No, timeline too tight
  
- **Inverted**: "What if we relax the constraint?"
  - Hypothesis: "Feasible if we allow 1 human expert as final arbiter (not full bootstrap)"
  - This breaks the deadlock by redefining success criteria

### 2. **Meta-Level Shift**

**Strategy**: Zoom out and reframe the question.

**Example**:
- Original question: 2026 bootstrap feasible?
- Meta question: "What are the prerequisites? Can we satisfy them by 2025?"
- Dream output: "Bootstrap is feasible IFF rewrite stability proven by 2025 Q2"
- Action: Spawn dedicated research graph to prove rewrite stability

### 3. **Orthogonal Dimension**

**Strategy**: Introduce a new dimension not in the original debate.

**Example**:
- Original: Pro vs. Contra on feasibility
- Dream: Introduce "intermediate goals" (e.g., "Can we achieve 70% bootstrap by 2025?")
- Output: "Phased bootstrap is feasible; full 100% by 2026 is at-risk"

### 4. **Temporal Reframing**

**Strategy**: Shift timeline or introduce checkpoints.

**Example**:
- Original: "Feasible by END OF 2026?"
- Dream: "Feasible with checkpoints at Q2 (rewrite proof), Q3 (scaling test), Q4 (stabilization)"
- Output: "Yes, IF we hit Q2 and Q3 checkpoints; else pivot strategy"

### 5. **Agent Spawning as Dream**

**Strategy**: Spawn a new agent with a novel role that neither Pro nor Contra have.

**Example**:
- New role: "Risk Arbitrageur"
- Goal: "Find the cheapest path to 2026 bootstrap (in terms of risk-adjusted cost)"
- Output: "Minimal viable bootstrap: (1) Nex runtime, (2) basic rewrite, (3) guard enforcement. Full stdlib deferred to 2027."

## Example: 2026 Debate Dream Node

From `bootstrap-2026-debate.json`:

```json
{
  "id": "spawn-dream",
  "kind": "reflect",
  "data": {
    "role": "Dream Node (Lateral Reasoning)",
    "trigger_condition": "deadlock between Pro (0.80) and Contra (0.73)",
    "status": "NOT TRIGGERED",
    "reasoning": "Difference of 0.07 is sufficient to break symmetry; dream node reserved for future tied votes",
    "latent_perspective": "If deadlocked: 2026 bootstrap may be feasible if guard+merge strategies are proven empirically before 2025 Q3"
  }
}
```

**Rationale**: Pro wins by 0.07 (80% vs 73%); no deadlock. Dream stays dormant but ready.

**If Pro and Contra were tied at 0.77 each**:
1. Deadlock detected
2. Dream node spawns
3. Lateral reasoning invoked
4. Output: "Full bootstrap unlikely; phased approach with human checkpoints is feasible"
5. Merge synthesizes: "2026 goal redefined as 'core runtime stable'; 2027 for stdlib"

## Truth-Density of Dream Outputs

Dream nodes are **speculative** and carry lower initial truth-density (typically 0.5-0.7). They are validated by:

1. **Re-evaluation**: Feed dream output back into critic node
2. **Empirical Testing**: Run the proposed strategy in simulation
3. **Consensus Check**: Spawn multiple dream nodes and see if they converge

```json
{
  "id": "dream-output",
  "kind": "memory",
  "data": {
    "hypothesis": "Phased bootstrap is viable",
    "truth_density": 0.55,
    "evidence": "Speculative; requires empirical validation",
    "next_test": "Prove rewrite stability in 1000+ graph evaluations"
  }
}
```

## Dream Node Patterns

### Pattern 1: Deadlock Breaking

```json
{
  "trigger": "Pro weight == Contra weight",
  "action": "Introduce third dimension (e.g., timeline)"
}
```

### Pattern 2: Guard Contradiction

```json
{
  "trigger": "Guard A denies AND Guard B allows",
  "action": "Spawn dream to find conditions where both can be satisfied"
}
```

### Pattern 3: Spawn Failure

```json
{
  "trigger": "Spawned agent returned incoherent result",
  "action": "Dream node reasons about agent instructions; proposes correction"
}
```

### Pattern 4: Merge Divergence

```json
{
  "trigger": "Merge returned contradictory synthesized output",
  "action": "Dream node finds reconciliation; outputs new merge strategy"
}
```

## Testing Dream Nodes

```bash
bun test dream-nodes.test.ts
```

Test suite covers:
- [ ] Deadlock detection and dream spawn
- [ ] Lateral reasoning (5+ strategies)
- [ ] Assumption inversion
- [ ] Meta-level reframing
- [ ] Orthogonal dimension introduction
- [ ] Temporal reframing
- [ ] Agent spawning as dream output
- [ ] Truth-density validation of dream output
- [ ] Merge of dream output with main execution
- [ ] 1000+ random deadlock scenarios

## Formal Property: Dream Convergence

**Theorem**: If a graph has a deadlock at the root level, spawning a dream node that reframes the problem will eventually break the deadlock (converge to a definitive result).

**Proof sketch**:
- Deadlock = equal weight on Pro and Contra
- Dream reframes question (introduces new dimension or inverts assumption)
- Reframed question is strictly different from original (not equivalent)
- Pro/Contra must re-argue on new dimension
- New dimension breaks symmetry (unlikely to produce equal weights again)
- Result: Deadlock broken; merge can proceed

## Philosophical Foundation

Dream nodes embody **Rhythm** and **Correspondence** from Hermetic philosophy:

- **Rhythm**: Cycles and tides. When execution reaches a symmetry point (tide slack), the system pauses and invokes reflection (the tidal turn).
- **Correspondence**: As above (macro) so below (micro). The dream node reasoning mirrors human lateral thinking, scaled to agent reasoning.

**Orisha**: **Yemọja** — Motherhood, tides, embrace of contradictions, wisdom of acceptance and fluidity.

Dream nodes are where Nex becomes most human-like and creative.

## Next Steps

1. **Implement Dream Spawning**: Build dream node factory in nex-runtime.ts
2. **Lateral Reasoning Library**: Codify 10+ lateral reasoning patterns
3. **Truth-Density Validation**: Integrate dream output back into critic node
4. **Large-Scale Testing**: Run 10,000+ graph evaluations with random deadlocks

---

## Seal

Yemọja — May this dream guide the system toward wisdom, not confusion.

Àṣẹ.
