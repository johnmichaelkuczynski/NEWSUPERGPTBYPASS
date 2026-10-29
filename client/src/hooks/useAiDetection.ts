import { useEffect, useState } from "react";

interface Detection {
  text: string;
  score: number | null;
  pending: boolean;
  error: string | null;
}

export function useAiDetection(text: string) {
  const [result, setResult] = useState<Detection>({
    text: "", score: null, pending: false, error: null,
  });

  useEffect(() => {
    if (!text.trim()) {
      setResult({ text, score: null, pending: false, error: null });
      return;
    }
    let active = true;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setResult({ text, score: null, pending: true, error: null });
      const timeout = window.setTimeout(() => controller.abort(), 90000);
      try {
        const response = await fetch("/api/analyze-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "GPTZero analysis failed");
        if (typeof data.aiScore !== "number" || !Number.isFinite(data.aiScore)) {
          throw new Error("GPTZero returned no score");
        }
        if (active) setResult({ text, score: data.aiScore, pending: false, error: null });
      } catch (error) {
        if (active) setResult({
          text, score: null, pending: false,
          error: controller.signal.aborted
            ? "GPTZero timed out. Edit the text to retry."
            : error instanceof Error ? error.message : "GPTZero analysis failed",
        });
      } finally {
        window.clearTimeout(timeout);
      }
    }, 1000);
    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [text]);

  const current = result.text === text;
  return {
    score: current ? result.score : null,
    pending: !!text.trim() && (!current || result.pending),
    error: current ? result.error : null,
  };
}
