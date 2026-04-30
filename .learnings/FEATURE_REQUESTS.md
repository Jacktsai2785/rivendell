# Feature Requests

Pending capabilities the user has asked for but isn't ready to build yet. Each
entry: what was asked, why, agreed scope, what triggers picking it back up.

---

## 2026-04-30 — `slide-office-hours` skill

**Asked**: User wants a gstack-style **interactive Q&A skill** specifically
for slide / pitch deck creation. Inspired by `gstack-office-hours`'s six
forcing questions and `gstack-plan-*` review skills' adversarial
challenge-and-rate pattern.

**Why**: Existing `slide-workflow` has 7 gates and `pitch-deck` has Discovery
Interview, but both are *informational fill-in* style ("what's the audience?",
"what's the time budget?"). Neither does the *Socratic-adversarial*
"逼你想清楚 story" pass that gstack-office-hours does. User wants this
because tuning a deck (current case: 光泉 pitch on 2026-04-30) takes
multiple iteration rounds and the existing skills don't sharpen the
underlying narrative — they just structure the output.

**Proposed scope (already discussed and acknowledged)**:

- New skill at `skills/docs/slide-office-hours/SKILL.md`
- Sits **before** `slide-workflow` Gate 2 — produces a `brief.md` that
  feeds into Gate 2 as a strong starting point
- Six forcing questions:
  1. 60 秒電梯故事是什麼？
  2. 聽完之後你希望聽眾做什麼**具體的下一步**？
  3. 如果只能留下 1 張 slide 給聽眾帶走，是哪張？
  4. 為什麼是「現在」做？(why now)
  5. 競品可複製什麼、不能複製什麼？
  6. 你最不想被問的問題是什麼？怎麼答？
- Optional adversarial mode: rate each answer 0–10, flag weak spots
  ("bullet 1 跟 3 重複", "你說 SOTA 但沒比較對象", "這故事在 $audience
  的房間會被噓")
- Output: `brief.md` with story arc, key messages, predicted Q&A,
  must-have / nice-to-have / kill slide list
- Handoff: trigger `slide-workflow` Gate 2 after brief is signed off

**TRIGGER candidates**: 「做簡報前先想清楚」「pitch 練習」「office hours
for slides」「這 deck 故事不太順」「pre-pitch review」

**DO NOT TRIGGER**: 已有完整 outline、純技術或內部報告、單純求 PPTX 輸出
直接走 `slide-workflow` 或 `office-pptx`

**Open naming question**: `slide-office-hours` vs `slide-discovery` vs
`pitch-rehearsal` vs 中文「簡報 office hours」. Decide when picking up.

**Trigger to revisit**: User said "等完成後再看" — currently tuning the
光泉 (KuangChuan) pitch deck (`Peter/Work/中華電/01-Presales/202604_光泉/`).
Pick this back up after that deck ships, ideally with the 光泉 experience
fresh as a real-world test case for what questions would have been most
useful to be forced to answer up-front.

**Effort estimate**: 1 SKILL.md, ~150 lines, no bundled scripts. ~30 min
write + iterate.

**Related skills already in catalog**:
- `slide-workflow` (skills/docs/) — 7-gate creation flow, this skill feeds it
- `pitch-deck` (skills/docs/) — narrative for investor pitches
- `slide-template-extractor` (skills/docs/) — extract style from existing deck
- `gstack-office-hours` — the methodology being borrowed

---

## 2026-04-30 — `cost-aware-model-routing` skill (also pending)

**Asked**: User implicitly agreed this was high-ROI when reviewing token cost
analysis but said "等完成後再看" applied to slide-office-hours. By extension
this one's also queued.

**Why**: 14-day token spend $10,683 with Opus 4.7 at 68% of cost. Most cron
headless agents (harvest, retro, scrapers, janitor) don't need Opus reasoning
and could run on Sonnet 4.6 at ~1/5 the cost — estimated $4-5K / week
savings.

**Proposed scope**: ~200 line SKILL.md covering Opus/Sonnet/Haiku decision
matrix, headless `claude -p --model claude-sonnet-4-6` cron pattern,
cost-aware iteration (Sonnet for iteration, Opus for finalization),
prompt-cache failure modes ($18.75/M create on system-prompt change /
>5min idle).

**Trigger to revisit**: Same as slide-office-hours — after 光泉 deck.

---

## How to pick these up

When ready: read this file → pick top entry → invoke `skill-creator`
with the proposed scope as args. If user has new context (e.g. lessons
from 光泉 deck process), incorporate before writing.
