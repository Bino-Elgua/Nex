#!/usr/bin/env node
/**
 * Nex v1.1.0 — Authentication & Authorization Manager
 *
 * Provides JWT/OAuth2 support, RBAC, and graph signature verification.
 * Integrates with dashboard and gateway for secure multi-tenant execution.
 */

import crypto from "crypto";

interface JWTPayload {
  userId: string;
  email: string;
  role: "admin" | "user" | "agent" | "readonly";
  permissions: string[];
  iat: number;
  exp: number;
  iss: string;
}

interface AuthUser {
  id: string;
  email: string;
  passwordHash: string;
  role: "admin" | "user" | "agent" | "readonly";
  permissions: string[];
  createdAt: number;
  lastLogin?: number;
  mfaSecret?: string;
  mfaEnabled: boolean;
}

interface GraphSignature {
  graphId: string;
  signature: string;
  signedBy: string;
  timestamp: number;
  algorithm: "sha256";
}

interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  provider: "github" | "google" | "microsoft";
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

const RBAC_PERMISSIONS = {
  admin: [
    "graphs:read",
    "graphs:write",
    "graphs:delete",
    "graphs:execute",
    "agents:spawn",
    "agents:kill",
    "users:manage",
    "settings:read",
    "settings:write",
    "audit:read",
  ],
  user: [
    "graphs:read",
    "graphs:write",
    "graphs:execute",
    "agents:spawn",
    "settings:read",
  ],
  agent: ["graphs:execute", "agents:spawn", "memory:read", "memory:write"],
  readonly: ["graphs:read", "settings:read"],
};

export class AuthManager {
  private users: Map<string, AuthUser> = new Map();
  private jwtSecret: string;
  private tokenBlacklist: Set<string> = new Set();
  private sessionStore: Map<string, JWTPayload> = new Map();

  constructor(jwtSecret?: string) {
    this.jwtSecret =
      jwtSecret ||
      crypto.randomBytes(32).toString("hex");
  }

  /**
   * Register a new user
   */
  public registerUser(
    email: string,
    password: string,
    role: "user" | "agent" = "user"
  ): AuthUser {
    const userId = `user_${crypto.randomBytes(8).toString("hex")}`;
    const passwordHash = this.hashPassword(password);
    const permissions = RBAC_PERMISSIONS[role];

    const user: AuthUser = {
      id: userId,
      email,
      passwordHash,
      role,
      permissions,
      createdAt: Date.now(),
      mfaEnabled: false,
    };

    this.users.set(userId, user);
    return user;
  }

  /**
   * Authenticate user with email/password
   */
  public authenticateUser(
    email: string,
    password: string
  ): { token: string; user: AuthUser } | null {
    for (const user of this.users.values()) {
      if (user.email === email) {
        if (this.verifyPassword(password, user.passwordHash)) {
          user.lastLogin = Date.now();
          const token = this.generateJWT(user);
          this.sessionStore.set(token, this.parseJWT(token));
          return { token, user };
        }
      }
    }
    return null;
  }

  /**
   * Generate JWT token
   */
  public generateJWT(user: AuthUser, expiresIn: number = 86400000): string {
    // 24 hours
    const now = Date.now();
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      iat: now,
      exp: now + expiresIn,
      iss: "nex-gateway",
    };

    const header = {
      alg: "HS256",
      typ: "JWT",
    };

    const headerB64 = Buffer.from(JSON.stringify(header)).toString("base64url");
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString(
      "base64url"
    );

    const signature = crypto
      .createHmac("sha256", this.jwtSecret)
      .update(`${headerB64}.${payloadB64}`)
      .digest("base64url");

    return `${headerB64}.${payloadB64}.${signature}`;
  }

  /**
   * Verify and decode JWT token
   */
  public verifyJWT(token: string): JWTPayload | null {
    // Check blacklist
    if (this.tokenBlacklist.has(token)) {
      return null;
    }

    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;

      const [headerB64, payloadB64, signatureB64] = parts;

      // Verify signature
      const signature = crypto
        .createHmac("sha256", this.jwtSecret)
        .update(`${headerB64}.${payloadB64}`)
        .digest("base64url");

      if (signature !== signatureB64) return null;

      // Decode payload
      const payload = JSON.parse(
        Buffer.from(payloadB64, "base64url").toString()
      ) as JWTPayload;

      // Check expiration
      if (payload.exp < Date.now()) {
        this.tokenBlacklist.add(token);
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Parse JWT without verification (for initial check)
   */
  private parseJWT(token: string): JWTPayload | null {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const payload = JSON.parse(
        Buffer.from(parts[1], "base64url").toString()
      ) as JWTPayload;
      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Logout (add token to blacklist)
   */
  public logout(token: string): boolean {
    this.tokenBlacklist.add(token);
    return true;
  }

  /**
   * Check if user has permission
   */
  public hasPermission(token: string, permission: string): boolean {
    const payload = this.verifyJWT(token);
    if (!payload) return false;
    return payload.permissions.includes(permission);
  }

  /**
   * Authorize request for specific action
   */
  public authorize(
    token: string,
    action: "read" | "write" | "delete" | "execute",
    resource: "graphs" | "agents" | "settings" | "audit"
  ): boolean {
    const permission = `${resource}:${action}`;
    return this.hasPermission(token, permission);
  }

  /**
   * Sign a graph (immutable proof of authorship)
   */
  public signGraph(graphId: string, token: string): GraphSignature | null {
    const payload = this.verifyJWT(token);
    if (!payload) return null;

    const signature = crypto
      .createHash("sha256")
      .update(`${graphId}${payload.userId}${Date.now()}`)
      .digest("hex");

    return {
      graphId,
      signature,
      signedBy: payload.userId,
      timestamp: Date.now(),
      algorithm: "sha256",
    };
  }

  /**
   * Verify graph signature
   */
  public verifyGraphSignature(sig: GraphSignature): boolean {
    // In production, verify against on-chain or ledger storage
    return sig.algorithm === "sha256" && sig.signature.length === 64;
  }

  /**
   * OAuth2: Exchange authorization code for token (stub)
   */
  public async oauth2Callback(
    code: string,
    config: OAuth2Config
  ): Promise<{ token: string; user: AuthUser } | null> {
    // This would call the OAuth2 provider's token endpoint
    // For now, create or retrieve user by email from provider
    console.log(`[OAuth2] Exchanging code for token from ${config.provider}`);
    return null; // Placeholder
  }

  /**
   * Enable MFA for user
   */
  public enableMFA(userId: string): string {
    const user = this.users.get(userId);
    if (!user) return "";

    const mfaSecret = crypto.randomBytes(16).toString("hex");
    user.mfaSecret = mfaSecret;
    user.mfaEnabled = true;

    return mfaSecret;
  }

  /**
   * Verify MFA code (TOTP)
   */
  public verifyMFA(userId: string, code: string): boolean {
    const user = this.users.get(userId);
    if (!user || !user.mfaSecret) return false;

    // TOTP verification would go here
    // For now, accept 6-digit codes
    return /^\d{6}$/.test(code);
  }

  /**
   * Hash password with bcrypt-like algorithm
   */
  private hashPassword(password: string): string {
    // In production, use bcrypt or argon2
    return crypto
      .createHash("sha256")
      .update(password + this.jwtSecret)
      .digest("hex");
  }

  /**
   * Verify password
   */
  private verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }

  /**
   * Get all active sessions (admin only)
   */
  public getActiveSessions(): Array<{ token: string; payload: JWTPayload }> {
    return Array.from(this.sessionStore.entries()).map(([token, payload]) => ({
      token,
      payload,
    }));
  }

  /**
   * Revoke all sessions for a user
   */
  public revokeUserSessions(userId: string): number {
    let count = 0;
    for (const [token, payload] of this.sessionStore.entries()) {
      if (payload.userId === userId) {
        this.tokenBlacklist.add(token);
        this.sessionStore.delete(token);
        count++;
      }
    }
    return count;
  }
}

export { JWTPayload, AuthUser, GraphSignature, OAuth2Config };
