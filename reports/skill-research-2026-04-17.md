# Skill Research Report — 2026-04-17

Scanned 41 local skills against community repos (GitHub, mcpmarket, tessl, playbooks, pawgrammer).

## 🟢 推薦升級 (5)

| Skill | 社群替代 | Stars | 優勢 |
|-------|---------|-------|------|
| `firebase-backend` | [SpillwaveSolutions/using-firebase](https://github.com/SpillwaveSolutions/using-firebase) | — | Hub-and-spoke: 8 deep reference files, 99/100 grading, SDK v12.8+ |
| `docker-compose-setup` | [OpenAEC-Foundation/Docker-Claude-Skill-Package](https://github.com/OpenAEC-Foundation/Docker-Claude-Skill-Package) | — | 22 deterministic skills, anti-pattern catalogs, decision trees |
| `skill-creator` | [FrancyJGLisboa/agent-skill-creator](https://github.com/FrancyJGLisboa/agent-skill-creator) | 722 | v4.0 "dark factory": auto-infer requirements from URLs/PDFs, 14+ tool export |
| `dispatching-parallel-agents` | [TheAhmadOsman/parallel-agent-worktree-skill](https://github.com/TheAhmadOsman/parallel-agent-worktree-skill) | 29 | Git worktree isolation, deterministic runners, changelog reconciliation |
| `de-slopify` | [blader/humanizer](https://github.com/blader/humanizer) | 14.1K | Wikipedia AI patterns, voice calibration from writing samples, anti-AI pass loop |

## 🟡 可增強 (5)

| Skill | 社群參考 | 值得借鏡的部分 |
|-------|---------|--------------|
| `audio-transcription-flow` | [jftuga/transcript-critic](https://github.com/jftuga/transcript-critic) | 轉錄後分析層：timestamped summaries, fallacy detection |
| `vector-search-setup` | [alirezarezvani/rag-architect](https://github.com/alirezarezvani/claude-skills/blob/main/engineering/rag-architect/SKILL.md) | 完整 RAG pipeline: chunking strategies, hybrid search, evaluation frameworks |
| `investment-research` | [tradermonty/claude-trading-skills](https://github.com/tradermonty/claude-trading-skills) | 50 skills: screener, thesis lifecycle, macro regime, institutional flow |
| `frontend-design` | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | 18 sub-skills: audit, animate, adapt, typeset — 更細粒度 |
| `knowledge-graph` | [safishamsi/graphify](https://github.com/safishamsi/graphify) | Project-scoped 知識圖（互補，非替代） |

## ✅ 保留現有版本 (31)

### 無社群替代（太 domain-specific）
rfq-writer, sow-writer, discovery-interview, metadata-workshop, crm-projection, customer-intel, tender-scraper, subsidy-scraper, keyword-discovery, sales-material, tw-company-lookup

### 現有版本已足夠
db-migration, oauth-token-vault, rbac-permissions, office-docx, office-pdf, office-pptx, office-xlsx, pitch-deck, executing-plans, writing-plans, self-improving-agent, session-harvest, context-recovery, qa-auto, qa-planner, ui-ux-pro-max, headless-agent, large-file-refactor, mcp-builder

### 建議同步上游
planning-with-files — 檢查是否已同步到 upstream v2.34+（hooks auto-context injection）

## 統計

| 類別 | 數量 |
|------|------|
| 推薦升級 | 5 |
| 可增強 | 5 |
| 保留 | 31 |
| **合計掃描** | **41** |

## 升級優先順序

1. **`de-slopify` → humanizer** — 14.1K stars，成熟度最高，直接替換
2. **`skill-creator` → agent-skill-creator** — 核心 meta skill，影響所有未來 skill 品質
3. **`dispatching-parallel-agents` → worktree-skill** — git 隔離防止 agent 互相汙染
4. **`docker-compose-setup` → Docker-Skill-Package** — 22 skills 遠比單一 setup 完整
5. **`firebase-backend` → using-firebase** — 99/100 分，8 reference files
