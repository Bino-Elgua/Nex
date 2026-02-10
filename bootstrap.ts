#!/usr/bin/env bun
/**
 * Nex Bootstrap v1.0 — First Invocation Executor
 * 
 * Loads the 2026 bootstrap debate graph and executes it
 * through the Nex interpreter, producing the sealed output.
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { NexInterpreter, NexGraph } from "./nex-runtime";

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  Nex Bootstrap v1.0 — 2026 Agent-Native Language Invocation");
  console.log("═══════════════════════════════════════════════════════════════\n");

  const graphPath = join(__dirname, "bootstrap-2026-debate.json");
  console.log(`📖 Loading graph: ${graphPath}`);

  let graph: NexGraph;
  try {
    const data = readFileSync(graphPath, "utf-8");
    graph = JSON.parse(data);
    console.log("✓ Graph loaded successfully\n");
  } catch (error) {
    console.error("✗ Failed to load graph:", error);
    process.exit(1);
  }

  console.log(`📋 Graph Metadata:`);
  console.log(`   Title: ${graph.meta?.title}`);
  console.log(`   Nodes: ${graph.nodes.length}`);
  console.log(`   Links: ${graph.links.length}`);
  console.log(`   Entry: ${graph.entry}\n`);

  console.log("🚀 Initializing Nex Interpreter...");
  let interpreter: NexInterpreter;
  try {
    interpreter = new NexInterpreter(graph);
    console.log("✓ Interpreter ready\n");
  } catch (error) {
    console.error("✗ Interpreter init failed:", error);
    process.exit(1);
  }

  console.log("⚙️  Executing graph (entry → exit)...\n");
  console.log("─── Execution Trace ───");

  let executionResult: any;
  try {
    executionResult = await interpreter.execute();
    console.log("✓ Execution completed\n");
  } catch (error) {
    console.error("✗ Execution failed:", error);
    process.exit(1);
  }

  // Retrieve results
  const results = interpreter.getResults();
  console.log(`📊 Results Summary:`);
  console.log(`   Nodes executed: ${results.size}`);
  console.log(`   Entry result: ${results.get(graph.entry)?.type}\n`);

  // Build final output graph
  const outputGraph: NexGraph = {
    ...graph,
    result: results.get(graph.entry),
    meta: {
      ...graph.meta,
      executed_at: new Date().toISOString(),
      status: "complete",
      seal: "Àṣẹ",
    },
  };

  // Print key findings
  const finalMerge = results.get("final-merge");
  if (finalMerge) {
    console.log(`🎯 Final Merge Output:`);
    console.log(JSON.stringify(finalMerge.merged, null, 2));
  }

  const criticJudgment = results.get("critic-judgment");
  if (criticJudgment) {
    console.log(`\n⚖️  Critic's Judgment:`);
    const judgment = criticJudgment.data;
    console.log(`   Truth Density (Pro):   ${judgment.truth_density_pro}`);
    console.log(`   Truth Density (Contra): ${judgment.truth_density_contra}`);
    console.log(`   Guard Status:          ${judgment.guard_check}`);
    console.log(`   Deadlock:              ${judgment.deadlock_status}`);
    console.log(`   Final Call:            ${judgment.final_call}`);
  }

  // Save output graph
  const outputPath = join(__dirname, "bootstrap-2026-debate-output.json");
  writeFileSync(outputPath, JSON.stringify(outputGraph, null, 2));
  console.log(`\n💾 Output graph saved: ${outputPath}`);

  // Print seal
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("                          Àṣẹ");
  console.log("═══════════════════════════════════════════════════════════════\n");

  console.log("✨ Bootstrap complete. Graph is consecrated and ready for iteration.");
  console.log(
    "📚 Next steps: (1) Run empirical proof tests; (2) Validate rewrite stability;"
  );
  console.log(
    "   (3) Formalize guard conflict resolution; (4) Scale to production agents.\n"
  );
}

main().catch(console.error);
