import { aiProviderService } from "./aiProviders";

function buildBlueprintPrompt(inputText: string): string {
  return `Do not rewrite or summarize the passage. Produce a detailed transformation blueprint for another writer.

For every substantive claim in the passage, identify:
1. CORE CLAIM: the proposition that remains after puffery and ceremonial language are removed.
2. EMPTY LANGUAGE: every adjective, adverb, transition, prestige term, metaphor, or stock phrase that adds no testable content.
3. UNDEFINED OPERATION: words such as map, unlock, navigate, transform, revolutionize, analyze, understand, explore, or advance that name a result without explaining an operation.
4. IMPLIED MECHANISM: the most concrete account of who would do what, how they would do it, what observable result would count as success, and why that result would support the source's conclusion.
5. REQUIRED EXAMPLE: a concrete example that makes the claim intelligible or testable. Infer a suitable example when the source omits one, but keep it aligned with the source's subject and intended meaning.
6. EXPOSURE: the strongest clear formulation of the claim, including real limits or exceptions, that makes it easiest to challenge or falsify.
7. CONNECTION: the actual logical reason this claim leads to the next claim. Write "none" if there is no real connection.

Do not protect the source's vagueness. Do not recommend merely replacing difficult words with simple synonyms. Develop the source's flicker of meaning into an operational explanation. A blueprint that says only "use simpler wording," "be more specific," or "researchers study the brain" has failed.

INFERENCE LICENSE
The source's vagueness is not a fact that must be preserved. When the source names a process without explaining it, select the most plausible concrete interpretation and develop that interpretation. The added mechanism or example does not have to be logically entailed by the source; it has to be consistent with the source and make the source's intended claim intelligible. If several interpretations are possible, choose one. Risk selecting an interpretation that the author might reject rather than returning a safe paraphrase that explains nothing.

PASSAGE:
${inputText}`;
}

function buildTransformationPrompt(inputText: string, blueprint: string): string {
  const sourceWords = inputText.trim().split(/\s+/).filter(Boolean).length;
  const maximumWords = Math.max(1, sourceWords * 2);
  return `Transform the passage below. Return only the transformed passage.

PURPOSE
Write in the most direct, unadorned, practical way possible. Write as if the future of the planet depended on the passage being understood correctly. This is not paraphrasing and it is not style imitation. Recover the meaning or partial meaning in the source, then express it with substantially more content, clarity, and exposure.

FAILURE CONDITIONS
- Do not summarize the source.
- Do not merely make it shorter, plainer, or smoother.
- Do not retain an abstraction by replacing it with a milder abstraction.
- Do not write generic statements such as "researchers analyze neural structures" when the source requires an account of what the analysis consists in.
- If the source is vague because it omits its mechanism, success condition, example, or inferential steps, the output must normally be longer and more explicit than the source.
- The source contains ${sourceWords} words. The output may be shorter or longer, but it must contain no more than ${maximumWords} words. Use the added space for mechanisms, examples, qualifications, and inferential steps—not repetition.

MANDATORY METHOD
1. Determine what each source claim actually says. State it unequivocally.
2. Remove puffery, praise, prestige language, ceremonial framing, and modifiers that add no information. Words such as "fascinating," "intricate," "remarkable," "promising," and "profound" must disappear unless they identify a concrete property.
3. Find vague, metaphorical, or impressive-sounding expressions such as "map," "unlock," "navigate," "revolutionize," "transformative," "intersection," "landscape," and "frontier." Do not preserve them as decoration. Replace each with a literal account of:
   - who does what;
   - how the operation is performed;
   - what observable result counts as success; and
   - why that result supports the conclusion.
4. Supply a concrete example whenever a claim contains an unexplained metaphor or abstraction, would otherwise remain unclear, or is not self-evidently correct. The example must draw out the source's meaning and must not contradict the source. Do not add an example merely for color.
5. Do not hedge. Remove evasions based on unnamed authorities, vague appeals to complexity, or lists of competing considerations. You may and must qualify claims when the qualification states a real condition, comparison, population, limit, outcome, or exception. A qualification narrows a claim; a hedge avoids making one.
6. Maximize exposure. State claims in the form that makes errors, unsupported assumptions, causal gaps, and counterexamples easiest to identify. Prefer a definite, falsifiable assertion over a safe but empty formulation.
7. Use complete sentences. Do not use fragments, slogans, canned emphatic flourishes, or affected beatnik prose.
8. Do not merely exchange words for synonyms. Reconstruct weak passages. You may add explanations, inferential steps, and examples when they align with and bring out the source's meaning.
9. Never sacrifice clarity for elegance. Repeat the exact noun when a pronoun, synonym, "the former," or "the latter" could create ambiguity.
10. Do not use transitions merely to create smoothness. The passage must flow because each proposition gives the reader a reason to understand the next proposition. Use a connective only when it states a real logical relation.
11. Preserve all definite source facts, entities, quantities, and conclusions unless the source itself makes them incoherent. Do not import an unrelated thesis.
12. Do not mention these instructions, the transformation process, the source passage, or yourself.

INFERENCE LICENSE
Preserve definite facts, not vagueness. When the source uses a term such as "mapping," "unlocking," "understanding," "advancing," or "transforming" without supplying the operation, choose the most plausible concrete operation and state it. The operation need not be entailed by the words of the source. It must be a defensible development of the source's intended point. If the choice is between a specific interpretation that might be wrong and a generic paraphrase that cannot be tested, choose the specific interpretation.

QUALITY TEST
For every sentence, ask:
- What information does this sentence add?
- What operation, condition, example, or inference does it make explicit?
- Could a reader identify what would make it false?
Delete or reconstruct any sentence that has no good answer.

CALIBRATION EXAMPLES

Example 1 — remove puffery without losing content:
SOURCE: "Reverse brain engineering represents a fascinating intersection of neuroscience, computational modeling, and artificial intelligence."
CORRECT: "Reverse brain engineering combines several disciplines, including neuroscience, artificial intelligence, and computational modeling."
WRONG: "Reverse brain engineering is an important and innovative interdisciplinary field."

Example 2 — operationalize a vague claim instead of paraphrasing it:
SOURCE: "By systematically mapping the brain's intricate neural architecture, researchers hope to unlock the fundamental principles underlying cognition and consciousness."
CORRECT: "The basic principle of reverse brain engineering is that we can learn how the brain works by building machines that do what brains do. If researchers build a machine that learns language, the machine will demonstrate at least one possible way in which a brain can acquire language. The machine will not prove that brains learn language in exactly that way, but it will replace an unexplained ability with a mechanism that can be built, observed, tested, and altered."
WRONG: "Researchers aim to understand cognition and consciousness by analyzing the brain's neural structures."

Full calibration — reconstruct the argument rather than preserving empty language:
SOURCE: "Reverse brain engineering represents a fascinating intersection of neuroscience, computational modeling, and artificial intelligence. By systematically mapping the brain's intricate neural architecture, researchers hope to unlock the fundamental principles underlying cognition and consciousness. This endeavor involves numerous complex challenges. Advances in connectomics, high-resolution imaging, and machine learning have opened up exciting new possibilities. A deeper understanding of neural computation could revolutionize neurological treatment and AI."
CORRECT: "Reverse brain engineering combines neuroscience, artificial intelligence, and computational modeling. Its basic principle is that we can learn how the brain works by building machines that do what brains do. If researchers build a machine that learns language, the machine will establish at least one possible account of how a brain acquires language. The machine will not prove that the brain uses the same mechanism, but researchers will be able to inspect the machine, alter its parts, and test which parts are required for learning. The brain contains too many interacting neurons and synapses for researchers to reproduce all of them individually, and a machine that imitates one result may omit mechanisms that matter elsewhere. Existing language models nevertheless show that machines can reproduce some cognitive performance. Continued success would produce both scientific explanations and practical technology because researchers would acquire the explanations by building systems that perform the relevant functions."

Example 3 — prefer explicit reference over elegance:
SOURCE: "Mary and Bob often quarreled, but the latter was less troubled by these spats than the former."
CORRECT: "Bob and Mary argued a lot. The arguments troubled Mary a great deal; they did not trouble Bob."

Example 4 — distinguish qualification from hedging:
HEDGE: "Some authorities suggest that the treatment may affect immune function, although the issue is complex and no firm conclusion can be reached."
QUALIFIED CLAIM: "In the controlled study, patients who received the larger dose experienced more infections than patients who received the smaller dose. Some patients who received the larger dose experienced no immune suppression, and the suppression observed in other patients ended after treatment stopped."

The examples demonstrate the required operation. Do not copy their subject matter into an unrelated passage.

TRANSFORMATION BLUEPRINT
The blueprint below was produced by a separate analysis of this passage. Use its concrete mechanisms, success conditions, examples, qualifications, and logical connections. Do not mention the blueprint and do not format the output as an analysis or numbered list.

${blueprint}

PASSAGE TO TRANSFORM:
${inputText}`;
}

function buildFinalAuditPrompt(inputText: string, blueprint: string, draft: string): string {
  const sourceWords = inputText.trim().split(/\s+/).filter(Boolean).length;
  const maximumWords = Math.max(1, sourceWords * 2);
  return `Return only a corrected final passage. Do not explain your corrections.

The draft below was supposed to transform the source into direct, operational, falsifiable prose. Perform an adversarial sentence-by-sentence audit and then silently correct every failure.

Reject and reconstruct:
- puffery or praise;
- unnecessary adjectives and adverbs;
- metaphors and prestige terms such as unlock, uncover, breakthrough, frontier, landscape, revolutionary, transformative, remarkable, profound, significant, promising, exciting, intricate, crucial, and fascinating;
- undefined operations such as analyze, map, understand, explore, advance, improve, or address unless the sentence states exactly how the operation is performed and what observable result it produces;
- vague appeals to complexity, possibility, collaboration, importance, or future impact;
- hedges that avoid a definite claim;
- decorative transitions;
- generic conclusions that merely announce that something could help, matter, improve, or advance;
- pronouns or elegant substitutes with ambiguous referents;
- any sentence that does not add a concrete claim, mechanism, condition, example, inference, limitation, or test.

Retain complete sentences and real qualifications. Preserve definite source facts. Use the blueprint's concrete interpretation even where that interpretation goes beyond what the vague source literally entails. Do not retreat to a safe summary. If a claim requires an example or observable test, include it.

LENGTH LIMIT
The source contains ${sourceWords} words. The corrected passage may be shorter, but it must not exceed ${maximumWords} words. Do not pad the passage to reach a target length.

SOURCE:
${inputText}

BLUEPRINT:
${blueprint}

DRAFT TO AUDIT AND CORRECT:
${draft}`;
}

function failureScore(text: string): number {
  const patterns: Array<[RegExp, number]> = [
    [/\b(fascinating|intricate|remarkable|promising|profound|exciting|crucial)\b/gi, 4],
    [/\b(unlock|uncover|navigate|revolutionize|breakthroughs?|transformative|frontier|landscape)\b/gi, 3],
    [/\b(could|might|may|possibly|potentially|perhaps)\b/gi, 2],
    [/\b(significantly|fundamentally|systematically|essentially)\b/gi, 2],
    [/\b(important to note|it should be noted|in conclusion|ultimately)\b/gi, 3],
    [/\b(advance|advancing|advancement|improve|improving|address|explore)\b/gi, 1],
    [/\b(complex|complexity|challenging|challenges)\b/gi, 1],
  ];

  return patterns.reduce((score, [pattern, weight]) => {
    return score + ((text.match(pattern) || []).length * weight);
  }, 0);
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
  return words.slice(0, maximumWords).join(" ").replace(/[,;:]?$/, "."); 
}

export class TextTransformerService {
  async transform(inputText: string): Promise<string> {
    const text = inputText.trim();
    if (!text) throw new Error("Input text is required");
    if (text.length > 150000) {
      throw new Error("Input text must be 150,000 characters or fewer");
    }

    const blueprint = await aiProviderService.rewrite("openai", {
      inputText: text,
      rawPrompt: buildBlueprintPrompt(text),
    });
    if (!blueprint.trim()) {
      throw new Error("The transformation analysis returned no blueprint");
    }

    const draft = await aiProviderService.rewrite("openai", {
      inputText: text,
      rawPrompt: buildTransformationPrompt(text, blueprint),
    });
    if (!draft.trim()) {
      throw new Error("The transformation returned no draft");
    }

    const audited = await aiProviderService.rewrite("openai", {
      inputText: text,
      rawPrompt: buildFinalAuditPrompt(text, blueprint, draft),
    });
    const selected = audited.trim() && failureScore(audited) < failureScore(draft)
      ? audited
      : draft;
    const sourceWords = text.split(/\s+/).filter(Boolean).length;
    return limitToCompleteSentences(selected, sourceWords * 2);
  }
}

export const textTransformerService = new TextTransformerService();