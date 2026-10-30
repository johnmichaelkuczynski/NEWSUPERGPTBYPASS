import { countWords } from "./transformationProtocol";

export interface PostprocessResult {
  text: string;
  removedCommentary: number;
  mergedSentences: number;
  repeatedWords: number;
  surfaceEdits: number;
}

const commentary = [
  /^That mattered because\b/i,
  /^This is a turning point toward\b/i,
  /^It does not mean (?:that )?[\s\S]*\b(?:already|fully) modern\b/i,
  /^It is important to (?:note|remember|recognize)\b/i,
  /^This (?:highlights|underscores|illustrates) the importance of\b/i,
  /^In (?:conclusion|summary),/i,
];

function sentences(text: string): string[] {
  return Array.from(new Intl.Segmenter("en", { granularity: "sentence" }).segment(text),
    ({ segment }) => segment.trim()).filter(Boolean);
}

function randomFor(text: string): () => number {
  let state = 2166136261;
  for (const char of text) state = Math.imul(state ^ char.charCodeAt(0), 16777619);
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

function subject(sentence: string): string {
  return sentence.match(/^(They|We|It|He|She|Researchers|Historians|The\s+[\p{L}-]+|A\s+[\p{L}-]+)\b/u)?.[0].toLowerCase() || "";
}

function canMerge(left: string, right: string): boolean {
  // Do not alter punctuation in quotations, citations, questions or labels.
  return /\p{L}\.$/u.test(left)
    && !/["“”]|https?:|[;:]/.test(left + right)
    && !/\b(?:Mr|Mrs|Ms|Dr|Prof|etc|Jr|Sr)\.$/.test(left)
    && countWords(left + " " + right) <= 90;
}

function merge(left: string, right: string): string {
  // Lowercase only unambiguous sentence-opening function words. Leave proper
  // nouns (including names at the start of a sentence) untouched.
  const next = right.replace(/^(The|A|An|They|We|It|He|She|This|These|Those|There)\b/,
    word => word.toLowerCase());
  return `${left.slice(0, -1)}; ${next}`;
}

// Small, explicit lexical families, not inferred replacements of technical
// nouns. Normalize only when both variants actually occur in the passage.
const wordFamilies = [
  ["use", "utilize"],
  ["uses", "utilizes"],
  ["used", "utilized"],
  ["using", "utilizing"],
  ["start", "commence"],
  ["started", "commenced"],
  ["help", "assist"],
] as const;

export function postprocessProse(input: string): PostprocessResult {
  const metrics: PostprocessResult = {
    text: input.trim(), removedCommentary: 0, mergedSentences: 0,
    repeatedWords: 0, surfaceEdits: 0,
  };
  const random = randomFor(input);
  const original = sentences(input);
  // Whole-sentence removal is deliberately narrow. Keep source details,
  // definitions, objections and qualifications, even if they sound formal.
  const retained = original.filter(sentence => {
    // Quoted editorial phrases are content, not narrator commentary.
    const remove = !/["“”]/.test(sentence) && commentary.some(pattern => pattern.test(sentence));
    if (remove) metrics.removedCommentary++;
    return !remove;
  });
  // Never discard the only completed output for a stylistic reason.
  const working = retained.length ? retained : original;
  if (!retained.length) metrics.removedCommentary = 0;
  const burst: string[] = [];
  for (let i = 0; i < working.length; i++) {
    let sentence = working[i];
    const sameSubjectRun = i + 2 < working.length
      && !!subject(sentence)
      && subject(sentence) === subject(working[i + 1])
      && subject(sentence) === subject(working[i + 2]);
    const mergeShortPair = i + 1 < working.length
      && countWords(sentence) <= 24
      && countWords(working[i + 1]) <= 24
      && random() < 0.55;
    if ((sameSubjectRun || mergeShortPair) && canMerge(sentence, working[i + 1])) {
      sentence = merge(sentence, working[++i]);
      metrics.mergedSentences++;
      // Some groups become genuinely long sentences; others remain pairs.
      if (i + 1 < working.length && random() < 0.35
          && canMerge(sentence.replace(";", ","), working[i + 1])) {
        sentence = merge(sentence, working[++i]);
        metrics.mergedSentences++;
      }
    }
    burst.push(sentence);
  }

  const tokens = burst.join(" ").match(/\s+|[\p{L}]+(?:['’][\p{L}]+)?|[^\s\p{L}]+/gu) || [];
  // Preserve quoted passages exactly, including all surface spelling.
  let quoted = false;
  const editable = tokens.map(token => {
    if (/["“”]/.test(token)) {
      if ((token.match(/["“”]/g)?.length || 0) % 2) quoted = !quoted;
      return false;
    }
    return !quoted && /^[a-z]+$/.test(token);
  });
  for (const family of wordFamilies) {
    const present = family.filter(word => tokens.some((token, i) => editable[i] && token === word));
    if (present.length < 2) continue;
    // The plain first member is preferred; do not introduce another synonym.
    const plain = family[0];
    tokens.forEach((token, i) => {
      if (editable[i] && token === family[1]) {
        tokens[i] = plain;
        metrics.repeatedWords++;
      }
    });
  }

  // Approximately one minor surface edit per 90 words. Only ordinary words
  // from a fixed allowlist are eligible; names, numbers, technical terms,
  // modal verbs and negation are never edited.
  const slips: Record<string, string> = {
    different: "differnt", another: "anohter", because: "becuase",
    sometimes: "somtimes", ordinary: "ordnary",
  };
  let wordIndex = 0;
  let nextEdit = 80 + Math.floor(random() * 21);
  for (let i = 0; i < tokens.length; i++) {
    if (/[\p{L}\p{N}]/u.test(tokens[i])) wordIndex++;
    if (wordIndex < nextEdit || !editable[i]) continue;
    // A dropped article before an ordinary descriptive word is preferred.
    const nextWordIndex = i + 2;
    const after = tokens[nextWordIndex];
    if (tokens[i] === "the" && /^\s+$/.test(tokens[i + 1] || "")
        && editable[nextWordIndex] && /^(?:same|next|first|last|other|different|ordinary)$/.test(after || "")) {
      tokens[i] = "";
      tokens[i + 1] = "";
      metrics.surfaceEdits++;
      nextEdit = wordIndex + 80 + Math.floor(random() * 21);
    } else if (slips[tokens[i]]) {
      tokens[i] = slips[tokens[i]];
      metrics.surfaceEdits++;
      nextEdit = wordIndex + 80 + Math.floor(random() * 21);
    }
  }

  const finished = sentences(tokens.join(""));
  // One block for short passages; two intentionally unequal blocks for longer
  // passages. Never add headings or standardized paragraph templates.
  const totalWords = countWords(finished.join(" "));
  let used = 0;
  let split = -1;
  if (totalWords >= 250) {
    for (let i = 0; i < finished.length - 1; i++) {
      used += countWords(finished[i]);
      if (used >= totalWords * 0.62) { split = i + 1; break; }
    }
  }
  metrics.text = split > 0
    ? `${finished.slice(0, split).join(" ")}\n\n${finished.slice(split).join(" ")}`
    : finished.join(" ");
  return metrics;
}
