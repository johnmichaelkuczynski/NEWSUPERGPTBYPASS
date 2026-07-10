import { type Document, type RewriteJob, type InsertDocument, type InsertRewriteJob } from "@shared/schema";
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
}

import { db } from "./db";
import { documents, rewriteJobs } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
