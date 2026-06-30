import type { InstructionPreset } from "@shared/schema";

export const instructionPresets: InstructionPreset[] = [
  // Advanced Techniques
  {
    id: "mixed-cadence-sprawl",
    name: "Mixed cadence + clause sprawl",
    description: "Alternate short and long sentences; allow some long sentences to wander with extra clauses.",
    category: "Advanced Techniques",
    instruction: "Alternate short and long sentences; allow some long sentences to wander with extra clauses."
  },
  {
    id: "asymmetric-emphasis",
    name: "Asymmetric emphasis",
    description: "Over-elaborate one point; compress or skate past another.",
    category: "Advanced Techniques",
    instruction: "Over-elaborate one point; compress or skate past another."
  },
  {
    id: "one-aside",
    name: "One aside",
    description: "Add a quick parenthetical or em-dash remark — factual, not jokey.",
    category: "Advanced Techniques",
    instruction: "Add a quick parenthetical or em-dash remark — factual, not jokey."
  },
  {
    id: "hedge-twice",
    name: "Hedge twice",
    description: "Use two mild uncertainty markers (\"probably,\" \"seems,\" \"roughly,\" \"I think\").",
    category: "Advanced Techniques",
    instruction: "Use two mild uncertainty markers (\"probably,\" \"seems,\" \"roughly,\" \"I think\")."
  },
  {
    id: "local-disfluency",
    name: "Local disfluency",
    description: "Keep one redundant or slightly awkward phrase that still makes sense.",
    category: "Advanced Techniques",
    instruction: "Keep one redundant or slightly awkward phrase that still makes sense."
  },
  {
    id: "analogy-injection",
    name: "Analogy injection",
    description: "Insert a short, concrete comparison to something unrelated but illustrative.",
    category: "Advanced Techniques",
    instruction: "Insert a short, concrete comparison to something unrelated but illustrative."
  },
  {
    id: "topic-snap",
    name: "Topic snap",
    description: "Abruptly shift focus once, then return.",
    category: "Advanced Techniques",
    instruction: "Abruptly shift focus once, then return."
  },
  {
    id: "friction-detail",
    name: "Friction detail",
    description: "Drop in a small, seemingly unnecessary but real-world-plausible detail.",
    category: "Advanced Techniques",
    instruction: "Drop in a small, seemingly unnecessary but real-world-plausible detail."
  },

  // Structure & Cadence
  {
    id: "compression-light",
    name: "Compression — light (-15%)",
    description: "Cut filler; merge short clauses; keep meaning.",
    category: "Structure & Cadence",
    instruction: "Cut filler; merge short clauses; keep meaning."
  },
  {
    id: "compression-medium",
    name: "Compression — medium (-30%)",
    description: "Trim hard; delete throat-clearing; tighten syntax.",
    category: "Structure & Cadence",
    instruction: "Trim hard; delete throat-clearing; tighten syntax."
  },
  {
    id: "compression-heavy",
    name: "Compression — heavy (-45%)",
    description: "Sever redundancies; collapse repeats; keep core claims.",
    category: "Structure & Cadence",
    instruction: "Sever redundancies; collapse repeats; keep core claims."
  },
  {
    id: "decrease-50",
    name: "Decrease by 50%",
    description: "Reduce the text length by half while preserving meaning.",
    category: "Structure & Cadence",
    instruction: "Decrease by 50%."
  },
  {
    id: "increase-150",
    name: "Increase by 150%",
    description: "Expand the text to 150% longer with additional detail and elaboration.",
    category: "Structure & Cadence",
    instruction: "Increase by 150%."
  },
  {
    id: "mixed-cadence",
    name: "Mixed cadence",
    description: "Alternate 5–35-word sentences; no uniform rhythm.",
    category: "Structure & Cadence",
    instruction: "Alternate 5–35-word sentences; no uniform rhythm."
  },
  {
    id: "clause-surgery",
    name: "Clause surgery",
    description: "Reorder main/subordinate clauses in 30% of sentences.",
    category: "Structure & Cadence",
    instruction: "Reorder main/subordinate clauses in 30% of sentences."
  },
  {
    id: "front-load",
    name: "Front-load claim",
    description: "Put the main conclusion in sentence 1; support follows.",
    category: "Structure & Cadence",
    instruction: "Put the main conclusion in sentence 1; support follows."
  },
  {
    id: "back-load",
    name: "Back-load claim",
    description: "Delay the conclusion to the final 2–3 sentences.",
    category: "Structure & Cadence",
    instruction: "Delay the conclusion to the final 2–3 sentences."
  },
  {
    id: "seam-pivot",
    name: "Seam/pivot",
    description: "Drop smooth connectors once; abrupt turn is fine.",
    category: "Structure & Cadence",
    instruction: "Drop smooth connectors once; abrupt turn is fine."
  },

  // Framing & Inference
  {
    id: "imply-step",
    name: "Imply one step",
    description: "Omit an obvious inferential step; leave it implicit.",
    category: "Framing & Inference",
    instruction: "Omit an obvious inferential step; leave it implicit."
  },
  {
    id: "conditional-framing",
    name: "Conditional framing",
    description: "Recast one key sentence as \"If/Unless …, then …\".",
    category: "Framing & Inference",
    instruction: "Recast one key sentence as \"If/Unless …, then …\"."
  },
  {
    id: "local-contrast",
    name: "Local contrast",
    description: "Use \"but/except/aside\" once to mark a boundary—no new facts.",
    category: "Framing & Inference",
    instruction: "Use \"but/except/aside\" once to mark a boundary—no new facts."
  },
  {
    id: "scope-check",
    name: "Scope check",
    description: "Replace one absolute with a bounded form (\"in cases like these\").",
    category: "Framing & Inference",
    instruction: "Replace one absolute with a bounded form (\"in cases like these\")."
  },

  // Diction & Tone
  {
    id: "deflate-jargon",
    name: "Deflate jargon",
    description: "Swap nominalizations for verbs where safe (e.g., \"utilization\" → \"use\").",
    category: "Diction & Tone",
    instruction: "Swap nominalizations for verbs where safe (e.g., \"utilization\" → \"use\")."
  },
  {
    id: "kill-transitions",
    name: "Kill stock transitions",
    description: "Delete \"Moreover/Furthermore/In conclusion\" everywhere.",
    category: "Diction & Tone",
    instruction: "Delete \"Moreover/Furthermore/In conclusion\" everywhere."
  },
  {
    id: "hedge-once",
    name: "Hedge once",
    description: "Use exactly one: \"probably/roughly/more or less.\"",
    category: "Diction & Tone",
    instruction: "Use exactly one: \"probably/roughly/more or less.\""
  },
  {
    id: "drop-intensifiers",
    name: "Drop intensifiers",
    description: "Remove \"very/clearly/obviously/significantly.\"",
    category: "Diction & Tone",
    instruction: "Remove \"very/clearly/obviously/significantly.\""
  },
  {
    id: "low-heat-voice",
    name: "Low-heat voice",
    description: "Prefer plain verbs; avoid showy synonyms.",
    category: "Diction & Tone",
    instruction: "Prefer plain verbs; avoid showy synonyms."
  },
  {
    id: "one-aside",
    name: "One aside",
    description: "One short parenthetical or em-dash aside; keep it factual.",
    category: "Diction & Tone",
    instruction: "One short parenthetical or em-dash aside; keep it factual."
  },

  // Concreteness & Benchmarks
  {
    id: "concrete-benchmark",
    name: "Concrete benchmark",
    description: "Replace one vague scale with a testable one (e.g., \"enough to X\").",
    category: "Concreteness & Benchmarks",
    instruction: "Replace one vague scale with a testable one (e.g., \"enough to X\")."
  },
  {
    id: "swap-example",
    name: "Swap generic example",
    description: "If the source has an example, make it slightly more specific; else skip.",
    category: "Concreteness & Benchmarks",
    instruction: "If the source has an example, make it slightly more specific; else skip."
  },
  {
    id: "metric-nudge",
    name: "Metric nudge",
    description: "Replace \"more/better\" with a minimal, source-safe comparator (\"more than last case\").",
    category: "Concreteness & Benchmarks",
    instruction: "Replace \"more/better\" with a minimal, source-safe comparator (\"more than last case\")."
  },

  // Asymmetry & Focus
  {
    id: "asymmetric-emphasis",
    name: "Asymmetric emphasis",
    description: "Linger on the main claim; compress secondary points sharply.",
    category: "Asymmetry & Focus",
    instruction: "Linger on the main claim; compress secondary points sharply."
  },
  {
    id: "cull-repeats",
    name: "Cull repeats",
    description: "Delete duplicated sentences/ideas; keep the strongest instance.",
    category: "Asymmetry & Focus",
    instruction: "Delete duplicated sentences/ideas; keep the strongest instance."
  },
  {
    id: "topic-snap",
    name: "Topic snap",
    description: "Change focus abruptly once; no recap.",
    category: "Asymmetry & Focus",
    instruction: "Change focus abruptly once; no recap."
  },

  // Formatting & Output Hygiene
  {
    id: "no-lists",
    name: "No lists",
    description: "Force continuous prose; remove bullets/numbering.",
    category: "Formatting & Output Hygiene",
    instruction: "Force continuous prose; remove bullets/numbering."
  },
  {
    id: "no-meta",
    name: "No meta",
    description: "No prefaces, apologies, or \"as requested\" scaffolding.",
    category: "Formatting & Output Hygiene",
    instruction: "No prefaces, apologies, or \"as requested\" scaffolding."
  },
  {
    id: "exact-nouns",
    name: "Exact nouns",
    description: "Replace vague pronouns where antecedent is ambiguous.",
    category: "Formatting & Output Hygiene",
    instruction: "Replace vague pronouns where antecedent is ambiguous."
  },
  {
    id: "quote-once",
    name: "Quote once",
    description: "If the source contains a strong phrase, quote it once; else skip.",
    category: "Formatting & Output Hygiene",
    instruction: "If the source contains a strong phrase, quote it once; else skip."
  },

  // Safety / Guardrails
  {
    id: "claim-lock",
    name: "Claim lock",
    description: "Do not add examples, scenarios, or data not present in the source.",
    category: "Safety / Guardrails",
    instruction: "Do not add examples, scenarios, or data not present in the source."
  },
  {
    id: "entity-lock",
    name: "Entity lock",
    description: "Keep names, counts, and attributions exactly as given.",
    category: "Safety / Guardrails",
    instruction: "Keep names, counts, and attributions exactly as given."
  }
];
