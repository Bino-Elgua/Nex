#!/usr/bin/env node
/**
 * Nex Gateway v1.1.0 — Authenticated Execution Server
 *
 * Adds JWT/OAuth2 auth, graph signing, RBAC, and real HTTP client.
 * HTTP gateway for accepting, executing, and returning Nex graphs.
 *
 * Listen: http://localhost:18789
 */

import { NexInterpreter, NexGraph } from "./nex-runtime.js";
import { AuthManager, JWTPayload } from "./auth-manager.js";
import { NexHttpClient } from "./http-client.js";
import { ProductionNexInterpreter } from "./v1.0.0-production.js";
import http from "http";
import { URL } from "url";

interface AuthenticatedRequest {
  id: string;
  action: "execute" | "validate" | "status" | "auth";
  graph?: NexGraph;
  token?: string;
  email?: string;
  password?: string;
  timestamp: number;
}

interface AuthenticatedResponse {
  id: string;
  status: "success" | "error" | "unauthorized" | "forbidden";
  result?: any;
  error?: string;
  token?: string;
  timestamp: number;
  executionMs?: number;
}

interface GatewaySession {
  id: string;
  userId: string;
  connected: boolean;
  executions: number;
  lastExecution: number;
}

export class NexGatewayV1_1 {
  private port: number;
  private sessions: Map<string, GatewaySession> = new Map();
  private executionCount: number = 0;
  private startTime: number = Date.now();
  private authManager: AuthManager;
  private httpClient: NexHttpClient;

  constructor(port: number = 18789, jwtSecret?: string) {
    this.port = port;
    this.authManager = new AuthManager(jwtSecret);
    this.httpClient = new NexHttpClient();

    // Create demo user
    this.authManager.registerUser("demo@nex.local", "demo-password", "user");
    this.authManager.registerUser("admin@nex.local", "admin-password", "admin");
  }

  public start() {
    const server = http.createServer(async (req, res) => {
      // Enable CORS
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS, PUT, DELETE"
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );

      if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
      }

      const url = new URL(req.url || "/", `http://localhost:${this.port}`);

      // Health check (public)
      if (url.pathname === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      // Status endpoint (public)
      if (url.pathname === "/status") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            gateway: "Nex v1.1",
            uptime: Date.now() - this.startTime,
            executions: this.executionCount,
            sessions: this.sessions.size,
            timestamp: Date.now(),
          })
        );
        return;
      }

      // Login endpoint
      if (url.pathname === "/auth/login" && req.method === "POST") {
        await this.handleLogin(req, res);
        return;
      }

      // Logout endpoint
      if (url.pathname === "/auth/logout" && req.method === "POST") {
        await this.handleLogout(req, res);
        return;
      }

      // Verify token endpoint
      if (url.pathname === "/auth/verify" && req.method === "POST") {
        await this.handleVerify(req, res);
        return;
      }

      // Protected endpoints below require authentication
      const token = this.extractToken(req);
      const payload = this.authManager.verifyJWT(token);

      if (!token || !payload) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "unauthorized",
            error: "Missing or invalid token",
          })
        );
        return;
      }

      // Execute endpoint (protected)
      if (url.pathname === "/execute" && req.method === "POST") {
        if (!this.authManager.authorize(token, "execute", "graphs")) {
          res.writeHead(403, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              status: "forbidden",
              error: "Missing execute permission",
            })
          );
          return;
        }

        await this.handleExecute(req, res, token, payload);
        return;
      }

      // Validate endpoint (protected)
      if (url.pathname === "/validate" && req.method === "POST") {
        if (!this.authManager.authorize(token, "read", "graphs")) {
          res.writeHead(403, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              status: "forbidden",
              error: "Missing read permission",
            })
          );
          return;
        }

        await this.handleValidate(req, res, token);
        return;
      }

      // Sign graph endpoint (protected)
      if (url.pathname === "/sign" && req.method === "POST") {
        if (!this.authManager.authorize(token, "write", "graphs")) {
          res.writeHead(403, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              status: "forbidden",
              error: "Missing write permission",
            })
          );
          return;
        }

        await this.handleSign(req, res, token);
        return;
      }

      // Metrics endpoint (admin only)
      if (url.pathname === "/metrics" && req.method === "GET") {
        if (payload.role !== "admin") {
          res.writeHead(403, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              status: "forbidden",
              error: "Admin role required",
            })
          );
          return;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            gateway: {
              uptime: Date.now() - this.startTime,
              executions: this.executionCount,
              sessions: this.sessions.size,
            },
            http: this.httpClient.getMetrics(),
            timestamp: Date.now(),
          })
        );
        return;
      }

      // 404
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not Found" }));
    });

    server.listen(this.port, () => {
      console.log(
        "═══════════════════════════════════════════════════════════════"
      );
      console.log("  Nex Gateway v1.1 — Authenticated Graph Execution Server");
      console.log(
        "═══════════════════════════════════════════════════════════════\n"
      );
      console.log(`🚀 Gateway running on http://localhost:${this.port}`);
      console.log(`⏰ Started: ${new Date().toISOString()}`);
      console.log("\n📚 API Endpoints:");
      console.log("  GET  /health — Health check");
      console.log("  GET  /status — Gateway status");
      console.log("  POST /auth/login — Authenticate user");
      console.log("  POST /auth/logout — Logout (requires token)");
      console.log("  POST /auth/verify — Verify token");
      console.log("  POST /execute — Execute a graph (requires token)");
      console.log("  POST /validate — Validate a graph (requires token)");
      console.log("  POST /sign — Sign a graph (requires token)");
      console.log("  GET  /metrics — Gateway metrics (admin only)\n");
      console.log("═══════════════════════════════════════════════════════════════\n");
      console.log("📖 Demo Users:");
      console.log("  Email: demo@nex.local | Password: demo-password (user)");
      console.log("  Email: admin@nex.local | Password: admin-password (admin)\n");
    });

    return server;
  }

  private async handleLogin(req: http.IncomingMessage, res: http.ServerResponse) {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const { email, password } = JSON.parse(body);
        const result = this.authManager.authenticateUser(email, password);

        if (!result) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              status: "error",
              error: "Invalid email or password",
            })
          );
          return;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "success",
            token: result.token,
            user: {
              id: result.user.id,
              email: result.user.email,
              role: result.user.role,
            },
            timestamp: Date.now(),
          })
        );
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "error",
            error: String(error),
          })
        );
      }
    });
  }

  private async handleLogout(req: http.IncomingMessage, res: http.ServerResponse) {
    const token = this.extractToken(req);
    if (token) {
      this.authManager.logout(token);
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "success", message: "Logged out" }));
  }

  private async handleVerify(req: http.IncomingMessage, res: http.ServerResponse) {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const { token } = JSON.parse(body);
        const payload = this.authManager.verifyJWT(token);

        if (!payload) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              status: "error",
              valid: false,
            })
          );
          return;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "success",
            valid: true,
            payload,
          })
        );
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "error",
            error: String(error),
          })
        );
      }
    });
  }

  private async handleExecute(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    token: string,
    payload: JWTPayload
  ) {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const data = JSON.parse(body);
        const graph: NexGraph = data.graph;

        if (!graph) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              status: "error",
              error: "Missing graph in request body",
            })
          );
          return;
        }

        const startTime = Date.now();

        // Use production interpreter with safety guardrails
        const prodInterpreter = new ProductionNexInterpreter(graph);
        const { result, metrics, error } = await prodInterpreter.executeWithSafety();

        const executionMs = Date.now() - startTime;
        this.executionCount++;

        if (error) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              status: "error",
              result,
              error,
              executionMs,
              timestamp: Date.now(),
            })
          );
          return;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "success",
            result,
            executionMs,
            metrics,
            userId: payload.userId,
            timestamp: Date.now(),
          })
        );
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "error",
            error: String(error),
          })
        );
      }
    });
  }

  private async handleValidate(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    token: string
  ) {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const data = JSON.parse(body);
        const graph: NexGraph = data.graph;

        if (!graph) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              status: "error",
              error: "Missing graph in request body",
            })
          );
          return;
        }

        // Validate graph structure
        const interpreter = new NexInterpreter(graph);
        const isValid = true; // If we get here, constructor didn't throw

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "success",
            valid: isValid,
            nodeCount: graph.nodes.length,
            linkCount: graph.links.length,
            timestamp: Date.now(),
          })
        );
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "error",
            valid: false,
            error: String(error),
          })
        );
      }
    });
  }

  private async handleSign(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    token: string
  ) {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const { graphId } = JSON.parse(body);

        if (!graphId) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              status: "error",
              error: "Missing graphId",
            })
          );
          return;
        }

        const signature = this.authManager.signGraph(graphId, token);

        if (!signature) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              status: "error",
              error: "Invalid token",
            })
          );
          return;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "success",
            signature,
            timestamp: Date.now(),
          })
        );
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "error",
            error: String(error),
          })
        );
      }
    });
  }

  private extractToken(req: http.IncomingMessage): string | null {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    return authHeader.slice(7);
  }
}

async function main() {
  const port = process.env.NEX_PORT ? parseInt(process.env.NEX_PORT) : 18789;
  const jwtSecret = process.env.JWT_SECRET;

  const gateway = new NexGatewayV1_1(port, jwtSecret);
  gateway.start();

  console.log("💾 Gateway is now listening...");
  console.log("   Press Ctrl+C to stop\n");
}

main().catch(console.error);
