#!/usr/bin/env node
/**
 * Nex v1.2.0 — Storage & Persistence Adapter
 *
 * Abstracts database operations for graph persistence.
 * Supports multiple backends: PostgreSQL, SQLite, MongoDB.
 * Provides file system access for tools.
 */

import { NexGraph } from "./nex-runtime.js";

interface StorageConfig {
  type: "postgresql" | "sqlite" | "mongodb" | "memory";
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
  filePath?: string; // for sqlite
}

interface StoredGraph {
  id: string;
  content: NexGraph;
  hash: string;
  owner: string;
  createdAt: number;
  updatedAt: number;
  isPublic: boolean;
  tags: string[];
}

interface ExecutionRecord {
  id: string;
  graphId: string;
  result: any;
  status: "success" | "error" | "timeout";
  error?: string;
  executionMs: number;
  executedBy: string;
  timestamp: number;
}

interface FileHandle {
  path: string;
  content: string | Buffer;
  mimeType: string;
  size: number;
  created: number;
  modified: number;
}

export class StorageAdapter {
  private config: StorageConfig;
  private memoryStore: Map<string, StoredGraph> = new Map();
  private executionRecords: ExecutionRecord[] = [];

  constructor(config: StorageConfig) {
    this.config = config;
  }

  /**
   * Initialize storage backend
   */
  public async connect(): Promise<void> {
    switch (this.config.type) {
      case "sqlite":
        await this.initSqlite();
        break;
      case "postgresql":
        await this.initPostgres();
        break;
      case "mongodb":
        await this.initMongoDB();
        break;
      case "memory":
        // In-memory storage, nothing to initialize
        break;
    }

    console.log(
      `[Storage] Connected to ${this.config.type} database: ${this.config.database}`
    );
  }

  /**
   * Store a graph
   */
  public async storeGraph(
    graph: NexGraph,
    owner: string,
    isPublic: boolean = false,
    tags: string[] = []
  ): Promise<string> {
    const graphId = `graph_${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}`;
    const hash = this.computeHash(JSON.stringify(graph));

    const stored: StoredGraph = {
      id: graphId,
      content: graph,
      hash,
      owner,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPublic,
      tags,
    };

    if (this.config.type === "memory") {
      this.memoryStore.set(graphId, stored);
    } else {
      await this.storeInDatabase(stored);
    }

    return graphId;
  }

  /**
   * Retrieve a graph
   */
  public async getGraph(
    graphId: string,
    userId?: string
  ): Promise<NexGraph | null> {
    let stored: StoredGraph | null = null;

    if (this.config.type === "memory") {
      stored = this.memoryStore.get(graphId) || null;
    } else {
      stored = await this.retrieveFromDatabase(graphId);
    }

    if (!stored) return null;

    // Check permissions
    if (!stored.isPublic && stored.owner !== userId) {
      throw new Error("Access denied");
    }

    return stored.content;
  }

  /**
   * List graphs (paginated)
   */
  public async listGraphs(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ graphs: StoredGraph[]; total: number }> {
    const allGraphs = Array.from(this.memoryStore.values()).filter(
      (g) => g.isPublic || g.owner === userId
    );

    const graphs = allGraphs.slice(offset, offset + limit);
    return { graphs, total: allGraphs.length };
  }

  /**
   * Update a graph
   */
  public async updateGraph(
    graphId: string,
    graph: NexGraph,
    userId: string
  ): Promise<boolean> {
    const stored = this.memoryStore.get(graphId);
    if (!stored) return false;

    // Check ownership
    if (stored.owner !== userId) {
      throw new Error("Only owner can update graph");
    }

    stored.content = graph;
    stored.hash = this.computeHash(JSON.stringify(graph));
    stored.updatedAt = Date.now();

    return true;
  }

  /**
   * Delete a graph
   */
  public async deleteGraph(graphId: string, userId: string): Promise<boolean> {
    const stored = this.memoryStore.get(graphId);
    if (!stored) return false;

    // Check ownership
    if (stored.owner !== userId) {
      throw new Error("Only owner can delete graph");
    }

    this.memoryStore.delete(graphId);
    return true;
  }

  /**
   * Record execution
   */
  public async recordExecution(
    graphId: string,
    result: any,
    status: "success" | "error" | "timeout",
    executionMs: number,
    executedBy: string,
    error?: string
  ): Promise<string> {
    const recordId = `exec_${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}`;

    const record: ExecutionRecord = {
      id: recordId,
      graphId,
      result,
      status,
      error,
      executionMs,
      executedBy,
      timestamp: Date.now(),
    };

    this.executionRecords.push(record);
    return recordId;
  }

  /**
   * Get execution history
   */
  public async getExecutionHistory(
    graphId: string,
    limit: number = 100
  ): Promise<ExecutionRecord[]> {
    return this.executionRecords
      .filter((r) => r.graphId === graphId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * File system operations
   */
  public async writeFile(
    path: string,
    content: string | Buffer,
    owner: string
  ): Promise<FileHandle> {
    // In production, use actual file system with permission checks
    const mimeType = this.getMimeType(path);
    const size = typeof content === "string" ? content.length : content.length;

    return {
      path,
      content,
      mimeType,
      size,
      created: Date.now(),
      modified: Date.now(),
    };
  }

  /**
   * Read file
   */
  public async readFile(path: string, owner: string): Promise<FileHandle | null> {
    // In production, use actual file system with permission checks
    return null;
  }

  /**
   * List files in directory
   */
  public async listFiles(
    directory: string,
    owner: string
  ): Promise<FileHandle[]> {
    // In production, use actual file system with permission checks
    return [];
  }

  /**
   * Delete file
   */
  public async deleteFile(path: string, owner: string): Promise<boolean> {
    // In production, use actual file system with permission checks
    return true;
  }

  /**
   * Search graphs by tag
   */
  public async searchByTag(tag: string, userId: string): Promise<StoredGraph[]> {
    return Array.from(this.memoryStore.values()).filter(
      (g) => (g.isPublic || g.owner === userId) && g.tags.includes(tag)
    );
  }

  /**
   * Compute content hash
   */
  private computeHash(content: string): string {
    // Simple hash; in production use crypto.createHash('sha256')
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeType(path: string): string {
    const ext = path.split(".").pop()?.toLowerCase();
    const types: Record<string, string> = {
      json: "application/json",
      js: "application/javascript",
      ts: "text/typescript",
      txt: "text/plain",
      md: "text/markdown",
      csv: "text/csv",
      html: "text/html",
      xml: "application/xml",
    };
    return types[ext || ""] || "application/octet-stream";
  }

  /**
   * Initialize SQLite (stub)
   */
  private async initSqlite(): Promise<void> {
    console.log("[Storage] Initializing SQLite...");
    // In production, use sqlite3 or better-sqlite3
  }

  /**
   * Initialize PostgreSQL (stub)
   */
  private async initPostgres(): Promise<void> {
    console.log("[Storage] Initializing PostgreSQL...");
    // In production, use pg or postgres driver
  }

  /**
   * Initialize MongoDB (stub)
   */
  private async initMongoDB(): Promise<void> {
    console.log("[Storage] Initializing MongoDB...");
    // In production, use mongodb driver
  }

  /**
   * Store in database (stub)
   */
  private async storeInDatabase(graph: StoredGraph): Promise<void> {
    // In production, write to actual database
  }

  /**
   * Retrieve from database (stub)
   */
  private async retrieveFromDatabase(graphId: string): Promise<StoredGraph | null> {
    // In production, read from actual database
    return null;
  }

  /**
   * Get storage stats
   */
  public async getStats(): Promise<{
    graphs: number;
    executions: number;
    storageType: string;
  }> {
    return {
      graphs: this.memoryStore.size,
      executions: this.executionRecords.length,
      storageType: this.config.type,
    };
  }

  /**
   * Disconnect from storage
   */
  public async disconnect(): Promise<void> {
    console.log("[Storage] Disconnected");
  }
}

export { StorageConfig, StoredGraph, ExecutionRecord, FileHandle };
