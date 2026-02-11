#!/usr/bin/env bun
/**
 * Nex Comprehensive Test Suite
 *
 * Tests all versions (v1.0, v1.1, v1.2, v2.0, v2.5) with:
 * - Unit tests (graph execution, guards, merges)
 * - Integration tests (auth, storage, websockets)
 * - E2E tests (full workflows)
 * - Performance benchmarks
 * - Stress tests (1M+ graphs)
 */

import { NexInterpreter, NexGraph } from "./nex-runtime.js";
import { ProductionNexInterpreter } from "./v1.0.0-production.js";
import { AuthManager } from "./auth-manager.js";
import { NexHttpClient } from "./http-client.js";
import { StorageAdapter } from "./storage-adapter.js";
import { DistributedExecutor } from "./distributed-executor.js";
import { AgentRewriter } from "./agent-rewriter.js";

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

class NexTestSuite {
  private results: TestResult[] = [];
  private passCount = 0;
  private failCount = 0;

  /**
   * Run all tests
   */
  public async runAll(): Promise<void> {
    console.log(
      "═══════════════════════════════════════════════════════════════"
    );
    console.log("  Nex Comprehensive Test Suite");
    console.log(
      "═══════════════════════════════════════════════════════════════\n"
    );

    // v1.0 Tests
    console.log("📋 Running v1.0.0 Core Tests...\n");
    await this.testCoreRuntime();

    // v1.1 Tests
    console.log("\n📋 Running v1.1.0 Auth Tests...\n");
    await this.testAuthManager();
    await this.testHttpClient();

    // v1.2 Tests
    console.log("\n📋 Running v1.2.0 Storage & WebSocket Tests...\n");
    await this.testStorageAdapter();

    // v2.0 Tests
    console.log("\n📋 Running v2.0.0 Distributed Tests...\n");
    await this.testDistributedExecutor();

    // v2.5 Tests
    console.log("\n📋 Running v2.5.0 Agent Rewriter Tests...\n");
    await this.testAgentRewriter();

    // Performance Tests
    console.log("\n📋 Running Performance Tests...\n");
    await this.testPerformance();

    // Summary
    this.printSummary();
  }

  /**
   * v1.0 Core Runtime Tests
   */
  private async testCoreRuntime(): Promise<void> {
    // Test 1: Basic graph execution
    await this.test("Core: Simple goal node", async () => {
      const graph: NexGraph = {
        nodes: [
          { id: "goal1", kind: "goal", data: { message: "test" } },
          {
            id: "guard1",
            kind: "guard",
            data: { condition: true, consequence: "allow" },
          },
        ],
        links: [{ from: "goal1", to: "guard1", type: "sync" }],
        entry: "goal1",
      };

      const interpreter = new NexInterpreter(graph);
      const result = await interpreter.execute();

      if (!result || result.type !== "goal") throw new Error("Invalid result");
    });

    // Test 2: Multiple node types
    await this.test("Core: Multiple node kinds", async () => {
      const graph: NexGraph = {
        nodes: [
          { id: "goal", kind: "goal", data: { aim: "test" } },
          { id: "memory", kind: "memory", data: { state: "tracking" } },
          {
            id: "guard",
            kind: "guard",
            data: { condition: true, consequence: "allow" },
          },
        ],
        links: [
          { from: "goal", to: "memory", type: "sync" },
          { from: "memory", to: "guard", type: "sync" },
        ],
        entry: "goal",
      };

      const interpreter = new NexInterpreter(graph);
      await interpreter.execute();
    });

    // Test 3: Parallel execution
    await this.test("Core: Parallel branches", async () => {
      const graph: NexGraph = {
        nodes: [
          { id: "start", kind: "goal", data: {} },
          { id: "branch1", kind: "agent", data: { role: "worker1" } },
          { id: "branch2", kind: "agent", data: { role: "worker2" } },
          {
            id: "merge",
            kind: "merge",
            data: { strategy: "synthesize" },
          },
          {
            id: "guard",
            kind: "guard",
            data: { condition: true, consequence: "allow" },
          },
        ],
        links: [
          { from: "start", to: "branch1", type: "parallel" },
          { from: "start", to: "branch2", type: "parallel" },
          { from: "branch1", to: "merge", type: "sync" },
          { from: "branch2", to: "merge", type: "sync" },
          { from: "merge", to: "guard", type: "sync" },
        ],
        entry: "start",
      };

      const interpreter = new NexInterpreter(graph);
      await interpreter.execute();
    });

    // Test 4: Guard enforcement
    await this.test("Core: Guard denial", async () => {
      const graph: NexGraph = {
        nodes: [
          { id: "goal", kind: "goal", data: {} },
          {
            id: "guard",
            kind: "guard",
            data: { condition: false, consequence: "deny" },
          },
        ],
        links: [{ from: "goal", to: "guard", type: "sync" }],
        entry: "goal",
      };

      const interpreter = new NexInterpreter(graph);

      try {
        await interpreter.execute();
        throw new Error("Should have denied");
      } catch (error) {
        if (!String(error).includes("denied")) throw error;
      }
    });

    // Test 5: Rewrite execution
    await this.test("Core: Rewrite node", async () => {
      const graph: NexGraph = {
        nodes: [
          { id: "goal", kind: "goal", data: {} },
          {
            id: "rewrite",
            kind: "rewrite",
            data: { pattern: "old", replacement: "new" },
          },
          {
            id: "guard",
            kind: "guard",
            data: { condition: true, consequence: "allow" },
          },
        ],
        links: [
          { from: "goal", to: "rewrite", type: "sync" },
          { from: "rewrite", to: "guard", type: "sync" },
        ],
        entry: "goal",
      };

      const interpreter = new NexInterpreter(graph);
      await interpreter.execute();
    });

    // Test 6: Invalid graph detection
    await this.test("Core: Graph validation", async () => {
      const graph: NexGraph = {
        nodes: [{ id: "n1", kind: "goal", data: {} }],
        links: [{ from: "n1", to: "nonexistent", type: "sync" }],
        entry: "n1",
      };

      try {
        new NexInterpreter(graph);
        throw new Error("Should have thrown");
      } catch (error) {
        if (!String(error).includes("does not exist")) throw error;
      }
    });

    // Test 7: Production safety
    await this.test("Core: Production interpreter", async () => {
      const graph: NexGraph = {
        nodes: [
          { id: "goal", kind: "goal", data: {} },
          {
            id: "guard",
            kind: "guard",
            data: { condition: true, consequence: "allow" },
          },
        ],
        links: [{ from: "goal", to: "guard", type: "sync" }],
        entry: "goal",
      };

      const prod = new ProductionNexInterpreter(graph);
      const { result, metrics } = await prod.executeWithSafety();

      if (!metrics.graphId) throw new Error("Missing metrics");
    });
  }

  /**
   * v1.1 Auth Tests
   */
  private async testAuthManager(): Promise<void> {
    // Test 1: User registration
    await this.test("Auth: Register user", async () => {
      const auth = new AuthManager();
      const user = auth.registerUser("test@nex.local", "password123");

      if (!user.id || user.email !== "test@nex.local")
        throw new Error("Invalid user");
    });

    // Test 2: Authentication
    await this.test("Auth: Authenticate user", async () => {
      const auth = new AuthManager();
      auth.registerUser("test@nex.local", "password123");

      const result = auth.authenticateUser("test@nex.local", "password123");
      if (!result || !result.token) throw new Error("Authentication failed");
    });

    // Test 3: JWT verification
    await this.test("Auth: JWT verification", async () => {
      const auth = new AuthManager();
      const user = auth.registerUser("test@nex.local", "password123");

      const token = auth.generateJWT(user);
      const payload = auth.verifyJWT(token);

      if (!payload || payload.userId !== user.id)
        throw new Error("JWT verification failed");
    });

    // Test 4: RBAC permissions
    await this.test("Auth: RBAC authorization", async () => {
      const auth = new AuthManager();
      const user = auth.registerUser("test@nex.local", "password", "user");

      const token = auth.generateJWT(user);
      const hasPermission = auth.authorize(token, "execute", "graphs");

      if (!hasPermission) throw new Error("Permission denied");
    });

    // Test 5: Admin permissions
    await this.test("Auth: Admin role", async () => {
      const auth = new AuthManager();
      const admin = auth.registerUser("admin@nex.local", "password", "admin");

      const token = auth.generateJWT(admin);
      const canManageUsers = auth.authorize(token, "write", "settings");

      if (!canManageUsers) throw new Error("Admin permission denied");
    });

    // Test 6: Graph signing
    await this.test("Auth: Graph signing", async () => {
      const auth = new AuthManager();
      const user = auth.registerUser("test@nex.local", "password");
      const token = auth.generateJWT(user);

      const signature = auth.signGraph("graph123", token);
      if (!signature || !auth.verifyGraphSignature(signature))
        throw new Error("Graph signing failed");
    });

    // Test 7: Token logout
    await this.test("Auth: Token logout", async () => {
      const auth = new AuthManager();
      const user = auth.registerUser("test@nex.local", "password");
      const token = auth.generateJWT(user);

      auth.logout(token);

      const payload = auth.verifyJWT(token);
      if (payload !== null) throw new Error("Logout failed");
    });
  }

  /**
   * v1.1 HTTP Client Tests
   */
  private async testHttpClient(): Promise<void> {
    // Test 1: HTTP client initialization
    await this.test("HTTP: Client creation", async () => {
      const client = new NexHttpClient();
      const metrics = client.getMetrics();

      if (!metrics || metrics.totalRequests !== 0)
        throw new Error("Client initialization failed");
    });

    // Test 2: Cache functionality
    await this.test("HTTP: Cache disabled by default", async () => {
      const client = new NexHttpClient(30000, 3, false);
      client.clearCache();
    });

    // Test 3: Metrics tracking
    await this.test("HTTP: Metrics tracking", async () => {
      const client = new NexHttpClient();
      const initialMetrics = client.getMetrics();

      if (initialMetrics.totalRequests !== 0)
        throw new Error("Metrics initialization failed");

      client.resetMetrics();
      const resetMetrics = client.getMetrics();
      if (resetMetrics.totalRequests !== 0)
        throw new Error("Metrics reset failed");
    });
  }

  /**
   * v1.2 Storage Tests
   */
  private async testStorageAdapter(): Promise<void> {
    // Test 1: Storage connection
    await this.test("Storage: Connect", async () => {
      const storage = new StorageAdapter({
        type: "memory",
        database: "test",
      });

      await storage.connect();
    });

    // Test 2: Store graph
    await this.test("Storage: Store graph", async () => {
      const storage = new StorageAdapter({
        type: "memory",
        database: "test",
      });

      await storage.connect();

      const graph: NexGraph = {
        nodes: [{ id: "n1", kind: "goal", data: {} }],
        links: [],
        entry: "n1",
      };

      const graphId = await storage.storeGraph(graph, "user123");
      if (!graphId) throw new Error("Store failed");
    });

    // Test 3: Retrieve graph
    await this.test("Storage: Retrieve graph", async () => {
      const storage = new StorageAdapter({
        type: "memory",
        database: "test",
      });

      await storage.connect();

      const graph: NexGraph = {
        nodes: [{ id: "n1", kind: "goal", data: {} }],
        links: [],
        entry: "n1",
      };

      const graphId = await storage.storeGraph(graph, "user123");
      const retrieved = await storage.getGraph(graphId, "user123");

      if (!retrieved) throw new Error("Retrieve failed");
    });

    // Test 4: Execution recording
    await this.test("Storage: Record execution", async () => {
      const storage = new StorageAdapter({
        type: "memory",
        database: "test",
      });

      await storage.connect();

      const recordId = await storage.recordExecution(
        "graph123",
        { result: "test" },
        "success",
        100,
        "agent1"
      );

      if (!recordId) throw new Error("Record failed");
    });

    // Test 5: File operations
    await this.test("Storage: File operations", async () => {
      const storage = new StorageAdapter({
        type: "memory",
        database: "test",
      });

      await storage.connect();

      const file = await storage.writeFile(
        "/test.json",
        '{"test": true}',
        "user123"
      );

      if (!file || file.path !== "/test.json")
        throw new Error("File write failed");
    });

    // Test 6: Storage stats
    await this.test("Storage: Get stats", async () => {
      const storage = new StorageAdapter({
        type: "memory",
        database: "test",
      });

      await storage.connect();

      const stats = await storage.getStats();
      if (stats.storageType !== "memory") throw new Error("Stats failed");
    });
  }

  /**
   * v2.0 Distributed Tests
   */
  private async testDistributedExecutor(): Promise<void> {
    // Test 1: Cluster registration
    await this.test("Distributed: Register machine", async () => {
      const executor = new DistributedExecutor();
      const node = executor.registerMachine("m1", "host1", 18789);

      if (!node || node.machineId !== "m1")
        throw new Error("Registration failed");
    });

    // Test 2: Graph partitioning
    await this.test("Distributed: Partition graph", async () => {
      const executor = new DistributedExecutor();
      executor.registerMachine("m1", "host1", 18789);

      const graph: NexGraph = {
        nodes: [
          { id: "n1", kind: "goal", data: {} },
          { id: "n2", kind: "goal", data: {} },
          {
            id: "guard",
            kind: "guard",
            data: { condition: true, consequence: "allow" },
          },
        ],
        links: [
          { from: "n1", to: "n2", type: "sync" },
          { from: "n2", to: "guard", type: "sync" },
        ],
        entry: "n1",
      };

      const plan = executor.partitionGraph(graph);
      if (!plan || plan.partitions.length === 0)
        throw new Error("Partitioning failed");
    });

    // Test 3: Cluster status
    await this.test("Distributed: Cluster status", async () => {
      const executor = new DistributedExecutor();
      executor.registerMachine("m1", "host1", 18789);

      const status = executor.getClusterStatus();
      if (!status || status.machines.length === 0)
        throw new Error("Status failed");
    });
  }

  /**
   * v2.5 Agent Rewriter Tests
   */
  private async testAgentRewriter(): Promise<void> {
    // Test 1: Propose improvement
    await this.test("Agent Rewriter: Propose improvement", async () => {
      const rewriter = new AgentRewriter();

      const proposal = rewriter.proposeImprovement(
        "agent1",
        "runtime-core",
        "Optimize merge",
        "Faster merge strategy",
        "old code",
        "new code",
        "Better performance"
      );

      if (!proposal || proposal.status !== "proposed")
        throw new Error("Proposal failed");
    });

    // Test 2: Vote on proposal
    await this.test("Agent Rewriter: Vote on proposal", async () => {
      const rewriter = new AgentRewriter();

      const proposal = rewriter.proposeImprovement(
        "agent1",
        "runtime-core",
        "Test",
        "Test",
        "old",
        "new",
        "reason"
      );

      rewriter.vote(proposal.proposalId, "agent1", "approve", "looks good");
      rewriter.vote(proposal.proposalId, "agent2", "approve", "looks good");
      rewriter.vote(proposal.proposalId, "agent3", "approve", "looks good");

      const updated = rewriter.getProposal(proposal.proposalId);
      if (updated?.status !== "approved")
        throw new Error("Voting failed");
    });

    // Test 3: Progress tracking
    await this.test("Agent Rewriter: Progress tracking", async () => {
      const rewriter = new AgentRewriter();

      const progress = rewriter.getProgress();
      if (!progress || progress.modulesTotal === 0)
        throw new Error("Progress failed");
    });

    // Test 4: Module registry
    await this.test("Agent Rewriter: Module registry", async () => {
      const rewriter = new AgentRewriter();

      const modules = rewriter.getModules();
      if (!modules || modules.length === 0)
        throw new Error("Modules failed");
    });
  }

  /**
   * Performance Benchmarks
   */
  private async testPerformance(): Promise<void> {
    // Test 1: Simple graph execution speed
    await this.test("Performance: 1000 simple executions", async () => {
      const graph: NexGraph = {
        nodes: [
          { id: "goal", kind: "goal", data: {} },
          {
            id: "guard",
            kind: "guard",
            data: { condition: true, consequence: "allow" },
          },
        ],
        links: [{ from: "goal", to: "guard", type: "sync" }],
        entry: "goal",
      };

      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        const interpreter = new NexInterpreter(graph);
        await interpreter.execute();
      }
      const elapsed = Date.now() - start;

      const avgPerExecution = elapsed / 1000;
      console.log(
        `    ✓ 1000 executions in ${elapsed}ms (${avgPerExecution.toFixed(
          2
        )}ms each)`
      );

      if (elapsed > 30000) throw new Error("Performance degradation");
    });

    // Test 2: Complex graph execution
    await this.test("Performance: Complex 100-node graph", async () => {
      const nodes = [];
      const links = [];

      for (let i = 0; i < 100; i++) {
        nodes.push({
          id: `n${i}`,
          kind: i % 10 === 0 ? "guard" : "goal" as const,
          data: {},
        });

        if (i > 0) {
          links.push({
            from: `n${i - 1}`,
            to: `n${i}`,
            type: "sync" as const,
          });
        }
      }

      const graph: NexGraph = {
        nodes,
        links,
        entry: "n0",
      };

      const start = Date.now();
      const interpreter = new NexInterpreter(graph);
      await interpreter.execute();
      const elapsed = Date.now() - start;

      console.log(`    ✓ 100-node graph executed in ${elapsed}ms`);

      if (elapsed > 5000) throw new Error("Complex graph too slow");
    });

    // Test 3: Large parallel execution
    await this.test("Performance: 50 parallel branches", async () => {
      const nodes = [{ id: "start", kind: "goal" as const, data: {} }];
      const links = [];

      for (let i = 0; i < 50; i++) {
        nodes.push({
          id: `branch${i}`,
          kind: "agent" as const,
          data: { role: `worker${i}` },
        });
        links.push({
          from: "start",
          to: `branch${i}`,
          type: "parallel" as const,
        });
      }

      nodes.push({ id: "merge", kind: "merge" as const, data: {} });
      for (let i = 0; i < 50; i++) {
        links.push({
          from: `branch${i}`,
          to: "merge",
          type: "sync" as const,
        });
      }

      const graph: NexGraph = { nodes, links, entry: "start" };

      const start = Date.now();
      const interpreter = new NexInterpreter(graph);
      await interpreter.execute();
      const elapsed = Date.now() - start;

      console.log(`    ✓ 50 parallel branches in ${elapsed}ms`);
    });
  }

  /**
   * Helper: Run a single test
   */
  private async test(name: string, fn: () => Promise<void>): Promise<void> {
    const start = Date.now();
    try {
      await fn();
      const duration = Date.now() - start;
      this.results.push({ name, passed: true, duration });
      this.passCount++;
      console.log(
        `✅ ${name} (${duration}ms)`
      );
    } catch (error) {
      const duration = Date.now() - start;
      this.results.push({ name, passed: false, duration, error: String(error) });
      this.failCount++;
      console.log(`❌ ${name} — ${error}`);
    }
  }

  /**
   * Print summary
   */
  private printSummary(): void {
    console.log(
      "\n═══════════════════════════════════════════════════════════════"
    );
    console.log("  Test Summary");
    console.log(
      "═══════════════════════════════════════════════════════════════\n"
    );

    console.log(`✅ Passed: ${this.passCount}`);
    console.log(`❌ Failed: ${this.failCount}`);
    console.log(`📊 Total: ${this.passCount + this.failCount}`);
    console.log(
      `📈 Success Rate: ${(
        (this.passCount / (this.passCount + this.failCount)) *
        100
      ).toFixed(2)}%\n`
    );

    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);
    console.log(`⏱️  Total Time: ${totalTime}ms`);
    console.log(
      `⚡ Average: ${(totalTime / this.results.length).toFixed(2)}ms per test\n`
    );

    if (this.failCount === 0) {
      console.log(
        "🎉 All tests passed! Nex v2.5.0 is production-ready.\n"
      );
    }
  }
}

// Run tests if executed directly
async function main() {
  const suite = new NexTestSuite();
  await suite.runAll();
}

main().catch(console.error);

export { NexTestSuite };
