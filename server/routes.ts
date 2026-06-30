import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { fileProcessorService } from "./services/fileProcessor";
import { textChunkerService } from "./services/textChunker";
import { gptZeroService } from "./services/gptZero";
import { aiProviderService } from "./services/aiProviders";
import { documentGeneratorService } from "./services/documentGenerator";
import type { RewriteRequest, RewriteResponse } from "@shared/schema";

const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

function cleanMarkup(text: string): string {
  return text
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/```[\s\S]*?```/g, (match) => {
      return match.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '');
    })
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/>\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // File upload endpoint
  app.post("/api/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      await fileProcessorService.validateFile(req.file);
      const processedFile = await fileProcessorService.processFile(req.file.path, req.file.originalname);

      const gptZeroResult = await gptZeroService.analyzeText(processedFile.content);

      const document = await storage.createDocument({
        filename: processedFile.filename,
        content: processedFile.content,
        wordCount: processedFile.wordCount,
        aiScore: gptZeroResult.aiScore,
      });

      const chunks = processedFile.wordCount > 500
        ? textChunkerService.chunkText(processedFile.content)
        : [];

      if (chunks.length > 0) {
        const chunkTexts = chunks.map(chunk => chunk.content);
        const chunkResults = await gptZeroService.analyzeBatch(chunkTexts);
        chunks.forEach((chunk, index) => {
          chunk.aiScore = chunkResults[index].aiScore;
        });
      }

      res.json({
        document,
        chunks,
        aiScore: gptZeroResult.aiScore,
        needsChunking: processedFile.wordCount > 500,
      });
    } catch (error: any) {
      console.error('File upload error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Text analysis endpoint
  app.post("/api/analyze-text", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ message: "Text is required" });
      }

      const gptZeroResult = await gptZeroService.analyzeText(text);
      const wordCount = text.trim().split(/\s+/).length;
      const chunks = wordCount > 500 ? textChunkerService.chunkText(text) : [];

      if (chunks.length > 0) {
        const chunkTexts = chunks.map(chunk => chunk.content);
        const chunkResults = await gptZeroService.analyzeBatch(chunkTexts);
        chunks.forEach((chunk, index) => {
          chunk.aiScore = chunkResults[index].aiScore;
        });
      }

      res.json({
        aiScore: gptZeroResult.aiScore,
        wordCount,
        chunks,
        needsChunking: wordCount > 500,
      });
    } catch (error: any) {
      console.error('Text analysis error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Rewrite text endpoint
  app.post("/api/rewrite", async (req, res) => {
    try {
      const rewriteRequest: RewriteRequest = req.body;
      if (!rewriteRequest.inputText || !rewriteRequest.provider) {
        return res.status(400).json({ message: "Input text and provider are required" });
      }

      const inputAnalysis = await gptZeroService.analyzeText(rewriteRequest.inputText);

      const rewriteJob = await storage.createRewriteJob({
        inputText: rewriteRequest.inputText,
        styleText: rewriteRequest.styleText,
        contentMixText: rewriteRequest.contentMixText,
        customInstructions: rewriteRequest.customInstructions,
        selectedPresets: rewriteRequest.selectedPresets,
        provider: rewriteRequest.provider,
        chunks: [],
        selectedChunkIds: rewriteRequest.selectedChunkIds,
        mixingMode: rewriteRequest.mixingMode,
        inputAiScore: inputAnalysis.aiScore,
        status: "processing",
      });

      try {
        const rewrittenText = await aiProviderService.rewrite(rewriteRequest.provider, {
          inputText: rewriteRequest.inputText,
          styleText: rewriteRequest.styleText,
          contentMixText: rewriteRequest.contentMixText,
          customInstructions: rewriteRequest.customInstructions,
          selectedPresets: rewriteRequest.selectedPresets,
          mixingMode: rewriteRequest.mixingMode,
        });

        const outputAnalysis = await gptZeroService.analyzeText(rewrittenText);
        const cleanedRewrittenText = cleanMarkup(rewrittenText);

        await storage.updateRewriteJob(rewriteJob.id, {
          outputText: cleanedRewrittenText,
          outputAiScore: outputAnalysis.aiScore,
          status: "completed",
        });

        const response: RewriteResponse = {
          rewrittenText: cleanedRewrittenText,
          inputAiScore: inputAnalysis.aiScore,
          outputAiScore: outputAnalysis.aiScore,
          jobId: rewriteJob.id,
        };
        res.json(response);
      } catch (error) {
        await storage.updateRewriteJob(rewriteJob.id, { status: "failed" });
        throw error;
      }
    } catch (error: any) {
      console.error('Rewrite error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Re-rewrite endpoint
  app.post("/api/re-rewrite/:jobId", async (req, res) => {
    try {
      const { jobId } = req.params;
      const { customInstructions, selectedPresets, provider } = req.body;

      const originalJob = await storage.getRewriteJob(jobId);
      if (!originalJob || !originalJob.outputText) {
        return res.status(404).json({ message: "Original job not found or incomplete" });
      }

      const rewriteJob = await storage.createRewriteJob({
        inputText: originalJob.outputText,
        styleText: originalJob.styleText,
        contentMixText: originalJob.contentMixText,
        customInstructions: customInstructions || originalJob.customInstructions,
        selectedPresets: selectedPresets || originalJob.selectedPresets,
        provider: provider || originalJob.provider,
        chunks: [],
        selectedChunkIds: [],
        mixingMode: originalJob.mixingMode,
        inputAiScore: originalJob.outputAiScore,
        status: "processing",
      });

      try {
        const rewrittenText = await aiProviderService.rewrite(provider || originalJob.provider, {
          inputText: originalJob.outputText,
          styleText: originalJob.styleText,
          contentMixText: originalJob.contentMixText,
          customInstructions: customInstructions || originalJob.customInstructions,
          selectedPresets: selectedPresets || originalJob.selectedPresets,
          mixingMode: originalJob.mixingMode,
        });

        const outputAnalysis = await gptZeroService.analyzeText(rewrittenText);
        const cleanedRewrittenText = cleanMarkup(rewrittenText);

        await storage.updateRewriteJob(rewriteJob.id, {
          outputText: cleanedRewrittenText,
          outputAiScore: outputAnalysis.aiScore,
          status: "completed",
        });

        const response: RewriteResponse = {
          rewrittenText: cleanedRewrittenText,
          inputAiScore: originalJob.outputAiScore || 0,
          outputAiScore: outputAnalysis.aiScore,
          jobId: rewriteJob.id,
        };
        res.json(response);
      } catch (error) {
        await storage.updateRewriteJob(rewriteJob.id, { status: "failed" });
        throw error;
      }
    } catch (error: any) {
      console.error('Re-rewrite error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // API Keys endpoint
  app.post("/api/set-keys", async (req, res) => {
    try {
      const { openai, anthropic, deepseek, perplexity, venice, gptzero } = req.body;
      if (openai) process.env.OPENAI_API_KEY = openai;
      if (anthropic) process.env.ANTHROPIC_API_KEY = anthropic;
      if (deepseek) process.env.DEEPSEEK_API_KEY = deepseek;
      if (perplexity) process.env.PERPLEXITY_API_KEY = perplexity;
      if (venice) process.env.VENICE_API_KEY = venice;
      if (gptzero) process.env.GPTZERO_API_KEY = gptzero;
      res.json({ success: true });
    } catch (error: any) {
      console.error('Set keys error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Download endpoints
  app.post("/api/download/:format", async (req, res) => {
    try {
      const { format } = req.params;
      const { content, filename } = req.body;
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ message: "Content is required" });
      }
      if (!['pdf', 'docx', 'txt'].includes(format)) {
        return res.status(400).json({ message: "Invalid format" });
      }

      const baseFilename = filename || 'rewritten-text';
      let buffer: Buffer;
      let mimeType: string;
      let downloadFilename: string;

      switch (format) {
        case 'pdf':
          buffer = await documentGeneratorService.generatePDF(content, baseFilename);
          mimeType = 'application/pdf';
          downloadFilename = `${baseFilename}.pdf`;
          break;
        case 'docx':
          buffer = await documentGeneratorService.generateDOCX(content, baseFilename);
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          downloadFilename = `${baseFilename}.docx`;
          break;
        case 'txt':
          buffer = documentGeneratorService.generateTXT(content);
          mimeType = 'text/plain';
          downloadFilename = `${baseFilename}.txt`;
          break;
        default:
          return res.status(400).json({ message: "Unsupported format" });
      }

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
      res.setHeader('Content-Length', buffer.length.toString());
      res.end(buffer);
    } catch (error: any) {
      console.error('Download error:', error);
      res.status(500).json({ message: `Failed to generate ${req.params.format.toUpperCase()} file: ${error.message}` });
    }
  });

  // Chat endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, provider, context } = req.body;
      if (!message || !provider) {
        return res.status(400).json({ error: "Message and provider are required" });
      }

      let providerName = "";
      switch (provider) {
        case 'openai': providerName = "Zhi 1"; break;
        case 'anthropic': providerName = "Zhi 2"; break;
        case 'deepseek': providerName = "Zhi 3"; break;
        case 'perplexity': providerName = "Zhi 4"; break;
        case 'venice': providerName = "Zhi 5"; break;
      }

      let contextInfo = "";
      if (context) {
        contextInfo = "\n\nCONTEXT - You have access to the following content from the GPT Bypass text rewriting application:\n";
        if (context.inputText) contextInfo += `\nINPUT TEXT (Box A): "${context.inputText}"\n`;
        if (context.styleText) contextInfo += `\nSTYLE SAMPLE (Box B): "${context.styleText}"\n`;
        if (context.contentMixText) contextInfo += `\nCONTENT REFERENCE (Box C): "${context.contentMixText}"\n`;
        if (context.outputText) contextInfo += `\nREWRITTEN OUTPUT (Box D): "${context.outputText}"\n`;
        contextInfo += `\nYou can help analyze, improve, or work with any of this content.`;
      }

      const systemInstructions = `You are ${providerName}, a helpful AI assistant integrated into a GPT Bypass text rewriting application. Answer the user's question directly. If asked which LLM you are, respond that you are ${providerName}.${contextInfo}`;

      let response: string;
      switch (provider) {
        case 'openai':
          response = await aiProviderService.rewriteWithOpenAI({ inputText: message, customInstructions: systemInstructions });
          break;
        case 'anthropic':
          response = await aiProviderService.rewriteWithAnthropic({ inputText: message, customInstructions: systemInstructions });
          break;
        case 'deepseek':
          response = await aiProviderService.rewriteWithDeepSeek({ inputText: message, customInstructions: systemInstructions });
          break;
        case 'perplexity':
          response = await aiProviderService.rewriteWithPerplexity({ inputText: message, customInstructions: systemInstructions });
          break;
        case 'venice':
          response = await aiProviderService.rewriteWithVenice({ inputText: message, customInstructions: systemInstructions });
          break;
        default:
          return res.status(400).json({ error: "Invalid provider" });
      }

      res.json({ response: cleanMarkup(response) });
    } catch (error: any) {
      console.error('Chat error:', error);
      res.status(500).json({ error: `Chat API Error: ${error?.message || 'Unknown error'}` });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
