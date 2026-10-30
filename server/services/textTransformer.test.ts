import assert from "node:assert/strict";
import test from "node:test";
import { TextTransformerService } from "./textTransformer";
import { countWords, splitTransformationInput } from "./transformationProtocol";
import { postprocessProse } from "./prosePostprocessor";

test("calls the model only for D and E, then applies B and N in code", async () => {
  const prompts: string[] = [];
  const outputs = ["Claim ledger", "Explicit claim."];
  const service = new TextTransformerService(async (_source, prompt) => {
    prompts.push(prompt);
    return outputs[prompts.length - 1];
  });
  assert.equal(await service.transform("The original contains six ordinary words."), postprocessProse(outputs[1]).text);
  assert.equal(prompts.length, 2);
  for (const [i, stage] of ["D", "E"].entries()) {
    assert.ok(prompts[i].startsWith(`Apply stage ${stage}`));
    if (i > 0) assert.ok(prompts[i].includes(outputs[i - 1]));
  }
});

test("never returns the internal ledger when explicit reconstruction fails", async () => {
  const service = new TextTransformerService(async (_source, prompt) =>
    prompt.startsWith("Apply stage D") ? "Internal ledger" : "");
  await assert.rejects(service.transform("A source sentence."), /stage E returned no text/);
});

test("returns imperfect prose without quality rejection", async () => {
  const service = new TextTransformerService(async () => "Perhaps it might be important.");
  assert.equal(await service.transform("A source sentence with enough words."), "Perhaps it might be important.");
});

test("enforces the 2x cap even when length correction is ignored", async () => {
  const service = new TextTransformerService(async () => "Too many words in this response. Another long sentence follows here.");
  const result = await service.transform("Short source.");
  assert.ok(countWords(result) <= 4);
  assert.ok(result.length > 0);
});

test("chunks long input without losing or reordering words", () => {
  const input = Array.from({ length: 2105 }, (_, i) => `word${i}`).join(" ");
  const chunks = splitTransformationInput(input);
  assert.equal(chunks.length, 3);
  assert.ok(chunks.every(chunk => countWords(chunk) <= 1000));
  assert.equal(chunks.join(" "), input);
});

test("rejects empty or oversized input before calling a provider", async () => {
  const service = new TextTransformerService(async () => { throw new Error("Must not call"); });
  await assert.rejects(service.transform(" "), /Input text is required/);
  await assert.rejects(service.transform("x".repeat(150001)), /150,000/);
});

test("breaks the screenshot's three-sentence parallel run", () => {
  const result = postprocessProse("They praised kings. They marked ceremonies. They put events in sacred time.");
  assert.ok(result.mergedSentences > 0);
  assert.match(result.text, /They praised kings; they marked ceremonies/);
  for (const claim of ["praised kings", "marked ceremonies", "put events in sacred time"]) {
    assert.ok(result.text.includes(claim));
  }
});

test("removes narrowly identified editorial commentary but keeps factual sentences", () => {
  const result = postprocessProse("Herodotus investigated the Persian Wars. That mattered because asking for causes differs from listing events. Thucydides rejected divine explanation.");
  assert.equal(result.removedCommentary, 1);
  assert.ok(result.text.includes("Herodotus"));
  assert.ok(result.text.includes("Thucydides rejected divine explanation"));
  assert.ok(!result.text.includes("That mattered"));
});

test("preserves quotations, names, dates, negation, and substantive qualifications", () => {
  const passage = 'Sima Qian wrote around 100 BC. Ranke used the phrase “as it actually was.” The account does not prove that all records are reliable. If a record changes, its interpretation may change.';
  const result = postprocessProse(passage);
  for (const phrase of ["Sima Qian", "100 BC", "“as it actually was.”", "does not prove", "If a record changes", "may change"]) {
    assert.ok(result.text.includes(phrase), phrase);
  }
});

test("surface irregularities are bounded and reproducible, not model requests", () => {
  const prose = Array.from({ length: 50 }, () => "The same ordinary process sometimes gives a different result.").join(" ");
  const first = postprocessProse(prose);
  assert.equal(first.text, postprocessProse(prose).text);
  assert.ok(first.surfaceEdits >= 1);
  assert.ok(first.surfaceEdits <= Math.ceil(countWords(prose) / 80));
  assert.ok(first.text.split(/\n\n/).length <= 2);
});

test("normalizes a narrow ordinary-word pair without rewriting technical nouns", () => {
  const result = postprocessProse("We use connectomics. Researchers utilize connectomics.");
  assert.ok(!result.text.includes("utilize"));
  assert.equal(result.repeatedWords, 1);
  assert.equal(result.text.match(/connectomics/g)?.length, 2);
});

test("does not erase output consisting only of commentary", () => {
  assert.ok(postprocessProse("That mattered because records changed.").text.length > 0);
});
