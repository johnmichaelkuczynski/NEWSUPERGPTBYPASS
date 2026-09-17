import fs from "fs";
import path from "path";

const MASTER_SOURCE_FILENAME = "1984__The_Definitive_Dystopian_Classic_on_Totalitarian_Power_(_1789603514019.txt";
const MIN_STYLE_WORDS = 150;
const MAX_STYLE_WORDS = 12000;
const STYLE_TO_INPUT_RATIO = 1.5;

let cachedNarrativeParagraphs: string[] | null = null;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function isNarrativeProse(paragraph: string): boolean {
  const trimmed = paragraph.trim();
  if (!trimmed) return false;
  if (/^(?:THE END|APPENDIX|PART\s+(?:ONE|TWO|THREE)|[IVXLCDM]+)$/i.test(trimmed)) return false;
  if (/^\[[^\]]+\]$/.test(trimmed)) return false;
  if (trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) return false;
  return true;
}

function loadNarrativeParagraphs(): string[] {
  if (cachedNarrativeParagraphs) return cachedNarrativeParagraphs;

  const candidates = [
    path.join(process.cwd(), "dist", "master-style-source.txt"),
    path.join(process.cwd(), "attached_assets", MASTER_SOURCE_FILENAME),
  ];
  const sourcePath = candidates.find(candidate => fs.existsSync(candidate));
  if (!sourcePath) {
    throw new Error("The operative master style text is missing from the application build.");
  }

  const source = fs.readFileSync(sourcePath, "utf-8");
  const narrative = source.split(/\r?\nTHE END\s*\r?\n/i)[0]?.trim();
  if (!narrative || !narrative.endsWith("He loved Big Brother.")) {
    throw new Error("The operative master style text does not contain the expected narrative boundary.");
  }

  cachedNarrativeParagraphs = narrative
    .split(/\r?\n\s*\r?\n/)
    .map(paragraph => paragraph.trim())
    .filter(isNarrativeProse);

  if (cachedNarrativeParagraphs.length === 0) {
    throw new Error("The operative master style text contains no narrative prose.");
  }
  return cachedNarrativeParagraphs;
}

function stableHash(text: string): number {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function getMasterStyleExcerpt(inputText: string): string {
  const paragraphs = loadNarrativeParagraphs();
  const inputWords = countWords(inputText);
  const targetWords = Math.min(
    MAX_STYLE_WORDS,
    Math.max(MIN_STYLE_WORDS, Math.ceil(inputWords * STYLE_TO_INPUT_RATIO)),
  );

  // Keep excerpts contiguous and away from the final edge so they never wrap
  // from the end of the novel back to its opening.
  const startRange = Math.max(1, Math.floor(paragraphs.length * 0.8));
  const startIndex = stableHash(inputText) % startRange;
  const selected: string[] = [];
  let selectedWords = 0;

  for (let index = startIndex; index < paragraphs.length && selectedWords < targetWords; index++) {
    selected.push(paragraphs[index]);
    selectedWords += countWords(paragraphs[index]);
  }

  const excerpt = selected.join("\n\n").trim();
  console.log(`[master-style] Selected ${selectedWords} narrative words for ${inputWords} input words.`);
  return excerpt;
}