import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  googleId: text("google_id").unique(),
  email: text("email"),
  displayName: text("display_name"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const visits = pgTable("visits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  email: text("email"),
  visitedAt: timestamp("visited_at").default(sql`now()`),
});

export type User = typeof users.$inferSelect;
export type Visit = typeof visits.$inferSelect;

export const writingSamples = pgTable("writing_samples", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  label: text("label").notNull(),
  content: text("content").notNull(),
  wordCount: integer("word_count").notNull().default(0),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const insertWritingSampleSchema = createInsertSchema(writingSamples).omit({ id: true, createdAt: true });
export type WritingSampleRow = typeof writingSamples.$inferSelect;
export type InsertWritingSample = z.infer<typeof insertWritingSampleSchema>;

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  content: text("content").notNull(),
  wordCount: integer("word_count").notNull(),
  aiScore: integer("ai_score"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const rewriteJobs = pgTable("rewrite_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true });
export const insertRewriteJobSchema = createInsertSchema(rewriteJobs).omit({ id: true, createdAt: true });

export type Document = typeof documents.$inferSelect;
export type RewriteJob = typeof rewriteJobs.$inferSelect;
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
