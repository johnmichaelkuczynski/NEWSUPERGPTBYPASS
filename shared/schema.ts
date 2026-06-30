import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  credits: integer("credits").notNull().default(0),
  stripeCustomerId: text("stripe_customer_id"),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  filename: text("filename").notNull(),
  content: text("content").notNull(),
  wordCount: integer("word_count").notNull(),
  aiScore: integer("ai_score"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const rewriteJobs = pgTable("rewrite_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  inputText: text("input_text").notNull(),
  styleText: text("style_text"),
  contentMixText: text("content_mix_text"),
  customInstructions: text("custom_instructions"),
  selectedPresets: jsonb("selected_presets").$type<string[]>(),
  provider: text("provider").notNull(),
  chunks: jsonb("chunks").$type<TextChunk[]>(),
  selectedChunkIds: jsonb("selected_chunk_ids").$type<string[]>(),
  mixingMode: text("mixing_mode").$type<'style' | 'content' | 'both'>(),
  outputText: text("output_text"),
  inputAiScore: integer("input_ai_score"),
  outputAiScore: integer("output_ai_score"),
  status: text("status").notNull().default("pending"),
  creditsPaid: integer("credits_paid").default(0),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stripePaymentIntentId: text("stripe_payment_intent_id").notNull().unique(),
  userId: varchar("user_id").notNull().references(() => users.id),
  credits: integer("credits").notNull(),
  amount: integer("amount").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  rewriteJobs: many(rewriteJobs),
  payments: many(payments),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
}));

export const rewriteJobsRelations = relations(rewriteJobs, ({ one }) => ({
  user: one(users, {
    fields: [rewriteJobs.userId],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertRewriteJobSchema = createInsertSchema(rewriteJobs).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type RewriteJob = typeof rewriteJobs.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type InsertRewriteJob = z.infer<typeof insertRewriteJobSchema>;

export interface TextChunk {
  id: string;
  content: string;
  startWord: number;
  endWord: number;
  aiScore?: number;
}

export interface InstructionPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  instruction: string;
}

export interface WritingSample {
  id: string;
  name: string;
  preview: string;
  content: string;
  category: string;
}

export interface AIProviderConfig {
  provider: 'openai' | 'anthropic' | 'deepseek' | 'perplexity' | 'venice';
  model?: string;
}

export interface RewriteRequest {
  inputText: string;
  styleText?: string;
  contentMixText?: string;
  customInstructions?: string;
  selectedPresets?: string[];
  provider: string;
  selectedChunkIds?: string[];
  mixingMode?: 'style' | 'content' | 'both';
}

export interface RewriteResponse {
  rewrittenText: string;
  inputAiScore: number;
  outputAiScore: number;
  jobId: string;
}

export interface PricingTier {
  id: string;
  name: string;
  priceUsd: number;
  credits: number;
}

export const pricingTiers: PricingTier[] = [
  // ZHI 1
  { id: 'zhi1_5', name: 'ZHI 1 - $5', priceUsd: 5, credits: 4275000 },
  { id: 'zhi1_10', name: 'ZHI 1 - $10', priceUsd: 10, credits: 8977500 },
  { id: 'zhi1_25', name: 'ZHI 1 - $25', priceUsd: 25, credits: 23512500 },
  { id: 'zhi1_50', name: 'ZHI 1 - $50', priceUsd: 50, credits: 51300000 },
  { id: 'zhi1_100', name: 'ZHI 1 - $100', priceUsd: 100, credits: 115425000 },
  
  // ZHI 2
  { id: 'zhi2_5', name: 'ZHI 2 - $5', priceUsd: 5, credits: 106840 },
  { id: 'zhi2_10', name: 'ZHI 2 - $10', priceUsd: 10, credits: 224360 },
  { id: 'zhi2_25', name: 'ZHI 2 - $25', priceUsd: 25, credits: 587625 },
  { id: 'zhi2_50', name: 'ZHI 2 - $50', priceUsd: 50, credits: 1282100 },
  { id: 'zhi2_100', name: 'ZHI 2 - $100', priceUsd: 100, credits: 2883400 },
  
  // ZHI 3
  { id: 'zhi3_5', name: 'ZHI 3 - $5', priceUsd: 5, credits: 702000 },
  { id: 'zhi3_10', name: 'ZHI 3 - $10', priceUsd: 10, credits: 1474200 },
  { id: 'zhi3_25', name: 'ZHI 3 - $25', priceUsd: 25, credits: 3861000 },
  { id: 'zhi3_50', name: 'ZHI 3 - $50', priceUsd: 50, credits: 8424000 },
  { id: 'zhi3_100', name: 'ZHI 3 - $100', priceUsd: 100, credits: 18954000 },
  
  // ZHI 4
  { id: 'zhi4_5', name: 'ZHI 4 - $5', priceUsd: 5, credits: 6410255 },
  { id: 'zhi4_10', name: 'ZHI 4 - $10', priceUsd: 10, credits: 13461530 },
  { id: 'zhi4_25', name: 'ZHI 4 - $25', priceUsd: 25, credits: 35256400 },
  { id: 'zhi4_50', name: 'ZHI 4 - $50', priceUsd: 50, credits: 76923050 },
  { id: 'zhi4_100', name: 'ZHI 4 - $100', priceUsd: 100, credits: 173176900 },
];
