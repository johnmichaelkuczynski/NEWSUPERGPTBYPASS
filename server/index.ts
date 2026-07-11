import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import pdfRouter from "./routes/pdf";
import fs from "fs";
import path from "path";
import { storage } from "./storage";

function watchWritingSamplesFolder() {
  const dir = path.join(process.cwd(), "writing_samples");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.watch(dir, async (eventType, filename) => {
    if (!filename || !filename.endsWith(".txt") || filename === "README.txt") return;
    const filePath = path.join(dir, filename);
    setTimeout(async () => {
      try {
        if (!fs.existsSync(filePath)) return;
        const content = fs.readFileSync(filePath, "utf-8").trim();
        if (!content) return;
        const label = filename.replace(/\.txt$/i, "").replace(/_/g, " ").trim();
        const wordCount = content.split(/\s+/).filter(Boolean).length;
        await storage.upsertWritingSampleByLabel({ label, content, wordCount });
        fs.unlinkSync(filePath);
        log(`✅ Auto-imported writing sample: "${label}" (${wordCount} words)`);
      } catch (err: any) {
        log(`⚠️ Failed to auto-import ${filename}: ${err.message}`);
      }
    }, 500);
  });

  log(`👁️  Watching writing_samples/ folder for new .txt files`);
}

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  watchWritingSamplesFolder();

  app.use("/api/pdf", pdfRouter);

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
    log(`serving on port ${port}`);
  });
})();
