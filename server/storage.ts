import { type User, type Document, type RewriteJob, type Payment, type InsertUser, type InsertDocument, type InsertRewriteJob } from "@shared/schema";
import { randomUUID } from "crypto";
import session from "express-session";
import type { Store } from "express-session";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserCredits(userId: string, credits: number): Promise<User>;
  incrementUserCredits(userId: string, creditsToAdd: number): Promise<User>;
  deductUserCredits(userId: string, amount: number): Promise<User>;
  updateStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User>;
  
  // Document operations
  createDocument(document: InsertDocument & { userId?: string | null }): Promise<Document>;
  getDocument(id: string): Promise<Document | undefined>;
  getUserDocuments(userId: string): Promise<Document[]>;
  
  // Rewrite job operations
  createRewriteJob(job: InsertRewriteJob & { userId?: string | null }): Promise<RewriteJob>;
  getRewriteJob(id: string): Promise<RewriteJob | undefined>;
  updateRewriteJob(id: string, updates: Partial<RewriteJob>): Promise<RewriteJob>;
  listRewriteJobs(): Promise<RewriteJob[]>;
  getUserRewriteJobs(userId: string): Promise<RewriteJob[]>;
  
  // Payment operations
  getPaymentByStripeId(stripePaymentIntentId: string): Promise<Payment | undefined>;
  createPayment(payment: { stripePaymentIntentId: string; userId: string; credits: number; amount: number; status: string }): Promise<Payment>;
  processPaymentWithCredits(payment: { stripePaymentIntentId: string; userId: string; credits: number; amount: number; status: string }): Promise<{ payment: Payment; user: User }>;
  
  // Session store
  sessionStore: Store;
}

import { db } from "./db";
import { users, documents, rewriteJobs, payments } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import { pool } from "./db";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Document operations
  async createDocument(insertDocument: InsertDocument & { userId?: string | null }): Promise<Document> {
    const [document] = await db.insert(documents).values(insertDocument).returning();
    return document;
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document || undefined;
  }

  async getUserDocuments(userId: string): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.userId, userId)).orderBy(desc(documents.createdAt));
  }

  // Rewrite job operations
  async createRewriteJob(insertJob: InsertRewriteJob & { userId?: string | null }): Promise<RewriteJob> {
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

  async getUserRewriteJobs(userId: string): Promise<RewriteJob[]> {
    return await db.select().from(rewriteJobs).where(eq(rewriteJobs.userId, userId)).orderBy(desc(rewriteJobs.createdAt));
  }

  async updateUserCredits(userId: string, credits: number): Promise<User> {
    const [user] = await db.update(users).set({ credits }).where(eq(users.id, userId)).returning();
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
    return user;
  }

  async incrementUserCredits(userId: string, creditsToAdd: number): Promise<User> {
    const [user] = await db.update(users)
      .set({ credits: sql`${users.credits} + ${creditsToAdd}` })
      .where(eq(users.id, userId))
      .returning();
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
    return user;
  }

  async deductUserCredits(userId: string, amount: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
    if (user.credits < amount) {
      throw new Error(`Insufficient credits. Required: ${amount}, Available: ${user.credits}`);
    }
    const newCredits = user.credits - amount;
    return await this.updateUserCredits(userId, newCredits);
  }

  async updateStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User> {
    const [user] = await db.update(users).set({ stripeCustomerId }).where(eq(users.id, userId)).returning();
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
    return user;
  }

  async getPaymentByStripeId(stripePaymentIntentId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.stripePaymentIntentId, stripePaymentIntentId));
    return payment || undefined;
  }

  async createPayment(payment: { stripePaymentIntentId: string; userId: string; credits: number; amount: number; status: string }): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async processPaymentWithCredits(payment: { stripePaymentIntentId: string; userId: string; credits: number; amount: number; status: string }): Promise<{ payment: Payment; user: User }> {
    return await db.transaction(async (tx) => {
      // Insert payment record first - unique constraint blocks duplicates
      const [newPayment] = await tx.insert(payments).values(payment).returning();
      
      // Atomically increment credits
      const [updatedUser] = await tx.update(users)
        .set({ credits: sql`${users.credits} + ${payment.credits}` })
        .where(eq(users.id, payment.userId))
        .returning();
      
      if (!updatedUser) {
        throw new Error(`User with id ${payment.userId} not found`);
      }
      
      return { payment: newPayment, user: updatedUser };
    });
  }
}

export const storage = new DatabaseStorage();
