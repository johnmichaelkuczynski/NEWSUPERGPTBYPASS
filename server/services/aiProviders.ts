import OpenAI from "openai";
import Anthropic from '@anthropic-ai/sdk';

/*
<important_code_snippet_instructions>
The newest OpenAI model is "gpt-4o" which was released May 13, 2024. Do not change this unless explicitly requested by the user.
The newest Anthropic model is "claude-sonnet-5". The prior default "claude-sonnet-4-20250514" was retired by Anthropic (404 not_found_error), confirmed via a live /v1/models lookup on 2026-07-10.
</important_code_snippet_instructions>
*/

// <important_do_not_delete>
const DEFAULT_OPENAI_MODEL = "gpt-4o";
const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-5";
// </important_do_not_delete>

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key",
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY_ENV_VAR || "default_key",
});

const PRESET_TEXT: Record<string,string> = {
  // Advanced Techniques
  "Mixed cadence + clause sprawl": "Alternate short and long sentences; allow some long sentences to wander with extra clauses.",
  "Asymmetric emphasis": "Over-elaborate one point; compress or skate past another.",
  "One aside": "Add a quick parenthetical or em-dash remark — factual, not jokey.",
  "Hedge twice": "Use two mild uncertainty markers (\"probably,\" \"seems,\" \"roughly,\" \"I think\").",
  "Local disfluency": "Keep one redundant or slightly awkward phrase that still makes sense.",
  "Analogy injection": "Insert a short, concrete comparison to something unrelated but illustrative.",
  "Topic snap": "Abruptly shift focus once, then return.",
  "Friction detail": "Drop in a small, seemingly unnecessary but real-world-plausible detail.",
  
  "Compression — light (−15%)": "Cut filler; merge short clauses; keep meaning. Target ≈15% shorter.",
  "Compression — medium (−30%)": "Trim hard; delete throat-clearing; tighten syntax. Target ≈30% shorter.",
  "Compression — heavy (−45%)": "Sever redundancies; collapse repeats; keep core claims. Target ≈45% shorter.",
  "Mixed cadence": "Alternate short (5–12 words) and long (20–35 words) sentences; avoid uniform rhythm.",
  "Clause surgery": "Reorder main/subordinate clauses in ~30% of sentences without changing meaning.",
  "Front-load claim": "Put the main conclusion in sentence 1; evidence follows.",
  "Back-load claim": "Delay the main conclusion to the final 2–3 sentences.",
  "Seam/pivot": "Drop smooth connectors once; allow one abrupt thematic pivot.",
  "Imply one step": "Omit one obvious inferential step; keep it implicit (context makes it recoverable).",
  "Conditional framing": "Recast one key sentence as: If/Unless …, then …. Keep content identical.",
  "Local contrast": "Use exactly one contrast marker (but/except/aside) to mark a boundary; add no new facts.",
  "Scope check": "Replace one absolute with a bounded form (e.g., 'in cases like these').",
  "Deflate jargon": "Swap nominalizations for plain verbs where safe (e.g., utilization→use).",
  "Kill stock transitions": "Delete 'Moreover/Furthermore/In conclusion' everywhere.",
  "Hedge once": "Use exactly one hedge: probably/roughly/more or less.",
  "Drop intensifiers": "Remove 'very/clearly/obviously/significantly'.",
  "Low-heat voice": "Prefer plain verbs; avoid showy synonyms.",
  "One aside": "Allow one short parenthetical or em-dash aside; strictly factual.",
  "Concrete benchmark": "Replace one vague scale with a testable one (e.g., 'enough to X').",
  "Swap generic example": "If the source has an example, make it slightly more specific; else skip.",
  "Metric nudge": "Replace 'more/better' with a minimal, source-safe comparator (e.g., 'more than last case').",
  "Asymmetric emphasis": "Linger on the main claim; compress secondary points sharply.",
  "Cull repeats": "Delete duplicated sentences/ideas; keep the strongest instance.",
  "Topic snap": "Allow one abrupt focus change; no recap.",
  "No lists": "Output as continuous prose; remove bullets/numbering.",
  "No meta": "No prefaces/apologies/phrases like 'as requested'.",
  "Exact nouns": "Replace ambiguous pronouns with exact nouns.",
  "Quote once": "If the source has a strong phrase, quote it once; otherwise skip.",
  "Claim lock": "Do not add examples, scenarios, or data not present in the source.",
  "Entity lock": "Keep names, counts, and attributions exactly as given.",
  // Combo presets expand to atomic ones:
  "Lean & Sharp": "Compression — medium (−30%); Mixed cadence; Imply one step; Kill stock transitions",
  "Analytic": "Clause surgery; Front-load claim; Scope check; Exact nouns; No lists",
};

function expandPresets(selected: string[] = []): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (name: string) => {
    const txt = PRESET_TEXT[name];
    if (!txt) return;
    if (txt.includes(";") && !txt.includes("…")) {
      // combo: split by ';' and add atomic names
      txt.split(";").map(s => s.trim()).forEach(alias => { if (PRESET_TEXT[alias] && !seen.has(alias)) { seen.add(alias); out.push(alias); }});
    } else {
      if (!seen.has(name)) { seen.add(name); out.push(name); }
    }
  };
  selected.forEach(add);
  return out;
}

function buildPresetBlock(selectedPresets?: string[], customInstructions?: string): string {
  const expanded = expandPresets(selectedPresets || []);
  const lines: string[] = [];
  expanded.forEach(name => { lines.push(`- ${PRESET_TEXT[name]}`); });
  const custom = (customInstructions || "").trim();
  if (custom) lines.push(`- ${custom}`);
  if (lines.length === 0) return "";
  return `Apply ONLY these additional rewrite instructions (no other goals):\n${lines.join("\n")}\n\n`;
}

function buildRewritePrompt(params: {
  inputText: string;
  styleText?: string;
  contentMixText?: string;
  selectedPresets?: string[];
  customInstructions?: string;
  fidelityCorrections?: ClaimAuditResult;
}): string {
  const hasStyle = !!(params.styleText && params.styleText.trim() !== "");
  const hasContent = !!(params.contentMixText && params.contentMixText.trim() !== "");
  const styleSample = hasStyle ? params.styleText! : `DEFAULT STYLE SAMPLE (The Raven Paradox):

Presumably, logically equivalent statements are confirmationally equivalent. In other words, if two statements entail each other, then anything that one confirms the one statement to a given degree also confirms the other statement to that degree. But this actually seems false when consider statement-pairs such as: 

(i) All ravens are black, 
and 
(ii) All non-black things are non-ravens, 

which, though logically equivalent, seem to confirmationally equivalent, in that a non-black non-raven confirms (ii) to a high degree but confirms (i) to no degree or at most to a low degree. 
A number of very contrived solutions to this paradox have been proposed, all of which either deny that there is a paradox or invent ad hoc systems of logic to validate the 'solution' in question. 
But the real solution is clear. First of all, it is only principled generalizations that can be confirmed. Supposing that you assert (i) with the intention of affirming a principled as opposed to an accidental generalization, you are saying that instances of the property of being a raven grounds or causes instances of blackness. Read thus, (i) is most certainly not equivalent with (ii) or with any variation thereof. Be it noted that while there is a natural nomic or causal reading of (i), there is no such reading of (ii). Also be it noted that it is only principled as opposed to accidental generalizations that can be confirmed. "All metal expands when heated" can be confirmed but not "all objects in Smith's pocket expand when heated." In general, when read as principled and therefore confirmable generalization, "all x's are y's" has nomic or causal content is therefore not equivalent with "all non-y's are non-x's." Case closed on the Raven Paradox.`;

  let prompt = `Rewrite the text below so that its style matches, at a granular level, the style of the following style sample. Keep copying the sample's sentence structure, rhythm, definition-then-example pattern, parenthetical glosses, transitions, paragraph shape, and sentence-length variation when those structures can express the source content faithfully:\n"${styleSample}"\n\n`;

  prompt += `Box B supplies STYLE ONLY: syntax, rhythm, sentence length, transitions and paragraph shape. Do not carry over Box B's arguments, logical forms (e.g., 'If A, then B,' 'Nothing can be both X and Y'), claims or examples. Every claim in the output must come from Box A, and every claim in Box A must appear in the output. Add no new assertions, conditionals, impossibility claims or generalizations. If a structure in Box B has no counterpart in Box A's content, skip that structure instead of inventing content to fill it.\n\n`;

  prompt += `Do not copy numbering, example labels, footnote markers, asterisks or cross-references (e.g., '1 obviously expresses…', '2–4', '4*', 'the first type', 'as in example 3') unless the same markers appear in Box A.\n\n`;

  if (hasContent) {
    prompt += `Use the following content reference only to clarify the wording of claims already present in Box A. It must not contribute any new claim, example, argument, condition, or generalization:\n"${params.contentMixText}"\n\n`;
  }

  // <<< PRESETS/APPLIED INSTRUCTIONS HERE >>>
  prompt += buildPresetBlock(params.selectedPresets, params.customInstructions);

  if (params.fidelityCorrections) {
    const unsupported = params.fidelityCorrections.addedClaims.length > 0
      ? params.fidelityCorrections.addedClaims.map(claim => `- ${claim}`).join("\n")
      : "- None";
    const missing = params.fidelityCorrections.missingClaims.length > 0
      ? params.fidelityCorrections.missingClaims.map(claim => `- ${claim}`).join("\n")
      : "- None";
    prompt += `A claim audit found problems in the previous draft. Regenerate the entire draft once and correct every item below while keeping all style constraints above.\nUnsupported claims to remove:\n${unsupported}\nMissing Box A claims to restore:\n${missing}\nDo not mention the audit or these instructions in the output.\n\n`;
  }

  prompt += `Box A — text to rewrite:\n"${params.inputText}"`;
  return prompt;
}

export interface ClaimAuditResult {
  addedClaims: string[];
  missingClaims: string[];
}

export interface RewriteParams {
  inputText: string;
  styleText?: string;
  contentMixText?: string;
  customInstructions?: string;
  selectedPresets?: string[];
  mixingMode?: 'style' | 'content' | 'both';
  fidelityCorrections?: ClaimAuditResult;
}

export class AIProviderService {
  async rewriteWithOpenAI(params: RewriteParams): Promise<string> {
    console.log("🔥 CALLING OPENAI API - Input length:", params.inputText?.length || 0);
    const prompt = buildRewritePrompt({
      inputText: params.inputText,
      styleText: params.styleText,
      contentMixText: params.contentMixText,
      selectedPresets: params.selectedPresets,
      customInstructions: params.customInstructions,
      fidelityCorrections: params.fidelityCorrections,
    });
    console.log("🔥 User prompt length:", prompt.length);
    
    try {
      console.log("🔥 About to make OpenAI API call...");
      const response = await openai.chat.completions.create({
        model: DEFAULT_OPENAI_MODEL,
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      });

      console.log("🔥 OpenAI response received, length:", response.choices[0].message.content?.length || 0);
      return this.cleanMarkup(response.choices[0].message.content || "");
    } catch (error: any) {
      console.error("🔥 OpenAI API ERROR:", error);
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  async rewriteWithAnthropic(params: RewriteParams): Promise<string> {
    console.log("🔥 CALLING ANTHROPIC API - Input length:", params.inputText?.length || 0);
    const prompt = buildRewritePrompt({
      inputText: params.inputText,
      styleText: params.styleText,
      contentMixText: params.contentMixText,
      selectedPresets: params.selectedPresets,
      customInstructions: params.customInstructions,
      fidelityCorrections: params.fidelityCorrections,
    });
    console.log("🔥 User prompt length:", prompt.length);
    
    try {
      console.log("🔥 About to make Anthropic API call...");
      const response = await anthropic.messages.create({
        model: DEFAULT_ANTHROPIC_MODEL,
        messages: [
          { role: "user", content: prompt }
        ],
        max_tokens: 4000,
      });

      console.log("🔥 Anthropic response received, length:", response.content[0].text?.length || 0);
      return this.cleanMarkup(response.content[0].text || "");
    } catch (error: any) {
      console.error("🔥 ANTHROPIC API ERROR:", error);
      throw new Error(`Anthropic API error: ${error.message}`);
    }
  }

  async rewriteWithPerplexity(params: RewriteParams): Promise<string> {
    const prompt = buildRewritePrompt({
      inputText: params.inputText,
      styleText: params.styleText,
      contentMixText: params.contentMixText,
      selectedPresets: params.selectedPresets,
      customInstructions: params.customInstructions,
      fidelityCorrections: params.fidelityCorrections,
    });
    
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY_ENV_VAR || "default_key"}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "llama-3.1-sonar-small-128k-online",
          messages: [
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 4000,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.cleanMarkup(data.choices[0].message.content || "");
    } catch (error) {
      throw new Error(`Perplexity API error: ${error.message}`);
    }
  }

  async rewriteWithVenice(params: RewriteParams): Promise<string> {
    const prompt = buildRewritePrompt({
      inputText: params.inputText,
      styleText: params.styleText,
      contentMixText: params.contentMixText,
      selectedPresets: params.selectedPresets,
      customInstructions: params.customInstructions,
      fidelityCorrections: params.fidelityCorrections,
    });

    try {
      const response = await fetch('https://api.venice.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.VENICE_API_KEY || "default_key"}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "llama-3.3-70b",
          messages: [
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 4000,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => response.statusText);
        throw new Error(`Venice API error: ${response.status} ${errText}`);
      }

      const data = await response.json();
      return this.cleanMarkup(data.choices[0].message.content || "");
    } catch (error: any) {
      throw new Error(`Venice API error: ${error.message}`);
    }
  }

  async rewriteWithDeepSeek(params: RewriteParams): Promise<string> {
    const prompt = buildRewritePrompt({
      inputText: params.inputText,
      styleText: params.styleText,
      contentMixText: params.contentMixText,
      selectedPresets: params.selectedPresets,
      customInstructions: params.customInstructions,
      fidelityCorrections: params.fidelityCorrections,
    });
    
    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY_ENV_VAR || "default_key"}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 4000,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.cleanMarkup(data.choices[0].message.content || "");
    } catch (error) {
      throw new Error(`DeepSeek API error: ${error.message}`);
    }
  }

  private cleanMarkup(text: string): string {
    return text
      // Remove markdown bold/italic markers
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
      // Remove markdown headers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove inline code backticks
      .replace(/`([^`]+)`/g, '$1')
      // Remove code block markers
      .replace(/```[\s\S]*?```/g, (match) => {
        return match.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '');
      })
      // Remove other common markdown symbols
      .replace(/~~([^~]+)~~/g, '$1') // strikethrough
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
      .replace(/>\s+/gm, '') // blockquotes
      // Remove excessive whitespace and clean up
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }



  private async rewriteWithProvider(provider: string, params: RewriteParams): Promise<string> {
    switch (provider) {
      case 'openai':
        return this.rewriteWithOpenAI(params);
      case 'anthropic':
        return this.rewriteWithAnthropic(params);
      case 'perplexity':
        return this.rewriteWithPerplexity(params);
      case 'deepseek':
        return this.rewriteWithDeepSeek(params);
      case 'venice':
        return this.rewriteWithVenice(params);
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  private buildClaimAuditPrompt(inputText: string, outputText: string): string {
    return `Compare Box D against Box A for claim-level fidelity. Treat a claim as any assertion, condition, impossibility statement, generalization, example presented as fact, attribution, quantity, or logical relationship.

Return JSON only in exactly this shape:
{"addedClaims":["claims in Box D that are not supported by Box A"],"missingClaims":["claims in Box A that do not appear in Box D"]}

Use an empty array when there are no problems. Ignore wording, syntax, rhythm, order, paragraphing, parenthetical glosses, and other purely stylistic differences. Do not treat a faithful paraphrase as missing or added. Be strict about invented examples, conditionals, impossibility claims, logical forms, and generalizations.

Box A:
${inputText}

Box D:
${outputText}`;
  }

  private async auditWithProvider(provider: string, prompt: string): Promise<string> {
    switch (provider) {
      case "openai": {
        const response = await openai.chat.completions.create({
          model: DEFAULT_OPENAI_MODEL,
          messages: [{ role: "user", content: prompt }],
          temperature: 0,
          max_tokens: 3000,
          response_format: { type: "json_object" },
        });
        return response.choices[0].message.content || "";
      }
      case "anthropic": {
        const response = await anthropic.messages.create({
          model: DEFAULT_ANTHROPIC_MODEL,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 3000,
          temperature: 0,
        });
        const firstBlock = response.content[0];
        return firstBlock?.type === "text" ? firstBlock.text : "";
      }
      case "deepseek": {
        const response = await fetch("https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY_ENV_VAR || "default_key"}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [{ role: "user", content: prompt }],
            temperature: 0,
            max_tokens: 3000,
            response_format: { type: "json_object" },
          }),
        });
        if (!response.ok) throw new Error(`DeepSeek audit error: ${response.statusText}`);
        const data = await response.json();
        return data.choices?.[0]?.message?.content || "";
      }
      case "perplexity": {
        const response = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY_ENV_VAR || "default_key"}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.1-sonar-small-128k-online",
            messages: [{ role: "user", content: prompt }],
            temperature: 0,
            max_tokens: 3000,
            stream: false,
          }),
        });
        if (!response.ok) throw new Error(`Perplexity audit error: ${response.statusText}`);
        const data = await response.json();
        return data.choices?.[0]?.message?.content || "";
      }
      case "venice": {
        const response = await fetch("https://api.venice.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.VENICE_API_KEY || "default_key"}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b",
            messages: [{ role: "user", content: prompt }],
            temperature: 0,
            max_tokens: 3000,
            stream: false,
          }),
        });
        if (!response.ok) throw new Error(`Venice audit error: ${response.statusText}`);
        const data = await response.json();
        return data.choices?.[0]?.message?.content || "";
      }
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  private parseClaimAudit(raw: string): ClaimAuditResult {
    const withoutFences = raw.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
    const start = withoutFences.indexOf("{");
    const end = withoutFences.lastIndexOf("}");
    if (start === -1 || end === -1 || end < start) {
      throw new Error("Claim audit did not return a JSON object");
    }
    const parsed = JSON.parse(withoutFences.slice(start, end + 1));
    if (!Array.isArray(parsed.addedClaims) || !Array.isArray(parsed.missingClaims)) {
      throw new Error("Claim audit JSON is missing required arrays");
    }
    return {
      addedClaims: parsed.addedClaims.filter((claim: unknown): claim is string => typeof claim === "string" && claim.trim().length > 0),
      missingClaims: parsed.missingClaims.filter((claim: unknown): claim is string => typeof claim === "string" && claim.trim().length > 0),
    };
  }

  async auditClaims(provider: string, inputText: string, outputText: string): Promise<ClaimAuditResult> {
    const prompt = this.buildClaimAuditPrompt(inputText, outputText);
    const allProviders = ["anthropic", "openai", "deepseek", "perplexity", "venice"];
    const ordered = [provider, ...allProviders.filter(candidate => candidate !== provider)];
    let lastError: any;

    for (const candidate of ordered) {
      try {
        const raw = await this.auditWithProvider(candidate, prompt);
        const audit = this.parseClaimAudit(raw);
        if (candidate !== provider) {
          console.warn(`Claim audit provider "${provider}" failed — used "${candidate}" as fallback.`);
        }
        return audit;
      } catch (error: any) {
        console.error(`Claim audit with "${candidate}" failed:`, error.message);
        lastError = error;
      }
    }

    throw new Error(`All claim audit providers failed. Last error: ${lastError?.message}`);
  }

  async rewrite(provider: string, params: RewriteParams): Promise<string> {
    const allProviders = ['anthropic', 'openai', 'deepseek', 'perplexity', 'venice'];
    const ordered = [provider, ...allProviders.filter(p => p !== provider)];

    let lastError: any;
    for (const p of ordered) {
      try {
        const result = await this.rewriteWithProvider(p, params);
        if (!result || result.trim().length === 0) {
          throw new Error(`Provider "${p}" returned empty response`);
        }
        if (p !== provider) {
          console.warn(`⚠️ Primary provider "${provider}" failed — used "${p}" as fallback.`);
        }
        return result;
      } catch (err: any) {
        console.error(`Provider "${p}" failed:`, err.message);
        lastError = err;
      }
    }
    throw new Error(`All AI providers failed. Last error: ${lastError?.message}`);
  }
}

export const aiProviderService = new AIProviderService();
