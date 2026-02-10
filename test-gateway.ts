#!/usr/bin/env bun
/**
 * Nex Gateway Test Client
 *
 * Tests the gateway with sample graphs
 */

import { readFileSync } from "fs";

async function testGateway() {
  const baseUrl = "http://localhost:18789";

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  Nex Gateway Test Suite");
  console.log("═══════════════════════════════════════════════════════════════\n");

  // Test 1: Health check
  console.log("📋 Test 1: Health check");
  try {
    const resp = await fetch(`${baseUrl}/health`);
    const data = await resp.json();
    console.log("✅ Health check:", data);
  } catch (e) {
    console.error("❌ Health check failed:", e);
  }

  // Test 2: Status
  console.log("\n📋 Test 2: Gateway status");
  try {
    const resp = await fetch(`${baseUrl}/status`);
    const data = await resp.json();
    console.log("✅ Gateway status:");
    console.log(`   Uptime: ${data.uptime}ms`);
    console.log(`   Executions: ${data.executions}`);
    console.log(`   Sessions: ${data.sessions}`);
  } catch (e) {
    console.error("❌ Status failed:", e);
  }

  // Test 3: Execute simple graph
  console.log("\n📋 Test 3: Execute simple graph");
  try {
    const simpleGraph = {
      nodes: [
        { id: "goal", kind: "goal", data: { message: "test" } },
        { id: "guard", kind: "guard", data: { condition: true, consequence: "allow" } },
      ],
      links: [{ from: "goal", to: "guard", type: "sync" }],
      entry: "goal",
    };

    const resp = await fetch(`${baseUrl}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ graph: simpleGraph }),
    });

    const data = await resp.json();
    console.log("✅ Graph executed:");
    console.log(`   Status: ${data.status}`);
    console.log(`   Execution time: ${data.executionMs}ms`);
    if (data.result) {
      console.log(`   Result type: ${data.result.type}`);
    }
  } catch (e) {
    console.error("❌ Execution failed:", e);
  }

  // Test 4: Execute bootstrap debate graph
  console.log("\n📋 Test 4: Execute bootstrap debate graph");
  try {
    const debateGraph = JSON.parse(readFileSync("bootstrap-2026-debate.json", "utf-8"));

    const resp = await fetch(`${baseUrl}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ graph: debateGraph }),
    });

    const data = await resp.json();
    console.log("✅ Bootstrap debate executed:");
    console.log(`   Status: ${data.status}`);
    console.log(`   Execution time: ${data.executionMs}ms`);
    if (data.result) {
      console.log(`   Result type: ${data.result.type}`);
    }
  } catch (e) {
    console.error("❌ Bootstrap debate failed:", e);
  }

  // Test 5: Validate graph
  console.log("\n📋 Test 5: Validate graph");
  try {
    const testGraph = {
      nodes: [
        { id: "n1", kind: "goal", data: {} },
        { id: "n2", kind: "guard", data: { condition: true, consequence: "allow" } },
      ],
      links: [{ from: "n1", to: "n2", type: "sync" }],
      entry: "n1",
    };

    const resp = await fetch(`${baseUrl}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "validate", graph: testGraph }),
    });

    const data = await resp.json();
    console.log("✅ Graph validated:", data);
  } catch (e) {
    console.error("❌ Validation failed:", e);
  }

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("  Tests complete");
  console.log("═══════════════════════════════════════════════════════════════");

  process.exit(0);
}

// Give gateway 2 seconds to start
setTimeout(testGateway, 2000);
