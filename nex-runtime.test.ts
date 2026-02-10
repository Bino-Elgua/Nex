import { describe, it, expect, beforeEach } from "bun:test";
import { NexInterpreter, NexGraph } from "./nex-runtime";

describe("NexInterpreter", () => {
  describe("Validation", () => {
    it("should validate graph structure", () => {
      const graph: NexGraph = {
        nodes: [
          { id: "n1", kind: "goal", data: { test: true } },
          { id: "n2", kind: "guard", data: { condition: true, consequence: "allow" } },
        ],
        links: [{ from: "n1", to: "n2", type: "sync" }],
        entry: "n1",
      };
      const interpreter = new NexInterpreter(graph);
      expect(interpreter).toBeDefined();
    });

    it("should reject graph without entry node", () => {
      const graph: NexGraph = {
        nodes: [{ id: "n1", kind: "goal", data: {} }],
        links: [],
        entry: "missing",
      };
      expect(() => new NexInterpreter(graph)).toThrow();
    });

    it("should reject graph without guard node", () => {
      const graph: NexGraph = {
        nodes: [{ id: "n1", kind: "goal", data: {} }],
        links: [],
        entry: "n1",
      };
      expect(() => new NexInterpreter(graph)).toThrow();
    });

    it("should reject link referencing non-existent from node", () => {
      const graph: NexGraph = {
        nodes: [
          { id: "n1", kind: "goal", data: {} },
          { id: "n2", kind: "guard", data: { condition: true, consequence: "allow" } },
        ],
        links: [{ from: "missing", to: "n2", type: "sync" }],
        entry: "n1",
      };
      expect(() => new NexInterpreter(graph)).toThrow();
    });

    it("should reject link referencing non-existent to node", () => {
      const graph: NexGraph = {
        nodes: [
          { id: "n1", kind: "goal", data: {} },
          { id: "n2", kind: "guard", data: { condition: true, consequence: "allow" } },
        ],
        links: [{ from: "n1", to: "missing", type: "sync" }],
        entry: "n1",
      };
      expect(() => new NexInterpreter(graph)).toThrow();
    });
  });

  describe("Basic Execution", () => {
    it("should execute simple goal node", async () => {
      const graph: NexGraph = {
        nodes: [
          { id: "goal", kind: "goal", data: { message: "test" } },
          { id: "guard", kind: "guard", data: { condition: true, consequence: "allow" } },
        ],
        links: [{ from: "goal", to: "guard", type: "sync" }],
        entry: "goal",
      };
      const interpreter = new NexInterpreter(graph);
      const result = await interpreter.execute();
      expect(result.type).toBe("goal");
      expect(result.data.message).toBe("test");
    });

    it("should execute memory node", async () => {
      const graph: NexGraph = {
        nodes: [
          { id: "memory", kind: "memory", data: { stored_value: 42 } },
          { id: "guard", kind: "guard", data: { condition: true, consequence: "allow" } },
        ],
        links: [{ from: "memory", to: "guard", type: "sync" }],
        entry: "memory",
      };
      const interpreter = new NexInterpreter(graph);
      const result = await interpreter.execute();
      expect(result.type).toBe("memory");
      expect(result.data.stored_value).toBe(42);
    });
  });

  describe("Guard Nodes", () => {
    it("should allow when condition passes", async () => {
      const graph: NexGraph = {
        nodes: [
          { id: "goal", kind: "goal", data: {} },
          { id: "guard", kind: "guard", data: { condition: true, consequence: "allow" } },
        ],
        links: [{ from: "goal", to: "guard", type: "sync" }],
        entry: "goal",
      };
      const interpreter = new NexInterpreter(graph);
      await interpreter.execute();
      const results = interpreter.getResults();
      const guardResult = results.get("guard");
      expect(guardResult.passed).toBe(true);
    });

    it("should deny when consequence is deny", async () => {
      const graph: NexGraph = {
        nodes: [
          { id: "goal", kind: "goal", data: {} },
          { id: "guard", kind: "guard", data: { condition: false, consequence: "deny" } },
        ],
        links: [{ from: "goal", to: "guard", type: "sync" }],
        entry: "goal",
      };
      const interpreter = new NexInterpreter(graph);
      expect(interpreter.execute()).rejects.toThrow();
    });
  });

  describe("Rewrite Nodes", () => {
    it("should execute rewrite node", async () => {
      const graph: NexGraph = {
        nodes: [
          { id: "goal", kind: "goal", data: {} },
          {
            id: "rewrite",
            kind: "rewrite",
            data: { pattern: "old", replacement: "new" },
          },
          { id: "guard", kind: "guard", data: { condition: true, consequence: "allow" } },
        ],
        links: [
          { from: "goal", to: "rewrite", type: "sync" },
          { from: "rewrite", to: "guard", type: "sync" },
        ],
        entry: "goal",
      };
      const interpreter = new NexInterpreter(graph);
      await interpreter.execute();
      const results = interpreter.getResults();
      const rewriteResult = results.get("rewrite");
      expect(rewriteResult.type).toBe("rewrite");
      expect(rewriteResult.applied).toBe(true);
    });
  });

  describe("Merge Nodes", () => {
    it("should merge consensus strategy", async () => {
      const graph: NexGraph = {
        nodes: [
          { id: "goal", kind: "goal", data: {} },
          { id: "m1", kind: "memory", data: { value: 1 } },
          { id: "m2", kind: "memory", data: { value: 2 } },
          {
            id: "merge",
            kind: "merge",
            data: { strategy: "consensus", inputs: ["m1", "m2"] },
          },
          { id: "guard", kind: "guard", data: { condition: true, consequence: "allow" } },
        ],
        links: [
          { from: "goal", to: "m1", type: "sync" },
          { from: "goal", to: "m2", type: "sync" },
          { from: "m1", to: "merge", type: "sync" },
          { from: "m2", to: "merge", type: "sync" },
          { from: "merge", to: "guard", type: "sync" },
        ],
        entry: "goal",
      };
      const interpreter = new NexInterpreter(graph);
      await interpreter.execute();
      const results = interpreter.getResults();
      const mergeResult = results.get("merge");
      expect(mergeResult.type).toBe("merge");
      expect(mergeResult.strategy).toBe("consensus");
    });

    it("should merge synthesize strategy", async () => {
      const graph: NexGraph = {
        nodes: [
          { id: "goal", kind: "goal", data: {} },
          { id: "m1", kind: "memory", data: { value: 1 } },
          { id: "m2", kind: "memory", data: { value: 2 } },
          {
            id: "merge",
            kind: "merge",
            data: { strategy: "synthesize", inputs: ["m1", "m2"] },
          },
          { id: "guard", kind: "guard", data: { condition: true, consequence: "allow" } },
        ],
        links: [
          { from: "goal", to: "m1", type: "sync" },
          { from: "goal", to: "m2", type: "sync" },
          { from: "m1", to: "merge", type: "sync" },
          { from: "m2", to: "merge", type: "sync" },
          { from: "merge", to: "guard", type: "sync" },
        ],
        entry: "goal",
      };
      const interpreter = new NexInterpreter(graph);
      await interpreter.execute();
      const results = interpreter.getResults();
      const mergeResult = results.get("merge");
      expect(mergeResult.merged.synthesized).toBe(true);
    });
  });

  describe("Agent Spawn Nodes", () => {
    it("should spawn agent node", async () => {
      const graph: NexGraph = {
        nodes: [
          { id: "goal", kind: "goal", data: {} },
          {
            id: "agent",
            kind: "agent",
            data: {
              role: "test-agent",
              goal: "test",
              instructions: "do something",
            },
          },
          { id: "guard", kind: "guard", data: { condition: true, consequence: "allow" } },
        ],
        links: [
          { from: "goal", to: "agent", type: "sync" },
          { from: "agent", to: "guard", type: "sync" },
        ],
        entry: "goal",
      };
      const interpreter = new NexInterpreter(graph);
      await interpreter.execute();
      const results = interpreter.getResults();
      const agentResult = results.get("agent");
      expect(agentResult.type).toBe("agent");
      expect(agentResult.spawned).toBe(true);
    });
  });

  describe("Reflect/Dream Nodes", () => {
    it("should execute reflect node", async () => {
      const graph: NexGraph = {
        nodes: [
          { id: "goal", kind: "goal", data: {} },
          {
            id: "reflect",
            kind: "reflect",
            data: { reasoning: "think deeply" },
          },
          { id: "guard", kind: "guard", data: { condition: true, consequence: "allow" } },
        ],
        links: [
          { from: "goal", to: "reflect", type: "sync" },
          { from: "reflect", to: "guard", type: "sync" },
        ],
        entry: "goal",
      };
      const interpreter = new NexInterpreter(graph);
      await interpreter.execute();
      const results = interpreter.getResults();
      const reflectResult = results.get("reflect");
      expect(reflectResult.type).toBe("reflect");
    });
  });

  describe("Parallel Execution", () => {
    it("should execute parallel branches", async () => {
      const graph: NexGraph = {
        nodes: [
          { id: "goal", kind: "goal", data: {} },
          { id: "parallel", kind: "parallel", data: { description: "branch" } },
          { id: "m1", kind: "memory", data: { value: 1 } },
          { id: "m2", kind: "memory", data: { value: 2 } },
          { id: "guard", kind: "guard", data: { condition: true, consequence: "allow" } },
        ],
        links: [
          { from: "goal", to: "parallel", type: "sync" },
          { from: "parallel", to: "m1", type: "parallel" },
          { from: "parallel", to: "m2", type: "parallel" },
          { from: "m1", to: "guard", type: "sync" },
          { from: "m2", to: "guard", type: "sync" },
        ],
        entry: "goal",
      };
      const interpreter = new NexInterpreter(graph);
      await interpreter.execute();
      const results = interpreter.getResults();
      const parallelResult = results.get("parallel");
      expect(parallelResult.type).toBe("parallel");
      expect(Array.isArray(parallelResult.branches)).toBe(true);
    });
  });

  describe("Graph Output", () => {
    it("should produce valid output graph", async () => {
      const graph: NexGraph = {
        nodes: [
          { id: "goal", kind: "goal", data: { message: "hello" } },
          { id: "guard", kind: "guard", data: { condition: true, consequence: "allow" } },
        ],
        links: [{ from: "goal", to: "guard", type: "sync" }],
        entry: "goal",
      };
      const interpreter = new NexInterpreter(graph);
      await interpreter.execute();
      const output = interpreter.outputGraph();
      expect(output.nodes).toBeDefined();
      expect(output.links).toBeDefined();
      expect(output.entry).toBe("goal");
      expect(output.result).toBeDefined();
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle multi-node sequential flow", async () => {
      const graph: NexGraph = {
        nodes: [
          { id: "goal", kind: "goal", data: { step: 1 } },
          { id: "memory1", kind: "memory", data: { step: 2 } },
          { id: "memory2", kind: "memory", data: { step: 3 } },
          {
            id: "guard",
            kind: "guard",
            data: { condition: true, consequence: "allow" },
          },
        ],
        links: [
          { from: "goal", to: "memory1", type: "sync" },
          { from: "memory1", to: "memory2", type: "sync" },
          { from: "memory2", to: "guard", type: "sync" },
        ],
        entry: "goal",
      };
      const interpreter = new NexInterpreter(graph);
      await interpreter.execute();
      const results = interpreter.getResults();
      expect(results.get("goal")).toBeDefined();
      expect(results.get("memory1")).toBeDefined();
      expect(results.get("memory2")).toBeDefined();
      expect(results.get("guard")).toBeDefined();
    });

    it("should handle tool nodes", async () => {
      const graph: NexGraph = {
        nodes: [
          { id: "goal", kind: "goal", data: {} },
          {
            id: "tool",
            kind: "tool",
            data: { name: "browser", action: "screenshot" },
          },
          { id: "guard", kind: "guard", data: { condition: true, consequence: "allow" } },
        ],
        links: [
          { from: "goal", to: "tool", type: "sync" },
          { from: "tool", to: "guard", type: "sync" },
        ],
        entry: "goal",
      };
      const interpreter = new NexInterpreter(graph);
      await interpreter.execute();
      const results = interpreter.getResults();
      const toolResult = results.get("tool");
      expect(toolResult.type).toBe("tool");
    });
  });
});
