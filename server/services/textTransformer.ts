import { aiProviderService } from "./aiProviders";
import {
  buildStagePrompt,
  capWords,
  countWords,
  splitTransformationInput,
} from "./transformationProtocol";
import { postprocessProse } from "./prosePostprocessor";

type Generate = (source: string, prompt: string) => Promise<string>;

export class TextTransformerService {
  constructor(
    private readonly generate: Generate = (inputText, rawPrompt) =>
      aiProviderService.rewrite("openai", { inputText, rawPrompt }),
  ) {}

  private async transformChunk(source: string): Promise<string> {
    let previous = "";
    let lastProse = "";
    for (const stage of ["D", "E"] as const) {
      try {
        const result = (await this.generate(
          source, buildStagePrompt(stage, source, previous),
        )).trim();
        if (!result) throw new Error(`Transformation stage ${stage} returned no text`);
        previous = result;
        if (stage !== "D") lastProse = result;
      } catch (error) {
        // A failed finishing pass must not discard completed prose. Never
        // return the internal decomposition ledger as the user's output.
        if (!lastProse) throw error;
        console.warn(`Transformation stage ${stage} failed; returning completed prose.`);
        break;
      }
    }
    const maximumWords = countWords(source) * 2;
    if (countWords(lastProse) > maximumWords) {
      try {
        const shortened = (await this.generate(source, `Shorten the following completed passage to no more than ${maximumWords} words. Preserve its plain repeated nouns, uneven sentence lengths, substantive claims, examples, qualifications, and explicit inferences. Remove repetition of whole claims before removing content. Do not polish it into an academic summary. Return only the shortened prose.\n\n${lastProse}`)).trim();
        if (shortened) lastProse = shortened;
      } catch {
        console.warn("Length correction failed; applying the existing word cap.");
      }
    }
    return capWords(lastProse, maximumWords);
  }

  async transform(inputText: string): Promise<string> {
    const text = inputText.trim();
    if (!text) throw new Error("Input text is required");
    if (text.length > 150000) {
      throw new Error("Input text must be 150,000 characters or fewer");
    }
    const chunks = splitTransformationInput(text);
    const results: string[] = [];
    // Bound concurrent calls while preserving the order of long documents.
    for (let i = 0; i < chunks.length; i += 2) {
      results.push(...await Promise.all(chunks.slice(i, i + 2).map(
        (chunk) => this.transformChunk(chunk),
      )));
    }
    const processed = postprocessProse(results.join("\n\n"));
    console.info("Code-based B/N applied:", {
      removedCommentary: processed.removedCommentary,
      mergedSentences: processed.mergedSentences,
      repeatedWords: processed.repeatedWords,
      surfaceEdits: processed.surfaceEdits,
    });
    return capWords(processed.text, countWords(text) * 2);
  }
}

export const textTransformerService = new TextTransformerService();
