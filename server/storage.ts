import { type Document, type RewriteJob, type InsertDocument, type InsertRewriteJob, type User, type Visit } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Document operations
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: string): Promise<Document | undefined>;

  // Rewrite job operations
  createRewriteJob(job: InsertRewriteJob): Promise<RewriteJob>;
  getRewriteJob(id: string): Promise<RewriteJob | undefined>;
  updateRewriteJob(id: string, updates: Partial<RewriteJob>): Promise<RewriteJob>;
  listRewriteJobs(): Promise<RewriteJob[]>;

  // User / auth operations
  getUserById(id: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUserWithGoogle(data: { username: string; googleId: string; email: string | null; displayName: string | null }): Promise<User>;
  updateUserGoogle(id: string, data: { googleId?: string; displayName?: string | null }): Promise<User>;

  // Visit / analytics operations
  recordVisit(userId: string, email: string | null): Promise<void>;
  getVisits(limit: number): Promise<Visit[]>;
  getVisitTimestampsSince(since: Date | null): Promise<Date[]>;
}

import { db } from "./db";
import { documents, rewriteJobs, users, visits } from "@shared/schema";
import { eq, desc, gte } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // Document operations
  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db.insert(documents).values(insertDocument).returning();
    return document;
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document || undefined;
  }

  // Rewrite job operations
  async createRewriteJob(insertJob: InsertRewriteJob): Promise<RewriteJob> {
    const [job] = await db.insert(rewriteJobs).values(insertJob).returning();
    return job;
  }

  async getRewriteJob(id: string): Promise<RewriteJob | undefined> {
    const [job] = await db.select().from(rewriteJobs).where(eq(rewriteJobs.id, id));
    return job || undefined;
  }

  async updateRewriteJob(id: string, updates: Partial<RewriteJob>): Promise<RewriteJob> {
    const [job] = await db.update(rewriteJobs).set(updates).where(eq(rewriteJobs.id, id)).returning();
    if (!job) {
      throw new Error(`Rewrite job with id ${id} not found`);
    }
    return job;
  }

  async listRewriteJobs(): Promise<RewriteJob[]> {
    return await db.select().from(rewriteJobs).orderBy(desc(rewriteJobs.createdAt));
  }

  // User / auth operations
  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUserWithGoogle(data: { username: string; googleId: string; email: string | null; displayName: string | null }): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async updateUserGoogle(id: string, data: { googleId?: string; displayName?: string | null }): Promise<User> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    return user;
  }

  // Visit / analytics operations
  async recordVisit(userId: string, email: string | null): Promise<void> {
    await db.insert(visits).values({ userId, email });
  }

  async getVisits(limit: number): Promise<Visit[]> {
    return await db.select().from(visits).orderBy(desc(visits.visitedAt)).limit(limit);
  }

  async getVisitTimestampsSince(since: Date | null): Promise<Date[]> {
    const rows = since
      ? await db.select().from(visits).where(gte(visits.visitedAt, since))
      : await db.select().from(visits);
    return rows.map((v) => v.visitedAt as Date).filter(Boolean);
  }
}

export const storage = new DatabaseStorage();
