import { aiProviderService, type ClaimAuditResult, type RewriteParams } from "./aiProviders";

export interface TemplateCleanupResult {
  text: string;
  removed: string[];
  flagged: string[];
}

export interface FaithfulRewriteResult {
  rewrittenText: string;
  audit: ClaimAuditResult | null;
  retryPerformed: boolean;
  warning?: string;
  templateRemovals: string[];
  templateFlags: string[];
}

function normalizeMarker(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function sourceContainsMarker(source: string, marker: string): boolean {
  return normalizeMarker(source).includes(normalizeMarker(marker));
}

export function cleanTemplateLeftovers(outputText: string, inputText: string): TemplateCleanupResult {
  const removed: string[] = [];
  const flagged: string[] = [];
  let text = outputText;

  const replaceIfAbsent = (pattern: RegExp, replacement: string | ((match: string, ...groups: string[]) => string)) => {
    text = text.replace(pattern, (match: string, ...groups: string[]) => {
      if (sourceContainsMarker(inputText, match)) return match;
      removed.push(match.trim());
      return typeof replacement === "function" ? replacement(match, ...groups) : replacement;
    });
  };

  // Remove copied numbered list labels only when Box A does not contain the same marker.
  replaceIfAbsent(/(^|\n)([ \t]*)(\(?\d{1,2}\)?[.)])(?=[ \t]+)/g, (_match, boundary, spacing) => `${boundary}${spacing}`);

  // Remove footnote-style markers and copied numeric cross-references.
  replaceIfAbsent(/\b\d{1,3}\*/g, "");
  replaceIfAbsent(/\b(?:as\s+in\s+)?examples?\s+\d{1,3}(?:\s*[–—-]\s*\d{1,3})?\b/gi, (match) =>
    /^as\s+in/i.test(match) ? "" : match.replace(/\s+\d{1,3}(?:\s*[–—-]\s*\d{1,3})?$/i, "")
  );
  replaceIfAbsent(/\b\d{1,3}\s*[–—]\s*\d{1,3}\b/g, "");

  // Preserve the noun while removing ordinal template language.
  replaceIfAbsent(/\bthe\s+(?:first|second)\s+(type|category|point|kind|form|class|group)\b/gi, (match, noun) => {
    const article = match[0] === match[0].toUpperCase() ? "The" : "the";
    return `${article} ${noun}`;
  });

  // Standalone numerals can be legitimate quantities, so flag rather than blindly deleting them.
  const standaloneNumerals = text.match(/(?<![\w.*])\d{1,3}(?![\w.*])/g) || [];
  for (const numeral of standaloneNumerals) {
    if (!sourceContainsMarker(inputText, numeral) && !flagged.includes(numeral)) {
      flagged.push(numeral);
    }
  }

  text = text
    .replace(/[ \t]{2,}/g, " ")
    .replace(/([.!?])\s*,\s*/g, "$1 ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\(\s*\)/g, "")
    .replace(/([.!?]\s+)([a-z])/g, (_match, boundary, letter) => `${boundary}${letter.toUpperCase()}`)
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { text, removed, flagged };
}

function hasAuditProblems(audit: ClaimAuditResult): boolean {
  return audit.addedClaims.length > 0 || audit.missingClaims.length > 0;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function applyDeterministicFidelityGuards(
  audit: ClaimAuditResult,
  inputText: string,
  outputText: string,
): ClaimAuditResult {
  const inputWords = countWords(inputText);
  const outputWords = countWords(outputText);
  const guarded: ClaimAuditResult = {
    addedClaims: [...audit.addedClaims],
    missingClaims: [...audit.missingClaims],
  };

  const maximumExpectedWords = Math.max(inputWords + 12, Math.ceil(inputWords * 1.35));
  if (outputWords > maximumExpectedWords) {
    guarded.addedClaims.push(
      `The ${outputWords}-word draft substantially exceeds the ${inputWords}-word source and contains unsupported expansion. Keep it close to the source length and remove all invented narrative detail.`,
    );
  }

  const minimumExpectedWords = Math.max(1, Math.floor(inputWords * 0.65));
  if (outputWords < minimumExpectedWords) {
    guarded.missingClaims.push(
      `The ${outputWords}-word draft is too compressed to reliably retain every claim from the ${inputWords}-word source.`,
    );
  }

  // Apostrophes in contractions are ordinary prose, not quotation formatting.
  // Only double-quotation marks are safe to treat deterministically here.
  const quotePattern = /["“”]/;
  if (!quotePattern.test(inputText) && quotePattern.test(outputText)) {
    guarded.addedClaims.push(
      "The draft introduced quotation or dialogue formatting that does not appear in Box A. Remove it and state only Box A's content directly.",
    );
  }

  if (/^\s*["“‘']?\s*(?:attention\b|listen\b|note\b|consider\b|imagine\b)/i.test(outputText)) {
    guarded.addedClaims.push(
      "The draft introduced an attention-getter or framing command that does not appear in Box A. Begin directly with the source content.",
    );
  }

  return guarded;
}

function logCleanup(stage: string, result: TemplateCleanupResult): void {
  if (result.removed.length > 0) {
    console.warn(`[template-cleanup:${stage}] Removed: ${JSON.stringify(result.removed)}`);
  }
  if (result.flagged.length > 0) {
    console.warn(`[template-cleanup:${stage}] Flagged standalone numerals: ${JSON.stringify(result.flagged)}`);
  }
}

export async function runFaithfulRewrite(provider: string, params: RewriteParams): Promise<FaithfulRewriteResult> {
  const firstDraft = await aiProviderService.rewrite(provider, params);
  const firstCleanup = cleanTemplateLeftovers(firstDraft, params.inputText);
  logCleanup("initial", firstCleanup);

  let firstAudit: ClaimAuditResult;
  try {
    firstAudit = applyDeterministicFidelityGuards(
      await aiProviderService.auditClaims(provider, params.inputText, firstCleanup.text),
      params.inputText,
      firstCleanup.text,
    );
  } catch (error: any) {
    console.error("Claim fidelity audit unavailable:", error.message);
    return {
      rewrittenText: firstCleanup.text,
      audit: null,
      retryPerformed: false,
      warning: "Claim fidelity could not be verified automatically. Review Box D against Box A before using it.",
      templateRemovals: firstCleanup.removed,
      templateFlags: firstCleanup.flagged,
    };
  }

  if (!hasAuditProblems(firstAudit)) {
    return {
      rewrittenText: firstCleanup.text,
      audit: firstAudit,
      retryPerformed: false,
      templateRemovals: firstCleanup.removed,
      templateFlags: firstCleanup.flagged,
    };
  }

  console.warn("[claim-audit] Retrying rewrite with corrections:", JSON.stringify(firstAudit));
  const correctedDraft = await aiProviderService.rewrite(provider, {
    ...params,
    fidelityCorrections: firstAudit,
  });
  const correctedCleanup = cleanTemplateLeftovers(correctedDraft, params.inputText);
  logCleanup("retry", correctedCleanup);

  let finalAudit: ClaimAuditResult;
  try {
    finalAudit = applyDeterministicFidelityGuards(
      await aiProviderService.auditClaims(provider, params.inputText, correctedCleanup.text),
      params.inputText,
      correctedCleanup.text,
    );
  } catch (error: any) {
    console.error("Final claim fidelity audit unavailable:", error.message);
    return {
      rewrittenText: correctedCleanup.text,
      audit: null,
      retryPerformed: true,
      warning: "The corrected rewrite was generated, but its final claim fidelity could not be verified automatically. Review Box D against Box A before using it.",
      templateRemovals: [...firstCleanup.removed, ...correctedCleanup.removed],
      templateFlags: [...firstCleanup.flagged, ...correctedCleanup.flagged],
    };
  }

  const warning = hasAuditProblems(finalAudit)
    ? `Claim fidelity warning: ${finalAudit.addedClaims.length} unsupported claim(s) and ${finalAudit.missingClaims.length} missing claim(s) remain after the automatic correction.`
    : undefined;

  return {
    rewrittenText: correctedCleanup.text,
    audit: finalAudit,
    retryPerformed: true,
    warning,
    templateRemovals: [...firstCleanup.removed, ...correctedCleanup.removed],
    templateFlags: [...firstCleanup.flagged, ...correctedCleanup.flagged],
  };
}