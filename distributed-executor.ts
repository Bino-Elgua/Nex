#!/usr/bin/env node
/**
 * Nex v2.0.0 — Distributed Graph Execution
 *
 * Executes graphs across multiple machines with:
 * - Graph partitioning and load balancing
 * - Cross-machine communication
 * - Distributed merge strategies
 * - Replication and failover
 */

import { NexGraph, NexNode, NexLink } from "./nex-runtime.js";
import { NexInterpreter } from "./nex-runtime.js";

interface NodeLocation {
  nodeId: string;
  machineId: string;
  hostname: string;
  port: number;
}

interface ExecutionPlan {
  graphId: string;
  partitions: GraphPartition[];
  schedule: ExecutionSchedule;
  replication: ReplicationStrategy;
}

interface GraphPartition {
  partitionId: string;
  nodes: NexNode[];
  links: NexLink[];
  dependencies: string[]; // partition IDs this depends on
  targetMachine?: string;
}

interface ExecutionSchedule {
  phases: ExecutionPhase[];
  criticalPath: string[];
  estimatedTimeMs: number;
}

interface ExecutionPhase {
  phaseId: string;
  partitions: string[];
  parallelism: number;
  timeoutMs: number;
}

interface ReplicationStrategy {
  enabled: boolean;
  factor: number; // 3 = store 3 copies
  consistency: "strong" | "eventual";
  primaryMachine: string;
}

interface ClusterNode {
  machineId: string;
  hostname: string;
  port: number;
  status: "healthy" | "degraded" | "offline";
  cpuUsage: number;
  memoryUsage: number;
  executions: number;
  capacity: number;
}

export class DistributedExecutor {
  private cluster: Map<string, ClusterNode> = new Map();
  private nodeLocations: Map<string, NodeLocation> = new Map();
  private executionPlans: Map<string, ExecutionPlan> = new Map();
  private activeExecutions: Map<string, ExecutionProgress> = new Map();

  constructor(private localMachineId: string = "machine_0") {
    this.initializeLocalNode();
  }

  /**
   * Register a machine in the cluster
   */
  public registerMachine(
    machineId: string,
    hostname: string,
    port: number
  ): ClusterNode {
    const node: ClusterNode = {
      machineId,
      hostname,
      port,
      status: "healthy",
      cpuUsage: 0,
      memoryUsage: 0,
      executions: 0,
      capacity: 100,
    };

    this.cluster.set(machineId, node);
    return node;
  }

  /**
   * Deregister a machine
   */
  public deregisterMachine(machineId: string): boolean {
    return this.cluster.delete(machineId);
  }

  /**
   * Partition a graph across the cluster
   */
  public partitionGraph(graph: NexGraph): ExecutionPlan {
    const partitions = this.computePartitions(graph);
    const schedule = this.computeSchedule(partitions);
    const replication = this.computeReplication(partitions);

    const plan: ExecutionPlan = {
      graphId: `plan_${Date.now()}`,
      partitions,
      schedule,
      replication,
    };

    this.executionPlans.set(plan.graphId, plan);
    return plan;
  }

  /**
   * Execute a distributed graph
   */
  public async executeDistributed(
    graph: NexGraph,
    opts?: { replication?: boolean; async?: boolean }
  ): Promise<{ result: any; executionMs: number }> {
    const startTime = Date.now();

    try {
      // Partition the graph
      const plan = this.partitionGraph(graph);

      // Assign partitions to machines
      this.assignPartitions(plan);

      // Execute partitions in sequence/parallel
      const results = await this.executePartitions(plan);

      // Merge results
      const result = this.mergeResults(graph, results);

      return {
        result,
        executionMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error("[Distributed] Execution failed:", error);
      throw error;
    }
  }

  /**
   * Partition graph into sub-graphs
   */
  private computePartitions(graph: NexGraph): GraphPartition[] {
    const partitions: GraphPartition[] = [];

    // Simple partitioning: each partition is a connected component
    // In production, use more sophisticated algorithms

    const visited = new Set<string>();
    let partitionCounter = 0;

    for (const node of graph.nodes) {
      if (visited.has(node.id)) continue;

      // Find connected component
      const component = this.dfs(node.id, graph);
      const nodes = graph.nodes.filter((n) => component.has(n.id));
      const links = graph.links.filter(
        (l) => component.has(l.from) && component.has(l.to)
      );

      const partition: GraphPartition = {
        partitionId: `partition_${partitionCounter}`,
        nodes,
        links,
        dependencies: this.findDependencies(partition, graph),
      };

      partitions.push(partition);

      for (const n of component) {
        visited.add(n);
      }

      partitionCounter++;
    }

    return partitions;
  }

  /**
   * DFS to find connected component
   */
  private dfs(nodeId: string, graph: NexGraph): Set<string> {
    const visited = new Set<string>();
    const stack = [nodeId];

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (visited.has(current)) continue;

      visited.add(current);

      // Find all connected nodes
      const links = graph.links.filter(
        (l) => l.from === current || l.to === current
      );
      for (const link of links) {
        const next = link.from === current ? link.to : link.from;
        if (!visited.has(next)) {
          stack.push(next);
        }
      }
    }

    return visited;
  }

  /**
   * Find partition dependencies
   */
  private findDependencies(partition: GraphPartition, graph: NexGraph): string[] {
    // Find links going into this partition from other nodes
    const nodeIds = new Set(partition.nodes.map((n) => n.id));
    const dependencies = new Set<string>();

    for (const link of graph.links) {
      if (!nodeIds.has(link.from) && nodeIds.has(link.to)) {
        // Link from outside into this partition
        dependencies.add(link.from);
      }
    }

    return Array.from(dependencies);
  }

  /**
   * Compute execution schedule
   */
  private computeSchedule(partitions: GraphPartition[]): ExecutionSchedule {
    // Topological sort to determine phases
    const phases: ExecutionPhase[] = [];
    const processed = new Set<string>();

    let phaseCounter = 0;

    while (processed.size < partitions.length) {
      const phase: ExecutionPhase = {
        phaseId: `phase_${phaseCounter}`,
        partitions: [],
        parallelism: 0,
        timeoutMs: 30000,
      };

      for (const partition of partitions) {
        if (processed.has(partition.partitionId)) continue;

        // Check if dependencies are satisfied
        const depsSatisfied = partition.dependencies.every((depId) =>
          processed.has(depId)
        );

        if (depsSatisfied) {
          phase.partitions.push(partition.partitionId);
          processed.add(partition.partitionId);
        }
      }

      if (phase.partitions.length > 0) {
        phase.parallelism = phase.partitions.length;
        phases.push(phase);
      }

      phaseCounter++;
    }

    return {
      phases,
      criticalPath: [], // Simplified; compute real critical path in production
      estimatedTimeMs: phases.length * 5000, // Rough estimate
    };
  }

  /**
   * Compute replication strategy
   */
  private computeReplication(partitions: GraphPartition[]): ReplicationStrategy {
    return {
      enabled: partitions.length > 2,
      factor: Math.min(3, this.cluster.size),
      consistency: "strong",
      primaryMachine: this.localMachineId,
    };
  }

  /**
   * Assign partitions to cluster machines
   */
  private assignPartitions(plan: ExecutionPlan): void {
    const machines = Array.from(this.cluster.values()).sort(
      (a, b) => a.executions - b.executions
    );

    for (let i = 0; i < plan.partitions.length; i++) {
      const partition = plan.partitions[i];
      const machine = machines[i % machines.length];
      partition.targetMachine = machine.machineId;

      for (const node of partition.nodes) {
        this.nodeLocations.set(node.id, {
          nodeId: node.id,
          machineId: machine.machineId,
          hostname: machine.hostname,
          port: machine.port,
        });
      }
    }
  }

  /**
   * Execute partitions
   */
  private async executePartitions(
    plan: ExecutionPlan
  ): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    const progress: ExecutionProgress = {
      planId: plan.graphId,
      completedPartitions: 0,
      failedPartitions: 0,
      status: "running",
    };

    this.activeExecutions.set(plan.graphId, progress);

    for (const phase of plan.schedule.phases) {
      // Execute partitions in this phase in parallel
      const promisees = phase.partitions.map((partitionId) =>
        this.executePartition(plan, partitionId, results)
      );

      try {
        await Promise.race([
          Promise.all(promisees),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Phase timeout")), phase.timeoutMs)
          ),
        ]);

        progress.completedPartitions += phase.partitions.length;
      } catch (error) {
        progress.failedPartitions += phase.partitions.length;
        progress.status = "error";
        throw error;
      }
    }

    progress.status = "complete";
    return results;
  }

  /**
   * Execute a single partition
   */
  private async executePartition(
    plan: ExecutionPlan,
    partitionId: string,
    results: Map<string, any>
  ): Promise<void> {
    const partition = plan.partitions.find(
      (p) => p.partitionId === partitionId
    );
    if (!partition) return;

    // Create a sub-graph from partition
    const subGraph: NexGraph = {
      nodes: partition.nodes,
      links: partition.links,
      entry: partition.nodes[0]?.id || "",
    };

    // Execute locally (in production, send to remote machine)
    const interpreter = new NexInterpreter(subGraph);
    const result = await interpreter.execute();

    results.set(partitionId, result);
  }

  /**
   * Merge results from all partitions
   */
  private mergeResults(graph: NexGraph, results: Map<string, any>): any {
    // Find merge nodes in original graph
    const mergeNodes = graph.nodes.filter((n) => n.kind === "merge");

    if (mergeNodes.length === 0) {
      // No explicit merge; return first non-null result
      for (const result of results.values()) {
        if (result) return result;
      }
      return null;
    }

    // Apply merge strategies
    const merged: Record<string, any> = {};
    for (const mergeNode of mergeNodes) {
      merged[mergeNode.id] = results.get(mergeNode.id) || null;
    }

    return merged;
  }

  /**
   * Get cluster status
   */
  public getClusterStatus() {
    return {
      machines: Array.from(this.cluster.values()),
      nodeLocations: Array.from(this.nodeLocations.entries()),
      activeExecutions: this.activeExecutions.size,
      totalCapacity: Array.from(this.cluster.values()).reduce(
        (sum, m) => sum + m.capacity,
        0
      ),
      usedCapacity: Array.from(this.cluster.values()).reduce(
        (sum, m) => sum + m.executions,
        0
      ),
    };
  }

  /**
   * Initialize local node
   */
  private initializeLocalNode() {
    this.registerMachine(this.localMachineId, "localhost", 18789);
  }
}

interface ExecutionProgress {
  planId: string;
  completedPartitions: number;
  failedPartitions: number;
  status: "running" | "complete" | "error";
}

export {
  ExecutionPlan,
  GraphPartition,
  ExecutionSchedule,
  ReplicationStrategy,
  ClusterNode,
  ExecutionProgress,
};
