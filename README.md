# 🧠 GPT BYPASS

**Multi-Provider AI Text Rewriting Platform for Style Mimicking, Detection Evasion, and Surgical Content Control**

---

## 🧩 Overview

GPT Bypass is a multi-provider AI text rewriting system designed to transform AI-generated content into writing that reads as authentically human. It plugs into four top-tier proprietary LLMs (OpenAI GPT-4o, Anthropic Claude Sonnet 4, DeepSeek, and Perplexity) and lets users route any rewrite task to the model best suited for it -- surgical style mimicking, instruction-driven transformation, intelligent chunking for long documents, or full-pipeline humanization with detection scoring.

Unlike generic paraphrasers that produce watered-down, recognizably synthetic output, GPT Bypass is built around a strict operating principle: every rewrite is faithful to the user's reference style, every instruction is honored literally, and every output is verified against an AI-detection scorer. If you supply a style sample, the output mirrors that sample. If you ask for 40 stacked rewrite instructions, all 40 are applied. No padding, no preamble, no editorializing.

---

## 👥 Who It's For

- **Students and researchers** -- need to humanize AI-assisted drafts so they pass institutional detection tools without losing argumentative substance
- **Writers and journalists** -- need to mimic a specific author's voice, tone, or cadence with surgical precision across long-form content
- **Content professionals and marketers** -- need to transform machine-generated drafts into copy that reads as authentically human and survives detection screening
- **Academics and theorists** -- need formal, analytic prose that preserves logical structure while shedding the telltale rhythms of LLM output
- **Editors and ghostwriters** -- need to match a client's existing voice across new material drawn from AI drafts or research notes
- **Anyone** -- who wants AI-assisted writing that reads like a real human wrote it, not like a chatbot trying to sound like one

---

## ⚙️ Core Capabilities

- **Multi-Provider Rewriting Engine** -- A unified prompt system routes rewrites across four LLMs (OpenAI GPT-4o, Anthropic Claude Sonnet 4, DeepSeek, Perplexity). Pick the model best suited for the task or switch providers mid-session without losing context.

- **Surgical Style Mimicking** -- Upload or paste a reference text and the system extracts its cadence, vocabulary, sentence-length distribution, and rhetorical posture, then rewrites your input to match. Includes a curated library of paradox, epistemology, and content-neutral style samples.

- **40+ Instruction Preset Library** -- Categorized rewrite controls covering Advanced Techniques (mixed cadence + clause sprawl, asymmetric emphasis, hedge twice, local disfluency, analogy injection, topic snap, friction detail), Structure & Cadence, Framing & Inference, Voice & Style, and Content Control. Stack as many as you need.

- **Combo Presets** -- One-click bundles like "Lean & Sharp" and "Analytic" automatically expand into the right combination of atomic instructions, with no manual tuning required.

- **Content Mixing Mode** -- Blend a second source text into the rewrite to fuse two voices, inject reference material, or combine an outline with a style exemplar in a single pass.

- **GPTZero Detection Scoring** -- Every input and output is scored by GPTZero for AI-detection probability. See the before/after delta on every rewrite and iterate until the score lands where you want it.

- **Intelligent Document Chunking** -- Long documents (>500 words) are automatically segmented with configurable overlap, rewritten chunk by chunk while preserving voice continuity, then reassembled into one cohesive output.

- **Multi-Format Document Upload** -- TXT, PDF, and DOC/DOCX files up to 50MB. Binary-safe PDF extraction using `pdf-parse` with a dedicated memory-storage endpoint -- no corruption, no garbage characters, just clean text.

- **Re-Rewrite Loop** -- Take any output, layer additional presets or custom instructions onto it, and rewrite again. Iterate freely until the result matches your target.

- **AI Chat Assistant** -- Conversational interface backed by the same multi-provider engine, useful for refining instructions, discussing style choices, or generating new reference samples on the fly.

- **Credit-Based Pricing with State Persistence** -- Five Stripe-powered credit tiers ($5 / $10 / $25 / $50 / $100). When credits run out, a paywall reveals a generous preview (35% -- 80% of the output depending on length) and a one-click "Buy Credits" path. Your full rewrite session is preserved through the Stripe checkout flow and restored automatically on return.

- **Optional Authentication & Dashboard** -- The site is fully usable as a guest. Logging in unlocks persistent storage of uploaded documents and rewrite jobs, a credit balance, and a dashboard view of every saved material.

---

## 🚀 What Makes It Different

- **It actually follows instructions** -- Stack 40 presets and all 40 are applied. Ask for a specific cadence change and that change happens, not a vague approximation of it.

- **It mimics style, not just topic** -- Most paraphrasers preserve meaning and strip voice. GPT Bypass preserves meaning *and* transfers the cadence, vocabulary, and rhetorical posture of your reference sample onto it.

- **It verifies its own output** -- Every rewrite ships with a GPTZero AI-detection score. You see the actual probability the result reads as AI, not a marketing claim about "human-like" output.

- **Four proprietary LLMs, one workflow** -- OpenAI, Anthropic, DeepSeek, and Perplexity behind a single unified prompt system. Pick the model best suited for each task, or A/B compare the same rewrite across providers.

- **Atomic instruction control** -- 40+ named rewrite presets organized by category (Advanced Techniques, Structure & Cadence, Framing & Inference, Voice & Style, Content Control) give you granular control over exactly which transformations get applied.

- **Long-document aware** -- Intelligent chunking with overlap handles full essays, chapters, and reports without losing voice continuity across boundaries. No 500-word ceiling.

- **No silent fallbacks** -- If a provider fails, you get a clear error. If credits run out, you get a clearly-marked paywall preview. If a PDF can't parse, you're told. The system is explicit when it fails instead of pretending it succeeded.

- **Generous paywall, not a wall** -- Free users get a real preview of every rewrite (up to 80% for short outputs), not a teaser sentence. You see what you're paying for before you pay.

- **State survives checkout** -- Click "Buy Credits" mid-session and your input, output, style sample, preset stack, AI scores, and job ID all persist through the Stripe redirect and restore automatically when you return.

- **Optional account, no lock-in** -- The full rewrite pipeline works without an account. Logging in is an upgrade (persistent materials, dashboard, credit balance), not a gate.
