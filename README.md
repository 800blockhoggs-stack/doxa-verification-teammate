# Doxa — The Verification Teammate

**Every other agent in this hackathon produces output. Doxa checks it.**

Drop any deliverable into your Discord channel — a document, another AI's answer, a claim — and Doxa extracts every assertion, grades each one **FACT / INTERPRETATION / UNSUPPORTED**, and posts the verdict back into the same channel with an evidence trail. No deliverable ships ungraded.

**Flip the Switch Hackathon 2026 · Team Axis Sovereign Energy · Track: Best Business Workflow**

---

## The problem

AI-generated deliverables are polished by default. A clean PDF, a confident summary, a professional report — none of that tells you whether a single claim inside is true. Teams are about to run on agent output. The missing teammate is the one that says *prove it*.

Doxa is that teammate.

## How Switch is used

Doxa is not a bot bolted onto chat — it is a Switch-native agent pair:

- **The room is the record.** Switch turns the Discord channel into a shared room: one log of messages, instructions, roles, and tasks that people and agents read alike. Doxa's verdicts land in the same log the team works from — there is no side channel to reconcile.
- **Agents join by name.** Doxa runs as two addressed agents (see `switch/doxa-agents.yaml`): `doxa-extractor` (addressed by anyone) pulls every verifiable claim out of a dropped deliverable; `doxa-verifier` (addressed by the extractor) grades the claims, computes the integrity score, and posts the verdict. Routing, addressing, and channel membership are all Switch.
- **Without Switch, there is no product.** Take Switch away and Doxa is a script with no room to live in: no shared log, no teammate addressing, no channel presence. The workflow *is* the Switch room.

Setup follows the Switch quickstart (Switch Console + Docker, or a cloud dev box), connecting the Discord platform and the custom agent pair via the Switch agent protocol.

## The engine

Doxa's instrument is a deterministic structural auditor (`engine/`). Same input, same output — every time:

- **8 claim detectors** extract assertions from any text deliverable
- **7 dressing markers** measure structural cosmetics (caps, bold spray, verdict vocabulary, em-dash emphasis — the costume, not the substance)
- **Path C grading:** every claim graded FACT / INTERPRETATION / UNSUPPORTED — no grade column, no ship
- **Two scores:** Integrity = fact ratio × 100 · Fraud Risk = failure ratio × dressing weight × 100
- Every run carries a scan ID and pattern hash, so any verdict is reproducible byte-for-byte

The engine runs offline, in a browser, with zero dependencies — the same file that powers the live demo powers the agent.

## Architecture

```
Discord channel ──► Switch room (shared log, addressing)
                        │
                 doxa-extractor ──► claims[]
                        │
                 doxa-verifier ──► grades + Integrity/Fraud Risk + band
                        │
Discord channel ◄── verdict post (evidence trail, scan ID)
```

## Run it

1. **Switch side:** Switch quickstart → connect Discord → load `switch/doxa-agents.yaml`
2. **Bot side:**
   ```bash
   cd bot
   npm install
   DISCORD_TOKEN=your-token DOXA_CHANNEL_ID=your-channel-id node doxa-bot.js
   ```
   The bot needs the **Message Content** intent enabled in the Discord developer portal.
3. Drop a document or paste text into the channel. Doxa answers.

## Grading disclosure (we check ourselves too)

The automated grader is a **deterministic heuristic**, and we say so on every verdict:

- Hedged or predictive language ("we believe", "will", "expected") → INTERPRETATION
- Evidence-shaped claims (numbers, percentages, attribution) → FACT *(asserted with evidence shape — Doxa grades the claim's structure, not the state of the world)*
- Superlatives and buzzwords without evidence → UNSUPPORTED

Deterministic means auditable: every grade rule is in `bot/doxa-bot.js`, every verdict carries its scan ID, and any result reproduces exactly. Heuristic means honest about limits: Doxa flags *what needs a human's evidence* — it does not replace the human.

## Team

**Team Axis Sovereign Energy** — solo build. Axis Sovereign Energy LLC: AI forensic detection. Evidence before explanation.
