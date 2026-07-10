---
name: Anthropic model retirement causes 404s
description: What to do when an Anthropic (or other LLM provider) API call fails with a 404 not_found_error on a previously-working, hardcoded model ID.
---

If a previously-working Anthropic API call starts failing with `404 {"type":"not_found_error","message":"model: <id>"}`, the pinned model ID has likely been retired by the provider — this is expected over a long enough time horizon, not a code bug.

**Why:** Provider-side model lifecycles are outside the app's control; hardcoded model ID constants (often annotated `// <important_do_not_delete>`) go stale silently with no compile-time warning.

**How to apply:**
- Don't guess a replacement name. Query the provider's live models list (e.g. `GET https://api.anthropic.com/v1/models` with `x-api-key` + `anthropic-version` headers) to get the current valid ID.
- Update the hardcoded constant and any comment claiming it's "the newest" model.
- Also double check request parameters — newer model versions may reject params the old one accepted (e.g. a newer Claude model rejected `temperature` as deprecated). Re-test the actual API call after swapping the model ID, not just that the 404 is gone.
