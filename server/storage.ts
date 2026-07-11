import { type Document, type RewriteJob, type InsertDocument, type InsertRewriteJob, type WritingSampleRow, type InsertWritingSample } from "@shared/schema";
import { db } from "./db";
import { documents, rewriteJobs, writingSamples } from "@shared/schema";
import { eq, desc, asc } from "drizzle-orm";

export interface IStorage {
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: string): Promise<Document | undefined>;
  createRewriteJob(job: InsertRewriteJob): Promise<RewriteJob>;
  getRewriteJob(id: string): Promise<RewriteJob | undefined>;
  updateRewriteJob(id: string, updates: Partial<RewriteJob>): Promise<RewriteJob>;
  listRewriteJobs(): Promise<RewriteJob[]>;
  listWritingSamples(): Promise<WritingSampleRow[]>;
  createWritingSample(data: InsertWritingSample): Promise<WritingSampleRow>;
  deleteWritingSample(id: string): Promise<void>;
  upsertWritingSampleByLabel(data: InsertWritingSample): Promise<WritingSampleRow>;
}

export class DatabaseStorage implements IStorage {
  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db.insert(documents).values(insertDocument).returning();
    return document;
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document || undefined;
  }

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
    if (!job) throw new Error(`Rewrite job ${id} not found`);
    return job;
  }

  async listRewriteJobs(): Promise<RewriteJob[]> {
    return await db.select().from(rewriteJobs).orderBy(desc(rewriteJobs.createdAt));
  }

  async listWritingSamples(): Promise<WritingSampleRow[]> {
    return await db.select().from(writingSamples).orderBy(asc(writingSamples.label));
  }

  async createWritingSample(data: InsertWritingSample): Promise<WritingSampleRow> {
    const [row] = await db.insert(writingSamples).values(data).returning();
    return row;
  }

  async deleteWritingSample(id: string): Promise<void> {
    await db.delete(writingSamples).where(eq(writingSamples.id, id));
  }

  async upsertWritingSampleByLabel(data: InsertWritingSample): Promise<WritingSampleRow> {
    const existing = await db.select().from(writingSamples).where(eq(writingSamples.label, data.label));
    if (existing.length > 0) {
      const [row] = await db.update(writingSamples).set({ content: data.content, wordCount: data.wordCount }).where(eq(writingSamples.label, data.label)).returning();
      return row;
    }
    const [row] = await db.insert(writingSamples).values(data).returning();
    return row;
  }
}

export const storage = new DatabaseStorage();
