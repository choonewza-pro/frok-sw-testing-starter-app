# Output Format

Used by `swe-test-planner` Step 5 to produce the final risk plan.

---

## Full Output Structure

Produce sections in this order:

### 1. Scan Summary

```
## 🔍 Risk-based Test Plan

**Project:** <project name or root folder>
**Scanned:** <ISO date>
**Git range:** Last 90 days (<N> commits total) | ⚠️ Git unavailable
**Features found:** <N>
**Framework detected:** <framework or "Unknown">
```

---

### 2. Risk Table

Produce a markdown table sorted by Risk Score descending:

```markdown
## 📊 Risk Table

| # | Feature | Impact | Likelihood | Risk Score | Zone | Existing Tests | Recommended Technique |
|---|---------|--------|------------|------------|------|---------------|----------------------|
| 1 | Payment | 5 | 4 | 20 | 🔴 Critical | ❌ | STT + EP |
| 2 | Login | 5 | 3 | 15 | 🔴 Critical | ❌ | STT |
| 3 | Order | 4 | 3 | 12 | 🟠 High | ✅ | EP + BVA |
| 4 | Product Search | 3 | 3 | 9 | 🟠 High | ❌ | EP |
| 5 | User Profile | 3 | 2 | 6 | 🟡 Medium | ✅ | EP |
| 6 | Change Theme | 1 | 1 | 1 | 🟢 Low | ❌ | — |
```

**Zone legend:**
- 🔴 **Critical** (≥ 16) — test first, block release if missing
- 🟠 **High** (9–15) — test in current sprint
- 🟡 **Medium** (4–8) — test when capacity allows
- 🟢 **Low** (1–3) — defer or test last

---

### 3. Impact Adjustment *(interactive — not a rendered section)*

After displaying the Risk Table, pause and run the Impact Adjustment step
as defined in **SKILL.md Step 5** before continuing to section 4.

Use `AskUserQuestion` (header: "Impact Review") with options:
- **Looks correct — proceed**
- **I want to adjust some scores** (then ask which feature and new score)

If user adjusts any score: **recalculate Risk Score, re-sort the table, and reprint it**
before continuing to the Recommended Testing Approach below.

> Do NOT render this as a markdown section in the saved file.
> It is an interactive step only.

---

### 4. Recommended Testing Approach (per zone)

After the table, provide a brief section:

```markdown
## 🎯 Recommended Testing Approach

### 🔴 Critical — Test Immediately
<For each Critical feature, 1 bullet:>
- **Payment** — Has workflows (pending → paid → refunded) → use **State Transition Testing (STT)**.
  Also has input validation (amount, card) → add **EP** for those fields.

### 🟠 High — Test This Sprint
<same format>

### 🟡 Medium — Schedule for Next Sprint
<same format>

### 🟢 Low — Defer
- These features have negligible risk. Consider testing only if time permits.
```

---

### 5. Technique Quick Reference

```markdown
## 🔧 Technique Guide

| Technique | When to Use | swe-test-engineer keyword |
|-----------|-------------|--------------------------|
| **BVA** | Numeric/time inputs with ranges (age, amount, date) | "boundary value" |
| **EP** | Enum, dropdown, role, boolean, text type inputs | "equivalence partitioning" |
| **STT** | Status fields, approval flows, state machines | "state transition" |
| **Mixed** | Feature has both range inputs AND enum inputs | List each condition separately |
```

---

### 6. Next Steps

Always end with:

```markdown
## ➡️ Next Steps

1. Start with 🔴 **Critical** features above
2. For each feature, activate **swe-test-engineer** and provide the feature's requirement or specification
3. swe-test-engineer will generate unit test cases + business test cases using the recommended technique

**Handoff example:**
> "Use swe-test-engineer: Payment feature — status can be pending, processing, paid, failed, refunded. Transitions: pending → processing → paid, paid → refunded. Invalid: paid → pending."
```

---

## File Save Format

When user chooses to save, write to:
```
test-plan/risk-plan-YYYY-MM-DD.md
```

File content = full output (all 6 sections above) as-is.
If `test-plan/` folder does not exist, create it.
Confirm save with:
```
✅ Saved to test-plan/risk-plan-<date>.md
```
