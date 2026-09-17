export interface SyntacticHost {
  inputIndex: number;
  inputSentence: string;
  hostSentence: string;
  hostIndex: number;
  compatibility: number;
  structure: string;
  template: string;
}

interface SentenceFeatures {
  words: number;
  clauses: number;
  commas: number;
  semicolons: number;
  colons: number;
  dashes: number;
  parentheticals: number;
  coordinators: number;
  subordinators: number;
  question: boolean;
  quotation: boolean;
  startsWithConnector: boolean;
  startsWithPreposition: boolean;
  startsWithGerund: boolean;
  participialTail: boolean;
  relativeClause: boolean;
  infinitivePhrase: boolean;
  passiveConstruction: boolean;
}

const CONNECTORS = new Set([
  "and", "but", "yet", "however", "therefore", "thus", "so", "although",
  "because", "if", "when", "while", "whereas", "since", "nevertheless",
]);

const SUBORDINATORS = /\b(although|because|if|unless|when|whenever|while|whereas|since|though|even though|provided that|insofar as|to the extent that)\b/gi;
const COORDINATORS = /\b(and|but|or|nor|for|yet|so)\b/gi;
const OPENING_PREPOSITIONS = new Set([
  "from", "by", "through", "with", "without", "within", "among", "between",
  "after", "before", "during", "despite", "in", "on", "at", "under", "over",
]);
const STRUCTURAL_WORDS = new Set([
  "a", "an", "the", "this", "that", "these", "those", "all", "any", "each", "every",
  "some", "no", "not", "neither", "either", "both", "more", "most", "only", "merely",
  "is", "are", "was", "were", "be", "being", "been", "am", "do", "does", "did",
  "has", "have", "had", "can", "could", "may", "might", "must", "shall", "should",
  "will", "would", "it", "its", "they", "them", "their", "one", "we", "our", "you",
  "your", "he", "she", "his", "her", "who", "whom", "whose", "which", "what",
  "and", "but", "or", "nor", "for", "yet", "so", "if", "unless", "although", "though",
  "because", "since", "while", "whereas", "when", "whenever", "as", "than", "then",
  "of", "to", "in", "on", "at", "by", "from", "with", "without", "within", "into",
  "through", "between", "among", "about", "over", "under", "before", "after", "against",
  "there", "here", "such", "same", "other", "another", "also", "even", "rather",
  "however", "therefore", "thus", "presumably", "ultimately", "incidentally",
  "insofar", "extent", "given", "contrary", "namely", "viz", "per", "ipso", "facto",
]);

export function splitSentences(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
  if (!normalized) return [];

  return (normalized.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g) || [normalized])
    .map((sentence) => sentence.replace(/\s+/g, " ").trim())
    .filter((sentence) => {
      const words = sentence.split(/\s+/).filter(Boolean);
      if (words.length < 4 || words.length > 120) return false;
      return !/^(chapter|section|part)\s+\w+/i.test(sentence)
        && !/^\d+(?:\.\d+)*[\s,.)]+\S/.test(sentence);
    });
}

function countMatches(text: string, pattern: RegExp): number {
  return (text.match(pattern) || []).length;
}

function features(sentence: string): SentenceFeatures {
  const words = sentence.split(/\s+/).filter(Boolean);
  const firstWord = words[0]?.replace(/[^a-z]/gi, "").toLowerCase() || "";
  const commas = countMatches(sentence, /,/g);
  const semicolons = countMatches(sentence, /;/g);
  const colons = countMatches(sentence, /:/g);
  const dashes = countMatches(sentence, /—|--/g);
  const parentheticals = countMatches(sentence, /\([^)]*\)/g);
  const coordinators = countMatches(sentence, COORDINATORS);
  const subordinators = countMatches(sentence, SUBORDINATORS);

  return {
    words: words.length,
    clauses: 1 + commas + semicolons + colons + dashes + subordinators,
    commas,
    semicolons,
    colons,
    dashes,
    parentheticals,
    coordinators,
    subordinators,
    question: sentence.endsWith("?"),
    quotation: /["“”]/.test(sentence),
    startsWithConnector: CONNECTORS.has(firstWord),
    startsWithPreposition: OPENING_PREPOSITIONS.has(firstWord),
    startsWithGerund: /^[A-Za-z]+ing\b/.test(words[0] || ""),
    participialTail: /,\s+(?:\w+\s+){0,2}\w+ing\b/i.test(sentence),
    relativeClause: /\b(that|which|who|whom|whose)\b/i.test(sentence),
    infinitivePhrase: /\bto\s+[a-z]+(?:\s|[,.])/i.test(sentence),
    passiveConstruction: /\b(?:is|are|was|were|be|been|being)\s+\w+(?:ed|en)\b/i.test(sentence),
  };
}

function difference(a: SentenceFeatures, b: SentenceFeatures): number {
  const wordDifference = Math.abs(a.words - b.words) / Math.max(a.words, b.words, 1);
  const clauseDifference = Math.abs(a.clauses - b.clauses) / Math.max(a.clauses, b.clauses, 1);

  return (
    wordDifference * 5
    + clauseDifference * 4
    + Math.abs(a.commas - b.commas) * 0.8
    + Math.abs(a.semicolons - b.semicolons) * 1.5
    + Math.abs(a.colons - b.colons) * 1.2
    + Math.abs(a.dashes - b.dashes) * 1.2
    + Math.abs(a.parentheticals - b.parentheticals) * 1.5
    + Math.abs(a.coordinators - b.coordinators) * 0.5
    + Math.abs(a.subordinators - b.subordinators) * 0.8
    + (a.question === b.question ? 0 : 4)
    + (a.quotation === b.quotation ? 0 : 1)
    + (a.startsWithConnector === b.startsWithConnector ? 0 : 1)
    + (a.startsWithPreposition === b.startsWithPreposition ? 0 : 4)
    + (a.startsWithGerund === b.startsWithGerund ? 0 : 3)
    + (a.participialTail === b.participialTail ? 0 : 4)
    + (a.relativeClause === b.relativeClause ? 0 : 3)
    + (a.infinitivePhrase === b.infinitivePhrase ? 0 : 2)
    + (a.passiveConstruction === b.passiveConstruction ? 0 : 2)
  );
}

function describeStructure(sentence: string): string {
  const value = features(sentence);
  const traits = [
    `${value.words} words`,
    `${value.clauses} clause unit${value.clauses === 1 ? "" : "s"}`,
  ];
  if (value.commas) traits.push(`${value.commas} comma break${value.commas === 1 ? "" : "s"}`);
  if (value.semicolons) traits.push(`${value.semicolons} semicolon`);
  if (value.colons) traits.push(`${value.colons} colon`);
  if (value.dashes) traits.push(`${value.dashes} dash interruption${value.dashes === 1 ? "" : "s"}`);
  if (value.parentheticals) traits.push(`${value.parentheticals} parenthetical`);
  if (value.subordinators) traits.push("subordination");
  if (value.startsWithConnector) traits.push("connector opening");
  if (value.startsWithPreposition) traits.push("prepositional opening");
  if (value.startsWithGerund) traits.push("gerund opening");
  if (value.participialTail) traits.push("participial modifier");
  if (value.relativeClause) traits.push("relative clause");
  if (value.infinitivePhrase) traits.push("infinitive phrase");
  if (value.passiveConstruction) traits.push("passive construction");
  if (value.question) traits.push("interrogative");
  return traits.join(", ");
}

function createTemplate(sentence: string): string {
  const tokens = sentence.match(/[A-Za-zÀ-ÖØ-öø-ÿ'’]+|\d+(?:[.,]\d+)*|[—–,:;!?()."-]/g) || [];
  const output: string[] = [];
  let contentSlotOpen = false;

  for (const token of tokens) {
    const isWord = /^[A-Za-zÀ-ÖØ-öø-ÿ'’]+$/.test(token);
    const normalized = token.toLowerCase().replace(/[’']/g, "'");
    if (isWord && !STRUCTURAL_WORDS.has(normalized)) {
      if (!contentSlotOpen) output.push("[CONTENT]");
      contentSlotOpen = true;
      continue;
    }

    contentSlotOpen = false;
    output.push(isWord ? normalized : token);
  }

  return output
    .join(" ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([(])\s+/g, "$1")
    .replace(/\s+([)])/g, "$1")
    .replace(/\s*—\s*/g, " — ")
    .trim();
}

export function selectSyntacticHosts(inputText: string, styleText: string): SyntacticHost[] {
  const inputSentences = splitSentences(inputText);
  const styleSentences = splitSentences(styleText);
  if (inputSentences.length === 0 || styleSentences.length === 0) return [];

  const styleFeatures = styleSentences.map(features);
  const useCounts = new Map<number, number>();

  return inputSentences.map((inputSentence, inputIndex) => {
    const inputFeatures = features(inputSentence);
    let bestIndex = 0;
    let bestScore = Number.POSITIVE_INFINITY;

    styleSentences.forEach((_, styleIndex) => {
      const reusePenalty = (useCounts.get(styleIndex) || 0) * 2;
      const score = difference(inputFeatures, styleFeatures[styleIndex]) + reusePenalty;
      if (score < bestScore) {
        bestScore = score;
        bestIndex = styleIndex;
      }
    });

    useCounts.set(bestIndex, (useCounts.get(bestIndex) || 0) + 1);
    return {
      inputIndex,
      inputSentence,
      hostSentence: styleSentences[bestIndex],
      hostIndex: bestIndex,
      compatibility: Math.max(0, Math.round(100 - bestScore * 8)),
      structure: describeStructure(styleSentences[bestIndex]),
      template: createTemplate(styleSentences[bestIndex]),
    };
  });
}

export function rankSyntacticCandidates(
  inputSentence: string,
  styleText: string,
  limit = 16,
): SyntacticHost[] {
  const styleSentences = splitSentences(styleText);
  const inputFeatures = features(inputSentence);

  return styleSentences
    .map((hostSentence, hostIndex) => {
      const score = difference(inputFeatures, features(hostSentence));
      return {
        inputIndex: 0,
        inputSentence,
        hostSentence,
        hostIndex,
        compatibility: Math.max(0, Math.round(100 - score * 8)),
        structure: describeStructure(hostSentence),
        template: createTemplate(hostSentence),
        score,
      };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map(({ score: _score, ...candidate }) => candidate);
}