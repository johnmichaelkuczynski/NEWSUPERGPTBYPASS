interface WalterHumanizerResponse {
  status?: string;
  result?: string | null;
  word_count?: number;
  credits_remaining?: number;
  detail?: string;
  error?: string;
  message?: string;
}

export class WalterWritesService {
  private readonly apiUrl = "https://developer-portal.walterwrites.ai/api/humanizer/";

  async humanize(content: string): Promise<string> {
    const apiKey = process.env.WALTERWRITES_API_KEY?.trim();
    if (!apiKey) {
      throw new Error("Walter Writes API key is not configured");
    }

    const text = content.trim();
    const words = text.split(/\s+/).filter(Boolean).length;
    if (words < 50 || words > 2000) {
      throw new Error("Walter Writes requires between 50 and 2,000 words");
    }

    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({ content: text }),
    });

    const data = await response.json().catch(() => ({})) as WalterHumanizerResponse;
    if (!response.ok) {
      const reason = data.detail || data.error || data.message || response.statusText;
      throw new Error(`Walter Writes error (${response.status}): ${reason}`);
    }
    if (data.status !== "success" || !data.result?.trim()) {
      throw new Error("Walter Writes returned no humanized text");
    }

    return data.result.trim();
  }
}

export const walterWritesService = new WalterWritesService();