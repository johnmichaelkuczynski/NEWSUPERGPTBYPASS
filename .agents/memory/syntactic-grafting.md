---
name: Syntactic grafting requirement
description: The required humanization method and why prompt-only or surface-feature matching is insufficient.
---

Humanization must operate sentence by sentence: search the entire style sample for a sentence whose syntax can carry the complete meaning of each input sentence, then graft that meaning onto the host syntax.

**Why:** General style imitation produced generic AI prose. Matching hosts by length, punctuation, clause counts, and other surface features also failed because a grammatically similar host can have incompatible semantic roles, verb valency, modality, polarity, or logical relationships. A later global semantic repair flattened genuine grafts back into generic paraphrases.

**How to apply:** Do not claim success from prompt-only imitation or detector scores. Use a real dependency and semantic-role representation for both source and candidate hosts, verify each graft independently, preserve successful host syntax during correction, and reject rather than display any sentence that cannot retain meaning.