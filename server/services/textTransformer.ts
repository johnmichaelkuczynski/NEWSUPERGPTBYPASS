import { aiProviderService } from "./aiProviders";

function buildTransformationPrompt(inputText: string): string {
  const sourceWords = inputText.trim().split(/\s+/).filter(Boolean).length;
  const maximumWords = Math.max(1, sourceWords * 2);

  return `Transform the input passage by following every instruction below.

1. Determine exactly what the input passage is trying to say.
2. Restate its claims in the most direct, unequivocal, practical language possible.
3. Remove vague, ornamental, journalistic, and promotional language.
4. Remove unnecessary adjectives, adverbs, jargon, metaphors, and transitions.
5. Replace metaphors such as “map,” “unlock,” and “navigate” with concrete explanations.
6. Explain what each sentence means using a fresh example.
7. Give an example whenever a claim is unclear, metaphorical, disputable, or not self-evidently correct.
8. Never hedge; make definite claims even when this creates a risk of error.
9. Qualify claims only when the evidence genuinely requires qualification.
10. State every claim so that its possible errors can be identified easily.
11. Make every assumption, inference, and conclusion explicit.
12. Use complete grammatical sentences.
13. Never use fragments, affected deadpan prose, or a “beatnik” style.
14. Do not merely paraphrase the original passage.
15. Add explanations, examples, objections, answers, and inferences when they clarify or develop the original meaning.
16. Ensure that every addition follows from, supports, or reveals something present in the original passage.
17. Never contradict the original passage unless resolving an internal contradiction is necessary to make it intelligible.
18. Never sacrifice clarity for elegance, smoothness, sophistication, or stylistic variation.
19. Repeat names and nouns whenever pronouns or expressions such as “the former” and “the latter” would create ambiguity.
20. Assume that the input may be vague, repetitive, content-poor, or AI-generated.
21. Extract every usable claim and convert it into a clear, specific, falsifiable statement.
22. Replace abstract generalities with concrete mechanisms, cases, consequences, or comparisons.
23. Delete sentences that merely announce importance, complexity, promise, controversy, or interdisciplinarity.
24. Create flow through logical relationships between statements, not decorative transitions.
25. When applicable, organize the output as follows: state the claim, explain it, exemplify it, draw the inference, present an objection, answer the objection, and extend the inference.
26. Produce prose with the directness and explicitness of Passage B, not the smoothness, compression, jargon, or abstraction of Passage A.

LENGTH
The input contains ${sourceWords} words. The output may be shorter or longer, but it must not exceed ${maximumWords} words.

OUTPUT
Return only the transformed passage. Do not discuss these instructions.

INPUT PASSAGE:
${inputText}`;
}

function limitToCompleteSentences(text: string, maximumWords: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maximumWords) return text.trim();

  const sentences = text.match(/[^.!?]+[.!?]+(?:["')\]]+)?/g) || [];
  const kept: string[] = [];
  let usedWords = 0;

  for (const sentence of sentences) {
    const sentenceWords = sentence.trim().split(/\s+/).filter(Boolean).length;
    if (usedWords + sentenceWords > maximumWords) break;
    kept.push(sentence.trim());
    usedWords += sentenceWords;
  }

  if (kept.length > 0) return kept.join(" ");
  return `${words.slice(0, maximumWords).join(" ").replace(/[,;:]?$/, "")}.`;
}

export class TextTransformerService {
  async transform(inputText: string): Promise<string> {
    const text = inputText.trim();
    if (!text) throw new Error("Input text is required");
    if (text.length > 150000) {
      throw new Error("Input text must be 150,000 characters or fewer");
    }

    const transformed = await aiProviderService.rewrite("openai", {
      inputText: text,
      rawPrompt: buildTransformationPrompt(text),
    });
    if (!transformed.trim()) {
      throw new Error("The transformation returned no output");
    }

    const sourceWords = text.split(/\s+/).filter(Boolean).length;
    return limitToCompleteSentences(transformed, sourceWords * 2);
  }
}

export const textTransformerService = new TextTransformerService();