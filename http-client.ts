#!/usr/bin/env node
/**
 * Nex v1.1.0 — Real HTTP Client for Tool Nodes
 *
 * Replaces stub implementations with actual HTTP requests.
 * Integrates with graph execution for external I/O.
 */

import http from "http";
import https from "https";
import { URL } from "url";

interface HttpRequest {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: string | Record<string, any>;
  timeout?: number;
  retries?: number;
}

interface HttpResponse {
  status: number;
  headers: Record<string, string>;
  body: string | Record<string, any>;
  timestamp: number;
}

interface HttpMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatencyMs: number;
  cacheHits: number;
  cacheMisses: number;
}

export class NexHttpClient {
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  private metrics: HttpMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageLatencyMs: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };
  private latencies: number[] = [];

  constructor(
    private defaultTimeout: number = 30000,
    private defaultRetries: number = 3,
    private cacheEnabled: boolean = true,
    private cacheTtlMs: number = 300000 // 5 minutes
  ) {}

  /**
   * Execute HTTP request
   */
  public async request(req: HttpRequest): Promise<HttpResponse> {
    const startTime = Date.now();

    // Check cache
    const cacheKey = this.getCacheKey(req);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.metrics.cacheHits++;
      return cached;
    }

    this.metrics.cacheMisses++;
    this.metrics.totalRequests++;

    const timeout = req.timeout || this.defaultTimeout;
    const retries = req.retries || this.defaultRetries;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.executeRequest(req, timeout);
        const latency = Date.now() - startTime;

        this.metrics.successfulRequests++;
        this.latencies.push(latency);
        this.updateAverageLatency();

        // Cache successful response
        if (this.cacheEnabled && req.method === "GET") {
          this.setCache(cacheKey, response);
        }

        return response;
      } catch (error) {
        lastError = error as Error;
        if (attempt < retries) {
          // Exponential backoff: 100ms, 200ms, 400ms...
          const backoff = Math.pow(2, attempt) * 100;
          await new Promise((resolve) => setTimeout(resolve, backoff));
        }
      }
    }

    this.metrics.failedRequests++;
    throw new Error(
      `HTTP request failed after ${retries + 1} attempts: ${lastError?.message}`
    );
  }

  /**
   * GET request
   */
  public async get(url: string, headers?: Record<string, string>): Promise<any> {
    const response = await this.request({
      url,
      method: "GET",
      headers,
    });
    return this.parseBody(response.body);
  }

  /**
   * POST request
   */
  public async post(
    url: string,
    body: any,
    headers?: Record<string, string>
  ): Promise<any> {
    const response = await this.request({
      url,
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });
    return this.parseBody(response.body);
  }

  /**
   * PUT request
   */
  public async put(
    url: string,
    body: any,
    headers?: Record<string, string>
  ): Promise<any> {
    const response = await this.request({
      url,
      method: "PUT",
      body,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });
    return this.parseBody(response.body);
  }

  /**
   * DELETE request
   */
  public async delete(url: string, headers?: Record<string, string>): Promise<any> {
    const response = await this.request({
      url,
      method: "DELETE",
      headers,
    });
    return this.parseBody(response.body);
  }

  /**
   * Execute raw HTTP request
   */
  private executeRequest(req: HttpRequest, timeout: number): Promise<HttpResponse> {
    return new Promise((resolve, reject) => {
      const url = new URL(req.url);
      const isHttps = url.protocol === "https:";
      const client = isHttps ? https : http;

      const options = {
        method: req.method,
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        headers: {
          "User-Agent": "Nex/1.1.0",
          ...req.headers,
        },
        timeout,
      };

      const httpReq = client.request(options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk.toString();
        });

        res.on("end", () => {
          const headers: Record<string, string> = {};
          if (res.headers) {
            for (const [key, value] of Object.entries(res.headers)) {
              headers[key] = Array.isArray(value) ? value.join(", ") : (value || "");
            }
          }

          try {
            const body =
              headers["content-type"]?.includes("application/json") &&
              data
                ? JSON.parse(data)
                : data;

            resolve({
              status: res.statusCode || 500,
              headers,
              body,
              timestamp: Date.now(),
            });
          } catch (error) {
            resolve({
              status: res.statusCode || 500,
              headers,
              body: data,
              timestamp: Date.now(),
            });
          }
        });
      });

      httpReq.on("error", (error) => {
        reject(error);
      });

      httpReq.on("timeout", () => {
        httpReq.destroy();
        reject(new Error(`Request timeout after ${timeout}ms`));
      });

      // Send body if present
      if (req.body) {
        const bodyStr =
          typeof req.body === "string"
            ? req.body
            : JSON.stringify(req.body);
        httpReq.write(bodyStr);
      }

      httpReq.end();
    });
  }

  /**
   * Cache management
   */
  private getCacheKey(req: HttpRequest): string {
    return `${req.method}:${req.url}`;
  }

  private getFromCache(key: string): HttpResponse | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (cached.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: HttpResponse): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.cacheTtlMs,
    });
  }

  /**
   * Parse response body
   */
  private parseBody(body: any): any {
    if (typeof body === "object") return body;
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }

  /**
   * Update average latency
   */
  private updateAverageLatency(): void {
    if (this.latencies.length === 0) return;
    const sum = this.latencies.reduce((a, b) => a + b, 0);
    this.metrics.averageLatencyMs = Math.round(sum / this.latencies.length);
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
    this.metrics.cacheHits = 0;
    this.metrics.cacheMisses = 0;
  }

  /**
   * Get metrics
   */
  public getMetrics(): HttpMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  public resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLatencyMs: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
    this.latencies = [];
  }
}

export { HttpRequest, HttpResponse, HttpMetrics };
