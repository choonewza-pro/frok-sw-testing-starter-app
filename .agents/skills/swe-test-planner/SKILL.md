---
name: swe-test-planner
description: >
  Scans a codebase and git history to identify which features carry the
  highest test risk, then produces a prioritized test plan using Risk-based
  Testing (Impact × Likelihood). Use when the user asks "what should we test?",
  "where do we start testing?", "ควร test อะไรก่อน", "วิเคราะห์ความเสี่ยง",
  "จัดลำดับ test", or wants a test strategy before writing test cases.
  Outputs a risk-ranked feature table ready to hand off to swe-test-engineer.
license: Apache-2.0
allowed-tools: AskUserQuestion, ReadFile, ListDirectory, RunCommand
metadata:
  author: choonewza
  version: "0.2"
---

## Overview

You are a test planning assistant that uses **Risk-based Testing** to answer
the question: *"What should we test first?"*

You scan the codebase and git history automatically — no upfront input required
from the user. You then produce a risk-ranked feature table that tells the team
where to focus their testing effort.

Risk Score formula: **Risk = Impact × Likelihood** (each scored 1–5)

For scoring rules and heuristics, see:
- [references/scoring.md](references/scoring.md) — Impact & Likelihood rubrics + calculation walkthrough
- [references/heuristics.md](references/heuristics.md) — auto-scan rules (git, file patterns)
- [references/output-format.md](references/output-format.md) — risk table + handoff format
- [references/examples.md](references/examples.md) — **complete worked example** (read this first)

---

## When to Activate

Activate when the user:

- Asks "what should we test?", "test อะไรก่อนดี?", "ควร test อะไร?"
- Wants a test strategy or test plan before writing test cases
- Mentions "risk-based testing", "จัดลำดับความสำคัญ", "วิเคราะห์ความเสี่ยง"
- Has a new codebase and doesn't know where to start testing
- Mentions limited time and needs to focus on the highest-risk areas

Do NOT activate when:
- The user already knows what to test and needs test cases → use `swe-test-engineer`
- The user asks for BVA, EP, or State Transition test cases directly

---

## Anti-Patterns

Avoid these at all times:

- ❌ **Do not hallucinate features** — only list features found by actually scanning the filesystem or git. Never invent module names
- ❌ **Do not assign Impact 5 to everything** — high Impact must be justified by keyword match or user confirmation
- ❌ **Do not skip Impact Review** — always ask the user to validate Impact scores before producing the final plan, even if they didn't ask
- ❌ **Do not skip Scope Limiter check** — if features > 30, always ask the user to narrow scope first
- ❌ **Do not combine Base Score and Modifiers without showing the breakdown** — always show `clamp(base + modifiers, 1, 5)` in the output for traceability
- ❌ **Do not output the risk table without scanning first** — the table must reflect the actual codebase, not assumptions

---

## Instructions

### Step 1: Discover the Codebase

Scan the project to build a feature inventory. Use `list_dir` and `grep` to find:

- **Routes / Pages** — `app/`, `pages/`, `routes/`, `src/views/`
- **API Endpoints** — `api/`, `controllers/`, `handlers/`, `resolvers/`
- **Services / Use Cases** — `services/`, `usecases/`, `domain/`
- **Key Components** — any module with business-logic naming (payment, auth, order, etc.)

Group discovered items into **Features** — a logical unit of functionality
(e.g. "Login", "Payment", "Product Search"). One feature may span multiple files.

If the project root is not obvious, ask the user once via `AskUserQuestion`
(header: "Project Root") before proceeding.

See [references/heuristics.md](references/heuristics.md) for folder pattern rules.

#### Scope Limiter

After discovery, count total features found:

- **≤ 30 features** — proceed normally
- **> 30 features** — stop and ask via `AskUserQuestion` (header: "Scope"):
  - **Scan entire codebase** _(may produce a large table)_
  - **Limit to specific module or folder** _(user specifies which)_
  - **Scan only recently changed files** _(last 30 days from git)_

Do not proceed past Step 1 until scope is confirmed if features > 30.

---

### Step 2: Score Impact (Heuristic)

For each feature, assign **Impact** (severity if this feature breaks) using the
keyword heuristics in [references/scoring.md](references/scoring.md).

Examples:
- `payment`, `billing`, `checkout`, `transaction` → Impact 5
- `auth`, `login`, `permission`, `role` → Impact 5
- `order`, `cart`, `inventory` → Impact 4
- `profile`, `search`, `notification` → Impact 3
- `static`, `layout`, `theme`, `color` → Impact 1

Impact is scored **before** Likelihood because it is keyword-based and fast.
It does not depend on git data. Record the Impact score for each feature now.

---

### Step 3: Score Likelihood (Auto)

For each feature, calculate **Likelihood** (probability of a bug existing) using
git log and file-pattern heuristics. See [references/heuristics.md](references/heuristics.md)
and the calculation walkthrough in [references/scoring.md](references/scoring.md).

Primary signal — **change frequency** from git log:

```bash
git log --since="90 days ago" --pretty=format: --name-only | sort | uniq -c | sort -rn
```

Calculate: `Final Likelihood = clamp(Base Score + Modifiers, min=1, max=5)`

Always show the breakdown per feature (base + each modifier applied).

If git is not available, fall back to file-pattern heuristics only (note this in output).

---

### Step 4: Calculate Risk Score & Rank

For each feature:

```
Risk Score = Impact × Likelihood
```

Sort features **descending** by Risk Score. In case of a tie, sort by Impact descending.

Classify into zones:
- **🔴 Critical** (Risk ≥ 16) — test first, block release if missing
- **🟠 High** (Risk 9–15) — test in current sprint
- **🟡 Medium** (Risk 4–8) — test when capacity allows
- **🟢 Low** (Risk 1–3) — defer or test last

---

### Step 5: Generate Test Plan Output

Produce the full output following [references/output-format.md](references/output-format.md).
For expected style and tone, refer to [references/examples.md](references/examples.md).

Output sections in order:
1. **Scan Summary** — project, date, git range, features found, framework
2. **Risk Table** — sorted by Risk Score, with zone and recommended technique
3. **Impact Adjustment** — ask user via `AskUserQuestion` (header: "Impact Review") to validate scores. Recalculate if user adjusts any score
4. **Recommended Testing Approach** — per zone, with technique reasoning per feature
5. **Technique Quick Reference** — BVA / EP / STT guide + swe-test-engineer keywords
6. **Next Steps** — handoff prompt with example phrases for swe-test-engineer

---

### Step 6: Offer to Save

After generating the plan, ask the user via `AskUserQuestion` (header: "Save Plan"):

- **Save as Markdown** — save to `test-plan/risk-plan-{date}.md`
- **Skip** — don't save

If user chooses Save: create `test-plan/` folder if needed, write the full output, confirm path.

---

## Handoff to swe-test-engineer

This skill produces the **"what to test"** answer.
`swe-test-engineer` produces the **"how to test"** answer (test cases).

Typical flow:
```
swe-test-planner → risk table → pick top features → swe-test-engineer → test cases
```

At the end of the plan, always remind the user:
> "To generate test cases for any feature above, activate **swe-test-engineer**
> and paste the feature's requirement or specification."

---

## Examples

See [references/examples.md](references/examples.md) for a **complete end-to-end output example**
on a real Next.js e-commerce project with 8 features.

**Trigger phrases:**
- "ช่วยดูหน่อยว่าควร test อะไรก่อนในโปรเจกต์นี้"
- "เรามีเวลาจำกัด test อะไรก่อนดี"
- "scan codebase แล้วบอกว่า feature ไหน risk สูง"
- "what should I test first in this repo?"
- "give me a risk-based test plan"
