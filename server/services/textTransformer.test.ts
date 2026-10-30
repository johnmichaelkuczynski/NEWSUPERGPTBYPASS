import assert from "node:assert/strict";
import test from "node:test";
import { TextTransformerService } from "./textTransformer";
import { countWords, splitTransformationInput } from "./transformationProtocol";

test("runs D, E, B, N in order and forwards each result", async () => {
  const prompts: string[] = [];
  const outputs = ["Claim ledger", "Explicit claim.", "A short claim; an explanation.", "Final plain prose."];
  const service = new TextTransformerService(async (_source, prompt) => {
    prompts.push(prompt);
    return outputs[prompts.length - 1];
  });
  assert.equal(await service.transform("The original contains six ordinary words."), outputs[3]);
  assert.equal(prompts.length, 4);
  for (const [i, stage] of ["D", "E", "B", "N"].entries()) {
    assert.ok(prompts[i].startsWith(`Apply stage ${stage}`));
    if (i > 0) assert.ok(prompts[i].includes(outputs[i - 1]));
  }
});

for (const failedStage of ["B", "N"]) {
  test(`returns completed prose when ${failedStage} fails`, async () => {
    const service = new TextTransformerService(async (_source, prompt) => {
      if (prompt.startsWith(`Apply stage ${failedStage}`)) throw new Error("Provider unavailable");
      return prompt.startsWith("Apply stage D") ? "Internal ledger" : "Completed prose.";
    });
    assert.equal(await service.transform("A sufficient source sentence here."), "Completed prose.");
  });
}

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
