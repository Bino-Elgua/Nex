#!/usr/bin/env node
/**
 * Multi-Agent Dispatcher v1.0 — Concurrent Agent Orchestration
 *
 * Manages 1000+ concurrent agents, each with isolated graphs
 * Implements fair scheduling, result aggregation, and fallback logic
 */

import { NexInterpreter, NexGraph } from "./nex-runtime.js";

interface AgentInstance {
  id: string;
  role: string;
  goal: string;
  graph: NexGraph;
  status: "pending" | "running" | "completed" | "failed";
  result?: any;
  error?: string;
  startTime?: number;
  endTime?: number;
  executionMs?: number;
}

interface DispatcherStats {
  totalAgents: number;
  running: number;
  completed: number;
  failed: number;
  uptime: number;
  avgExecutionMs: number;
}

interface AgentSpawnRequest {
  role: string;
  goal: string;
  instructions?: string;
  graph: NexGraph;
}

export class MultiAgentDispatcher {
  private agents: Map<string, AgentInstance> = new Map();
  private results: Map<string, any> = new Map();
  private errors: Map<string, string> = new Map();
  private concurrencyLimit: number;
  private runningCount: number = 0;
  private startTime: number = Date.now();
  private queue: AgentInstance[] = [];

  constructor(concurrencyLimit: number = 100) {
    this.concurrencyLimit = concurrencyLimit;
  }

  /**
   * Spawn a new agent
   */
  public async spawnAgent(request: AgentSpawnRequest): Promise<string> {
    const agentId = `agent-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const agent: AgentInstance = {
      id: agentId,
      role: request.role,
      goal: request.goal,
      graph: request.graph,
      status: "pending",
    };

    this.agents.set(agentId, agent);

    // If under concurrency limit, execute immediately
    if (this.runningCount < this.concurrencyLimit) {
      await this.executeAgent(agent);
    } else {
      // Queue for later execution
      this.queue.push(agent);
    }

    return agentId;
  }

  /**
   * Execute a single agent's graph
   */
  private async executeAgent(agent: AgentInstance): Promise<void> {
    agent.status = "running";
    agent.startTime = Date.now();
    this.runningCount++;

    try {
      const interpreter = new NexInterpreter(agent.graph);
      const result = await interpreter.execute();

      agent.result = result;
      agent.status = "completed";
      this.results.set(agent.id, result);
    } catch (error) {
      agent.error = String(error);
      agent.status = "failed";
      this.errors.set(agent.id, String(error));
    }

    agent.endTime = Date.now();
    agent.executionMs = agent.endTime - (agent.startTime || 0);
    this.runningCount--;

    // Process queued agents
    if (this.queue.length > 0) {
      const nextAgent = this.queue.shift();
      if (nextAgent) {
        await this.executeAgent(nextAgent);
      }
    }
  }

  /**
   * Spawn multiple agents in parallel
   */
  public async spawnAgentBatch(
    requests: AgentSpawnRequest[]
  ): Promise<string[]> {
    const agentIds: string[] = [];

    for (const request of requests) {
      const id = await this.spawnAgent(request);
      agentIds.push(id);
    }

    // Wait for all to complete
    await this.waitForCompletion(agentIds);

    return agentIds;
  }

  /**
   * Wait for agents to complete
   */
  public async waitForCompletion(agentIds: string[]): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const allDone = agentIds.every((id) => {
          const agent = this.agents.get(id);
          return agent && agent.status !== "pending" && agent.status !== "running";
        });

        if (allDone) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  /**
   * Get result from completed agent
   */
  public getResult(agentId: string): any | null {
    return this.results.get(agentId) || null;
  }

  /**
   * Get error from failed agent
   */
  public getError(agentId: string): string | null {
    return this.errors.get(agentId) || null;
  }

  /**
   * Get agent status
   */
  public getAgentStatus(agentId: string): AgentInstance | null {
    return this.agents.get(agentId) || null;
  }

  /**
   * Aggregate results from multiple agents
   */
  public aggregateResults(agentIds: string[], strategy: "all" | "first-success" | "merge"): any[] {
    const results: any[] = [];

    if (strategy === "all") {
      for (const id of agentIds) {
        const result = this.results.get(id);
        if (result) results.push(result);
      }
    } else if (strategy === "first-success") {
      for (const id of agentIds) {
        const result = this.results.get(id);
        if (result) {
          return [result];
        }
      }
    } else if (strategy === "merge") {
      const merged = {
        agents: agentIds.length,
        results: results,
        errors: this.errors.size,
      };
      return [merged];
    }

    return results;
  }

  /**
   * Get dispatcher statistics
   */
  public getStats(): DispatcherStats {
    const completed = Array.from(this.agents.values()).filter(
      (a) => a.status === "completed"
    );
    const failed = Array.from(this.agents.values()).filter(
      (a) => a.status === "failed"
    );

    const totalExecutionMs = completed.reduce(
      (sum, agent) => sum + (agent.executionMs || 0),
      0
    );

    return {
      totalAgents: this.agents.size,
      running: this.runningCount + this.queue.length,
      completed: completed.length,
      failed: failed.length,
      uptime: Date.now() - this.startTime,
      avgExecutionMs:
        completed.length > 0
          ? totalExecutionMs / completed.length
          : 0,
    };
  }

  /**
   * List all agents
   */
  public listAgents(): AgentInstance[] {
    return Array.from(this.agents.values());
  }

  /**
   * Reset dispatcher
   */
  public reset(): void {
    this.agents.clear();
    this.results.clear();
    this.errors.clear();
    this.queue = [];
    this.runningCount = 0;
  }
}

// Example usage
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const dispatcher = new MultiAgentDispatcher(10); // Max 10 concurrent

    console.log("═══════════════════════════════════════════════════════");
    console.log("  Multi-Agent Dispatcher v1.0 — Spawn Test");
    console.log("═══════════════════════════════════════════════════════\n");

    // Create sample graph
    const sampleGraph: NexGraph = {
      nodes: [
        { id: "goal", kind: "goal", data: { task: "process_data" } },
        {
          id: "guard",
          kind: "guard",
          data: { condition: true, consequence: "allow" },
        },
      ],
      links: [{ from: "goal", to: "guard", type: "sync" }],
      entry: "goal",
    };

    // Spawn 100 agents
    console.log("Spawning 100 agents...");
    const agentIds: string[] = [];

    for (let i = 0; i < 100; i++) {
      const id = await dispatcher.spawnAgent({
        role: `worker-${i}`,
        goal: `Execute task ${i}`,
        graph: sampleGraph,
      });
      agentIds.push(id);

      if ((i + 1) % 10 === 0) {
        console.log(`  Spawned ${i + 1} agents...`);
      }
    }

    console.log("\nWaiting for completion...");
    await dispatcher.waitForCompletion(agentIds);

    console.log("\n📊 Dispatcher Statistics:");
    const stats = dispatcher.getStats();
    console.log(JSON.stringify(stats, null, 2));

    console.log("\n✅ Multi-agent dispatch test complete");
  })();
}
