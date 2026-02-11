#!/usr/bin/env node
/**
 * Nex v1.2.0 — WebSocket Server for Real-Time Graph Streaming
 *
 * Allows clients to stream graph execution in real-time.
 * Supports bidirectional communication for agent spawn/control.
 */

import { NexInterpreter, NexGraph } from "./nex-runtime.js";
import http from "http";
import { createHash } from "crypto";

interface WebSocketFrame {
  fin: boolean;
  opcode: number; // 1=text, 2=binary, 8=close, 9=ping, 10=pong
  masked: boolean;
  mask?: Buffer;
  payload: Buffer;
}

interface NexMessage {
  type:
    | "subscribe"
    | "execute"
    | "spawn"
    | "control"
    | "heartbeat"
    | "unsubscribe";
  graphId?: string;
  graph?: NexGraph;
  data?: any;
  timestamp: number;
}

interface SubscriberConnection {
  graphId: string;
  socket: any;
  subscribed: boolean;
}

export class NexWebSocketServer {
  private port: number;
  private subscribers: Map<string, SubscriberConnection[]> = new Map();
  private activeExecutions: Map<string, NexInterpreter> = new Map();

  constructor(port: number = 18790) {
    this.port = port;
  }

  public start() {
    const server = http.createServer();

    server.on("upgrade", (req, socket, head) => {
      if (req.url === "/ws") {
        this.handleWebSocketUpgrade(req, socket, head);
      } else {
        socket.destroy();
      }
    });

    server.listen(this.port, () => {
      console.log(
        "═══════════════════════════════════════════════════════════════"
      );
      console.log(
        "  Nex WebSocket Server v1.2.0 — Real-Time Graph Streaming"
      );
      console.log(
        "═══════════════════════════════════════════════════════════════\n"
      );
      console.log(`🚀 WebSocket server running on ws://localhost:${this.port}/ws`);
      console.log("📡 Clients can stream graph execution in real-time\n");
    });

    return server;
  }

  private handleWebSocketUpgrade(
    req: any,
    socket: any,
    head: Buffer
  ) {
    // Parse WebSocket handshake
    const key = req.headers["sec-websocket-key"];
    const GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
    const sha1 = createHash("sha1")
      .update(key + GUID)
      .digest("base64");

    const responseHeaders = [
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      "Sec-WebSocket-Accept: " + sha1,
    ];

    socket.write(responseHeaders.join("\r\n") + "\r\n\r\n");

    // Handle incoming frames
    socket.on("data", (data: Buffer) => {
      this.handleFrame(socket, data);
    });

    socket.on("close", () => {
      // Remove disconnected socket
      for (const [graphId, connections] of this.subscribers.entries()) {
        const idx = connections.findIndex((c) => c.socket === socket);
        if (idx >= 0) {
          connections.splice(idx, 1);
        }
      }
    });

    socket.on("error", (err: Error) => {
      console.error("[WebSocket] Error:", err);
    });
  }

  private handleFrame(socket: any, data: Buffer) {
    try {
      const frame = this.parseFrame(data);

      if (frame.opcode === 8) {
        // Close frame
        socket.end();
        return;
      }

      if (frame.opcode === 9) {
        // Ping frame; respond with pong
        this.sendFrame(socket, 10, Buffer.from("pong"));
        return;
      }

      if (frame.opcode === 1) {
        // Text frame
        const payload = frame.mask
          ? this.unmask(frame.payload, frame.mask)
          : frame.payload;

        const message = JSON.parse(payload.toString()) as NexMessage;
        this.handleMessage(socket, message);
      }
    } catch (error) {
      console.error("[WebSocket] Frame parsing error:", error);
    }
  }

  private handleMessage(socket: any, message: NexMessage) {
    switch (message.type) {
      case "subscribe":
        this.handleSubscribe(socket, message.graphId || "");
        break;

      case "execute":
        if (message.graph) {
          this.handleExecute(socket, message.graph);
        }
        break;

      case "spawn":
        this.handleSpawn(socket, message.data);
        break;

      case "heartbeat":
        this.sendMessage(socket, {
          type: "heartbeat",
          timestamp: Date.now(),
        });
        break;

      case "unsubscribe":
        this.handleUnsubscribe(socket, message.graphId || "");
        break;
    }
  }

  private handleSubscribe(socket: any, graphId: string) {
    if (!this.subscribers.has(graphId)) {
      this.subscribers.set(graphId, []);
    }

    this.subscribers.get(graphId)!.push({
      graphId,
      socket,
      subscribed: true,
    });

    this.sendMessage(socket, {
      type: "subscribe",
      graphId,
      timestamp: Date.now(),
    });

    console.log(`[WebSocket] Client subscribed to graph: ${graphId}`);
  }

  private handleUnsubscribe(socket: any, graphId: string) {
    const connections = this.subscribers.get(graphId);
    if (connections) {
      const idx = connections.findIndex((c) => c.socket === socket);
      if (idx >= 0) {
        connections.splice(idx, 1);
      }
    }

    this.sendMessage(socket, {
      type: "unsubscribe",
      graphId,
      timestamp: Date.now(),
    });
  }

  private async handleExecute(socket: any, graph: NexGraph) {
    const executionId = `exec_${Date.now()}`;

    try {
      const interpreter = new NexInterpreter(graph);
      this.activeExecutions.set(executionId, interpreter);

      // Emit start event
      this.sendMessage(socket, {
        type: "execute",
        data: { status: "started", executionId },
        timestamp: Date.now(),
      });

      // Execute graph
      const result = await interpreter.execute();

      // Emit result
      this.sendMessage(socket, {
        type: "execute",
        data: { status: "completed", executionId, result },
        timestamp: Date.now(),
      });

      // Broadcast to all subscribers
      this.broadcast(graph.entry, {
        type: "execute",
        data: { status: "completed", executionId, result },
        timestamp: Date.now(),
      });
    } catch (error) {
      this.sendMessage(socket, {
        type: "execute",
        data: { status: "error", executionId, error: String(error) },
        timestamp: Date.now(),
      });
    } finally {
      this.activeExecutions.delete(executionId);
    }
  }

  private handleSpawn(socket: any, data: any) {
    // Spawn new agent
    const agentId = `agent_${Date.now()}`;

    this.sendMessage(socket, {
      type: "spawn",
      data: { status: "spawned", agentId, role: data?.role },
      timestamp: Date.now(),
    });

    console.log(`[WebSocket] Spawned agent: ${agentId}`);
  }

  private broadcast(graphId: string, message: NexMessage) {
    const connections = this.subscribers.get(graphId);
    if (!connections) return;

    for (const connection of connections) {
      if (connection.subscribed) {
        this.sendMessage(connection.socket, message);
      }
    }
  }

  private sendMessage(socket: any, message: NexMessage) {
    const payload = JSON.stringify(message);
    this.sendFrame(socket, 1, Buffer.from(payload));
  }

  private sendFrame(socket: any, opcode: number, payload: Buffer) {
    const frame = Buffer.alloc(payload.length + 14);
    let offset = 0;

    // First byte: FIN + opcode
    frame[offset] = 0x80 | opcode;
    offset += 1;

    // Payload length
    if (payload.length < 126) {
      frame[offset] = payload.length;
      offset += 1;
    } else if (payload.length < 65536) {
      frame[offset] = 126;
      offset += 1;
      frame.writeUInt16BE(payload.length, offset);
      offset += 2;
    } else {
      frame[offset] = 127;
      offset += 1;
      frame.writeBigUInt64BE(BigInt(payload.length), offset);
      offset += 8;
    }

    // Payload
    payload.copy(frame, offset);

    socket.write(frame);
  }

  private parseFrame(data: Buffer): WebSocketFrame {
    let offset = 0;

    const byte1 = data[offset];
    const fin = (byte1 & 0x80) !== 0;
    const opcode = byte1 & 0x0f;
    offset += 1;

    const byte2 = data[offset];
    const masked = (byte2 & 0x80) !== 0;
    let payloadLen = byte2 & 0x7f;
    offset += 1;

    if (payloadLen === 126) {
      payloadLen = data.readUInt16BE(offset);
      offset += 2;
    } else if (payloadLen === 127) {
      payloadLen = Number(data.readBigUInt64BE(offset));
      offset += 8;
    }

    let mask: Buffer | undefined;
    if (masked) {
      mask = data.slice(offset, offset + 4);
      offset += 4;
    }

    const payload = data.slice(offset, offset + payloadLen);

    return { fin, opcode, masked, mask, payload };
  }

  private unmask(payload: Buffer, mask: Buffer): Buffer {
    const unmasked = Buffer.alloc(payload.length);
    for (let i = 0; i < payload.length; i++) {
      unmasked[i] = payload[i] ^ mask[i % 4];
    }
    return unmasked;
  }

  /**
   * Get active connections stats
   */
  public getStats() {
    return {
      activeExecutions: this.activeExecutions.size,
      subscribers: this.subscribers.size,
      subscriptionsByGraph: Array.from(this.subscribers.entries()).map(
        ([graphId, connections]) => ({
          graphId,
          count: connections.length,
        })
      ),
    };
  }
}

export { NexWebSocketServer, NexMessage };
