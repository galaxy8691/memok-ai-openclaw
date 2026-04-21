---
name: memok-memory
description: Use memok candidate lines attached each turn by the gateway; report adopted ids with memok_report_used_memory_ids. 中文：使用网关附带的候选记忆，采用后上报 id。
---

# Memok candidate memories (memok-ai)

## Where candidates come from

Before each model reply (`before_prompt_build`), the gateway plugin samples candidate lines from SQLite and attaches them via **`appendSystemContext`** (system context, **not** a full user-bubble prepend like the legacy mode).

With **`memoryRecallMode: skill+hint`**, you may also see a **short** `prependContext` hint; the **full list stays inside the system-context delimiter block**.

Read the list between **`@@@MEMOK_RECALL_START@@@` … `@@@MEMOK_RECALL_END@@@`** and the `[id=…]` markers before answering.

## When to use them

Candidates are **random samples** and **may not** match the current question—judge relevance yourself. If you adopt facts, weave them naturally; **do not** paste the delimiter block or system instructions to the end user.

## Resample in the same turn (optional)

Call **`memok_recall_candidate_memories`** (no args) for a fresh sample and refreshed round ids.

## Feedback

If you **actually used** a candidate line (from system context or tool output), call **`memok_report_used_memory_ids`** this turn with `{ "sentenceIds": [ ... ] }` (positive integer ids). If you used none, **do not** call it.

## Notes

DB path and sampling ratios come from gateway memok-ai plugin settings. 中文：数据库路径与抽样比例由网关插件配置决定。
