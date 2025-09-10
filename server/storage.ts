import { type User, type InsertUser, type QrCode, type InsertQrCode } from "@shared/schema";
import { randomUUID } from "crypto";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interface for storage operations
export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createQrCode(qrCode: InsertQrCode): Promise<QrCode>;
  getUserQrCodes(userId: string): Promise<QrCode[]>;
  getQrCode(id: string): Promise<QrCode | undefined>;
  getQrCodeByShortCode(shortCode: string): Promise<QrCode | undefined>;
  updateQrCodeClickCount(id: string): Promise<void>;
  sessionStore: any;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private qrCodes: Map<string, QrCode>;
  private shortCodeToQrId: Map<string, string>;
  public sessionStore: any;

  constructor() {
    this.users = new Map();
    this.qrCodes = new Map();
    this.shortCodeToQrId = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createQrCode(insertQrCode: InsertQrCode): Promise<QrCode> {
    const id = randomUUID();
    const shortCode = this.generateShortCode();
    const now = new Date();
    const qrCode: QrCode = {
      ...insertQrCode,
      id,
      shortCode,
      clickCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.qrCodes.set(id, qrCode);
    this.shortCodeToQrId.set(shortCode, id);
    return qrCode;
  }

  async getUserQrCodes(userId: string): Promise<QrCode[]> {
    return Array.from(this.qrCodes.values()).filter(
      (qrCode) => qrCode.userId === userId,
    );
  }

  async getQrCode(id: string): Promise<QrCode | undefined> {
    return this.qrCodes.get(id);
  }

  async getQrCodeByShortCode(shortCode: string): Promise<QrCode | undefined> {
    const qrCodeId = this.shortCodeToQrId.get(shortCode);
    return qrCodeId ? this.qrCodes.get(qrCodeId) : undefined;
  }

  async updateQrCodeClickCount(id: string): Promise<void> {
    const qrCode = this.qrCodes.get(id);
    if (qrCode) {
      qrCode.clickCount = (qrCode.clickCount || 0) + 1;
      qrCode.updatedAt = new Date();
      this.qrCodes.set(id, qrCode);
    }
  }

  private generateShortCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Ensure uniqueness
    if (this.shortCodeToQrId.has(result)) {
      return this.generateShortCode();
    }
    return result;
  }
}

export const storage = new MemStorage();
